# Troubleshooting

## There is no tray icon

The icon needs a tray in your bar. The Omarchy bar has one (it may sit inside
the expandable tray group). GNOME has no tray without an AppIndicator
extension. If the tray is missing the app still runs as a plain window, and
`kairos44-companion --quit` or `npm run app:kill` ends it.

## The window cannot be clicked

Click-through is on. Press Esc while the window has focus, or run
`kairos44-companion --toggle-click-through`. Click-through is never saved, so
restarting the app also clears it.

## The window disappeared

It may be hidden. Run `kairos44-companion --show`, or the plain command
`kairos44-companion`. On Hyprland a hidden window lives on the special
workspace `special:kairos44`; `hyprctl clients` lists it there.

If the window is off screen, a resize or a view switch brings it back inside.
As a last resort, close the app and delete `~/.config/dev.kairos.companion`
to forget the saved position.

## The window looks faint or see-through

Two things fade it: the app's Opacity slider and, on Omarchy, the compositor,
which fades windows that are not focused. Set the slider to 100%, then add the
rule in [Hyprland](hyprland.md) if it is still faint.

## Pin does nothing

- On Hyprland, check that `hyprctl` works in a terminal and that the version
  is 0.56 or newer with the Lua configuration ([Hyprland](hyprland.md)).
- On other Wayland compositors an app cannot pin itself. Use the compositor's
  own window rule or key to keep the window on top.
- Pin is per view. You may have unpinned the view you are looking at.

## A key binding does nothing

- Check the path to the binary. After `npm run clean:rust` or a fresh checkout,
  rebuild with `npm run build:bin`.
- Make sure another binding does not already use the same keys:
  `hyprctl binds`.
- Run the command by hand in a terminal to see any error.
- On the Kairos44, home-row mods need the two modifier keys held briefly before
  the letter is tapped ([Key bindings](keybindings.md)).

## The window is the wrong size, or does not remember its size

Sizes are saved per view, only while the view is pinned, half a second after
you stop resizing. A tiled window's size is the window manager's, not yours.
Pin the view, resize it, and wait a moment.

## The key labels do not match my keyboard

The data is written by hand for the trackpad build of the Kairos44 and is shown
for the layer you select, not the layer the keyboard is on. If you changed the
keymap, update the data ([Development](development.md)).

## Starting the app prints a GTK warning

`gtk_window_set_titlebar() called on a realized window` appears at start. It is
harmless and comes from the frameless window.

## Settings are in a bad state

Close the app and delete `~/.local/share/dev.kairos.companion` and
`~/.config/dev.kairos.companion`. The next start uses the defaults.

## Build problems

- `webkit2gtk-4.1` or another library not found: install the Tauri Linux
  prerequisites ([Install and run](install.md)).
- `cargo clippy` or `cargo fmt` not found: they are not installed on the
  development machine. Install them with `rustup component add clippy rustfmt`.
- The dev server port 1420 is busy: another `npm run dev` is running. Stop it.
