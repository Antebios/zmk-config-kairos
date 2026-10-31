import {
  KEY_COUNT,
  type GestureAction,
  type KeyCell,
  homeRowMod,
  key,
  layerTap,
  media,
  momentary,
  mouse,
  resolveTransparent,
  sticky,
  switchTo,
  system,
  tapDance,
  transparent,
  unassigned,
} from "./keys";

export interface LayerInfo {
  id: number;
  name: string;
  title: string;
  reach: string;
  keys: KeyCell[];
}

const gesture = (
  kind: GestureAction["gesture"],
  action: string,
): GestureAction => ({
  gesture: kind,
  action,
});

const times = (count: number, make: () => KeyCell): KeyCell[] =>
  Array.from({ length: count }, make);

const keys = (...labels: string[]): KeyCell[] => labels.map(key);
const mice = (...labels: string[]): KeyCell[] =>
  labels.map((label) => mouse(label));

// Layouts list each row as six left keys then six right keys.
function interleave(left: KeyCell[][], right: KeyCell[][]): KeyCell[] {
  return [0, 1, 2].flatMap((row) => [...left[row], ...right[row]]);
}

const SHIFT = tapDance("Shift", "Sticky Shift for the next key", [
  gesture("hold", "Shift"),
  gesture("double-tap", "Caps Word"),
  gesture("tap-hold", "Ctrl"),
]);
const SEMICOLON = tapDance(";", undefined, [
  gesture("hold", "Right GUI"),
  gesture("double-tap", ":"),
]);
const punctuation = (label: string, shifted: string): KeyCell =>
  tapDance(label, undefined, [
    gesture("double-tap", shifted),
    gesture("tap-hold", shifted),
  ]);

const typingLeft = (): KeyCell[][] => [
  keys("Bksp", "Q", "W", "E", "R", "T"),
  [
    key("Tab"),
    homeRowMod("A", "GUI"),
    homeRowMod("S", "Alt"),
    homeRowMod("D", "Shift"),
    homeRowMod("F", "Ctrl"),
    key("G"),
  ],
  [SHIFT, ...keys("Z", "X", "C", "V", "B")],
];

const typingRight = (): KeyCell[][] => [
  [...keys("Y", "U", "I", "O", "P"), punctuation("=", "+")],
  [
    key("H"),
    homeRowMod("J", "Ctrl"),
    homeRowMod("K", "Shift"),
    homeRowMod("L", "Alt"),
    SEMICOLON,
    punctuation("'", '"'),
  ],
  [
    ...keys("N", "M"),
    punctuation(",", "<"),
    punctuation(".", ">"),
    punctuation("/", "?"),
    punctuation("\\", "|"),
  ],
];

const typingThumbs = (): KeyCell[] => [
  momentary("NAV"),
  momentary("FUNC"),
  layerTap("Space", "SYM layer"),
  key("Enter"),
  momentary("SYM"),
  momentary("UTIL"),
];

// Extra Kairos44 thumbs: left Enter and right Space.
const extraThumbs = (): KeyCell[] => [
  layerTap("Enter", "Pad scroll mode"),
  layerTap("Space", "Pad precision (¼ speed)"),
];

const wheel = (label: string): KeyCell =>
  mouse(label, "One wheel step", [gesture("hold", "Repeats")]);

function layer(
  id: number,
  name: string,
  title: string,
  reach: string,
  cells: KeyCell[],
): LayerInfo {
  if (cells.length !== KEY_COUNT) {
    throw new Error(
      `Layer ${name} has ${cells.length} keys, expected ${KEY_COUNT}`,
    );
  }
  return { id, name, title, reach, keys: cells };
}

