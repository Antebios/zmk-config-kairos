# Layer and combo reference

This page is generated from `src/layers.ts` and `src/layout.ts` by
`npm run docs:reference`. Do not edit it by hand.

## How to read the tables

Each layer is shown as the keyboard is laid out: three rows of twelve keys,
six on the left half (L1 to L6) and six on the right (R1 to R6), then the
thumb keys. In a cell:

- **Bold** is the key's label, with its gestures underneath as a code and an
  action, such as `hold GUI` or `2× Caps Word`. The codes are explained in
  [Reading a key](reading-keys.md).
- _Italic_ is a transparent key: it is not assigned on this layer and uses the
  BASE key shown.
- A dash is an unassigned key that does nothing.

The key types are:

- Key: Regular key press.
- Home-row mod: Tap for the key, hold for a modifier.
- Layer / mode tap: Tap for a key or action, hold for a layer or pointer mode.
- Tap dance: Different action depending on how many times it is tapped or held.
- Momentary layer: Layer is active only while the key is held.
- Sticky layer: Layer applies to the next key press, then releases.
- Layer switch: Switches to the layer and stays there until changed.
- Mouse: Pointer movement, wheel or button.
- System: Bluetooth, power or RGB control.
- Media: Volume, brightness or playback.
- Transparent: Not assigned here; the key falls through to BASE.
- Unassigned: Blocked; the key does nothing on this layer.

## Layers

### BASE

Base. Default typing layer.

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>Bksp</code>** | **<code>Q</code>** | **<code>W</code>** | **<code>E</code>** | **<code>R</code>** | **<code>T</code>** | **<code>Y</code>** | **<code>U</code>** | **<code>I</code>** | **<code>O</code>** | **<code>P</code>** | **<code>=</code>**<br><code>2× +</code><br><code>tap+hold +</code> |
| Home | **<code>Tab</code>** | **<code>A</code>**<br><code>hold GUI</code> | **<code>S</code>**<br><code>hold Alt</code> | **<code>D</code>**<br><code>hold Shift</code> | **<code>F</code>**<br><code>hold Ctrl</code> | **<code>G</code>** | **<code>H</code>** | **<code>J</code>**<br><code>hold Ctrl</code> | **<code>K</code>**<br><code>hold Shift</code> | **<code>L</code>**<br><code>hold Alt</code> | **<code>;</code>**<br><code>hold Right GUI</code><br><code>2× :</code> | **<code>'</code>**<br><code>2× "</code><br><code>tap+hold "</code> |
| Bottom | **<code>Shift</code>**<br><code>hold Shift</code><br><code>2× Caps Word</code><br><code>tap+hold Ctrl</code> | **<code>Z</code>** | **<code>X</code>** | **<code>C</code>** | **<code>V</code>** | **<code>B</code>** | **<code>N</code>** | **<code>M</code>** | **<code>,</code>**<br><code>2× &lt;</code><br><code>tap+hold &lt;</code> | **<code>.</code>**<br><code>2× &gt;</code><br><code>tap+hold &gt;</code> | **<code>/</code>**<br><code>2× ?</code><br><code>tap+hold ?</code> | **<code>\</code>**<br><code>2× &#124;</code><br><code>tap+hold &#124;</code> |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | **<code>NAV</code>** | **<code>FUNC</code>** | **<code>Space</code>**<br><code>hold SYM layer</code> | **<code>Enter</code>** | **<code>SYM</code>** | **<code>UTIL</code>** |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | **<code>Enter</code>**<br><code>hold Pad scroll mode</code> | **<code>Space</code>**<br><code>hold Pad precision (¼ speed)</code> |

### NAVIGATION

