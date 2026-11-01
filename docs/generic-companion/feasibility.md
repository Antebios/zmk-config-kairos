# Generic Companion Feasibility Assessment

See the [planning entry point](README.md) for confirmed scope and continuation.
These findings describe source inspected on 2026-11-01, not shipped generic support.

## Conclusion

The companion can become a firmware-neutral desktop application with keyboard
profiles and separate ZMK/QMK import and telemetry adapters. Static assistance
requires an imported profile, not a telemetry firmware change.

Standard keyboard HID exposes resulting keys, not the internal layers, combos,
hold-tap decisions or tap-dance configuration that produced them. Host keystroke
monitoring cannot reliably reconstruct that internal state. Full live assistance
therefore cannot be guaranteed for every unmodified keyboard.

## Current Kairos44 Coupling

| Source | Inspected constraint |
| --- | --- |
| [keys.ts](../../companion/src/keys.ts) | Fixed 44-key count and a finite gesture vocabulary |
| [geometry.ts](../../companion/src/geometry.ts) | Fixed Kairos44 placement in a 13-column grid |
| [layers.ts](../../companion/src/layers.ts) | Seven curated layers, labels and gestures; transparent keys resolved against BASE |
| [layout.ts](../../companion/src/layout.ts) | Kairos44-specific combos, shortcut names and layer filters |
| [Keymap exporter](../../scripts/generate_companion_keymap.py) | Exactly 44 keys and seven named layers; limited recursive behavior decoding |
| [Keymap verification](../../companion/src/keymap.test.ts) | Generated firmware data verifies curated UI data rather than directly supplying it |
| [keyboard.ts](../../companion/src/keyboard.ts) | Seven visible layers; specific higher layer bits interpreted as pointer modes |
| [keyboard.rs](../../companion/src-tauri/src/keyboard.rs) | Single USB identity and fixed v1 report parser |
| [Telemetry producer](../../src/telemetry/kairos44_telemetry.c) | USB-only; unconditional Bluetooth API calls require adaptation for wired-only targets |

The host reader matches VID `0x1D50`, PID `0x615E`, usage page `0xFF4B` and usage
`0x01`. The report is 16 bytes, with a 32-bit layer mask. It carries layers,
highest layer, modifiers, host lock state, output selection and Bluetooth profile
status. It does not carry keymaps, combo definitions, macro content, physical
key presses or tap-dance resolution events.

The [telemetry specification](../kairos44-host-telemetry.md) records USB-only,
left trackpad receiver scope and existing hardware acceptance. Other firmware
variants are intentionally unaffected. Ordinary typing avoids unnecessary work;
sends are nonblocking and coalesced, with a snapshot requested on connection.
Preserve these performance properties in future modules.

The community raw-HID module was previously rejected because it also introduced
a Bluetooth HID service. That was a deliberate BLE compatibility decision, not
evidence that all raw-HID approaches are unsuitable.

## Reusable Features

The [current manual](../../companion/docs/index.md) and
[views documentation](../../companion/docs/views.md) describe the reusable
foundation: Normal, Compact and Shortcuts views; color-coded behavior types;
tap/hold/repeated-tap explanations; combo highlighting and filtering; window
pinning, opacity, click-through, sizing, CLI control and the embedded manual.

The [live-sync documentation](../../companion/docs/live-sync.md) describes
layer following, pointer modes, modifiers, locks, output and profile status.
Manual selection already supports disconnected use.

Keep private-macro descriptions redacted. Generic import must not expose content
that the current curated UI deliberately hides.

## Compatibility Matrix

| Target | Static assistance | Authoritative live assistance |
| --- | --- | --- |
| ZMK over USB | Imported profile | Opt-in reusable ZMK telemetry module or compatible existing extension |
| ZMK over BLE | Imported profile | Host-accessible BLE reporting service/protocol plus native BLE client |
| ZMK through a wireless receiver | Imported profile | Keyboard/receiver firmware must forward telemetry to a host-accessible interface |
| QMK over USB | Imported profile | Raw HID enabled plus reporting hooks/module |
| QMK over BLE or proprietary wireless | Imported profile | Hardware/fork/receiver-specific integration; no universal guarantee |

