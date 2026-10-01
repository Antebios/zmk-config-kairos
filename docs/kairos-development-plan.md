# Kairos 42/44 Development Plan

Approved scope as of 2026-09-30. Progress and actual validation evidence are
tracked in [development-log.md](development-log.md).

For a new session or computer, read [session-handoff.md](session-handoff.md)
first. It records the checkpoint, worktree transfer requirements, original
configuration commit, environment reconstruction and ordered continuation gates.

## Scope and Decisions

- Support the existing 42-key `kairos` and new 44-key `kairos44` in this repository.
- Preserve both legacy displays and existing electrical definitions. The new
  model has a left nice_view only and a right Cirque trackpad.
- Use `nice_nano_v2` for both models, assuming the alternative nRF52840 board is
  nice!nano v2-compatible. This is an assumption, not measured compatibility.
  Check socket orientation, supply/battery pins and bootloader before flashing.
- Keep the left central, BLE between halves, and USB/Bluetooth host output left.
- Add dedicated Enter on the new left and Space on the new right.
- Apply typing improvements to both models: direct momentary Lower/NAVIGATION,
  Raise/FUNCTIONS, Down/SYMBOL_KP and Up/UTILS holds. Move former dance actions to
  explicit layer keys. Preserve punctuation and Shift/Caps Word dances, macros,
  combos and home-row modifier mappings.
- Start home-row modifier tuning at 200 ms (formerly 220 ms), retaining
  tap-preferred flavor and 200 ms quick-tap. Tune thumb and punctuation behaviors
  independently. Existing 50 ms combo arbitration is not zero-latency.
- Repair and include intended MIRROR=5 and COMBOS=6 layers, with BASE recovery.
- Requested pointing: motion, tap-to-click, three keyboard mouse buttons,
  held scroll mode and dragging through a held keyboard button.
- No Elite-Pi/RP2040, wired split, KiCad/case changes, speculative controller
  variants, automatic flashing, commits or custom driver development.

## Evidence Versus Assumptions

Original source observations recorded before implementation (now resolved where
noted below); these are not hardware-test results:

- [kairos.dtsi](../boards/shields/kairos/kairos.dtsi) defines a 4x6 scanner per
  half and 42 combined transform positions. `pro_micro` indices are logical
  connector indices, not raw Nordic GPIO numbers.
- The original [kairos.keymap](../boards/shields/kairos/kairos.keymap) included
  layers 0-4 only. The unused layer files 5/6 duplicate `base_layer`; layer 6
  also had the wrong display name. Both are now included with distinct nodes.
- [tap_dance.keymap](../boards/shields/common/kairos/helpers/tap_dance.keymap) nests
  hold-taps inside layer dances. The direct-hold change removes these decisions;
  its native behavior test passes; practical timing with overlapping combos
  still needs hardware testing. Old layer-dance definitions remain unused.
- [west.yml](../config/west.yml) and the reusable
  [build workflow](../.github/workflows/build.yml) originally followed `main`.
  Both are now pinned to ZMK v0.3.0 commit
  `edf5c0814fd3ea202e43aad2d68fd32e882a518c`; the untouched legacy halves and
  all four final targets build against this baseline.

The implementation, complete switch map, dependency provenance and actual
validation results are recorded in [development-log.md](development-log.md).
The new trackpad remains gated; the implemented 44-key targets are keyboard-only.

Read-only hardware reference: the sibling repository
`kairos44_choc_trackpad-flip/pcb/michele44_trackpad-splayed.kicad_pcb` and matching
schematic. Verified pad/net observations:

| PCB item                   | Observed connection           | Implication                                |
| -------------------------- | ----------------------------- | ------------------------------------------ |
| U1 D6-D9                   | Row0-Row3                     | Reconcile through supported board GPIO map |
| U1 D19,D18,D15,D14,D16,D10 | Column0-Column5               | Mounting flip determines physical order    |
| U1 D21,D20,D0              | SDA,SCL,DRDY                  | Do not equate D labels with P0 pin numbers |
| S22 / D44                  | Column5 / diode cathode Row2  | S22 is RC(2,5), not an assumed extra thumb |
| J2 pins 1,2,3,4,7          | VCC,GND,TP-SDA,TP-SCL,DRDY    | VIK accessory socket, not split transport  |
| R1 / R2                    | SDA to TP-SDA / SCL to TP-SCL | Series 4.7k resistors, not pull-ups        |

