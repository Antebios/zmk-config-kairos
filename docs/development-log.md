# Kairos Development Log

Design source: [kairos-development-plan.md](kairos-development-plan.md).
Append meaningful changes and actual check outcomes here; do not infer hardware
success from source inspection or compilation.

Portable continuation instructions and the 2026-10-01 repository checkpoint are
in [session-handoff.md](session-handoff.md). Historical pass results below must
be rechecked after later edits or transfer; this documentation update did not
rerun firmware builds or physical acceptance.

## Phase Status

- [x] Phase 0: repository plan and tracking documents.
- [x] Phase 1: complete source matrix and recorded legacy build baseline.
- [x] Phase 2: multi-keyboard shields and shared keymap.
- [x] Phase 3: direct layer holds, independent timing and layer repairs.
- [ ] Phase 4: verified trackpad integration.
- [x] Phase 5a: four-target build gate, native test and user guide.
- [ ] Phase 5b: real hardware acceptance on both models.

## Decisions (2026-09-30)

| Decision       | Approved outcome                                                    |
| -------------- | ------------------------------------------------------------------- |
| Models         | Preserve 42-key shield, add 44-key shield in same repository        |
| Typing         | Improve both; direct Lower/Raise/Down/Up holds                      |
| Extra actions  | Move dance sticky/locked/modifier actions to explicit bindings      |
| Extra switches | Left Enter, right Space                                             |
| Display        | Both legacy halves; new left only                                   |
| Controller     | Assume nice!nano v2 compatibility; no additional target             |
| Split          | Left central, wireless BLE halves, host output left                 |
| Trackpad       | Exact purchased module/direct ribbon compatibility must be verified |
| Exclusions     | No Elite-Pi, hardware redesign, custom driver or automatic flashing |

## Open Issues

| ID        | Evidence / uncertainty                                                                                         | Closure condition                                                                                             | Blocks                             | Status             |
| --------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------ |
| HW-01     | TM040040-2024-302 suffix/direct ribbon pinout unverified; current family page says 6-pin, PCB J2 is 12-pin VIK | Exact specification plus both-end contact/power/ground/interrupt continuity verified                          | Phase 4 and powered trackpad tests | Open               |
| HW-02     | PCB 4.7k R1/R2 are series signal resistors; real pull-ups unverified                                           | Validate circuit against exact module requirements and safe bus measurements                                  | Phase 4 and powered trackpad tests | Open               |
| DRV-01    | Gen6 report format/compatible ZMK driver not established                                                       | Maintained licensed driver proven to support exact protocol, revision recorded                                | Phase 4                            | Open               |
| MAP-01    | All 22 switch/diode/net pairs and physical coordinates extracted with KiCad pcbnew; S22 is RC(2,5)             | Source map and generated transform reconciled; mounting and switch behavior still require physical acceptance | Phase 2 new shield                 | Source gate closed |
| BUILD-01  | Manifest/workflow pinned to v0.3.0 commit; both untouched legacy baselines and four final targets compile      | Recorded revisions and successful builds below                                                                | Shared refactoring build gate      | Closed             |
| ACCEPT-01 | No switches, displays, RGB, BLE/USB or typing tested on the physical keyboards                                 | Complete the manual checklist in the README on both models                                                    | Hardware acceptance                | Open               |

Controller identification is not a blocking question under the approved v2
assumption. Socket, supply and bootloader safety checks remain necessary before
flashing. Hardware fixes or a custom driver require separate scope approval.

## Validation Ledger

