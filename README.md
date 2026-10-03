# Kairos ZMK Configuration

Continuing this work in another session or on another computer? Start with the
[session handoff](docs/session-handoff.md), including how to transfer uncommitted
files and recreate the original build baseline without this machine's `/tmp`.

For editing keys, navigating the configuration, running builds/tests and working
with Git, see [Using This Repository](docs/repository-guide.md).

For every Kairos44 layer, combo, tap/hold action and macro, see the single
[Kairos44 Printable Reference](docs/kairos44-reference.md).

Shared firmware for the existing 42-key Kairos and a 44-key Kairos with dedicated
left Enter and right Space. Both use a left central and BLE right peripheral,
with USB/Bluetooth host output on the left. Board target: `nice_nano_v2`.

### Kairos44 SuperMini Controller

The pictured SuperMini nRF52840 uses the same visible connector GPIO mapping as
the pinned nice!nano board definition. Keep `nice_nano_v2` for both Kairos44
targets; this selects nRF52840 firmware, not a different processor. The existing
`pro_micro` matrix mappings and raw display/RGB GPIOs need no remapping for this
pinout. For example, D6 maps to P1.00, D7 to P0.11, and D18 to P1.15; markings
such as `100`, `011`, and `115` on the controller are raw port/pin labels.

Photos do not verify the bootloader, battery charging or external-power control
circuit. Confirm a compatible UF2 bootloader and the board's power specifications
before flashing or connecting a battery. Do not assume every SuperMini revision
is electrically identical to nice!nano v2.

**The new 44-key firmware is keyboard-only.** Its right Cirque trackpad is not
enabled. Exact `TM040040-2024-302` ribbon wiring, bus electrical requirements and
a compatible driver remain unverified. Do not connect/power the trackpad on the
strength of these builds. Controller compatibility, mounting and all physical
keyboard behavior also require acceptance before normal use.

The legacy electrical definitions and both legacy displays are preserved. The
new model has a nice_view on the left only, its own PCB-derived physical layout
and a 22-LED chain per half. No RP2040/Elite-Pi target is provided.

## Firmware Targets

| Model / side | Shields                   | Artifact name                  | Display |
| ------------ | ------------------------- | ------------------------------ | ------- |
| 42 left      | `kairos_left nice_view`   | `kairos42-left`                | Yes     |
| 42 right     | `kairos_right nice_view`  | `kairos42-right`               | Yes     |
| 44 left      | `kairos44_left nice_view` | `kairos44-left-keyboard-only`  | Yes     |
| 44 right     | `kairos44_right`          | `kairos44-right-keyboard-only` | No      |

[build.yaml](build.yaml) supplies the matrix. The manifest and reusable
[GitHub workflow](.github/workflows/build.yml) are pinned to ZMK v0.3.0 commit
`edf5c0814fd3ea202e43aad2d68fd32e882a518c`. Push/PR builds and manual workflow
dispatch use that revision. GitHub-hosted CI has not been run as part of this
local implementation; all four targets have compiled locally.

