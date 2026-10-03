# Kairos44 Printable Reference

Reference for this repository's current 44-key configuration, checked
2026-10-02. Uses the physical BASE key names throughout. Host keyboard layout
and application shortcuts can change what a keycode produces; the symbol charts
assume a US host layout. Print this Markdown preview, or export it to PDF.

## Physical Layout And Notation

Each main row is listed outer-to-inner on the left and inner-to-outer on the
right, matching the keyboard viewed from above. The three original thumb keys
on each half are shown separately from the two additional upper-inner thumbs.

| Row                     | Left: outer to inner         | Right: inner to outer                 |
| ----------------------- | ---------------------------- | ------------------------------------- |
| Top                     | Backspace, Q, W, E, R, T     | Y, U, I, O, P, Equal                  |
| Home                    | Tab, A, S, D, F, G           | H, J, K, L, Semicolon, Quote          |
| Bottom                  | Shift, Z, X, C, V, B         | N, M, Comma, Period, Slash, Backslash |
| Original thumbs         | Lower, Raise, original Space | original Enter, Down, Up              |
| Extra upper-inner thumb | extra Enter                  | extra Space                           |

- `LGUI` means left GUI/Super/Windows; `RGUI` means right GUI. Ctrl, Alt and
  Shift are literal modifiers, not application-specific command names.
- **Hold layer**: active while the key is held. **Lock layer**: stays active
  after release. **Sticky layer/modifier**: applies to the next eligible key.
- **Transparent**: falls through to an active lower layer; on BASE it uses the
  BASE action. **None**: deliberately does nothing.
- A chord such as `Q + W` means press the physical keys together, not in
  sequence. Combo arbitration is 50 ms; roll the keys together within that
  interval. Letter names identify positions even on non-BASE layers.
- Return to BASE from any layer with **Lower + Raise + original left Space**
  together. The extra right Space is not part of this chord.

## Layer Access

| ID  | Layer      | From BASE                                                                  |
| --- | ---------- | -------------------------------------------------------------------------- |
| 0   | BASE       | Default; recovery chord above                                              |
| 1   | NAVIGATION | Hold Lower                                                                 |
| 2   | FUNCTIONS  | Hold Raise                                                                 |
| 3   | SYMBOL_KP  | Hold Down, or hold original left Space                                     |
| 4   | UTILS      | Hold Up                                                                    |
| 5   | MIRROR     | NAVIGATION: hold physical left C; UTILS: tap physical right N to lock      |
| 6   | COMBOS     | NAVIGATION: hold physical right N; UTILS: tap physical right Slash to lock |

Lower, Raise, Down and Up are direct momentary layer keys. Tapping or
double/triple-tapping them does not select the old thumb tap-dance actions.
They do not send arrow characters on BASE.

To lock UTILS entirely from the left: hold Lower, tap physical Q, then release
both. To return to BASE, tap the far-left bottom-row Shift-position key in
NAVIGATION, UTILS or COMBOS; tap physical right N in FUNCTIONS. SYMBOL_KP and
MIRROR use the recovery chord. In SYMBOL_KP the Shift position sends tilde;
in FUNCTIONS it sends keypad Enter, not a layer reset.

## BASE And Tap/Hold Behavior

Letters and ordinary keys follow the physical layout above. Exceptions:

| Physical key         | Tap   | Hold        |
| -------------------- | ----- | ----------- |
| A                    | A     | Left GUI    |
| S                    | S     | Left Alt    |
| D                    | D     | Left Shift  |
| F                    | F     | Left Ctrl   |
| J                    | J     | Right Ctrl  |
| K                    | K     | Right Shift |
| L                    | L     | Right Alt   |
| Original left Space  | Space | SYMBOL_KP   |
| Extra left Enter     | Enter | Enter       |
| Original right Enter | Enter | Enter       |
| Extra right Space    | Space | Space       |

Home-row modifiers use tap-preferred hold/tap with a 200 ms tapping term and
200 ms quick-tap interval. Fast rolls favor letters. The original left Space
uses its independent 220 ms tapping term. The extra thumbs remain transparent
on every other layer, so their BASE Enter/Space bindings remain available.