| Date       | Command / target                                                                        | Dependency revision                            | Result                                        | Output / artifact                                                                     |
| ---------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| 2026-09-30 | `git status --short` before edits                                                       | Configuration repository                       | Clean                                         | Terminal output empty                                                                 |
| 2026-09-30 | Untouched `kairos_left nice_view` and `kairos_right nice_view` before shared extraction | ZMK `edf5c0814fd3ea202e43aad2d68fd32e882a518c` | Both passed                                   | `build-original-left/right/zephyr/zmk.uf2`                                            |
| 2026-09-30 | Final `kairos_left nice_view` / `kairos_right nice_view`                                | Same pinned baseline                           | Both passed                                   | `build-shared-left/right/zephyr/zmk.uf2`                                              |
| 2026-09-30 | Final `kairos44_left nice_view` / `kairos44_right`                                      | Same pinned baseline                           | Both passed; keyboard-only                    | `build-kairos44-left/right/zephyr/zmk.uf2`                                            |
| 2026-09-30 | `validate_firmware.py` for all four final targets against untouched originals           | Same pinned baseline                           | Four passed                                   | Counts, pin map, seven layers, 43 combos, timings, display/RGB/split and preservation |
| 2026-09-30 | Native `kairos-behaviors` fixture                                                       | Same pinned baseline                           | Passed against independently written snapshot | `build-kairos-native/tests/kairos-behaviors/keycode_events.log`                       |
| 2026-09-30 | `sh scripts/verify-local.sh /tmp/kairos-zmk-baseline /tmp/kairos-original-config`       | Same pinned baseline                           | Full repeatable gate passed                   | Two baselines, four final builds, four validators, one native test                    |
| 2026-09-30 | Trackpad and physical keyboard acceptance                                               | Not applicable                                 | Not run                                       | HW-01, HW-02, DRV-01 and ACCEPT-01 remain open                                        |

Build directories above are relative to `/tmp/kairos-zmk-baseline`, an isolated
west workspace. `/tmp/kairos-original-config` is the untouched configuration
snapshot made with `git archive HEAD | tar -x` before implementation. These
temporary directories are not repository artifacts and may be removed by the OS.

## Build Provenance

| Component                                   | Recorded revision                          |
| ------------------------------------------- | ------------------------------------------ |
| ZMK v0.3.0 (manifest and reusable workflow) | `edf5c0814fd3ea202e43aad2d68fd32e882a518c` |
| Zephyr v3.5.0+zmk-fixes                     | `dacab4875df72109b96cc8977547a0dc04875bcd` |
| hal_nordic                                  | `884c4d61746bc35fbd379c169fc87ddb56c6461d` |
| lvgl                                        | `8a6a2d1d29d17d1e4bdc94c243c146a39d635fdd` |
| nanopb                                      | `8c60555d6277a0360c876bd85d491fc4fb0cd74a` |
| zmk-studio-messages                         | `6cb4c283e76209d59c45fbcb218800cd19e9339d` |

Local environment: Docker `zmkfirmware/zmk-build-arm:stable`, west 1.5.0,
Zephyr SDK 0.16.9. Recorded image digest:
`sha256:edb1c953438c6f720ddb79c3762f3972013b7fbbaf4fff3592fc869983e7afc5`.
The `stable` tag can move; use the recorded digest for an identical container.
Current upstream main was inspected but not selected: its board-target names
have changed. The stable baseline preserves `nice_nano_v2` and includes ZMK's
input-listener/input-split infrastructure; that does not establish a Cirque
driver or exact module compatibility.

| Build                  | Flash bytes | RAM bytes | UF2 bytes |
| ---------------------- | ----------: | --------: | --------: |
| Untouched 42 left      |      343880 |     69532 |    688128 |
| Untouched 42 right     |      282384 |     44036 |    565248 |
| Final 42 left          |      344880 |     69532 |    690176 |
| Final 42 right         |      282384 |     44036 |    565248 |
| Keyboard-only 44 left  |      343732 |     69588 |    687616 |
| Keyboard-only 44 right |      178160 |     34836 |    356352 |

Existing deprecated `label` and `NRF_STORE_REBOOT_TYPE_GPREGRET` warnings
remain; they did not prevent linking or UF2 generation. They were not cleaned
up as part of this work.

## Source-Verified 44-Key Hardware Map

Read-only source: the sibling PCB and schematic under
`kairos44_choc_trackpad-flip/pcb/`. KiCad's `pcbnew` API was used to follow switch
and diode pad nets and extract centers/rotations. The shield's own physical
layout reflects those splayed/staggered coordinates, rather than a Corne layout.
This establishes source correspondence, not actual continuity or mounting.

| Row / electrical column | 0        | 1        | 2         | 3         | 4         | 5         |
| ----------------------- | -------- | -------- | --------- | --------- | --------- | --------- |
| 0                       | S1 / D23 | S5 / D27 | S9 / D31  | S13 / D35 | S17 / D39 | S20 / D42 |
| 1                       | S2 / D24 | S6 / D28 | S10 / D32 | S14 / D36 | S18 / D40 | S21 / D43 |
| 2                       | S3 / D25 | S7 / D29 | S11 / D33 | S15 / D37 | S19 / D41 | S22 / D44 |
| 3                       | S4 / D26 | S8 / D30 | S12 / D34 | S16 / D38 | -         | -         |