For splits, report resolved authoritative state at the host-connected
central/master/receiver, not independently from each peripheral. Wireless
communication between halves does not imply wireless telemetry to the computer.
Likewise a "Bluetooth connected" field in a USB report does not mean the app has
a BLE reporting connection.

## Firmware Modules Versus OS Drivers

Optional firmware reporting additions are acceptable, but the current Kairos44
firmware must remain unchanged. Preserve its existing host adapter.

A custom OS kernel driver is normally unnecessary for USB HID: the application
already uses hidapi. Linux may need udev permissions. USB serial and BLE need
their own user-space clients and platform permission handling. Unsupported
wireless hardware may require substantial firmware or receiver changes.

Platform support is distinct from keyboard support. The current project documents
Linux/Hyprland testing; Windows/macOS behavior and packaging acceptance remain
unverified. Neither this research nor hidapi portability proves end-to-end support.

## ZMK Findings

Package a reusable producer as an optional external Zephyr/ZMK module rather than
requiring every keyboard config to copy Kairos44-specific files. Make USB and BLE
independently configurable; wired-only builds must not depend on Bluetooth APIs.

[ZMK Studio](https://zmk.dev/docs/features/studio) documents keymap updates,
physical layouts and USB/BLE RPC connectivity, subject to firmware configuration
and host platform limitations. Its inspected
[keymap protocol](https://github.com/zmkfirmware/zmk-studio-messages/blob/6cb4c283e76209d59c45fbcb218800cd19e9339d/proto/zmk/keymap.proto),
[behavior protocol](https://github.com/zmkfirmware/zmk-studio-messages/blob/6cb4c283e76209d59c45fbcb218800cd19e9339d/proto/zmk/behaviors.proto)
and [core protocol](https://github.com/zmkfirmware/zmk-studio-messages/blob/6cb4c283e76209d59c45fbcb218800cd19e9339d/proto/zmk/core.proto)
provide layout/binding/parameter metadata, not an active-layer/modifier stream or
complete nested tap-dance, combo and macro definitions.

Studio can assist discovery and import, but is not a complete replacement for
a build-export profile or live reporting extension. Runtime Studio changes can
make a compiled-stock profile stale. Do not enable Studio or make keymap writes
automatically. New BLE services can affect cached pairing attributes; validate
pairing, input latency and battery use.

The protocol revision above pins the inspected evidence. Upstream documentation
is mutable and can differ from protocol source. Recheck both against the target
firmware revision before implementation; upstream main is not proof of support
in this repository's [pinned manifest](../../config/west.yml).

## QMK Findings

[QMK Raw HID](https://docs.qmk.fm/features/rawhid) supplies bidirectional USB
transport using `RAW_ENABLE = yes`, `raw_hid_receive()` and `raw_hid_send()`.
Reports must be exactly `RAW_EPSIZE`, currently documented as 32 bytes, unlike
the current Kairos44 16-byte report. Normalize semantic state through adapters,
not a single assumed byte layout.

[QMK hooks](https://docs.qmk.fm/custom_quantum_functions) allow reporting through
user/keyboard/module integration; basic layer/default-layer hooks and resolved
modifier/LED sampling should not require a QMK core fork. Preserve existing hooks
and integrate deliberately with VIA/Vial ownership of Raw HID. These protocols
are not interchangeable and must not be assumed safe to multiplex blindly.

QMK source may implement arbitrary custom C behavior. Complete automatic
extraction of its meaning is not generally possible: retain raw identities and
allow explicit annotations instead of guessing. Advanced live tap-dance or macro
state requires additional instrumentation beyond current feature parity.

[QMK wireless documentation](https://docs.qmk.fm/features/wireless) describes
hardware-specific limitations. USB Raw HID does not imply a working BLE or
proprietary wireless reporting path; verify the exact hardware, fork and receiver.

## Recommended Direction

Use profiles and rendering first, preserve Kairos44 as the bundled default,
then introduce ZMK USB and QMK USB adapters/modules. Add BLE and receiver support
only for tested targets. Details and acceptance requirements are in the
[implementation plan](implementation-plan.md) and [validation plan](validation-plan.md).
