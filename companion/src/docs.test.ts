import { readFileSync, readdirSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MANUAL_NAV } from "./manual/pages";
import { pageSlugFromHref, renderMarkdown } from "./manual/render";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

const docFiles = readdirSync(new URL("docs/", root)).filter((name) =>
  name.endsWith(".md"),
);
const pages = Object.fromEntries(
  docFiles.map((name) => [name.replace(/\.md$/, ""), read(`docs/${name}`)]),
);

// Entries of the form `  - Title: file.md` in mkdocs.yml.
function mkdocsNav(): { title: string; slug: string }[] {
  return [...read("mkdocs.yml").matchAll(/^\s+- (.+): ([\w-]+)\.md$/gm)].map(
    (match) => ({ title: match[1], slug: match[2] }),
  );
}

describe("manual pages", () => {
  it("are listed in the app in the same order and with the same titles as in mkdocs.yml", () => {
    expect(MANUAL_NAV).toEqual(mkdocsNav());
  });

  it("are all listed, and every listed page exists", () => {
    expect(Object.keys(pages).sort()).toEqual(
      MANUAL_NAV.map((page) => page.slug).sort(),
    );
  });

  it("are all linked from the home page", () => {
    for (const page of MANUAL_NAV.slice(1)) {
      expect(pages.index, page.slug).toContain(`(${page.slug}.md)`);
    }
  });

  it("start with a title and render to HTML", () => {
    for (const page of MANUAL_NAV) {
      expect(pages[page.slug].startsWith("# "), page.slug).toBe(true);
      expect(renderMarkdown(pages[page.slug]), page.slug).toContain("<h1");
    }
  });

  it("link only to pages and images that exist", () => {
    for (const [slug, text] of Object.entries(pages)) {
      for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = match[1];
        if (/^https?:/.test(target)) continue;
        const file = target.split("#")[0];
        expect(
          existsSync(new URL(`docs/${file}`, root)),
          `${slug} -> ${target}`,
        ).toBe(true);
      }
    }
  });

  it("avoid syntax that only one of the two renderers understands", () => {
    for (const [slug, text] of Object.entries(pages)) {
      expect(text, slug).not.toMatch(/^(!!!|\?\?\?|===) /m);
      expect(text, slug).not.toMatch(/\]\(#/);
    }
  });
});

describe("manual content stays in step with the code", () => {
  it("documents every command-line flag", () => {
    const rust = read("src-tauri/src/lib.rs");
    const parser = rust.slice(
      rust.indexOf("pub fn parse_command"),
      rust.indexOf("fn is_hidden"),
    );
    const flags = new Set(
      [...parser.matchAll(/"(--[a-z-]+)"/g)].map((match) => match[1]),
    );
    expect(flags.size).toBeGreaterThan(5);
    for (const flag of flags) {
      expect(pages["command-line"], flag).toContain(flag);
    }
  });

  it("documents every npm script", () => {
    const scripts = Object.keys(JSON.parse(read("package.json")).scripts);
    for (const name of scripts.filter((script) => script !== "tauri")) {
      expect(pages.install, name).toContain(`\`${name}\``);
    }
  });

  it("listens in the UI for every event the Rust side emits", () => {
    const emitted = [
      ...read("src-tauri/src/lib.rs").matchAll(/emit\(\s*"([a-z-]+)"/g),
    ].map((match) => match[1]);
    expect(emitted.length).toBeGreaterThan(4);
    const behavior = read("src/windowBehavior.ts");
    for (const event of emitted) {
      expect(behavior, event).toContain(`"${event}"`);
    }
  });

  it("documents every Tauri event the app listens for", () => {
    const behavior = read("src/windowBehavior.ts");
    const events = [
      ...behavior.matchAll(/onCommand(?:<[^>]+>)?\(\s*"([a-z-]+)"/g),
    ].map((match) => match[1]);
    expect(events.length).toBeGreaterThan(4);
    for (const event of events) {
      expect(pages.development, event).toContain(`\`${event}\``);
    }
  });

  it("documents every key type and gesture", async () => {
    const { GESTURE_INFO, KIND_INFO } = await import("./keys");
    for (const info of Object.values(KIND_INFO)) {
      expect(pages["reading-keys"], info.name).toContain(info.name);
    }
    for (const info of Object.values(GESTURE_INFO)) {
      expect(pages["reading-keys"], info.short).toContain(`\`${info.short}\``);
    }
  });
});

describe("pageSlugFromHref", () => {
  it("recognises links to other pages, with or without an anchor", () => {
    expect(pageSlugFromHref("views.md")).toBe("views");
    expect(pageSlugFromHref("reading-keys.md#gestures")).toBe("reading-keys");
  });

  it("ignores external and image links", () => {
    expect(pageSlugFromHref("https://example.com/a.md")).toBeUndefined();
    expect(pageSlugFromHref("img/view-normal.png")).toBeUndefined();
  });
});
