import { describe, expect, it } from "vitest";
import {
  COMBOS,
  GESTURE_INFO,
  KEY_COUNT,
  KIND_INFO,
  LAYERS,
  combosForLayer,
  comboKeyLabels,
} from "./layout";

describe("layers", () => {
  it("define seven layers whose ids match their position", () => {
    expect(LAYERS).toHaveLength(7);
    LAYERS.forEach((layer, index) => expect(layer.id).toBe(index));
  });

  it("have a binding for every one of the 44 positions", () => {
    for (const layer of LAYERS) {
      expect(layer.keys).toHaveLength(KEY_COUNT);
    }
  });

  it("describe home-row mods, plain keys and tap dances", () => {
    expect(LAYERS[0].keys[13]).toMatchObject({
      label: "A",
      kind: "mod-tap",
      gestures: [{ gesture: "hold", action: "GUI" }],
    });
    expect(LAYERS[0].keys[1]).toMatchObject({
      label: "Q",
      kind: "key",
      gestures: [],
    });
    expect(LAYERS[0].keys[24].gestures.map((entry) => entry.gesture)).toEqual([
      "hold",
      "double-tap",
      "tap-hold",
    ]);
  });

  it("label every key on every layer", () => {
    for (const layer of LAYERS) {
      layer.keys.forEach((entry, index) => {
        expect(entry.label, `${layer.name} key ${index}`).not.toBe("");
        expect(KIND_INFO[entry.kind]).toBeDefined();
        for (const item of entry.gestures) {
          expect(GESTURE_INFO[item.gesture]).toBeDefined();
        }
      });
    }
  });

  it("assigns every BASE key an action", () => {
    for (const entry of LAYERS[0].keys) {
      expect(["transparent", "none"]).not.toContain(entry.kind);
    }
  });

  it("shows transparent keys as the BASE key they inherit", () => {
    const base = LAYERS[0].keys;
    for (const layer of LAYERS.slice(1)) {
      layer.keys.forEach((entry, index) => {
        if (entry.kind === "transparent") {
          expect(entry.label).toBe(base[index].label);
          expect(entry.inheritedKind).toBe(base[index].kind);
          expect(entry.gestures).toEqual([]);
        }
      });
    }
  });

  it("marks unassigned keys explicitly", () => {
    expect(LAYERS[6].keys[0]).toMatchObject({ label: "none", kind: "none" });
  });
});

describe("combos", () => {
  it("use unique names", () => {
    const names = COMBOS.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("reference valid, distinct positions and layers", () => {
    for (const entry of COMBOS) {
      expect(new Set(entry.keys).size).toBe(entry.keys.length);
      for (const key of entry.keys) {
        expect(key).toBeGreaterThanOrEqual(0);
        expect(key).toBeLessThan(KEY_COUNT);
      }
      for (const id of entry.layers) {
        expect(LAYERS.some((layer) => layer.id === id)).toBe(true);
      }
    }
  });

  it("never give one chord two actions on the same layer", () => {
    for (const layer of LAYERS) {
      const seen = new Map<string, string>();
      for (const entry of combosForLayer(layer.id)) {
        const chord = [...entry.keys].sort((a, b) => a - b).join(",");
        expect(seen.get(chord), `${layer.name} ${chord}`).toBeUndefined();
        seen.set(chord, entry.name);
      }
    }
  });

  it("limits cut, copy and paste to BASE", () => {
    for (const name of ["cut", "copy", "paste"]) {
      expect(COMBOS.find((entry) => entry.name === name)?.layers).toEqual([0]);
    }
  });

  it("names the keys to press for a combo on a layer", () => {
    const find = (name: string) => COMBOS.find((entry) => entry.name === name)!;
    expect(comboKeyLabels(0, find("undo"))).toEqual(["Shift", "Z"]);
    expect(comboKeyLabels(0, find("cut"))).toEqual(["Z", "X"]);
    expect(comboKeyLabels(0, find("copy"))).toEqual(["X", "C"]);
    expect(comboKeyLabels(0, find("paste"))).toEqual(["C", "V"]);
  });

  it("falls back to the BASE keycap for unassigned keys", () => {
    const palette = COMBOS.find((entry) => entry.name === "palette_left")!;
    expect(comboKeyLabels(6, palette)).toEqual(["Z", "X"]);
  });
});
