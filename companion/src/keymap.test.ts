import { describe, expect, it } from "vitest";
import keymap from "./generated/keymap.json";
import type { KeyCell, KeyKind } from "./keys";
import { COMBOS } from "./layout";
import { LAYERS } from "./layers";

// The generated file is the compiled firmware keymap (scripts/generate_companion_keymap.py).
// These checks fail when the hand written layers and combos stop matching it.

interface Binding {
  behavior: string;
  compatible: string;
  params: number[];
  text: string;
  hold?: Binding;
  tap?: Binding;
}

const MODIFIER_KEYS = new Set([
  "LCTRL",
  "LSHFT",
  "LALT",
  "LGUI",
  "RCTRL",
  "RSHFT",
  "RALT",
  "RGUI",
]);

// What kind of key the app should draw for a compiled binding.
function expectedKind(binding: Binding): KeyKind {
  switch (binding.compatible) {
    case "zmk,behavior-transparent":
      return "transparent";
    case "zmk,behavior-none":
      return "none";
    case "zmk,behavior-key-press":
      return binding.text.startsWith("kp C_") ? "media" : "key";
    case "zmk,behavior-hold-tap":
      return binding.hold && MODIFIER_KEYS.has(binding.hold.text.slice(3))
        ? "mod-tap"
        : "layer-tap";
    case "zmk,behavior-tap-dance":
      return "tap-dance";
    case "zmk,behavior-momentary-layer":
      return "layer-hold";
    case "zmk,behavior-to-layer":
      return "layer-switch";
    case "zmk,behavior-sticky-key":
      return binding.behavior === "sl" ? "layer-sticky" : "key";
    case "zmk,behavior-mouse-key-press":
    case "zmk,behavior-input-two-axis":
    case "zmk,behavior-macro-two-param":
      return "mouse";
    case "zmk,behavior-bluetooth":
    case "zmk,behavior-ext-power":
    case "zmk,behavior-rgb-underglow":
    case "zmk,behavior-reset":
      return "system";
    default:
      throw new Error(`Unclassified behavior ${binding.behavior}`);
  }
}

const layers = keymap.layers as {
  index: number;
  name: string;
  keys: Binding[];
}[];

const SYMBOLS: Record<string, string> = {
  MINUS: "-",
  EQUAL: "=",
  GRAVE: "`",
  LBKT: "[",
  RBKT: "]",
  BSLH: "\\",
  SEMI: ";",
  SQT: "'",
  COMMA: ",",
  DOT: ".",
  FSLH: "/",
  KP_DIVIDE: "/",
  KP_MINUS: "-",
  KP_MULTIPLY: "*",
  KP_PLUS: "+",
  "LS(1)": "!",
  "LS(2)": "@",
  "LS(3)": "#",
  "LS(4)": "$",
  "LS(5)": "%",
  "LS(6)": "^",
  "LS(7)": "&",
  "LS(8)": "*",
  "LS(9)": "(",
  "LS(0)": ")",
  "LS(MINUS)": "_",
  "LS(EQUAL)": "+",
  "LS(GRAVE)": "~",
  "LS(BSLH)": "|",
  "LS(LBKT)": "{",
  "LS(RBKT)": "}",
  "LS(SQT)": '"',
  "LS(COMMA)": "<",
  "LS(DOT)": ">",
  "LS(FSLH)": "?",
  "LS(SEMI)": ":",
};

const NAMED: Record<string, string[]> = {
  BSPC: ["Bksp"],
  TAB: ["Tab"],
  ENTER: ["Enter", "Return"],
  ESC: ["Esc"],
  SPACE: ["Space"],
  DEL: ["Del"],
  UP: ["Up"],
  DOWN: ["Down"],
  LEFT: ["Left"],
  RIGHT: ["Right"],
  PG_UP: ["PgUp"],
  PG_DN: ["PgDn"],
  HOME: ["Home"],
  END: ["End"],
  INS: ["Ins"],
  KP_ENTER: ["KP Enter"],
  LALT: ["Alt"],
  C_BRI_UP: ["Bright +"],
  C_BRI_DN: ["Bright -"],
  C_VOL_UP: ["Vol +"],
  C_VOL_DN: ["Vol -"],
  C_PREV: ["Prev"],
  C_PLAY_PAUSE: ["Play"],
  C_NEXT: ["Next"],
  C_MUTE: ["Mute"],
};

// The labels the app may use for a key code; an unknown code fails so the table gets extended.
function keyLabels(code: string): string[] {
  if (/^[A-Z0-9]$/.test(code) || /^F\d+$/.test(code)) return [code];
  const labels = NAMED[code] ?? (SYMBOLS[code] ? [SYMBOLS[code]] : undefined);
  if (!labels) throw new Error(`No label known for key code ${code}`);
  return labels;
}

const SHORT_LAYER: Record<string, string> = {
  BASE: "BASE",
  NAVIGATION: "NAV",
  FUNCTIONS: "FUNC",
  SYMBOL_KP: "SYM",
  UTILS: "UTIL",
  MIRROR: "MIRROR",
  COMBOS: "COMBOS",
};

const MODIFIER_NAME = (code: string): string =>
  code.endsWith("GUI")
    ? "GUI"
    : code.endsWith("ALT")
      ? "Alt"
      : code.endsWith("SHFT")
        ? "Shift"
        : "Ctrl";

