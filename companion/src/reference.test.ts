import { describe, expect, it } from "vitest";
import { renderReference } from "./reference";

describe("generated reference page", () => {
  it("matches docs/reference.md; run `npm run docs:reference` to update it", async () => {
    await expect(renderReference()).toMatchFileSnapshot("../docs/reference.md");
  });

  it("mentions every combo action and every layer", () => {
    const text = renderReference();
    for (const name of [
      "BASE",
      "NAVIGATION",
      "FUNCTIONS",
      "SYMBOL_KP",
      "UTILS",
      "MIRROR",
      "COMBOS",
    ]) {
      expect(text).toContain(`### ${name}`);
    }
    expect(text).toContain("Cut (Ctrl+X)");
    expect(text).toContain("Reset to bootloader");
  });

  it("never reveals what the private-text combos type", () => {
    expect(renderReference()).toContain("Private text macro");
  });
});
