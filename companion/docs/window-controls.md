# Window controls

The title bar is also the drag handle: drag any empty part of it to move the
window. It holds the view switcher, the toggles below, the Opacity slider, the
Manual button, and Minimize and Close.

## Toggles and sliders

| Control       | What it does                                                       | Remembered |
| ------------- | ------------------------------------------------------------------ | ---------- |
| Pin           | Keeps the window above other windows                               | Per view   |
| Click-through | Lets mouse clicks pass through the window to whatever is behind it | Never      |
| No taskbar    | Hides the window from the taskbar                                  | Yes        |
| Opacity       | Fades the window background from 100% down to 30%                  | Per view   |
| Manual        | Opens or closes this manual                                        | No         |

### Pin

Pin applies to the current view only. Compact can be pinned while Normal is
not; switching view applies the new view's state. On Windows, macOS and X11 the
app asks the window system for "always on top". On Hyprland it floats and pins
the window with `hyprctl` instead, because Wayland does not let an app do this
itself ([Hyprland](hyprland.md)). All three views start pinned.

Unpinning leaves the window where it is. On Hyprland an unpinned window stays
floating.

### Opacity

Opacity fades only the background, so keycaps and text stay crisp. The slider
stops at 30% so the window cannot disappear. The default is 100%. If the window
looks faint at 100%, the compositor may be fading unfocused windows; see
[Hyprland](hyprland.md).

### Click-through

When on, the whole window ignores the mouse, so you can read it while working in
the window underneath. A yellow banner tells you it is on.

A click-through window cannot be clicked, so turn it off in one of these ways:

- Press Esc while the window has keyboard focus.
- Run `kairos44-companion --toggle-click-through` or press the bound key
  ([Key bindings](keybindings.md)).

Click-through is never saved. Restarting the app always starts with it off.

### No taskbar

Hides the window from the taskbar or window list where the desktop supports it.

## Size and position

Each view remembers its own size. Resize the window while it is pinned and the
new size is saved for that view after half a second. A size is only saved while
the view is pinned, because a tiled window's size is chosen by the window
manager, not by you. Sizes are limited to between 240 and 4000 pixels.

The window position is restored when the app starts, except on Wayland, where
apps cannot choose their own position; there the compositor places the window
and the app keeps it on screen after a resize.

## Keyboard

| Key   | Effect                                           |
| ----- | ------------------------------------------------ |
| `F1`  | Open or close the manual                         |
| `Esc` | Close the manual, or turn click-through off      |
| `Tab` | Move through the keys; the details panel follows |

## Closing

Close ends the app. To keep it running but out of the way, hide it with
`kairos44-companion --hide` or the bound show/hide key
([Command line](command-line.md)).