// ZMK's command numbers for the Bluetooth, external power and RGB behaviors.
const RGB_LABEL: Record<number, string> = {
  0: "RGB",
  3: "Hue +",
  4: "Hue -",
  5: "Sat +",
  6: "Sat -",
  7: "Bri +",
  8: "Bri -",
  9: "Spd +",
  10: "Spd -",
  11: "RGB mode",
};
const MOUSE_BUTTON: Record<number, string> = {
  1: "L click",
  2: "R click",
  4: "M click",
};

const argument = (binding: Binding): string => binding.text.split(" ")[1] ?? "";

// Problems with how one key is labelled, compared with what the firmware does.
function labelProblems(binding: Binding, cell: KeyCell): string[] {
  const wants = (labels: string[]): string[] =>
    labels.includes(cell.label)
      ? []
      : [`label "${cell.label}", firmware ${labels.join(" or ")}`];
  switch (binding.compatible) {
    case "zmk,behavior-key-press":
      return wants(keyLabels(argument(binding)));
    case "zmk,behavior-hold-tap": {
      const problems: string[] = [];
      const hold = binding.hold;
      const tap = binding.tap;
      if (tap && ["kp", "sk"].includes(tap.behavior)) {
        problems.push(...wants(keyLabels(argument(tap))));
      }
      if (binding.behavior === "ht" && hold) {
        const expected = MODIFIER_NAME(argument(hold));
        const actual = cell.gestures.find((g) => g.gesture === "hold")?.action;
        if (actual !== expected) {
          problems.push(`hold "${actual}", firmware ${expected}`);
        }
      } else if (hold?.behavior === "mo" && !hold.text.includes(" mo ")) {
        const layer = SHORT_LAYER[argument(hold)];
        const actual = cell.gestures.find((g) => g.gesture === "hold")?.action;
        if (layer && !actual?.includes(layer)) {
          problems.push(`hold "${actual}", firmware holds ${layer}`);
        }
      }
      return problems;
    }
    case "zmk,behavior-momentary-layer":
    case "zmk,behavior-to-layer":
      return wants([SHORT_LAYER[argument(binding)]]);
    case "zmk,behavior-sticky-key":
      return binding.behavior === "sl"
        ? wants([SHORT_LAYER[argument(binding)]])
        : [];
    case "zmk,behavior-mouse-key-press":
      return wants([MOUSE_BUTTON[binding.params[0]]]);
    case "zmk,behavior-bluetooth": {
      const [command, profile] = binding.params;
      const labels: Record<number, string> = {
        1: "BT next",
        2: "BT prev",
        3: `BT ${profile}`,
        4: "BT clear all",
      };
      return wants([labels[command]]);
    }
    case "zmk,behavior-ext-power":
      return wants([binding.params[0] === 1 ? "Power on" : "Power off"]);
    case "zmk,behavior-rgb-underglow":
      return wants([RGB_LABEL[binding.params[0]]]);
    default:
      return [];
  }
}

describe("hand written layers match the compiled keymap", () => {
  it("have the same layers in the same order", () => {
    expect(LAYERS.map((layer) => layer.id)).toEqual(
      layers.map((layer) => layer.index),
    );
    const plain = (name: string) => name.toUpperCase().replace(/[^A-Z]/g, "");
    expect(LAYERS.map((layer) => plain(layer.name))).toEqual(
      layers.map((layer) => plain(layer.name)),
    );
  });

  it("have 44 keys, the same as the firmware", () => {
    expect(keymap.keyCount).toBe(44);
    for (const layer of layers) expect(layer.keys).toHaveLength(44);
  });

  it("draw every key as the kind of key it is in the firmware", () => {
    const mismatches: string[] = [];
    for (const layer of layers) {
      layer.keys.forEach((binding, position) => {
        const drawn = LAYERS[layer.index].keys[position].kind;
        const expected = expectedKind(binding);
        if (drawn !== expected) {
          mismatches.push(
            `${layer.name} key ${position}: drawn ${drawn}, firmware ${expected} (${binding.text})`,
          );
        }
      });
    }
    expect(mismatches).toEqual([]);
  });

  it("label every key, and its hold action, as the firmware does", () => {
    const problems: string[] = [];
    for (const layer of layers) {
      layer.keys.forEach((binding, position) => {
        const cell = LAYERS[layer.index].keys[position];
        for (const problem of labelProblems(binding, cell)) {
          problems.push(
            `${layer.name} key ${position} (${binding.text}): ${problem}`,
          );
        }
      });
    }
    expect(problems).toEqual([]);
  });
});

describe("hand written combos match the compiled keymap", () => {
  const compiled = keymap.combos as {
    name: string;
    positions: number[];
    layers: number[];
  }[];
  const signature = (positions: number[], layerIds: number[]) =>
    `${[...positions].sort((a, b) => a - b).join("+")} on ${[...layerIds].sort((a, b) => a - b).join(",")}`;

  it("list every firmware combo, with the same keys and layers", () => {
    const drawn = new Set(
      COMBOS.map((combo) => signature(combo.keys, combo.layers)),
    );
    const missing = compiled
      .filter((combo) => !drawn.has(signature(combo.positions, combo.layers)))
      .map(
        (combo) => `${combo.name}: ${signature(combo.positions, combo.layers)}`,
      );
    expect(missing).toEqual([]);
  });

  it("list no combo the firmware does not have", () => {
    const real = new Set(
      compiled.map((combo) => signature(combo.positions, combo.layers)),
    );
    const extra = COMBOS.filter(
      (combo) => !real.has(signature(combo.keys, combo.layers)),
    ).map((combo) => `${combo.name}: ${signature(combo.keys, combo.layers)}`);
    expect(extra).toEqual([]);
  });
});
