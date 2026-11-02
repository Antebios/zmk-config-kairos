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
| Layer peek    | Shows briefly on effective keyboard layer changes; off by default | Yes        |
| Settings      | Adjusts the peek duration                                          | Duration only |

### Layer peek (optional)

Layer peek is **off by default**. With it off, layer changes never open a hidden
window. Enable **Layer peek** in the title bar, use **Layer peek on or off** in
the tray menu, or run `kairos44-companion --toggle-layer-peek`.

When enabled, the desktop window hides while idle. A change to the effective
keyboard layer shows the current view without explicitly requesting focus, then
hides it after **5 seconds**. Return to BASE also counts. Another layer change
restarts the timer; repeated reports, modifiers, locks and pointer-mode-only
changes do not. Connecting or reconnecting establishes a baseline, not a peek.
Disconnecting cancels an active peek.

Open **Settings** to adjust the duration from **0.5 to 60 seconds**. The mode and
duration are saved globally, independently of the three views. Old settings
retain normal, always-visible behavior until you opt in.

An explicit show from the tray, CLI or launcher keeps the window open for
browsing. Opening Settings or the manual, or turning Follow off, also suspends
auto-hide. Hide the window when finished to re-arm peeks (and turn Follow back
on if you disabled it). Hiding closes the manual and Settings. Turning Layer
peek off cancels the timer and restores the window.

Pin, opacity, click-through and the selected view are unchanged by peeks.
The browser preview disables the Layer peek button; native visibility requires
the desktop app. Hyprland uses the existing workspace/focus-preserving show/hide
path. Focus behavior on other desktops still needs platform testing.

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

## Closing and quitting

The Close button, and a close from your window manager, hide the window to the
tray. The app keeps running; its tray icon is how you tell. To end the app, use
**Quit Kairos44 Companion** in the tray menu, `kairos44-companion --quit`, or
`npm run app:kill` ([Install and run](install.md)). To bring the window back, use
the tray icon, the bound show/hide key, or `kairos44-companion --toggle`
([Command line](command-line.md)).

## The tray icon

While the app runs, a Kairos44 icon is in the system tray (Windows), the status
notifier tray of your bar (Linux, including the Omarchy bar) or the menu bar
(macOS). On macOS the app has no Dock icon.

| Menu entry                 | Same as                       |
| -------------------------- | ----------------------------- |
| Show or hide window        | `--toggle`                    |
| Next view                  | `--next-view`                 |
| Pin on top or unpin        | `--toggle-pin`                |
| Layer peek on or off       | `--toggle-layer-peek`         |
| Click-through on or off    | `--toggle-click-through`      |
| Open or close the manual   | `--manual`                    |
| Quit Kairos44 Companion    | `--quit`                      |

On Windows and macOS a left click on the icon shows or hides the window and a
right click opens the menu. On Linux the tray protocol has no click event, so
any click opens the menu. The menu works while the window is hidden or
click-through, so it is also the way out of click-through.
