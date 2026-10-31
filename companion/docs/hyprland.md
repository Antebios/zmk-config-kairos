# Hyprland

Wayland compositors decide where windows go and how they stack. An app cannot
ask to stay on top, cannot hide itself without being unmapped, and cannot
choose its own position. So on Hyprland the app does these jobs through
`hyprctl`, the compositor's own control program.

This page describes what the app does and the requirements. Nothing here needs
a change to your Hyprland configuration, except the optional opacity rule at
the end.

## Requirements

- Hyprland **0.56** or newer with the Lua configuration. The app sends
  dispatchers in the Lua form, for example
  `hl.dsp.window.pin({ action = "enable", window = "pid:1234" })`. Older
  Hyprland versions use a different dispatcher syntax and are not supported.
- `hyprctl` on the `PATH`, and the `HYPRLAND_INSTANCE_SIGNATURE` environment
  variable that Hyprland sets for its sessions. The app detects Hyprland from
  that variable and does nothing special without it.

The window's class is `kairos44-companion`, which is what window rules match.

## What the app does

| Action         | How                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Pin            | Floats the window, then pins it. Hyprland only pins floating windows                               |
| Unpin          | Unpins the window; it stays floating                                                               |
| Hide           | Unpins the window, then moves it silently to the special workspace `special:kairos44`              |
| Show           | Moves the window to the active workspace, then pins it again if its view is pinned                 |
| Resize         | Sets the exact size of the floating window                                                         |
| Keep on screen | After a resize, moves the window back inside the monitor's usable area if it sticks out            |
| Focus          | Gives the window focus only for a plain launch; otherwise restores focus to the window that had it |

Windows are found by their process id, so a changed class or title does not
break anything.

### Why hiding uses a special workspace

Hiding the window normally would unmap it, and an unmapped window that is shown
again is a new window to Hyprland, so its position, size and pin state could be
lost. Moving it to a special workspace that is never shown keeps all three. This
was tested; the unmap route was not tried. Pinned windows ignore workspace
moves, which is why Hide unpins first and Show pins again. This workspace is
separate from Omarchy's scratchpad.

### Keeping your typing safe

Showing a window can pull focus to it, which would send your next key presses to
the companion instead of your editor. For `--toggle` and `--show` the app
records the focused window first and, if focus moved, gives it back. This was
tested over repeated hide and show cycles.

### Start-up and view switching

At start the app applies the saved view's size and Pin state, so it opens
floating and pinned unless you unpinned that view. Switching view resizes the
window to that view's size around its centre and applies that view's Pin state.

## Optional: stop Hyprland fading the window

Omarchy fades unfocused windows. Because the app has its own Opacity slider, you
may want the compositor to leave the window alone. Add this to
`~/.config/hypr/hyprland.lua`:

```lua
o.window({ class = "^kairos44-companion$" }, { opacity = "1.0 1.0" })
```

This rule is not applied on the development machine. `SUPER + BACKSPACE` is
Omarchy's own window transparency toggle.

## Not covered

- Click-through works through the toolkit, not `hyprctl`. Real clicks passing
  through have not been confirmed.
- Other compositors (Sway, GNOME, KDE) have no special handling. Pin may not
  work there, and Hide hides the window the ordinary way.
