# Command line

A second launch of the app does not open a second window. It hands its command
to the window that is already running and exits. This is what lets a key on
your keyboard control the app even when the window is hidden or click-through.

```sh
kairos44-companion --toggle
```

If the app is not running, the same command starts it normally.

## Commands

| Command                            | Effect                                                  |
| ---------------------------------- | ------------------------------------------------------- |
| `kairos44-companion`               | Show, restore and focus the window                      |
| `--toggle`                         | Hide the window if it is shown, show it if it is hidden |
| `--show`                           | Show the window without taking keyboard focus           |
| `--hide`                           | Hide the window                                         |
| `--next-view`                      | Cycle Normal, Compact, Shortcuts                        |
| `--view <name>` or `--view=<name>` | Select `normal`, `compact` or `shortcuts`               |
| `--toggle-pin`                     | Pin or unpin the current view                           |
| `--toggle-click-through`           | Turn click-through on or off                            |
| `--manual`                         | Open or close the manual                                |

Only one flag is used per call. Unknown flags are ignored, and `--view` with no
name does nothing.

## Show, hide and focus

`--toggle`, `--show` and `--hide` are designed for use from a key while you are
typing, so showing the window does not steal keyboard focus on Hyprland: the
window you were typing in stays focused. The plain launch, with no flag, does
take focus, because you asked for the window explicitly.

Hiding is done by the window system. On Hyprland the window is moved to a
private workspace and brought back on show, keeping its position, size and
pin state ([Hyprland](hyprland.md)). Elsewhere the window is hidden and shown.

## Using the commands

From a terminal, use the full path of the binary unless you have put it on
your `PATH`:

```sh
~/dev/zmk-config-kairos/companion/src-tauri/target/release/kairos44-companion --view shortcuts
```

During development the debug binary is
`src-tauri/target/debug/kairos44-companion`, which `npm run dev:app` builds.

To drive the app from a key press, see [Key bindings](keybindings.md).
