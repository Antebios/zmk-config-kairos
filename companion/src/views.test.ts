import { describe, expect, it } from "vitest";
import {
  COMBOS,
  combosForLayer,
  comboHints,
  describeKey,
  filterCombos,
} from "./layout";

const find = (name: string) => COMBOS.find((entry) => entry.name === name)!;

describe("comboHints", () => {
  it("lists the other keys to press with Z on BASE", () => {
    const hints = comboHints(0, 25).map((hint) => ({
      short: hint.combo.short,
      partners: hint.partners,
    }));
    expect(hints).toEqual([
      { short: "Undo", partners: ["Shift"] },
      { short: "Cut", partners: ["X"] },
    ]);
  });

  it("includes every partner of a three-key combo", () => {
    const hint = comboHints(0, 38).find(
      (entry) => entry.combo.name === "reset_bootloader",
    );
    expect(hint?.partners).toEqual(["'", "C"]);
  });

  it("gives every combo a short name that fits a key", () => {
    for (const entry of COMBOS) {
      expect(entry.short.length).toBeLessThanOrEqual(8);
    }
  });

  it("never reveals what the private-text combos type", () => {
    for (const name of ["private_text_1", "private_text_2", "private_text_3"]) {
      expect(find(name).short).toBe("Private");
      expect(find(name).action).toBe("Private text macro");
    }
  });
});

describe("describeKey", () => {
  it("spells out type, gestures and combos on separate lines", () => {
    const text = describeKey(0, 24).split("\n");
    expect(text[0]).toBe("Shift: Tap dance");
    expect(text).toContain("Tap: Sticky Shift for the next key");
    expect(text).toContain("Double tap: Caps Word");
    expect(text).toContain("With Z: Undo (Ctrl+Z)");
  });

  it("explains transparent and unassigned keys", () => {
    expect(describeKey(1, 36)).toContain("Uses the BASE key");
    const unassigned = describeKey(6, 0).split("\n");
    expect(unassigned[0]).toBe("none: Unassigned");
    expect(unassigned).toContain("With Q: Explorer (Ctrl+Shift+E)");
  });
});

describe("filterCombos", () => {
  const base = combosForLayer(0);

  it("returns everything for an empty query", () => {
    expect(filterCombos(0, base, "  ")).toEqual(base);
  });

  it("matches the action text", () => {
    expect(filterCombos(0, base, "paste").map((entry) => entry.name)).toEqual([
      "paste",
    ]);
  });

  it("matches the keys to press and requires every term", () => {
    const withZ = filterCombos(0, base, "z").map((entry) => entry.name);
    expect(withZ).toContain("undo");
    expect(withZ).toContain("cut");
    expect(filterCombos(0, base, "z x").map((entry) => entry.name)).toEqual([
      "cut",
    ]);
  });
});