22 unique coordinates per half. The left scanner reverses electrical columns
5..0; the right uses 0..5 and transform offset 6. Shared positions 0-35 remain
the three full rows, left then right. The last eight combined transform cells:

```text
RC(3,2) RC(3,3) RC(3,4) RC(3,7) RC(3,8) RC(3,9) RC(3,5) RC(3,6)
```

| Position | Side / PCB switch           | BASE function               |
| -------- | --------------------------- | --------------------------- |
| 36       | Left S16                    | Lower / NAVIGATION hold     |
| 37       | Left S12                    | Raise / FUNCTIONS hold      |
| 38       | Left S8                     | Space / SYMBOL_KP layer-tap |
| 39       | Right S8                    | Enter                       |
| 40       | Right S12                   | Down / SYMBOL_KP hold       |
| 41       | Right S16                   | Up / UTILS hold             |
| 42       | Left S4, upper inner thumb  | New dedicated Enter         |
| 43       | Right S4, upper inner thumb | New dedicated Space         |

The assignment of S4 as the extra upper inner thumb is an implementation choice
to verify on mounted hardware. Appending 42/43 preserves existing combo positions;
the physical-layout list has the same logical order, not purely row-wise order.
The extras are transparent above BASE.

| Logical connector pin | nice!nano v2 GPIO | New PCB function           |
| --------------------- | ----------------- | -------------------------- |
| D0                    | P0.08             | Trackpad DRDY, not enabled |
| D1                    | P0.06             | RGB data                   |
| D2                    | P0.17             | Left display MOSI          |
| D3                    | P0.20             | Left display SCK           |
| D4                    | P0.22             | Left display CS            |
| D6                    | P1.00             | Row0                       |
| D7                    | P0.11             | Row1                       |
| D8                    | P1.04             | Row2                       |
| D9                    | P1.06             | Row3                       |
| D10                   | P0.09             | Electrical Column5         |
| D16                   | P0.10             | Electrical Column4         |
| D14                   | P1.11             | Electrical Column3         |
| D15                   | P1.13             | Electrical Column2         |
| D18                   | P1.15             | Electrical Column1         |
| D19                   | P0.02             | Electrical Column0         |
| D20                   | P0.29             | Trackpad SCL, not enabled  |
| D21                   | P0.31             | Trackpad SDA, not enabled  |

The connector-to-GPIO map assumes a nice!nano v2-compatible controller. Display
SPI0 is enabled only on the new left. I2C0 is disabled on both new halves;
SPI0 is also disabled on the new right. RGB uses SPI3/MOSI P0.06 on both new
halves. The PCB has one continuous 22-LED D1..D22 chain; both side definitions
use length 22. Net-traced order:

```text
D1 -> D2 -> D3 -> D4 -> D8 -> D7 -> D6 -> D5 -> D9 -> D10 -> D11 -> D12
-> D16 -> D15 -> D14 -> D13 -> D17 -> D18 -> D19 -> D22 -> D21 -> D20
```

## Verification Boundaries

The structured validator uses Zephyr `devicetree.dtlib` on generated DTS, not
regex extraction from keymap text. It checks matrix and physical-key counts,
GPIO order/flags, all seven layer counts, extras, four direct thumb holds,
timing values, real combo layers/positions, same-chord collisions, all-layer
BASE recovery, display ownership, RGB count, split role and UF2 existence.
Against the untouched generated baseline it also compares every macro binding,
all combo positions/actions, unchanged bindings on layers 0-4 and punctuation/
Shift dance bindings and timing. Only explicitly approved changes are exempted.

The native fixture imports the actual shared layer macros, timings and behavior
definitions. Its reduced eight-key mock matrix tests direct layer-plus-key
sequences with 1 ms gaps, both release orders, a 190 ms HRM tap, a 210 ms HRM
hold, repeated-key quick-tap behavior and independent 210/230 ms Space
tap/hold decisions. It also checks UTILS locking from NAVIGATION after Lower
release, explicit BASE recovery, sticky NAVIGATION from UTILS after Up release
and its expiry after one key. The snapshot was written before running the test; automatic
snapshot acceptance was not used. The fixture has no full keyboard combos,
physical BLE/display or trackpad devices. It is not proof of total HID latency,
punctuation workflow correctness or real hardware acceptance.

