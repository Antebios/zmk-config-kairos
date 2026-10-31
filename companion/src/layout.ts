// Curated from boards/shields/common/kairos (trackpad NAVIGATION variant); phase 5 replaces it with generated data.
import { LAYERS } from "./layers";
import { GESTURE_INFO, KIND_INFO } from "./keys";
export * from "./keys";
export { LAYERS, type LayerInfo } from "./layers";

export type ComboKind = "shortcut" | "symbol" | "system";

export interface Combo {
  name: string;
  action: string;
  // Few-character name for dense views.
  short: string;
  keys: number[];
  layers: number[];
  kind: ComboKind;
}

export const LAYER = {
  BASE: 0,
  NAVIGATION: 1,
  FUNCTIONS: 2,
  SYMBOL_KP: 3,
  UTILS: 4,
  MIRROR: 5,
  COMBOS: 6,
} as const;

const ALL_LAYERS = [0, 1, 2, 3, 4, 5, 6];
// Escape/Delete exclude COMBOS, which assigns other actions to the same chords.
const NO_COMBOS_LAYER = [0, 1, 2, 3, 4, 5];
const BASE_ONLY = [LAYER.BASE];
const COMBOS_ONLY = [LAYER.COMBOS];

// Keyed by combo name without its _left/_right suffix.
const SHORT_NAMES: Record<string, string> = {
  enter: "Enter",
  space: "Space",
  esc: "Esc",
  delete: "Del",
  undo: "Undo",
  cut: "Cut",
  copy: "Copy",
  paste: "Paste",
  primary_sidebar: "Side",
  secondary_sidebar: "Side 2",
  panel: "Panel",
  console: "Term",
  new_console: "New term",
  palette: "Palette",
  explorer: "Files",
  search: "Search",
  search_thumb: "Search",
  find: "Find",
  source_control: "Git",
  new_window: "New win",
  print_screen: "PrtSc",
  back_tick: "`",
  tilde: "~",
  minus: "-",
  underscore: "_",
  plus: "+",
  equal: "=",
  private_text_1: "Private",
  private_text_2: "Private",
  private_text_3: "Private",
  reset_bootloader: "Reset",
  return_to_base: "BASE",
};

function combo(
  name: string,
  action: string,
  keys: number[],
  layers: number[],
  kind: ComboKind,
): Combo {
  const short = SHORT_NAMES[name.replace(/_(left|right)$/, "")] ?? action;
  return { name, action, short, keys, layers, kind };
}

