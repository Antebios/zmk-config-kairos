# Kairos44 Host Telemetry

The left half of the Kairos44 (the half connected to the computer) can report its
state to the computer over USB, so the desktop companion app can follow the layer
the keyboard is on. This page is the specification of that report and the record
of how and why it is built this way. The app side is described in
[kairos44-companion-app.md](kairos44-companion-app.md).

Status: **done; flashed and accepted on hardware.** See [Acceptance](#acceptance).

## Scope

- Only the left half of the trackpad build (`kairos44-left-trackpad-receiver`),
  because it is the only half that talks to the computer. The right half, the
  keyboard-only builds and the 42-key builds are unchanged, and a check in
  `scripts/validate_firmware.py` fails if the telemetry appears in any of them.
- USB only. Bluetooth output is unaffected.
- One direction of data: the keyboard reports, the computer may ask for a fresh
  copy. The computer cannot change anything on the keyboard.

## Why not the zmk-raw-hid module

The plan was to use [zzeneg/zmk-raw-hid](https://github.com/zzeneg/zmk-raw-hid).
Its source shows that it also registers a **second HID-over-GATT service** on
Bluetooth whenever Bluetooth is built (`src/hog.c`, compiled when `CONFIG_ZMK_BLE`
is set, with no option to turn it off). That changes the keyboard's Bluetooth
attribute table, which hosts such as Windows cache, and could force re-pairing or
change BLE behaviour on a keyboard whose BLE latency has already been tuned. The
USB half of the module is about eighty lines, so this repository implements the
USB part itself in `src/telemetry/` and leaves Bluetooth completely alone. No new
dependency is added to `config/west.yml`.

## USB interface

A second HID interface is added next to ZMK's keyboard and mouse interface, which
stays the first interface.

| Item          | Value                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| Zephyr device | `HID_1` (needs `CONFIG_USB_HID_DEVICE_COUNT=2`)                                                      |
| Usage page    | `0xFF4B` (vendor defined)                                                                            |
| Usage         | `0x01`                                                                                               |
| Report IDs    | None                                                                                                 |
| Input report  | 16 bytes, interrupt IN endpoint                                                                      |
| Output report | 16 bytes, sent as a control transfer (SET_REPORT), because the interrupt OUT endpoint is not enabled |
| Host access   | Linux `hidraw`, or `hidapi` on any platform, matched by usage page and usage                         |

The report is 16 bytes so it fits in one packet at the default endpoint size
(`CONFIG_HID_INTERRUPT_EP_MPS=16`), and no global USB setting needs to change.
A different usage page from QMK's raw HID (`0xFF60`) avoids other tools claiming
the interface.

## Report layout

All multi-byte values are little endian. Unused bytes are zero.

| Byte     | Field         | Meaning                                                                                                                                                     |
| -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | magic         | `0x4B`                                                                                                                                                      |
| 1        | version       | `1`. A parser must reject versions it does not know                                                                                                         |
| 2        | type          | `0x01` = state                                                                                                                                              |
| 3        | sequence      | Wraps at 256. Increases by one for each report sent                                                                                                         |
| 4 to 7   | layers        | Bit n is set when layer n is active. The default layer (BASE, 0) is always set                                                                              |
| 8        | highest layer | Number of the highest active layer, or `0xFF` if none                                                                                                       |
| 9        | modifiers     | HID modifier bits: 0 left Ctrl, 1 left Shift, 2 left Alt, 3 left GUI, 4 right Ctrl, 5 right Shift, 6 right Alt, 7 right GUI                                 |
| 10       | locks         | Bit 0 Num Lock, bit 1 Caps Lock, bit 2 Scroll Lock, bit 7 set once the host has reported its lock state (otherwise the lock bits mean "unknown", not "off") |
| 11       | flags         | Bit 0: USB is the selected output. Bit 1: the active Bluetooth profile is connected                                                                         |
| 12       | profile       | Active Bluetooth profile, counted from 1                                                                                                                    |
| 13 to 15 | reserved      | Zero                                                                                                                                                        |

Layer numbers are those in `boards/shields/common/kairos/helpers/layers.keymap`:
0 to 6 are the keyboard layers and 7 to 21 are the trackpad layers (pointer speed
and mode layers, and the trackpad copies of the keyboard layers).

### Request from the host

An output report whose first three bytes are `4B 01 01` asks the keyboard to send
its state now. Anything else is rejected. The host app sends this when it starts,
so it never waits for the next change. A GET_REPORT request for the input report
also returns the current state.

### Golden bytes

These are checked by `tests/kairos-telemetry/telemetry_test.c`, and a host parser
must produce the same values from them.

| Bytes                                             | Meaning                                                                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `4b 01 01 07 03 00 00 00 01 02 82 01 01 00 00 00` | Sequence 7, layers BASE and NAVIGATION, highest 1, left Shift held, Caps Lock on and reported, USB selected, profile 1 |
| `4b 01 01 ff 01 00 20 00 15 00 00 02 02 00 00 00` | Sequence 255, layers BASE and 21 (trackpad COMBOS), highest 21, Bluetooth profile 2 connected, locks unknown           |

## When a report is sent

A report is sent only when the state changes, after a 20 ms wait that merges a
burst of changes into one report (`CONFIG_KAIROS44_HOST_TELEMETRY_COALESCE_MS`).
It is also sent when the computer connects over USB and when the host asks.
Nothing is sent while USB is not connected, so Bluetooth use costs nothing but a
few comparisons.

Sending never waits. If the previous report is still in the USB controller (the
normal case when the app is not running, because the computer only collects a
report while something has the device open), the newest state is sent as soon as
the computer collects the earlier one. A waiting send would block the shared
system work queue that also runs key combo timeouts.

The events watched are layer changes, modifier key changes, host lock state,
output selection and Bluetooth profile changes, and USB connection changes. A key
press that touches no modifier, while none is held, returns at once without taking a
lock or building a report, so ordinary typing, combos and trackpad movement are not
slowed. Otherwise the modifier byte is sampled 20 ms later from ZMK's keyboard
report, which is what the computer receives, including Shift added by Caps Word.
Counting key events was tried first and drifted: Caps Word adds Shift to key
presses but not to their releases, so Shift looked stuck.

## Build and configuration

| Item          | Where                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Option        | `CONFIG_KAIROS44_HOST_TELEMETRY`, defined in `zephyr/Kconfig`; depends on USB, the central role and the trackpad receiver shield |
| Enabled by    | `boards/shields/kairos44_trackpad_receiver/kairos44_trackpad_receiver.conf`, together with `CONFIG_USB_HID_DEVICE_COUNT=2`       |
| Source        | `src/telemetry/kairos44_telemetry.h` (pure encoding) and `kairos44_telemetry.c` (USB and ZMK events)                             |
| Unit test     | `tests/kairos-telemetry/telemetry_test.c`, run by `scripts/verify-local.sh`                                                      |
| Build check   | `scripts/validate_firmware.py` requires the option on the left trackpad receiver and nowhere else                                |
| To switch off | Remove the two lines from the receiver `.conf` and rebuild                                                                       |

## Safety and rollback

- The first telemetry build made the right half's Bluetooth link stall on battery
  because the left half's 512 byte input thread stack overflowed silently; adding
  any code shifted memory enough to expose it. The receiver configuration now sets
  larger stacks (input thread 2048, split central run 1024, Bluetooth thread 1024).
  If a future change brings the stall back, check thread stack use first.
  `CONFIG_KAIROS44_HOST_TELEMETRY_DEBUG_STAGE` (1: second USB interface only, 2:
  listeners without sending) helps bisect.
- The telemetry registers after ZMK's own HID device and takes no part in sending
  keyboard, mouse or Bluetooth reports.
- The report buffer is static because the USB controller reads it by DMA after the
  send function returns.
- Rollback is flashing the previous receiver image. The one installed before this
  work is
  `artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-display-render-fix.uf2`.
- This build also contains source changes that were committed but never flashed
  (the Caps Word `SPACE` continuation). Flashing the telemetry image delivers
  those as well.

## Acceptance

Nothing is flashed without your confirmation. Before flashing, the build is
verified by the full local gate. After flashing, check in this order:

1. The keyboard enumerates, and `lsusb -v` shows two HID interfaces (keyboard and
   the `0xFF4B` vendor interface). Typing and pointer movement still work.
2. A `hidraw` read of the second interface shows reports that change when you
   switch layers, hold a modifier, press Caps Lock, and change output.
3. Typing, combo recognition (cut, copy and paste especially) and trackpad
   smoothness feel the same as before, over USB and over Bluetooth.
4. Bluetooth pairing and reconnection to the other host are unchanged.
5. Unplugging and replugging USB resumes reports without restarting the app.

If any step regresses, roll back before investigating.
