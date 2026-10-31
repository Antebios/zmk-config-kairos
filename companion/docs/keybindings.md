# Key bindings

You cannot click a hidden window, so the app is designed to be driven by key
presses that run its [command line](command-line.md).

## Recommended chords

These chords were checked against the bindings Hyprland has loaded on the
development machine with `hyprctl binds`. Every `SUPER + SHIFT` combination
below was unused. Already taken with `SUPER + SHIFT` are `A B C D E F G M N O P
S W X Y`, comma, slash and the arrow keys. Plain `SUPER + J`, `K` and `L` are
Omarchy bindings, which is why Shift is part of the chord.

| Keys                | Command                  | Effect                  |
| ------------------- | ------------------------ | ----------------------- |
| `SUPER + SHIFT + K` | `--toggle`               | Show or hide the window |
| `SUPER + SHIFT + L` | `--next-view`            | Next view               |
| `SUPER + SHIFT + J` | `--toggle-pin`           | Pin or unpin            |
| `SUPER + SHIFT + H` | `--toggle-click-through` | Click-through on or off |

H, J, K and L sit together on the right home row, so one hold of GUI and Shift
on the left hand covers all four.

## Typing the chord on the Kairos44

On the BASE layer, SUPER is a hold on A (left GUI) and Shift is a hold on D
(left Shift). Hold A and D with the left hand, then tap K, L, J or H with the
right. Because home-row mods wait for the tapping term, hold the two keys a
moment before tapping the letter.

## Hyprland setup

These lines are in `~/.config/hypr/hyprland.lua` on the development machine,
under the "Add any other personal Hyprland configuration" comment:

```lua
local companion = "/home/richard/dev/zmk-config-kairos/companion/src-tauri/target/release/kairos44-companion"
o.bind("SUPER + SHIFT + K", "Kairos44 show/hide", companion .. " --toggle")
o.bind("SUPER + SHIFT + L", "Kairos44 next view", companion .. " --next-view")
o.bind("SUPER + SHIFT + J", "Kairos44 pin", companion .. " --toggle-pin")
o.bind("SUPER + SHIFT + H", "Kairos44 click-through", companion .. " --toggle-click-through")
```

Change the path if the binary lives elsewhere. After rebuilding with
`npm run build:bin` the bindings use the new binary automatically. Omarchy's own
file for personal bindings is `~/.config/hypr/bindings.lua`; either file works.

If the app is not running, the first press starts it and a later press toggles
it.

## Other desktops

Not tested. The same commands work anywhere; only the way you bind a key
differs.

- **GNOME, KDE, XFCE on X11 or Wayland:** add a custom keyboard shortcut in
  system settings whose command is the full path plus `--toggle`.
- **Windows:** make a shortcut to `kairos44-companion.exe --toggle` and give the
  shortcut a hotkey, or use a hotkey tool such as AutoHotkey.
- **macOS:** create a Shortcuts or Automator action that runs the binary with
  `--toggle`, and give it a keyboard shortcut.

The app does not register its own global hotkey, because that does not work on
Wayland.

## A single-key alternative

A Kairos44 combo could send an otherwise unused key such as F13, which you would
bind in Hyprland instead of the three-key chord. That needs a firmware change
and a flash, so it is not set up. It is tracked in the
[Roadmap](roadmap.md).
