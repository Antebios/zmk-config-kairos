# Live layer sync

The window can follow the layer your keyboard is on. When you hold Lower, the
window shows the NAVIGATION layer; when you let go, it returns to BASE. A strip
under the layer tabs shows what the keyboard reports.

## What you need

- The left half of the Kairos44 connected to the computer by USB, running the
  firmware that reports its state (the host telemetry,
  `docs/kairos44-host-telemetry.md` in the repository root).
- On Linux, a one-time udev rule so your user can read that device
  ([Install and run](install.md)).

Bluetooth-only use cannot be followed: the keyboard reports over USB only, and
the report is not sent over Bluetooth. The right half is never connected to the
computer, so the left half reports for both.

## The status strip

| Part                                      | Meaning                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Green dot, Keyboard connected             | The app found the keyboard's report interface and is reading it                   |
| Grey dot, Keyboard not found              | No keyboard found; choose the layer yourself. The app looks again every 3 seconds |
| Pointer Normal, Fast, Precision or Scroll | The trackpad speed or scroll mode in effect                                       |
| USB or Bluetooth 2                        | Where the keyboard is sending keys; a Bluetooth profile can read "not connected"  |
| L Shift, R Ctrl and so on                 | Modifiers held right now, including those from home-row keys                      |
| Caps lock, Num lock, Scroll lock          | Lock states the computer has reported to the keyboard                             |
| Follow keyboard: on or off                | Whether the shown layer follows the keyboard                                      |

Lock chips appear only after the computer has reported its lock state to the
keyboard, which usually happens as soon as you press a lock key.

## Following

With Follow keyboard on and the keyboard connected, the layer tabs track the
keyboard. The layer shown is the highest of the seven keyboard layers that is
active, which is how the keyboard picks its own keys. The trackpad layers above
those (speed modes and the copies used for combos) are not drawn; the pointer
mode is shown in the strip instead.

Choosing a layer tab yourself turns Follow keyboard off, so you can look at a
layer you are not on. Turn it on again to catch up with the keyboard. The choice
is remembered.

## How it is read

The app asks the keyboard for its current state when it connects, then reads a
short report each time the layer, a modifier, a lock or the output changes. It
does nothing while the window is hidden other than keep the latest state, so
the window is right the moment you show it. No key presses are read, only that
state.

## Windows and macOS

The reader uses the `hidapi` library on every platform and needs no extra rules
on Windows. On macOS the system may ask for Input Monitoring permission the
first time. Neither has been tried yet ([Roadmap](roadmap.md)).