Punctuation and Shift tap-dances are listed below; they are not ordinary
auto-shift bindings. Application macros send shortcuts, not application-aware
commands.

### Punctuation, Shift And Caps Word

These actions apply on BASE and at their relocated positions on MIRROR.
Tap-dances use a 300 ms multi-tap window. Double tap means one alternate
character/action, not two copies of the single-tap character.

| BASE physical key | Single tap        | Single hold  | Double tap    | Tap then hold |
| ----------------- | ----------------- | ------------ | ------------- | ------------- |
| Shift             | Sticky left Shift | Left Shift   | Caps Word     | Left Ctrl     |
| Semicolon         | Semicolon         | Right GUI    | Colon         | No action     |
| Equal             | Equal             | Equal        | Plus          | Plus          |
| Quote             | Single quote      | Single quote | Double quote  | Double quote  |
| Comma             | Comma             | Comma        | Less-than     | Less-than     |
| Period            | Period            | Period       | Greater-than  | Greater-than  |
| Slash             | Slash             | Slash        | Question mark | Question mark |
| Backslash         | Backslash         | Backslash    | Pipe          | Pipe          |

Shift's nested hold/taps use 300 ms; Semicolon's first hold/tap uses 220 ms.
For the plain punctuation dances, holding keeps the selected character key
pressed; host repeat settings determine repetition. Caps Word uppercases
letters without holding Shift. Its configured continuation keys are underscore,
minus, Backspace and Delete; Space ends the word mode. Caps Word is not Caps
Lock. Home-row Shift remains an ordinary held modifier.

## NAVIGATION: Movement, Mouse And Layer Selection

Hold Lower. All physical names below refer to BASE, not the layer's output.

| Left physical key | Action           | Right physical key | Action              |
| ----------------- | ---------------- | ------------------ | ------------------- |
| Backspace         | Delete           | Y                  | Wheel up            |
| Q                 | Lock UTILS       | U                  | Wheel left          |
| W                 | Sticky FUNCTIONS | I                  | Mouse up            |
| E                 | Up arrow         | O                  | Wheel right         |
| R                 | Sticky SYMBOL_KP | P                  | None                |
| T                 | Page Up          | Equal              | None                |
| Tab               | Insert           | H                  | Wheel down          |
| A                 | Sticky UTILS     | J                  | Mouse left          |
| S                 | Left arrow       | K                  | Mouse down          |
| D                 | Down arrow       | L                  | Mouse right         |
| F                 | Right arrow      | Semicolon          | None                |
| G                 | Page Down        | Quote              | None                |
| Shift             | Return to BASE   | N                  | Hold COMBOS         |
| Z                 | Sticky left Alt  | M                  | Left mouse button   |
| X                 | Hold left Alt    | Comma              | Middle mouse button |
| C                 | Hold MIRROR      | Period             | Right mouse button  |
| V                 | Home             | Slash              | None                |
| B                 | End              | Backslash          | None                |

All original thumbs are transparent. The extra Enter and Space are transparent.
Mouse buttons remain held while their keys are held, allowing dragging with
the movement keys. These are keyboard-generated pointer controls, not a
trackpad implementation.

## FUNCTIONS: Numbers And Function Keys

Hold Raise, or use NAVIGATION W for one-shot access.
Numbers are ordinary number-row codes; actions marked KP are keypad codes.

| Left physical key | Action      | Right physical key | Action         |
| ----------------- | ----------- | ------------------ | -------------- |
| Backspace         | KP Divide   | Y                  | None           |
| Q                 | KP Minus    | U                  | F1             |
| W                 | 1           | I                  | F2             |
| E                 | 2           | O                  | F3             |
| R                 | 3           | P                  | F4             |
| T                 | Period      | Equal              | Backspace      |
| Tab               | KP Multiply | H                  | None           |
| A                 | KP Plus     | J                  | F5             |
| S                 | 4           | K                  | F6             |
| D                 | 5           | L                  | F7             |
| F                 | 6           | Semicolon          | F8             |
| G                 | Comma       | Quote              | None           |
| Shift             | KP Enter    | N                  | Return to BASE |
| Z                 | Equal       | M                  | F9             |
| X                 | 7           | Comma              | F10            |
| C                 | 8           | Period             | F11            |
| V                 | 9           | Slash              | F12            |
| B                 | 0           | Backslash          | None           |