The [GitLab pipeline](.gitlab-ci.yml) builds the same four targets and validates
generated firmware before publishing named UF2s, checksums and dependency/build
provenance. Artifacts expire after 30 days, subject to GitLab retention settings.
See [GitLab build/download instructions](docs/repository-guide.md#build-with-gitlab)
for the Kubernetes runner prerequisites and selecting the correct flash files.

## Shared Layers And Typing

| ID  | Layer      | Direct BASE access                         |
| --- | ---------- | ------------------------------------------ |
| 0   | BASE       | Recovery chord below                       |
| 1   | NAVIGATION | Hold Lower                                 |
| 2   | FUNCTIONS  | Hold Raise                                 |
| 3   | SYMBOL_KP  | Hold Down, or hold the original left Space |
| 4   | UTILS      | Hold Up                                    |
| 5   | MIRROR     | Explicit NAVIGATION hold or UTILS lock     |
| 6   | COMBOS     | Explicit NAVIGATION hold or UTILS lock     |

Lower/Raise/Down/Up now activate momentary layers directly. Their old tap,
double-tap and triple-tap dance actions are no longer bound to those thumbs;
use the explicit actions below. HRMs retain their original modifiers and
tap-preferred flavor, with a 200 ms tapping term and 200 ms quick-tap. Left
Space keeps its independent 220 ms layer-tap. Semicolon's first hold-tap remains
220 ms; punctuation and Shift/Caps Word dances otherwise retain their timings.
All 43 combo positions and actions are retained. Combo arbitration remains
50 ms, so this is not a claim of zero delay.

Positions use the physical BASE legends, not the current layer's legend. Named
positions are in [positions.keymap](boards/shields/common/kairos/positions.keymap).

| Active layer | Physical key / position    | Explicit action     |
| ------------ | -------------------------- | ------------------- |
| NAVIGATION   | Left Q / `L_TOP_1`         | Lock UTILS          |
| NAVIGATION   | Left W / `L_TOP_2`         | Sticky FUNCTIONS    |
| NAVIGATION   | Left R / `L_TOP_4`         | Sticky SYMBOL_KP    |
| NAVIGATION   | Left A / `L_HOME_1`        | Sticky UTILS        |
| NAVIGATION   | Left Z / `L_BOTTOM_1`      | Sticky Left Alt     |
| NAVIGATION   | Left X / `L_BOTTOM_2`      | Left Alt while held |
| NAVIGATION   | Left C / `L_BOTTOM_3`      | MIRROR while held   |
| NAVIGATION   | Right N / `R_BOTTOM_0`     | COMBOS while held   |
| UTILS        | Right O / `R_TOP_3`        | Lock NAVIGATION     |
| UTILS        | Right J / `R_HOME_1`       | Lock FUNCTIONS      |
| UTILS        | Right K / `R_HOME_2`       | Lock SYMBOL_KP      |
| UTILS        | Right L / `R_HOME_3`       | Sticky NAVIGATION   |
| UTILS        | Right N / `R_BOTTOM_0`     | Lock MIRROR         |
| UTILS        | Right Slash / `R_BOTTOM_4` | Lock COMBOS         |

UTILS locking and sticky NAVIGATION are intentionally accessed from different
source layers: releasing a momentary key for the same target layer would clear
that layer in this ZMK version. Their cross-layer release sequences are covered
by the native regression.

The legacy reset-to-BASE chord is the three original left thumbs together:
**Lower + Raise + original left Space** (positions 36/37/38). It works on all
seven layers, including locked layers. NAVIGATION, UTILS and COMBOS also have
an explicit BASE return on the left bottom outer key (physical Shift).
FUNCTIONS returns to BASE on physical right N; its Shift position sends keypad
Enter. Use the chord for locked SYMBOL_KP or MIRROR. SYMBOL_KP's Shift position
sends tilde. Escape/Delete combos exclude COMBOS so that layer's existing
same-chord VS Code actions can run.

On the 44-key model, the extra upper inner thumb is S4 on each half: Enter at
42 on the left and Space at 43 on the right. Both are transparent on other
layers. Existing IDs 0-41 remain stable, including the original Space/Enter.
See the [hardware map and development log](docs/development-log.md) for all
switch/diode pairs and the mounting assumption that needs physical verification.

## Existing Mouse And Utility Controls

NAVIGATION retains keyboard pointer movement, wheel/side scrolling and three
buttons: physical right M = left button, Comma = middle button, Period = right
button. Holding a button retains the standard keyboard-driven drag behavior.
These controls are not proof of working Cirque motion or tap-to-click.
Trackpad motion, tap-to-click and held trackpad-scroll mode remain pending.

UTILS retains media, brightness, RGB, external-power and Bluetooth controls.
Profile 0 is on the left top outer key; profile 1 is on left home outer Tab;
previous/next profiles are on physical left Q/W. Physical left E runs
`BT_CLR_ALL`, which intentionally clears host bonds: do not use it as a routine
update step.

## Local Build And Verification

Requirements: Docker access and an initialized west workspace containing the
pinned ZMK checkout at its root (`app/`, `zephyr/`, `.west/` and fetched modules).
The verification script expects this layout and uses the public
`zmkfirmware/zmk-build-arm:stable` image; the tested digest and dependencies are
recorded in the log. For a fresh workspace, from this configuration repository:

```sh
git clone https://github.com/zmkfirmware/zmk.git /tmp/kairos-zmk-work
git -C /tmp/kairos-zmk-work checkout edf5c0814fd3ea202e43aad2d68fd32e882a518c
docker run --rm -v /tmp/kairos-zmk-work:/work/zmk -w /work/zmk zmkfirmware/zmk-build-arm:stable west init -l app
docker run --rm -v /tmp/kairos-zmk-work:/work/zmk -w /work/zmk zmkfirmware/zmk-build-arm:stable west update --fetch-opt=--filter=tree:0
sh scripts/verify-local.sh /tmp/kairos-zmk-work
```

The script stops on command failure and builds/validates all four targets, then
runs the native shared-behavior fixture. Optionally supply an untouched original
configuration snapshot as its second argument to build both old baselines and
compare unchanged layer bindings, macros, combo positions/actions and dance
bindings/timings. The actual full gate run used:

```sh
sh scripts/verify-local.sh /tmp/kairos-zmk-baseline /tmp/kairos-original-config
```

Local UF2 files are under the workspace's `build-shared-left`,
`build-shared-right`, `build-kairos44-left` and `build-kairos44-right`, each at
`zephyr/zmk.uf2`. Do not interchange models/sides. The `/tmp` build directories
used during development are temporary, not durable artifacts.

The [generated-firmware validator](scripts/validate_firmware.py) uses Zephyr's
Devicetree parser. The [native fixture](tests/kairos-behaviors/native_posix_64.keymap)
imports the real shared behavior definitions and checks fast layer sequences,
release ordering, HRM tap/hold/repeat, independent Space timing and sticky/locked
release and recovery. Its reduced
mock keymap omits the full combo engine; hardware latency and interaction tests
remain necessary.

## Flash, Pair And Recover

1. Identify the controller and compatible bootloader before flashing. The v2
   target is an approved compatibility assumption, not identification of every
   nRF52840 controller. Verify socket orientation, power/battery pins and the
   mounted physical layout. Keep the unverified trackpad disconnected.
2. Build both matching halves. Enter the controller's UF2 bootloader using its
   documented reset procedure, then transfer the correct side/model's UF2 to
   its bootloader drive. Power-cycle both halves after updating the pair.
3. Connect the left half to the host. The right peripheral talks to the left
   over BLE; do not pair it to the host as a separate keyboard. Pair the host
   with the left central using the desired Bluetooth profile, or test over USB.
   Avoid running both keyboard models simultaneously during initial pairing.
4. Preserve bonds during normal updates. If split pairing really needs recovery,
   follow the pinned ZMK release's settings-reset procedure on both halves and
   then reinstall both matching normal builds; this repository does not build a
   settings-reset artifact. Resetting settings is deliberate and erases pairing
   state. Clear/re-pair a host profile only when needed.
5. Recover a locked layer with Lower + Raise + original left Space, not the new
   right Space. Bootloader/reset remains a separate hardware procedure.

### Kairos44 Pairing Recovery: Verified 2026-10-02

The left typed normally, but the right produced no characters. Right-side USB
diagnostics showed key presses/releases reaching the split handler, followed by
`Error notifying -128` (`ENOTCONN`). In this pinned ZMK/Zephyr version, that
notification path had no connected, subscribed recipient. Left-side diagnostics
showed Bluetooth scanning but no usable split connection during the test.
LED activity alone did not establish that the halves were connected.

No functional matrix, pin or split-role code change was needed. Resetting both
halves' saved settings and restoring their firmware made the tested right-side
Y, H, N, Enter and Space keys type through the left's USB connection. A separate
host-profile clear and fresh laptop pairing then restored wireless typing from
both halves. This is consistent with stale/incomplete pairing state, not proof
of a particular corrupted bond. Diagnostic firmware only added logging; normal
CI firmware had not yet been flashed and retested at this verification point.

**Normal firmware update: preserve bonds.** Double-tapping reset to enter the
UF2 bootloader does not itself clear settings. Flash only the matching
`kairos44-left-keyboard-only` and `kairos44-right-keyboard-only` images. Do not
flash settings-reset firmware, invoke `BT_CLR_ALL`, or forget the laptop's
keyboard entry as part of a routine update.

#### Recover The Half-To-Half Split Bond

Use this deliberate recovery only if the right cannot type through the left,
including with the left connected by USB. It erases saved settings and bonds
on both controllers, including the left's laptop/phone bonds.

1. Obtain both matching keyboard UF2s before starting. Build ZMK's stock
   `settings_reset` shield for `nice_nano_v2` from the pinned checkout. From an
   initialized ZMK checkout containing `app/` and its fetched west dependencies:

   ```sh
   west zephyr-export
   west build -p always -s app -d build-settings-reset -b nice_nano_v2 -- -DSHIELD=settings_reset
   ```

   The reset UF2 is `build-settings-reset/zephyr/zmk.uf2`. This repository's CI
   does not publish it. The stock shield enables
   `CONFIG_ZMK_SETTINGS_RESET_ON_START` and disables BLE so it cannot re-pair
   while reset firmware is installed.
2. Double-tap reset on the left, identify its bootloader drive, and copy the
   reset UF2 to it. Let it reboot and run the reset firmware. Leave the left
   running that firmware while clearing the right.
3. Repeat on the right: enter its bootloader, flash the reset UF2, and let it
   boot. Both halves must actually run reset firmware, not merely enter their
   bootloaders. Keep only one bootloader drive mounted at a time to avoid
   confusing identically named `NICENANO` volumes.
4. Enter the right's bootloader again and flash its matching keyboard UF2.
   Then enter the left's bootloader and flash its matching keyboard UF2.
   Keep both halves powered and nearby. They establish the split bond
   automatically; do not pair the right separately in laptop Bluetooth settings.
5. Keep the left connected by USB and test right-side keys in a text editor.
   If they type, the split link works. Then forget the laptop's old keyboard
   entry and pair with the left on the desired host profile. Unplug the left's
   USB, keep it powered on battery, and verify typing from both halves.

#### Recover Only Laptop/Phone Pairing

If the right already types through the left over USB, do not reset both halves
just to repair a host connection. In this pinned ZMK version, `BT_CLR_ALL`
clears only the left's host profiles, preserves its split bond, and selects
profile index 0 (user-facing Profile 1).

1. On the left, hold Lower, tap physical Q, then release both to lock UTILS.
2. Tap physical E to invoke `BT_CLR_ALL`. This clears all host profiles, so
   every previously paired laptop/phone will need pairing again.
3. Tap the far-left bottom-row Shift-position key to return to BASE.
4. Forget/remove the old Kairos/Kairos44 entry on the laptop, then scan and
   pair with the left again. Power-cycling alone does not clear saved bonds.
5. On Linux, verify `bluetoothctl info <keyboard-MAC>` reports `Paired: yes`,
   `Bonded: yes` and `Connected: yes`; ensure the device is trusted. The UI's
   "Paired" grouping was misleading in this incident: BlueZ initially reported
   no bond. An initial authentication failure was followed by successful
   bonding, so verify the final state rather than trusting the first message.
6. With the left's USB unplugged and both halves powered, test typing from
   both halves. USB normally takes priority while the left is plugged in,
   so USB typing alone does not verify wireless host output.

## Hardware Acceptance Still Required

- [ ] Verify controller compatibility and mounting; test every switch, especially
      S4's new Enter/Space, on both models.
- [ ] Test both legacy displays, new left display, RGB/power and sleep/wake.
- [ ] Test split BLE and left host USB/Bluetooth, profiles and reconnection.
- [ ] Test rapid layer sequences with full combo arbitration, both release orders,
      sticky/locked actions and BASE recovery on every layer.
- [ ] Test HRM shortcuts/simultaneous modifiers, repeated letters/Space,
      punctuation dances, Shift/Caps Word and all shortcut combos.
- [ ] Resolve trackpad HW-01/HW-02/DRV-01 before any powered connection; then
      implement and test motion, axes/gain, tap, buttons/drag, held scroll,
      concurrent typing and reconnection without stuck buttons.

Plan, source map, open issues and actual pass evidence:
[development plan](docs/kairos-development-plan.md) and
[development log](docs/development-log.md).
