# Reading a key

Every key on every layer is drawn, including keys that do nothing. A key has a
type, shown by its border colour, and optional gestures, shown as small chips
inside it.

## Key types

The legend under the keyboard in the Normal view lists the types present on the
selected layer. The colours are in the table; the type name is also in each
key's accessible label and in the details panel, so colour is never the only
cue.

| Border              | Type             | Meaning                                                                                                          |
| ------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Slate grey          | Key              | An ordinary key press                                                                                            |
| Green               | Home-row mod     | Tap for the key, hold for a modifier (the A S D F and J K L keys)                                                |
| Cyan                | Layer / mode tap | Tap for a key or action, hold for a layer or pointer mode (for example Space holds the symbol layer)             |
| Purple              | Tap dance        | A different action depending on how many times the key is tapped or held                                         |
| Blue                | Momentary layer  | The layer is active only while the key is held                                                                   |
| Orange              | Sticky layer     | The layer applies to the next key press, then releases                                                           |
| Pink                | Layer switch     | Switches to the layer and stays there until you change it                                                        |
| Lime                | Mouse            | Pointer movement, wheel or a mouse button                                                                        |
| Red                 | System           | Bluetooth, power or RGB control                                                                                  |
| Tan                 | Media            | Volume, brightness or playback                                                                                   |
| Dashed, dim         | Transparent      | Not assigned on this layer; the key falls through to the BASE layer, and the label shown is the BASE key it uses |
| Dotted, dim, "none" | Unassigned       | Blocked; the key does nothing on this layer                                                                      |

## Gestures

Gesture chips are written as a short code then the action.

| Code       | Gesture                        | Example                                             |
| ---------- | ------------------------------ | --------------------------------------------------- |
| `hold`     | Press and hold                 | `hold GUI` on A makes the key act as GUI while held |
| `tap+hold` | Tap, then press again and hold | `tap+hold Ctrl` on Shift gives Ctrl                 |
| `2×`       | Double tap                     | `2× Caps Word` on Shift                             |
| `2×+hold`  | Double tap, then hold          | Not used by the current layout                      |
| `3×`       | Triple tap                     | Not used by the current layout                      |
| `3×+hold`  | Triple tap, then hold          | Not used by the current layout                      |

The Shift key is the richest example: tap for a sticky Shift on the next key,
hold for Shift, double tap for Caps Word, tap then hold for Ctrl.

Punctuation keys such as `,` `.` `/` and `'` are tap dances too: a double tap or
a tap then hold gives the shifted character (`<`, `>`, `?` and `"`).

## Combos on a key

A combo is two or three keys pressed together. In the Compact view each key
shows its combos in gold as `+` then the other keys then a short name. The
short names:

| Short name                                 | Action                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Undo, Cut, Copy, Paste                     | Ctrl+Z, Ctrl+X, Ctrl+C, Ctrl+V                                                       |
| Side, Side 2                               | Toggle primary and secondary sidebars in VS Code                                     |
| Panel, Term, New term                      | Toggle the bottom panel, toggle the terminal, open a new terminal                    |
| Palette, Files, Search, Find, Git, New win | VS Code command palette, explorer, search in files, find, source control, new window |
| PrtSc                                      | Print Screen                                                                         |
| Enter, Space, Esc, Del                     | The keys of those names                                                              |
| `` ` ``, `~`, `-`, `_`, `+`, `=`           | The symbol itself                                                                    |
| Private                                    | A macro that types stored text. Its contents are deliberately never shown            |
| Reset                                      | Reset to the bootloader                                                              |
| BASE                                       | Return to the BASE layer                                                             |

The full list with the exact keys for every layer is in the
[Layer and combo reference](reference.md).

## The layers

| Layer      | How to reach it                               |
| ---------- | --------------------------------------------- |
| BASE       | Default typing layer                          |
| NAVIGATION | Hold NAV (Lower)                              |
| FUNCTIONS  | Hold FUNC (Raise)                             |
| SYMBOL_KP  | Hold SYM (Down), or hold Space                |
| UTILS      | Hold UTIL (Up)                                |
| MIRROR     | Lock from UTILS (right N)                     |
| COMBOS     | Hold COMBOS on NAVIGATION, or lock from UTILS |

On the COMBOS layer most keys are unassigned, and the combos use the BASE
layer's key labels for those positions, because the physical key you press is
the same.

## Where the data comes from

The key labels, types and combos are written by hand from the keymap files in
`boards/shields/common/kairos`, for the trackpad build. If you change the
keymap, update `src/layers.ts` and `src/layout.ts` to match
([Development](development.md)). Tests compare what is drawn with the compiled
firmware keymap and fail when they disagree, so a changed keymap cannot go
unnoticed.
