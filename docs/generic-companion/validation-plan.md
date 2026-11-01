# Generic Companion Validation Plan

**Status: proposed checks, not test results.** The feasibility phase inspected
source and upstream evidence; it did not build, flash or test generic support.
Existing Kairos44 acceptance in the [telemetry specification](../kairos44-host-telemetry.md)
does not validate these future changes.

See the [implementation work items](implementation-plan.md) for dependencies.

## Documentation Preservation Gate

For this documentation-only task, verify all four planning documents are present,
internal file links resolve, no machine/session-specific paths are required, and
all substantive research and the confirmed firmware decision are preserved.
No app build or firmware test is necessary to save the research.

## Application Feature-Parity Gate (P1-P5)

Use the bundled Kairos44 profile to check:

- All 44 positions and seven visible layers retain curated labels, reach
  instructions, gestures and combo scope.
- Normal, Compact and Shortcuts views, combo highlighting/filtering, hover/focus
  details and generated reference remain consistent.
- Manual, CLI commands, show/hide, pinning, opacity, click-through and remembered
  per-view settings retain intended behavior.
- Follow/manual selection, disconnect fallback, modifiers, known/unknown locks,
  pointer modes, output selection and Bluetooth profile display remain correct.
- Profile changes do not leave invalid layer/key/combo selections or contaminate
  another profile's settings.

Use a differently shaped board to exercise arbitrary key counts, positions,
dimensions/rotation and layer IDs. Test overlapping active layers, transparent
fall-through, blocked keys and firmware-specific default-layer semantics.

## Import And Profile Gate (P1, P3, P4, P7, P9)

Test deterministic export, schema/version validation and position/layer reference
integrity. Cover custom layer names, recursive hold-tap/tap-dance definitions,
combo filters/timing, macros, conditional layers and unsupported custom nodes.

Unsupported or incompletely decoded behavior must be visible with raw identity
and annotations, not silently dropped or assigned inferred semantics. Test
annotation preservation after regeneration and nested/cyclic or excessive
structures with explicit errors.

QMK C callbacks need representative manual annotations; do not claim automatic
semantic extraction from successful parsing alone. Match layout positions to
matrix/logical bindings, not assumed Kairos44 order.

Test stale/mismatched profiles and runtime Studio/VIA/Vial keymap changes where
supported. When firmware has no revision/fingerprint, show that freshness is
unverified rather than claiming a match.

## Protocol And Host Gate (P5, P6, P8)

- Reuse existing Kairos44 golden report fixtures and snapshot expectations;
  accepted firmware and its USB v1 interface must remain unchanged.
- Check new framing independently: ZMK/legacy packet size and QMK's exact
  `RAW_EPSIZE` requirement are distinct.
- Reject unknown versions, malformed lengths and invalid data explicitly.
  Test capability absence, unknown fields, layer limits and default-layer state.
- Exercise snapshots, changed-state delivery, sequence wrap where applicable,
  coalescing, reconnects, cable removal, idle devices and no app listener.
- Test multiple keyboards, wrong interfaces, shared VID/PID values, access denied,
  unsupported devices and lost connections. Do not open an arbitrary keyboard
  interface merely because it is HID.
- Validate resolved modifiers, including hold-tap and implicit/weak modifier
  behavior where the firmware supports it.
- Verify existing QMK hooks remain functional and test the selected VIA/Vial
  integration policy; competing Raw HID clients must not corrupt commands.

## Firmware And Hardware Gate (P6, P8, P10)

Build an actual wired-only ZMK target, a split central and a QMK target.
Enabling the optional module must not introduce mandatory BLE dependencies on
USB-only targets. Disabled modules must not change keyboard interfaces.

Compare module-enabled and module-disabled behavior on the selected test
hardware: typing, combo recognition/timeouts, hold-tap decisions, pointer
smoothness, idle behavior and host reconnection. Verify telemetry never blocks
input-related work and that an app not reading cannot stall the shared work queue.

For wireless, identify the entire path: peripheral to central, central to host,
and any receiver forwarding. Test pairing/bond retention, attribute-cache
changes, reconnects, output changes, low-power/sleep transitions and battery use.
Preserve independent USB/BLE configuration; do not assume a status flag proves
transport connectivity.

Define numerical latency/power/reconnect budgets before measurement, record
baseline and observed results, and compare against those exact budgets.
Successful compilation or native tests alone do not establish physical behavior.
Flashing requires explicit user approval and must not happen automatically.

## Platform And Privacy Gate (P4-P11)

Validate accepted combinations separately on Linux/Hyprland, Windows and macOS.
Check hidapi permissions, udev rules where needed, native BLE access, window
controls, CLI behavior and installers. Mark untested combinations explicitly.

Private macros remain redacted in imported profiles, tooltips, generated
references, exports and logs. Reject or redact sensitive macro content before it
is persisted as a shareable profile. Do not collect typed text or physical-key
events by default; the current state-only model should remain the default.

## Existing Commands And Evidence

The [companion package manifest](../../companion/package.json) provides
`npm run check`, `npm run keymap:check` and `npm run docs:build`. Use focused
tests first, then the existing aggregate checks as applicable; do not run
firmware gates just for documentation changes.

For firmware/build prerequisites and applicable targets, follow the
[repository guide](../repository-guide.md) and
[telemetry specification](../kairos44-host-telemetry.md). Recheck commands against
the selected target/revision rather than treating historical build artifacts as
new evidence.

Record each future result with work-item ID, source revision, target/OS,
command or hardware procedure, expected outcome, observed outcome and limitations.
Keep unrun tests distinguishable from passes. Publish a support matrix only for
combinations whose applicable gates have passed.