Navigate. Hold NAV (Lower).

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>Del</code>** | **<code>UTIL</code>** | **<code>FUNC</code>** | **<code>Up</code>** | **<code>SYM</code>** | **<code>PgUp</code>** | **<code>Wheel ↑</code>**<br><code>hold Repeats</code> | **<code>Wheel ←</code>**<br><code>hold Repeats</code> | **<code>Mouse ↑</code>** | **<code>Wheel →</code>**<br><code>hold Repeats</code> | **<code>Home</code>** | **<code>End</code>** |
| Home | **<code>Ins</code>** | **<code>UTIL</code>** | **<code>Left</code>** | **<code>Down</code>** | **<code>Right</code>** | **<code>PgDn</code>** | **<code>Wheel ↓</code>**<br><code>hold Repeats</code> | **<code>Mouse ←</code>** | **<code>Mouse ↓</code>** | **<code>Mouse →</code>** | — | — |
| Bottom | **<code>BASE</code>** | **<code>Alt</code>**<br><code>hold Scroll mode</code> | **<code>R click</code>** | **<code>M click</code>** | **<code>L click</code>** | **<code>Speed</code>**<br><code>hold Temporary precision (¼ speed)</code> | **<code>COMBOS</code>** | — | — | — | — | — |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | _<code>NAV</code>_ | _<code>FUNC</code>_ | _<code>Space</code>_ | _<code>Enter</code>_ | _<code>SYM</code>_ | _<code>UTIL</code>_ |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

### FUNCTIONS

Functions. Hold FUNC (Raise).

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>/</code>** | **<code>-</code>** | **<code>1</code>** | **<code>2</code>** | **<code>3</code>** | **<code>.</code>** | — | **<code>F1</code>** | **<code>F2</code>** | **<code>F3</code>** | **<code>F4</code>** | **<code>Bksp</code>** |
| Home | **<code>*</code>** | **<code>+</code>** | **<code>4</code>** | **<code>5</code>** | **<code>6</code>** | **<code>,</code>** | — | **<code>F5</code>** | **<code>F6</code>** | **<code>F7</code>** | **<code>F8</code>** | — |
| Bottom | **<code>KP Enter</code>** | **<code>=</code>** | **<code>7</code>** | **<code>8</code>** | **<code>9</code>** | **<code>0</code>** | **<code>BASE</code>** | **<code>F9</code>** | **<code>F10</code>** | **<code>F11</code>** | **<code>F12</code>** | — |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | **<code>Bksp</code>** | _<code>FUNC</code>_ | _<code>Space</code>_ | _<code>Enter</code>_ | _<code>SYM</code>_ | _<code>UTIL</code>_ |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

### SYMBOL_KP

Symbols / Keypad. Hold SYM (Down), or hold Space.

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>Bksp</code>** | **<code>!</code>** | **<code>@</code>** | **<code>#</code>** | **<code>(</code>** | **<code>)</code>** | **<code>/</code>** | **<code>7</code>** | **<code>8</code>** | **<code>9</code>** | **<code>-</code>** | **<code>_</code>** |
| Home | **<code>&#96;</code>** | **<code>$</code>** | **<code>%</code>** | **<code>^</code>** | **<code>[</code>** | **<code>]</code>** | **<code>*</code>** | **<code>4</code>** | **<code>5</code>** | **<code>6</code>** | **<code>+</code>** | **<code>=</code>** |
| Bottom | **<code>~</code>** | **<code>&amp;</code>** | **<code>*</code>** | **<code>&#124;</code>** | **<code>{</code>** | **<code>}</code>** | **<code>.</code>** | **<code>1</code>** | **<code>2</code>** | **<code>3</code>** | **<code>,</code>** | **<code>KP Enter</code>** |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | **<code>Bksp</code>** | _<code>FUNC</code>_ | **<code>Space</code>** | **<code>Return</code>** | — | **<code>0</code>** |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

### UTILS

