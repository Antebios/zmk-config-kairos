import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const json = (path: string) => JSON.parse(read(path));
const match = (text: string, pattern: RegExp) => text.match(pattern)?.[1];

describe("releases", () => {
  it("use one version everywhere", () => {
    const version = json("package.json").version;
    expect(json("src-tauri/tauri.conf.json").version).toBe(version);
    expect(match(read("src-tauri/Cargo.toml"), /^version = "([^"]+)"/m)).toBe(
      version,
    );
    expect(match(read("packaging/arch/PKGBUILD"), /^pkgver=(\S+)/m)).toBe(
      version,
    );
  });

  it("ship the udev rule in the Linux packages", () => {
    const linux = json("src-tauri/tauri.conf.json").bundle.linux;
    for (const format of ["deb", "rpm"]) {
      const files: Record<string, string> = linux[format].files;
      const [destination, source] = Object.entries(files)[0];
      expect(destination).toBe("/usr/lib/udev/rules.d/70-kairos44-companion.rules");
      expect(existsSync(new URL(`src-tauri/${source}`, root)), format).toBe(true);
    }
    expect(read("packaging/arch/PKGBUILD")).toContain(
      "70-kairos44-companion.rules",
    );
  });

  it("name the window class in the desktop entry, so launchers match the window", () => {
    expect(read("packaging/kairos44-companion.desktop")).toContain(
      "StartupWMClass=kairos44-companion",
    );
  });
});
