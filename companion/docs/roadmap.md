# Roadmap

The detailed plan and a dated log are in `docs/kairos44-companion-app.md` in
the repository root. This page is the summary.

## Status

| Phase | What                                                                     | Status                                       |
| ----- | ------------------------------------------------------------------------ | -------------------------------------------- |
| 0     | Plan and tracking document                                               | Done                                         |
| 1     | Layer viewer with key types, gestures and combos                         | Done                                         |
| 2     | Floating window, three views, pin, opacity, click-through, show and hide | Done; Windows and macOS untested             |
| 3     | Firmware sends the active layer to the computer                          | Done                                         |
| 4     | App reads the keyboard and follows the active layer                      | Done; Windows and macOS untested             |
| 5     | Key data generated from the compiled keymap                              | Done                                         |
| 6     | Packaging for Linux and Windows                                          | In progress                                  |

## Live layer sync (phases 3 and 4)

The window follows the layer the keyboard is on ([Live layer sync](live-sync.md)).
The firmware part (phase 3) and the app part (phase 4) are built; this section
records how they were designed.

Normal keyboard input does not say which layer is active, so this needs a small
firmware addition on the left half, which is the half connected to the computer:

- Add a small USB-only telemetry module to this repository (the community
  `zmk-raw-hid` module was rejected because it also adds a Bluetooth HID service),
  and build it only into the left receiver. The report layout is in
  `docs/kairos44-host-telemetry.md` in the repository root.
- Send a short report only when the layer, modifiers, lock state or pointer mode
  changes, never on every key press or trackpad movement, and send a full
  snapshot when the app connects.
- Keep the work out of the key and pointer paths so typing, combos and trackpad
  smoothness are unchanged. Compare typing, combo recognition and trackpad
  behaviour with it on and off before accepting it.
- Start with USB. Bluetooth is a separate, later decision because of the extra
  radio traffic and battery use.

On the computer the app reads the report with the `hidapi` library, follows the
layer, and falls back to manual selection when the keyboard is not connected.
Linux needs a one-time udev rule so a normal user can read the device.

Flashing firmware needs your confirmation and is never done automatically.

## Other planned work

| Item                                       | Notes                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Keyboard-only NAVIGATION layer             | Today only the trackpad variant is drawn                                                                |
| One-key show/hide                          | A Kairos44 combo sending an unused key such as F13, bound in Hyprland                                   |
| Windows and macOS                          | Pinning, hiding, show and hide, and click-through are untested there                                    |
| Real click-through check                   | Confirm that clicks reach the window underneath                                                         |
| `rustfmt` and `clippy`                     | Not installed on the development machine; then add lint scripts                                         |
| Installers for Windows and macOS           | Written but never built; `npm run package` must be run on those systems                               |