Utilities. Hold UTIL (Up).

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>BT 0</code>** | **<code>BT prev</code>** | **<code>BT next</code>** | **<code>BT clear all</code>** | **<code>Power off</code>** | **<code>Power on</code>** | **<code>Power on</code>** | **<code>Power off</code>** | **<code>RGB</code>** | **<code>NAV</code>** | **<code>Bright +</code>** | **<code>Vol +</code>** |
| Home | **<code>BT 1</code>** | **<code>RGB</code>** | **<code>Hue +</code>** | **<code>Sat +</code>** | **<code>Bri +</code>** | **<code>Spd +</code>** | **<code>RGB</code>** | **<code>FUNC</code>** | **<code>SYM</code>** | **<code>NAV</code>** | **<code>Bright -</code>** | **<code>Vol -</code>** |
| Bottom | **<code>BASE</code>** | **<code>RGB mode</code>** | **<code>Hue -</code>** | **<code>Sat -</code>** | **<code>Bri -</code>** | **<code>Spd -</code>** | **<code>MIRROR</code>** | **<code>Prev</code>** | **<code>Play</code>** | **<code>Next</code>** | **<code>COMBOS</code>** | **<code>Mute</code>** |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | _<code>NAV</code>_ | _<code>FUNC</code>_ | _<code>Space</code>_ | _<code>Enter</code>_ | _<code>SYM</code>_ | _<code>UTIL</code>_ |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

### MIRROR

Mirror. Lock from UTILS (right N).

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | **<code>Y</code>** | **<code>U</code>** | **<code>I</code>** | **<code>O</code>** | **<code>P</code>** | **<code>=</code>**<br><code>2× +</code><br><code>tap+hold +</code> | **<code>Bksp</code>** | **<code>Q</code>** | **<code>W</code>** | **<code>E</code>** | **<code>R</code>** | **<code>T</code>** |
| Home | **<code>H</code>** | **<code>J</code>**<br><code>hold Ctrl</code> | **<code>K</code>**<br><code>hold Shift</code> | **<code>L</code>**<br><code>hold Alt</code> | **<code>;</code>**<br><code>hold Right GUI</code><br><code>2× :</code> | **<code>'</code>**<br><code>2× "</code><br><code>tap+hold "</code> | **<code>Tab</code>** | **<code>A</code>**<br><code>hold GUI</code> | **<code>S</code>**<br><code>hold Alt</code> | **<code>D</code>**<br><code>hold Shift</code> | **<code>F</code>**<br><code>hold Ctrl</code> | **<code>G</code>** |
| Bottom | **<code>N</code>** | **<code>M</code>** | **<code>,</code>**<br><code>2× &lt;</code><br><code>tap+hold &lt;</code> | **<code>.</code>**<br><code>2× &gt;</code><br><code>tap+hold &gt;</code> | **<code>/</code>**<br><code>2× ?</code><br><code>tap+hold ?</code> | **<code>\</code>**<br><code>2× &#124;</code><br><code>tap+hold &#124;</code> | **<code>Shift</code>**<br><code>hold Shift</code><br><code>2× Caps Word</code><br><code>tap+hold Ctrl</code> | **<code>Z</code>** | **<code>X</code>** | **<code>C</code>** | **<code>V</code>** | **<code>B</code>** |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | **<code>NAV</code>** | **<code>FUNC</code>** | **<code>Space</code>**<br><code>hold SYM layer</code> | **<code>Enter</code>** | **<code>SYM</code>** | **<code>UTIL</code>** |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

### COMBOS

Combos. Hold COMBOS on NAVIGATION, or lock from UTILS.

|  | L1 | L2 | L3 | L4 | L5 | L6 | R1 | R2 | R3 | R4 | R5 | R6 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Top | — | — | — | — | — | — | — | — | — | — | — | — |
| Home | — | — | — | — | — | — | — | — | — | — | — | — |
| Bottom | **<code>BASE</code>** | — | — | — | — | — | — | — | — | — | — | — |

| Thumbs | Lower | Raise | Space | Enter | Down | Up |
| --- | --- | --- | --- | --- | --- | --- |
|  | **<code>NAV</code>** | **<code>FUNC</code>** | **<code>Space</code>**<br><code>hold SYM layer</code> | **<code>Enter</code>** | **<code>SYM</code>** | **<code>UTIL</code>** |

| Extra thumbs | Left Enter | Right Space |
| --- | --- | --- |
|  | _<code>Enter</code>_ | _<code>Space</code>_ |

## Combos

Press the keys together. Key labels are those of the first layer listed for the
combo, and the physical keys are the same on every layer.

### Shortcuts