Original Lower sends Backspace. Raise, original left Space, original right
Enter, Down and Up are transparent. Extra Enter and Space are transparent.

## SYMBOL_KP: Symbols And Right-Hand Numbers

Hold Down or original left Space; NAVIGATION R provides one-shot access.
Symbol descriptions below assume a US host layout.

| Left physical key | Action                   | Right physical key | Action         |
| ----------------- | ------------------------ | ------------------ | -------------- |
| Backspace         | Backspace                | Y                  | KP Divide      |
| Q                 | Exclamation `!`          | U                  | 7              |
| W                 | At sign `@`              | I                  | 8              |
| E                 | Hash `#`                 | O                  | 9              |
| R                 | Left parenthesis `(`     | P                  | KP Minus       |
| T                 | Right parenthesis `)`    | Equal              | Underscore `_` |
| Tab               | Grave/backtick           | H                  | KP Multiply    |
| A                 | Dollar `$`               | J                  | 4              |
| S                 | Percent `%`              | K                  | 5              |
| D                 | Caret `^`                | L                  | 6              |
| F                 | Left square bracket `[`  | Semicolon          | Plus `+`       |
| G                 | Right square bracket `]` | Quote              | Equal `=`      |
| Shift             | Tilde `~`                | N                  | Period         |
| Z                 | Ampersand `&`            | M                  | 1              |
| X                 | Asterisk `*`             | Comma              | 2              |
| C                 | Pipe                     | Period             | 3              |
| V                 | Left brace `{`           | Slash              | Comma          |
| B                 | Right brace `}`          | Backslash          | KP Enter       |

| Original thumb | Action                                              |
| -------------- | --------------------------------------------------- |
| Lower          | Backspace                                           |
| Raise          | Transparent                                         |
| Left Space     | Plain Space                                         |
| Right Enter    | Return/Enter                                        |
| Down           | None; an already held Down still releases the layer |
| Up             | 0                                                   |

Extra Enter and Space are transparent. Use the three-thumb recovery chord
if this layer is locked. The physical Shift position is not a BASE-return key.

## UTILS: Bluetooth, RGB, Power And Media

Hold Up, or hold Lower, tap Q, then release both to lock UTILS from the left.
The table deliberately distinguishes profile numbers from zero-based firmware
indices.

| Left physical key | Action                              | Right physical key | Action               |
| ----------------- | ----------------------------------- | ------------------ | -------------------- |
| Backspace         | Select Profile 1 (`BT_SEL 0`)       | Y                  | External power on    |
| Q                 | Previous host profile               | U                  | External power off   |
| W                 | Next host profile                   | I                  | Toggle RGB           |
| E                 | Clear ALL host bonds (`BT_CLR_ALL`) | O                  | Lock NAVIGATION      |
| R                 | External power off                  | P                  | Host brightness up   |
| T                 | External power on                   | Equal              | Volume up            |
| Tab               | Select Profile 2 (`BT_SEL 1`)       | H                  | Toggle RGB           |
| A                 | Toggle RGB                          | J                  | Lock FUNCTIONS       |
| S                 | RGB hue up                          | K                  | Lock SYMBOL_KP       |
| D                 | RGB saturation up                   | L                  | Sticky NAVIGATION    |
| F                 | RGB brightness up                   | Semicolon          | Host brightness down |
| G                 | RGB animation speed up              | Quote              | Volume down          |
| Shift             | Return to BASE                      | N                  | Lock MIRROR          |
| Z                 | Next RGB effect                     | M                  | Previous media track |
| X                 | RGB hue down                        | Comma              | Play/pause           |
| C                 | RGB saturation down                 | Period             | Next media track     |
| V                 | RGB brightness down                 | Slash              | Lock COMBOS          |
| B                 | RGB animation speed down            | Backslash          | Mute                 |