const RAW_LAYERS: LayerInfo[] = [
  layer(0, "BASE", "Base", "Default typing layer", [
    ...interleave(typingLeft(), typingRight()),
    ...typingThumbs(),
    ...extraThumbs(),
  ]),

  layer(1, "NAVIGATION", "Navigate", "Hold NAV (Lower)", [
    ...[
      key("Del"),
      switchTo("UTIL"),
      sticky("FUNC"),
      key("Up"),
      sticky("SYM"),
      key("PgUp"),
    ],
    ...[
      wheel("Wheel ↑"),
      wheel("Wheel ←"),
      mouse("Mouse ↑", "Moves while held"),
      wheel("Wheel →"),
      key("Home"),
      key("End"),
    ],
    ...[
      key("Ins"),
      sticky("UTIL"),
      key("Left"),
      key("Down"),
      key("Right"),
      key("PgDn"),
    ],
    ...[
      wheel("Wheel ↓"),
      mouse("Mouse ←", "Moves while held"),
      mouse("Mouse ↓", "Moves while held"),
      mouse("Mouse →", "Moves while held"),
      unassigned(),
      unassigned(),
    ],
    ...[
      switchTo("BASE"),
      layerTap("Alt", "Scroll mode", "Sticky Alt for the next key"),
      ...mice("R click", "M click", "L click"),
      layerTap(
        "Speed",
        "Temporary precision (¼ speed)",
        "Cycle speed: Normal, Fast, Precision",
      ),
    ],
    ...[momentary("COMBOS"), ...times(5, unassigned)],
    ...times(8, transparent),
  ]),

  layer(2, "FUNCTIONS", "Functions", "Hold FUNC (Raise)", [
    ...keys("/", "-", "1", "2", "3", "."),
    unassigned(),
    ...keys("F1", "F2", "F3", "F4", "Bksp"),
    ...keys("*", "+", "4", "5", "6", ","),
    unassigned(),
    ...keys("F5", "F6", "F7", "F8"),
    unassigned(),
    ...keys("KP Enter", "=", "7", "8", "9", "0"),
    switchTo("BASE"),
    ...keys("F9", "F10", "F11", "F12"),
    unassigned(),
    key("Bksp"),
    ...times(7, transparent),
  ]),

  layer(3, "SYMBOL_KP", "Symbols / Keypad", "Hold SYM (Down), or hold Space", [
    ...keys("Bksp", "!", "@", "#", "(", ")", "/", "7", "8", "9", "-", "_"),
    ...keys("`", "$", "%", "^", "[", "]", "*", "4", "5", "6", "+", "="),
    ...keys("~", "&", "*", "|", "{", "}", ".", "1", "2", "3", ",", "KP Enter"),
    key("Bksp"),
    transparent(),
    key("Space"),
    key("Return"),
    unassigned(),
    key("0"),
    ...times(2, transparent),
  ]),

  layer(4, "UTILS", "Utilities", "Hold UTIL (Up)", [
    system("BT 0", "Select Bluetooth profile 0"),
    system("BT prev", "Previous Bluetooth profile"),
    system("BT next", "Next Bluetooth profile"),
    system("BT clear all", "Clear all host bonds"),
    system("Power off", "Turn off external power"),
    system("Power on", "Turn on external power"),
    system("Power on", "Turn on external power"),
    system("Power off", "Turn off external power"),
    system("RGB", "Toggle RGB"),
    switchTo("NAV"),
    media("Bright +"),
    media("Vol +"),
    system("BT 1", "Select Bluetooth profile 1"),
    system("RGB", "Toggle RGB"),
    system("Hue +", "RGB hue up"),
    system("Sat +", "RGB saturation up"),
    system("Bri +", "RGB brightness up"),
    system("Spd +", "RGB speed up"),
    system("RGB", "Toggle RGB"),
    switchTo("FUNC"),
    switchTo("SYM"),
    sticky("NAV"),
    media("Bright -"),
    media("Vol -"),
    switchTo("BASE"),
    system("RGB mode", "Next RGB effect"),
    system("Hue -", "RGB hue down"),
    system("Sat -", "RGB saturation down"),
    system("Bri -", "RGB brightness down"),
    system("Spd -", "RGB speed down"),
    switchTo("MIRROR"),
    media("Prev"),
    media("Play"),
    media("Next"),
    switchTo("COMBOS"),
    media("Mute"),
    ...times(8, transparent),
  ]),

  layer(5, "MIRROR", "Mirror", "Lock from UTILS (right N)", [
    ...interleave(typingRight(), typingLeft()),
    ...typingThumbs(),
    ...times(2, transparent),
  ]),

  layer(
    6,
    "COMBOS",
    "Combos",
    "Hold COMBOS on NAVIGATION, or lock from UTILS",
    [
      ...times(24, unassigned),
      switchTo("BASE"),
      ...times(11, unassigned),
      ...typingThumbs(),
      ...times(2, transparent),
    ],
  ),
];

const base = RAW_LAYERS[0].keys;

export const LAYERS: LayerInfo[] = RAW_LAYERS.map((entry) =>
  entry.id === 0
    ? entry
    : { ...entry, keys: resolveTransparent(entry.keys, base) },
);