// The private-text macros are deliberately unlabeled so the window is safe to screen-share.
export const COMBOS: Combo[] = [
  combo("enter_left", "Enter", [37, 38], ALL_LAYERS, "symbol"),
  combo("space_right", "Space", [39, 40], ALL_LAYERS, "symbol"),
  combo("esc_left", "Escape", [2, 3], NO_COMBOS_LAYER, "symbol"),
  combo("delete", "Delete", [0, 1], NO_COMBOS_LAYER, "symbol"),

  combo("undo", "Undo (Ctrl+Z)", [24, 25], BASE_ONLY, "shortcut"),
  combo("cut", "Cut (Ctrl+X)", [25, 26], BASE_ONLY, "shortcut"),
  combo("copy", "Copy (Ctrl+C)", [26, 27], BASE_ONLY, "shortcut"),
  combo("paste", "Paste (Ctrl+V)", [27, 28], BASE_ONLY, "shortcut"),

  combo(
    "primary_sidebar_right",
    "Toggle primary sidebar (Ctrl+B)",
    [8, 9],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "primary_sidebar_left",
    "Toggle primary sidebar (Ctrl+B)",
    [2, 3],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "secondary_sidebar_right",
    "Toggle secondary sidebar (Ctrl+Alt+B)",
    [20, 21],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "secondary_sidebar_left",
    "Toggle secondary sidebar (Ctrl+Alt+B)",
    [14, 15],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "panel_right",
    "Toggle bottom panel (Ctrl+J)",
    [32, 33],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "panel_left",
    "Toggle bottom panel (Ctrl+J)",
    [26, 27],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "console_right",
    "Toggle terminal (Ctrl+`)",
    [9, 10],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "console_left",
    "Toggle terminal (Ctrl+`)",
    [1, 2],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "new_console_right",
    "New terminal (Ctrl+Shift+`)",
    [21, 22],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "new_console_left",
    "New terminal (Ctrl+Shift+`)",
    [15, 16],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "palette_right",
    "Command palette (Ctrl+Shift+P)",
    [33, 34],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "palette_left",
    "Command palette (Ctrl+Shift+P)",
    [25, 26],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "explorer_right",
    "Explorer (Ctrl+Shift+E)",
    [10, 11],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "explorer_left",
    "Explorer (Ctrl+Shift+E)",
    [0, 1],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "search_right",
    "Search in files (Ctrl+Shift+F)",
    [22, 23],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "search_left",
    "Search in files (Ctrl+Shift+F)",
    [12, 13],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "search_thumb",
    "Search in files (Ctrl+Shift+F)",
    [16, 38],
    BASE_ONLY,
    "shortcut",
  ),
  combo("find", "Find (Ctrl+F)", [16, 29], BASE_ONLY, "shortcut"),
  combo(
    "source_control_right",
    "Source control (Ctrl+Shift+G, G)",
    [34, 35],
    BASE_ONLY,
    "shortcut",
  ),
  combo(
    "source_control_left",
    "Source control (Ctrl+Shift+G, G)",
    [24, 25],
    COMBOS_ONLY,
    "shortcut",
  ),
  combo(
    "new_window",
    "New window (Ctrl+Shift+N)",
    [15, 16],
    BASE_ONLY,
    "shortcut",
  ),

  combo("print_screen_right", "Print Screen", [11, 23], ALL_LAYERS, "system"),
  combo("print_screen_left", "Print Screen", [0, 12], ALL_LAYERS, "system"),
  combo("back_tick", "` (grave)", [0, 1, 2], ALL_LAYERS, "symbol"),
  combo("tilde", "~ (tilde)", [12, 13, 14], ALL_LAYERS, "symbol"),
  combo("minus", "- (minus)", [6, 7], ALL_LAYERS, "symbol"),
  combo("underscore", "_ (underscore)", [7, 8], ALL_LAYERS, "symbol"),
  combo("plus", "+ (plus)", [18, 19], ALL_LAYERS, "symbol"),
  combo("equal", "= (equal)", [19, 20], ALL_LAYERS, "symbol"),

  combo("private_text_1", "Private text macro", [4, 5], ALL_LAYERS, "system"),
  combo("private_text_2", "Private text macro", [16, 17], ALL_LAYERS, "system"),
  combo("private_text_3", "Private text macro", [28, 29], ALL_LAYERS, "system"),

  combo(
    "reset_bootloader",
    "Reset to bootloader",
    [23, 27, 38],
    ALL_LAYERS,
    "system",
  ),
  combo(
    "return_to_base",
    "Return to BASE layer",
    [36, 37, 38],
    ALL_LAYERS,
    "system",
  ),
];

export function combosForLayer(layerId: number): Combo[] {
  return COMBOS.filter((entry) => entry.layers.includes(layerId));
}

export function combosForKey(layerId: number, keyIndex: number): Combo[] {
  return combosForLayer(layerId).filter((entry) =>
    entry.keys.includes(keyIndex),
  );
}

// Unassigned keys show their BASE keycap, since that physical key is still the one to press.
export function comboKeyLabels(layerId: number, entry: Combo): string[] {
  return entry.keys.map((index) => {
    const cell = LAYERS[layerId].keys[index];
    return cell.kind === "none" ? LAYERS[0].keys[index].label : cell.label;
  });
}

export interface ComboHint {
  combo: Combo;
  // The other keys to press together with this one.
  partners: string[];
}

export function comboHints(layerId: number, keyIndex: number): ComboHint[] {
  return combosForKey(layerId, keyIndex).map((entry) => {
    const labels = comboKeyLabels(layerId, entry);
    return {
      combo: entry,
      partners: labels.filter(
        (_, position) => entry.keys[position] !== keyIndex,
      ),
    };
  });
}

// One line per fact, for tooltips in the dense view.
export function describeKey(layerId: number, keyIndex: number): string {
  const cell = LAYERS[layerId].keys[keyIndex];
  const lines = [`${cell.label}: ${KIND_INFO[cell.kind].name}`];
  if (cell.kind === "transparent") {
    lines.push("Uses the BASE key");
  } else if (cell.kind !== "none") {
    lines.push(`Tap: ${cell.tap ?? cell.label}`);
    for (const item of cell.gestures) {
      lines.push(`${GESTURE_INFO[item.gesture].name}: ${item.action}`);
    }
  }
  for (const hint of comboHints(layerId, keyIndex)) {
    lines.push(`With ${hint.partners.join(" + ")}: ${hint.combo.action}`);
  }
  return lines.join("\n");
}

// Every space-separated term must match the action, short name or one of the keys.
export function filterCombos(
  layerId: number,
  entries: Combo[],
  query: string,
): Combo[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return entries;
  return entries.filter((entry) => {
    const haystack = [
      entry.action,
      entry.short,
      ...comboKeyLabels(layerId, entry),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