All original and extra thumbs are transparent. RGB effect/speed changes depend
on the selected animation. External-power controls operate the configured
switched supply; they do not turn the controller off. SuperMini power circuitry
compatibility is not established by working GPIOs. Host brightness/media
responses depend on the desktop and application.

**Destructive host action:** UTILS E clears all laptop/phone profile bonds and
selects Profile 1. In the pinned ZMK version it preserves the separate split
bond. Re-pair host devices afterward. It is not a routine update step.

## MIRROR: Relocated BASE Actions

NAVIGATION C holds MIRROR; UTILS N locks it. Each main-row binding is swapped
to the opposite half in row order, not simply horizontally reflected. The
home-row modifiers and punctuation behaviors move with their bindings.

| Left physical key | Action                                        | Right physical key | Action                |
| ----------------- | --------------------------------------------- | ------------------ | --------------------- |
| Backspace         | Y                                             | Y                  | Backspace             |
| Q                 | U                                             | U                  | Q                     |
| W                 | I                                             | I                  | W                     |
| E                 | O                                             | O                  | E                     |
| R                 | P                                             | P                  | R                     |
| T                 | Equal/Plus dance                              | Equal              | T                     |
| Tab               | H                                             | H                  | Tab                   |
| A                 | J / hold right Ctrl                           | J                  | A / hold left GUI     |
| S                 | K / hold right Shift                          | K                  | S / hold left Alt     |
| D                 | L / hold right Alt                            | L                  | D / hold left Shift   |
| F                 | Semicolon / hold right GUI / double tap Colon | Semicolon          | F / hold left Ctrl    |
| G                 | Quote dance                                   | Quote              | G                     |
| Shift             | N                                             | N                  | Shift/Caps Word dance |
| Z                 | M                                             | M                  | Z                     |
| X                 | Comma dance                                   | Comma              | X                     |
| C                 | Period dance                                  | Period             | C                     |
| V                 | Slash dance                                   | Slash              | V                     |
| B                 | Backslash dance                               | Backslash          | B                     |

Original thumbs keep BASE bindings; extra Enter and Space are transparent.
Use Lower + Raise + original left Space to leave a locked MIRROR layer.
Combo positions do not move with the mirrored characters: use the BASE
physical positions listed in the combo tables.

## COMBOS: Shortcut-Only Main Rows

NAVIGATION N holds COMBOS; UTILS Slash locks it. Main-row single keys do
nothing except the left Shift-position key, which returns to BASE. Original
thumbs keep BASE actions and extra Enter/Space are transparent. Global combos
and the COMBOS-specific VS Code chords below remain active.

## Combo Reference: All 43 Definitions

Press physical positions together within the 50 ms combo window. Modifiers
shown in the output are generated by firmware; you do not separately hold them.
Chord names remain BASE positions on every layer, including MIRROR.

### Global Chords: Every Layer

| Physical chord                      | Output/action                                   |
| ----------------------------------- | ----------------------------------------------- |
| Raise + original left Space         | Enter                                           |
| Original right Enter + Down         | Space                                           |
| Equal + Quote                       | Print Screen                                    |
| Backspace + Tab                     | Print Screen                                    |
| Backspace + Q + W                   | Grave/backtick                                  |
| Tab + A + S                         | Tilde                                           |
| Y + U                               | Minus                                           |
| U + I                               | Underscore                                      |
| H + J                               | Plus                                            |
| J + K                               | Equal                                           |
| Quote + C + original left Space     | Firmware reboot (`sys_reset`); not a bond clear |
| Lower + Raise + original left Space | Return to BASE; not a firmware reboot           |

Three additional global chords trigger the private text macros listed in the
macro section: R + T, F + G, and V + B. Avoid testing them in a terminal or
password field: each sends stored text followed by Enter.

### Escape/Delete And BASE Editing

