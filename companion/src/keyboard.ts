// Reads the state the left half reports over USB (docs/kairos44-host-telemetry.md).

export interface KeyboardState {
  // Bit n is set while layer n is active; the default layer is always set.
  layers: number;
  highest: number | null;
  // HID modifier bits: left Ctrl, Shift, Alt, Gui, then the same on the right.
  modifiers: number;
  // Null until the computer has reported its lock state to the keyboard.
  numLock: boolean | null;
  capsLock: boolean | null;
  scrollLock: boolean | null;
  usb: boolean;
  bleConnected: boolean;
  profile: number;
}

export interface KeyboardLink {
  connected: boolean;
  state: KeyboardState | null;
}

export const NO_KEYBOARD: KeyboardLink = { connected: false, state: null };

// Layers 0 to 6 are the keyboard layers the app draws. Higher ones are trackpad speed modes and
// copies of those layers that scope combos (boards/shields/common/kairos/helpers/layers.keymap).
const KEYBOARD_LAYERS = 7;
const MODE_BITS = {
  fast: [7],
  precision: [8, 9, 11],
  scroll: [10, 12],
};

export type PointerMode = "normal" | "fast" | "precision" | "scroll";

export const POINTER_MODE_LABEL: Record<PointerMode, string> = {
  normal: "Normal",
  fast: "Fast",
  precision: "Precision",
  scroll: "Scroll",
};

const bitSet = (layers: number, bit: number): boolean =>
  (layers & (1 << bit)) !== 0;

// The highest active keyboard layer, as the keyboard itself resolves its keys.
export function activeLayer(layers: number): number {
  for (let layer = KEYBOARD_LAYERS - 1; layer > 0; layer--) {
    if (bitSet(layers, layer)) return layer;
  }
  return 0;
}

// Scroll wins over precision, which wins over fast, as on the keyboard's display.
export function pointerMode(layers: number): PointerMode {
  for (const mode of ["scroll", "precision", "fast"] as const) {
    if (MODE_BITS[mode].some((bit) => bitSet(layers, bit))) return mode;
  }
  return "normal";
}

const MODIFIER_NAMES = ["Ctrl", "Shift", "Alt", "Gui"];

export function heldModifiers(mask: number): string[] {
  const held: string[] = [];
  for (let bit = 0; bit < 8; bit++) {
    if (mask & (1 << bit)) {
      held.push(`${bit < 4 ? "L" : "R"} ${MODIFIER_NAMES[bit % 4]}`);
    }
  }
  return held;
}

export function activeLocks(state: KeyboardState): string[] {
  const locks: string[] = [];
  if (state.numLock) locks.push("Num");
  if (state.capsLock) locks.push("Caps");
  if (state.scrollLock) locks.push("Scroll");
  return locks;
}

export function outputLabel(state: KeyboardState): string {
  if (state.usb) return "USB";
  return `Bluetooth ${state.profile}${state.bleConnected ? "" : " (not connected)"}`;
}
