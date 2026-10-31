export const KEY_COUNT = 44;

export type KeyKind =
  | "key"
  | "mod-tap"
  | "layer-tap"
  | "tap-dance"
  | "layer-hold"
  | "layer-sticky"
  | "layer-switch"
  | "mouse"
  | "system"
  | "media"
  | "transparent"
  | "none";

// "tap-hold" is a tap followed straight away by a held press.
export type Gesture =
  | "hold"
  | "tap-hold"
  | "double-tap"
  | "double-tap-hold"
  | "triple-tap"
  | "triple-tap-hold";

export interface GestureAction {
  gesture: Gesture;
  action: string;
}

export interface KeyCell {
  label: string;
  kind: KeyKind;
  // What a single tap does when it differs from typing the label.
  tap?: string;
  gestures: GestureAction[];
  // For transparent keys: the kind of the BASE key being inherited.
  inheritedKind?: KeyKind;
}

export const KIND_INFO: Record<KeyKind, { name: string; description: string }> =
  {
    key: { name: "Key", description: "Regular key press." },
    "mod-tap": {
      name: "Home-row mod",
      description: "Tap for the key, hold for a modifier.",
    },
    "layer-tap": {
      name: "Layer / mode tap",
      description: "Tap for a key or action, hold for a layer or pointer mode.",
    },
    "tap-dance": {
      name: "Tap dance",
      description:
        "Different action depending on how many times it is tapped or held.",
    },
    "layer-hold": {
      name: "Momentary layer",
      description: "Layer is active only while the key is held.",
    },
    "layer-sticky": {
      name: "Sticky layer",
      description: "Layer applies to the next key press, then releases.",
    },
    "layer-switch": {
      name: "Layer switch",
      description: "Switches to the layer and stays there until changed.",
    },
    mouse: { name: "Mouse", description: "Pointer movement, wheel or button." },
    system: {
      name: "System",
      description: "Bluetooth, power or RGB control.",
    },
    media: { name: "Media", description: "Volume, brightness or playback." },
    transparent: {
      name: "Transparent",
      description: "Not assigned here; the key falls through to BASE.",
    },
    none: {
      name: "Unassigned",
      description: "Blocked; the key does nothing on this layer.",
    },
  };

export const GESTURE_INFO: Record<Gesture, { short: string; name: string }> = {
  hold: { short: "hold", name: "Hold" },
  "tap-hold": { short: "tap+hold", name: "Tap, then hold" },
  "double-tap": { short: "2×", name: "Double tap" },
  "double-tap-hold": { short: "2×+hold", name: "Double tap, then hold" },
  "triple-tap": { short: "3×", name: "Triple tap" },
  "triple-tap-hold": { short: "3×+hold", name: "Triple tap, then hold" },
};

function cell(
  label: string,
  kind: KeyKind,
  tap?: string,
  gestures: GestureAction[] = [],
): KeyCell {
  return { label, kind, tap, gestures };
}

export const key = (label: string): KeyCell => cell(label, "key");

export const homeRowMod = (label: string, modifier: string): KeyCell =>
  cell(label, "mod-tap", undefined, [{ gesture: "hold", action: modifier }]);

export const layerTap = (
  label: string,
  holdAction: string,
  tap?: string,
): KeyCell =>
  cell(label, "layer-tap", tap, [{ gesture: "hold", action: holdAction }]);

export const tapDance = (
  label: string,
  tap: string | undefined,
  gestures: GestureAction[],
): KeyCell => cell(label, "tap-dance", tap, gestures);

export const momentary = (layer: string): KeyCell =>
  cell(layer, "layer-hold", `Hold for the ${layer} layer`);

export const sticky = (layer: string): KeyCell =>
  cell(layer, "layer-sticky", `Sticky ${layer} for the next key`);

export const switchTo = (layer: string): KeyCell =>
  cell(layer, "layer-switch", `Switch to the ${layer} layer`);

export const mouse = (
  label: string,
  tap?: string,
  gestures: GestureAction[] = [],
): KeyCell => cell(label, "mouse", tap, gestures);

export const system = (label: string, tap?: string): KeyCell =>
  cell(label, "system", tap);

export const media = (label: string): KeyCell => cell(label, "media");

export const unassigned = (): KeyCell => cell("none", "none");

// Resolved against BASE once every layer is built.
export const transparent = (): KeyCell => cell("", "transparent");

export function resolveTransparent(
  cells: KeyCell[],
  base: KeyCell[],
): KeyCell[] {
  return cells.map((entry, index) =>
    entry.kind === "transparent"
      ? {
          label: base[index].label,
          kind: "transparent",
          gestures: [],
          inheritedKind: base[index].kind,
        }
      : entry,
  );
}