| Physical chord | Output         | Active layers                                         |
| -------------- | -------------- | ----------------------------------------------------- |
| W + E          | Escape         | BASE, NAVIGATION, FUNCTIONS, SYMBOL_KP, UTILS, MIRROR |
| Backspace + Q  | Delete         | BASE, NAVIGATION, FUNCTIONS, SYMBOL_KP, UTILS, MIRROR |
| Shift + Z      | Ctrl+Z (Undo)  | BASE                                                  |
| Z + X          | Ctrl+X (Cut)   | BASE                                                  |
| X + C          | Ctrl+C (Copy)  | BASE                                                  |
| C + V          | Ctrl+V (Paste) | BASE                                                  |

Escape/Delete are deliberately excluded from COMBOS, where those same
positions select VS Code actions. The editing row uses the physical Shift
position as a chord member; it does not require a separately held modifier.

### VS Code Chords And Bound Shortcut Macros

Intended actions assume compatible VS Code keybindings. Outside VS Code these
same shortcuts may do something else. A dash means no alternate chord exists.

| Intended action               | BASE chord              | COMBOS chord  | Exact shortcut sent                           |
| ----------------------------- | ----------------------- | ------------- | --------------------------------------------- |
| Toggle primary sidebar        | I + O                   | W + E         | Ctrl+B                                        |
| Toggle secondary sidebar      | K + L                   | S + D         | Ctrl+Alt+B                                    |
| Toggle bottom panel           | Comma + Period          | X + C         | Ctrl+J                                        |
| Toggle integrated terminal    | O + P                   | Q + W         | Ctrl+Grave                                    |
| New integrated terminal       | L + Semicolon           | A + S         | Ctrl+Shift+Grave                              |
| Command Palette               | Period + Slash          | Z + X         | Ctrl+Shift+P                                  |
| Explorer                      | P + Equal               | Backspace + Q | Ctrl+Shift+E                                  |
| Search                        | Semicolon + Quote       | Tab + A       | Ctrl+Shift+F                                  |
| Search, left-side alternative | F + original left Space | -             | Ctrl+Shift+F                                  |
| Find                          | F + B                   | -             | Ctrl+F                                        |
| Source Control                | Slash + Backslash       | Shift + Z     | Ctrl+Shift+G, release modifiers, then plain G |
| New window                    | D + F                   | D + F         | Ctrl+Shift+N                                  |

Source Control really sends an extra unmodified G after its shortcut. This
could type into the focused control; it is not just Ctrl+Shift+G.

## Macro Inventory

### Bound Custom Text Macros

These are active on all seven layers. Payloads are intentionally omitted from
this printable document because they may contain private/credential-like text.
They are literal keystroke sequences, not Command Palette commands, despite
the behavior names. Inspect the source privately before enabling/testing them.

| Physical chord | Source behavior                        | What happens                                       |
| -------------- | -------------------------------------- | -------------------------------------------------- |
| R + T          | `vscode_cmd_pallet2` (`wkshell` combo) | Stored mixed-case text/symbol sequence, then Enter |
| F + G          | `vscode_cmd_pallet3` (`hmmp` combo)    | Stored numeric text sequence, then Enter           |
| V + B          | `vscode_cmd_pallet4` (`hmmp2` combo)   | Stored numeric text sequence, then Enter           |

All seven bound VS Code macro actions are included in the shortcut table above;
Explorer, Search, Find and New Window are direct shortcut bindings rather than
separate macro nodes.

### Defined But Not Bound To The Current Keymap

These definitions exist in the shared source but have no active key/combo
assignment. They cannot be invoked just by using the current layers. Names do
not guarantee the advertised host action: the literal sequence is decisive.

| Source behavior    | Literal output/sequence                                  |
| ------------------ | -------------------------------------------------------- |
| `git_pull`         | Types `git pull`, then Enter                             |
| `git_pull_rebase`  | Types `git pull --rebase`, then Enter                    |
| `git_push`         | Types `git push`, then Enter                             |
| `git_commit_start` | Types `git commit -m "` without Enter or a closing quote |
| `tab_prev`         | Ctrl+Page Up                                             |
| `tab_next`         | Ctrl+Page Down                                           |
| `lng_eng`          | Ctrl+Shift+1                                             |
| `lng_lt`           | Ctrl+Shift+2                                             |
| `lng_ru`           | Ctrl+Shift+3                                             |
| `alt_summary`      | Hold left Alt, tap keypad 6 then keypad 1, release Alt   |
| `log_off`          | GUI/Windows+L, usually lock screen rather than log off   |
| `td_demo_hold1`    | 1                                                        |
| `td_demo_hold2`    | 2                                                        |