| Action | Keys to press | Layers |
| --- | --- | --- |
| Undo (Ctrl+Z) | <code>Shift</code> + <code>Z</code> | BASE |
| Cut (Ctrl+X) | <code>Z</code> + <code>X</code> | BASE |
| Copy (Ctrl+C) | <code>X</code> + <code>C</code> | BASE |
| Paste (Ctrl+V) | <code>C</code> + <code>V</code> | BASE |
| Toggle primary sidebar (Ctrl+B) | <code>I</code> + <code>O</code> | BASE |
| Toggle primary sidebar (Ctrl+B) | <code>W</code> + <code>E</code> | COMBOS |
| Toggle secondary sidebar (Ctrl+Alt+B) | <code>K</code> + <code>L</code> | BASE |
| Toggle secondary sidebar (Ctrl+Alt+B) | <code>S</code> + <code>D</code> | COMBOS |
| Toggle bottom panel (Ctrl+J) | <code>,</code> + <code>.</code> | BASE |
| Toggle bottom panel (Ctrl+J) | <code>X</code> + <code>C</code> | COMBOS |
| Toggle terminal (Ctrl+`) | <code>O</code> + <code>P</code> | BASE |
| Toggle terminal (Ctrl+`) | <code>Q</code> + <code>W</code> | COMBOS |
| New terminal (Ctrl+Shift+`) | <code>L</code> + <code>;</code> | BASE |
| New terminal (Ctrl+Shift+`) | <code>D</code> + <code>F</code> | COMBOS |
| Command palette (Ctrl+Shift+P) | <code>.</code> + <code>/</code> | BASE |
| Command palette (Ctrl+Shift+P) | <code>Z</code> + <code>X</code> | COMBOS |
| Explorer (Ctrl+Shift+E) | <code>P</code> + <code>=</code> | BASE |
| Explorer (Ctrl+Shift+E) | <code>Bksp</code> + <code>Q</code> | COMBOS |
| Search in files (Ctrl+Shift+F) | <code>;</code> + <code>'</code> | BASE |
| Search in files (Ctrl+Shift+F) | <code>Tab</code> + <code>A</code> | COMBOS |
| Search in files (Ctrl+Shift+F) | <code>F</code> + <code>Space</code> | BASE |
| Find (Ctrl+F) | <code>F</code> + <code>B</code> | BASE |
| Source control (Ctrl+Shift+G, G) | <code>/</code> + <code>\</code> | BASE |
| Source control (Ctrl+Shift+G, G) | <code>BASE</code> + <code>Z</code> | COMBOS |
| New window (Ctrl+Shift+N) | <code>D</code> + <code>F</code> | BASE |

### Keys and symbols

| Action | Keys to press | Layers |
| --- | --- | --- |
| Enter | <code>FUNC</code> + <code>Space</code> | All |
| Space | <code>Enter</code> + <code>SYM</code> | All |
| Escape | <code>W</code> + <code>E</code> | All except COMBOS |
| Delete | <code>Bksp</code> + <code>Q</code> | All except COMBOS |
| ` (grave) | <code>Bksp</code> + <code>Q</code> + <code>W</code> | All |
| ~ (tilde) | <code>Tab</code> + <code>A</code> + <code>S</code> | All |
| - (minus) | <code>Y</code> + <code>U</code> | All |
| _ (underscore) | <code>U</code> + <code>I</code> | All |
| + (plus) | <code>H</code> + <code>J</code> | All |
| = (equal) | <code>J</code> + <code>K</code> | All |

### System

| Action | Keys to press | Layers |
| --- | --- | --- |
| Print Screen | <code>=</code> + <code>'</code> | All |
| Print Screen | <code>Bksp</code> + <code>Tab</code> | All |
| Private text macro | <code>R</code> + <code>T</code> | All |
| Private text macro | <code>F</code> + <code>G</code> | All |
| Private text macro | <code>V</code> + <code>B</code> | All |
| Reset to bootloader | <code>'</code> + <code>C</code> + <code>Space</code> | All |
| Return to BASE layer | <code>NAV</code> + <code>FUNC</code> + <code>Space</code> | All |