## Entries

### 2026-09-30: Documentation Before Firmware

Created the consolidated plan and this log before firmware edits. Research and
approved decisions are recorded, but matrix completion, build baseline,
implementation and hardware acceptance remain pending. No claim of trackpad
compatibility or passed build is made.

### 2026-09-30: Authorized Keyboard Implementation

Following "Start implementation", established the stable upstream baseline and
built the untouched legacy pair before extraction. Moved keymaps/helpers under
`boards/shields/common/kairos/` and retained the legacy shield's electrical
files. Both models now use wrappers around the same seven-layer keymap.

Converted Lower/Raise/Down/Up access macros to direct momentary layers and gave
sticky, locked, Alt and MIRROR/COMBOS actions explicit bindings, documented in
[the user guide](../README.md). HRM tapping is 200 ms; quick-tap remains 200 ms;
Space and semicolon hold-taps retain independent 220 ms constants. Punctuation
and Shift/Caps Word dances, original macros and modifier mappings are preserved.
Unused old layer-dance nodes remain available in the shared behavior file but
are not bound by either keyboard.

Included MIRROR/COMBOS as IDs 5/6 with distinct nodes and correct display labels.
Named all 43 combo positions, first verified them against the original indices,
then excluded COMBOS from only global Escape/Delete because its VS Code actions
use the same chords. BASE recovery remains available on all seven layers.

Added the dedicated 44-key source-derived transform/layout, side overlays,
22-LED RGB chain, left-only display, model config and named keyboard-only build
artifacts. No trackpad compatible string, bus activation, input split device or
tap/scroll implementation was guessed. The exact ribbon/electrical/driver gates
remain open.

Local tooling initially hit registry and DNS failures; the public Docker Hub
builder subsequently worked. A long interactive one-liner was corrupted by
terminal input; the malformed execution was stopped. Repeatable checked-in
scripts now run commands without pipelines that could mask build exit codes.
The native regression and all four generated-firmware checks pass via the full
local verification command above. No Git commit, flashing, bond clearing,
hardware modification or change to the KiCad repository was performed.

Next action: verify controller/mounting safely, perform keyboard acceptance,
and resolve HW-01/HW-02/DRV-01 before a separately gated pointing implementation.

### 2026-09-30: Same-Layer Release Regression

Final migration review identified that the initial UTILS `&to UTILS` action
would be cleared when its momentary Up key was released. A native regression
confirmed BASE B was sent instead of UTILS G. ZMK v0.3.0 stores layer activation
as a bit, not reference-counted ownership. The analogous sticky NAVIGATION
action must not share its target with a held Lower key either.

Moved the UTILS lock to NAVIGATION's physical left Q and sticky NAVIGATION to
UTILS' physical right L. Other explicit actions are unchanged. Expanded the
native fixture to confirm both cross-layer release sequences, one-key sticky
expiry and BASE recovery. The corrected fixture and the subsequent four-target
build/preservation gate pass. Snapshot comparison briefly caught an extra blank
line, which was normalized without accepting new behavior automatically.
Fresh `uvx --from flake8 flake8 scripts/validate_firmware.py` also passes.

### 2026-10-01: Portable Session Handoff

Added the linked handoff document so continuation does not require editor/chat
memory or temporary build directories. Recorded firmware branch
`feature/kairo-44-trackpad`, original configuration commit
`7268ea34f01bc4bb29cdd53dcc3c3a9901ed2dd2`, remote references, hardware source
fingerprints, the image digest and fresh-machine build/baseline reconstruction.
The original baseline can be regenerated directly from the recorded Git commit.

Explicitly recorded that firmware changes are still uncommitted and that the
44-key hardware directory is untracked in the parent `keyboards` repository.
A plain remote clone is therefore not a complete checkpoint. Transfer options
include reviewed publication or worktree archives containing untracked files;
no transfer, commit, push, build, flash or hardware change was executed here.
Preserved existing document edits and left source/scripts/tests unchanged.