The unbound legacy Lower/Raise/Down/Up dances and `td_semi` are also not
reachable through current BASE thumb/punctuation bindings. `MO_TOG` and `AS`
helper macros are not active bindings. Do not infer extra features from their
presence in the source.

## Bluetooth, USB And Safe Recovery

- The left is the central and the only host-facing keyboard. The right sends
  positions to the left over BLE. Do not pair the right to the laptop.
- USB normally takes host-output priority while the left is plugged in.
  To test wireless typing, unplug the left's USB and keep both halves powered.
  A right-side USB connection is not itself a keyboard-input connection.
- UI grouping under "Paired" is not proof of a completed bond. On Linux use
  `bluetoothctl info <keyboard-MAC>` and check Paired, Bonded and Connected are
  all `yes`; the host should also trust the device.
- Host-only recovery: Lower+Q, release, E, then the Shift-position key. This
  invokes `BT_CLR_ALL`, returns to BASE, and preserves the split bond. Forget
  the stale laptop entry and pair with the left again on Profile 1.
- A full `settings_reset` firmware boot erases settings, including split and
  host bonds. Use it only for deliberate split recovery on both halves, then
  restore each half's matching keyboard image. Power-cycling or entering the
  normal bootloader alone does not erase bonds.
- For normal updates flash `kairos44-left-keyboard-only` to the left and
  `kairos44-right-keyboard-only` to the right. Preserve settings and bonds.

**Verified split-recovery order:** obtain both restore images; flash and boot
settings-reset on the left; flash and boot settings-reset on the right; restore
the right keyboard image; restore the left keyboard image. Keep both powered
nearby to pair automatically. Test right-side typing through left USB before
re-pairing the laptop, then test both halves with the left on battery.

On 2026-10-02, this reset restored right-side typing and a subsequent host-only
clear/re-pair restored wireless typing from both halves. No functional matrix
or split-role change was required. Diagnostic firmware was used for that test;
normal CI images still require their own post-flash test. Detailed reset-build
instructions are in the README's pairing-recovery section.

## Hardware Scope And Verification

- Firmware target: `nice_nano_v2` on both halves, using the visible SuperMini
  nRF52840 GPIO mapping. This does not certify battery/charging/power circuitry.
- RGB firmware declares 22 LEDs per half; UTILS provides its controls. Shared
  configuration enables idle auto-off. LED activity is not proof of a split bond.
- Nice!view support is configured only on the left. The right has no display.
  Left display hardware and operation were not verified during recovery.
  The left configuration enables layer, battery and output status widgets;
  numerical battery percentage is disabled.
- Cirque trackpad support is not enabled or verified. Keyboard mouse controls
  in NAVIGATION are usable without a trackpad; do not connect/power an unverified
  trackpad based on this reference.
- Recovery verified the installed right Y, H, N, Enter and Space switches and
  typing from both halves over Bluetooth. It did not certify every switch,
  every combo, application shortcut, power control, display or sleep/wake path.

## Source Of Truth

If firmware changes, update this document before relying on a printed copy.

- [Layer bindings](../boards/shields/common/kairos/keymap.keymap)
- [Kairos44 extra Enter/Space](../boards/shields/kairos44/kairos44.keymap)
- [Named physical positions](../boards/shields/common/kairos/positions.keymap)
- [Combo definitions](../boards/shields/common/kairos/helpers/combos.keymap)
- [Macro definitions](../boards/shields/common/kairos/helpers/macros.keymap)
- [Tap/hold and tap-dance definitions](../boards/shields/common/kairos/helpers/tap_dance.keymap)
- [Active helper bindings](../boards/shields/common/kairos/helpers/macros_include.keymap)
- [Recovery and flashing instructions](../README.md#kairos44-pairing-recovery-verified-2026-10-02)