Purchased parts: `TM040040-2024-302`, `FH12-12S-0.5SH(55)`,
`CRCW04024K70FKED` and Molex `15166-0122`; direct ribbon connection requested.
The exact module pinout, power, contact orientation and report protocol are
unverified. The current [Cirque circular trackpad family page](https://www.cirque.com/glidepoint-circle-trackpads)
describes a 6-pin interface; this is not proof of compatibility with the 12-pin
PCB socket or the purchased suffix. See also
[Gen6 information](https://www.cirque.com/gen6-ic-details) and
[vendor examples](https://github.com/cirque-corp/Cirque_Gen6), whose license must
be reviewed before reuse. Do not configure `cirque,pinnacle` on brand alone.
The local saved specification is a Dropbox HTML wrapper, not verified PDF text.
The [nRFMicro comparison](https://github.com/joric/nrfmicro/wiki/Pinout) is not
identification of the user's controller or proof of identical raw GPIO maps.

## Implementation Phases

1. **Hardware and dependency baseline.** Extract all switch/diode/net/position
   pairs, confirm 22 unique coordinates per half and flipped mounting, and
   establish RGB chain length. Record a ZMK commit and build both legacy halves
   before extraction. Independently resolve exact trackpad ribbon, electrical
   and driver gates; keyboard-only work need not wait for the trackpad.
2. **Multi-keyboard structure.** Preserve `boards/shields/kairos/`; add
   `boards/shields/kairos44/` with its own Kconfig, metadata, matrix, physical
   layout, side overlays/configs and keymap wrapper. Reuse keymap content under
   `boards/shields/common/kairos/`. Supply model-specific named positions and
   42/44 binding expansions. Name every combo position by intended physical key,
   preserving original IDs 0-41 and appending extras 42/43 rather than shifting
   existing thumb IDs. Preserve logical matrix pins separately
   from board-specific bus pinctrl.
3. **Typing.** Replace four layer dances with direct `&mo` bindings, give sticky,
   locked and extra modifier actions explicit access, and document migration.
   Apply modest independent HRM tuning. Include layers 0-6 in stable order and
   provide recovery from every locked layer. Preserve all existing shortcuts.
4. **Gated trackpad integration.** Only after electrical and exact driver
   compatibility are verified: right input device, `zmk,input-split` with stable
   ID 0, left listener, central axis/gain processors and a separate held scroll
   layer appended after existing IDs. Tap-to-click must be driver-supported or
   separately approved. Do not silently add a driver or hardware rework.
   Right must contain no nice_view references; resolve SPI0/I2C0 exclusivity by
   side ownership. Preserve RGB only with confirmed pin/chain information.
5. **Builds and user documentation.** Expand [build.yaml](../build.yaml), add a
   README with build/flash/pairing/recovery and binding tables, and record all
   actual checks in the log. Clearly label keyboard-only artifacts if pointing
   remains blocked. Do not clear Bluetooth bonds by default.

Phase 2 depends on the matrix and legacy build baseline. Phase 3 depends on the
shared keymap boundary. Phase 4 additionally depends on HW-01, HW-02 and DRV-01
in the log. Hardware acceptance depends on successful builds and safe wiring.

## Build Matrix

| Model / side | Board        | Shields                 | Display |
| ------------ | ------------ | ----------------------- | ------- |
| 42 left      | nice_nano_v2 | kairos_left nice_view   | Yes     |
| 42 right     | nice_nano_v2 | kairos_right nice_view  | Yes     |
| 44 left      | nice_nano_v2 | kairos44_left nice_view | Yes     |
| 44 right     | nice_nano_v2 | kairos44_right          | No      |

Use board syntax supported by the selected checkout, recording the resolved
revision and exact commands. Do not substitute current web-doc target syntax
without checking that version.

## Acceptance Checklist

- [x] Both legacy halves build before refactoring against recorded dependencies.
- [x] Four final targets compile with 42/44 unique transform entries and matching
      binding counts on every layer.
- [x] Generated DTS/config confirms display placement, matrix pins, RGB length
      and split roles; new right SPI0/I2C0 remain disabled pending trackpad gates.
- [x] All 43 combo positions/actions match the original generated baseline;
      real layer IDs and disjoint same-chord filters are checked. Escape/Delete
      intentionally exclude COMBOS to allow its existing VS Code shortcuts.
- [x] Native direct-layer/target sequences at 1 ms and both release orders pass;
      compiled BASE recovery exists on all seven layers.
- [x] Native HRM taps at 190 ms, holds at 210 ms and quick-tap repeat pass;
      independent Space taps at 210 ms and holds at 230 ms pass.
- [ ] Full-keymap combo arbitration, sticky/locked workflows, punctuation double
      taps, Shift/Caps Word, simultaneous modifiers and shortcuts pass on hardware.
- [ ] Every switch, layer, display, RGB/power setting, split connection and host
      USB/Bluetooth path is tested on both real models.
- [ ] Exact trackpad connection is electrically safe and driver-supported before
      powered testing; motion, axes, gain, click/tap, drag, scroll, concurrent
      typing, sleep/wake and reconnection pass without stuck buttons.

Where native behavior tests or hardware are unavailable, record an explicit
unverified result and manual checklist. Compilation alone is not timing or
hardware acceptance.
