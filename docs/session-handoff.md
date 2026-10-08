# Session Handoff

Checkpoint: 2026-10-08. This document is the starting point for continuing on
another session or computer. It requires neither Copilot memory nor the original
chat transcript. Update it when the checkpoint, gates or repository state change.

## Latest Checkpoint: Extra Thumb Holds Flashed (2026-10-08)

Implemented only the approved Kairos44 trackpad extra-thumb tap/hold actions:
LEFT extra Enter42 tapENTER/holdpad-scroll; RIGHT extra Space43 tapSPACE/hold
temporary Precision.200 ms tap-preferred mo/kp behavior, tap on release,
no literal key on hold. Available from BASE without Lower and through other
layers' transparent extras. Keyboard-only Kairos44 plain Enter/Space, original
thumbs, NAV Z/B and X/C/V buttons,42 combos, sensor and orientation unchanged.
No alternatives, new combos, double-taps or BASE X/C/V mouse holds added.

Independent extra Precision11/Scroll12 coexist safely with original B/Z
temporary states9/10; selected speed7/8 is unchanged. Context IDs now13..21
(22 trackpad layers,7 keyboard-only). Receiver scroll mask10/12 first at1/16
with Y inversion and XY-to-wheel; precision8/9/11 at1/4, fast7 at2/1. Both
thumb holds prioritize scrolling; Enter release while Space remains produces
Precision. Either release order with a same-function B/Z hold preserves the
remaining control. Explicit to-layer reset clears both and release doesn't
reactivate them. Single shared pointer_thumb behavior avoids extra source files.

Existing native snapshot passed first; extended16-key synthetic-pad fixture
then passed actual Enter/Space taps, typing-roll ordering, BASE four-direction
wheel output, precision and Normal/Fast/Precision restoration, concurrent
thumbs, both release orders with Z/B, and reset while both thumbs held.
Focused LEFT compiled validator and full six-build/validator/native gate passed.
Printable reference and trackpad notes updated.

Flashed LEFT artifact:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-extra-thumb-holds.uf2`.
SHA256 `c32af7fc4d73850b5857203e37de7e5254d28e038f62ea1ba2fa851e10c09512`.
Package verified against `build-kairos44-left-trackpad-verified` in the existing
workspace. User entered LEFT bootloader; verified serial `6A5D691ABAC1CDB3`,
mount and checksum immediately before copy/sync. Bootloader disappeared;
the same serial returned as ZMK `Kairos44`. Next: user tests taps, BASE
scroll/precision, restored speed and ergonomic hold timing. Physical thumb
acceptance is pending; no acceptance was inferred from compile/USB success.
RIGHT orientation-user debug firmware stays unchanged; no right flash or
bonds/settings reset required. Older images preserved; no commit/push.
Keep V+B private-text macro caution, and avoid EP_OFF.

## Previous Checkpoint: Held Pad Scroll Flashed (2026-10-08)

Implemented approved LEFT NAV physical Z (position25): tap sticky Alt,
hold>=200 ms key-assisted one-finger pad scrolling on both axes. Z release
restores cursor movement at the selected speed; B's tap-cycle/precision hold,
left X/C/V mouse buttons, arrows and keyboard wheel taps remain intact.
Not two-finger gesture recognition. Gesture starts with Lower+Z, wait200 ms
before swiping. Initial scroll scale1/16 independent of cursor speed modes.
Vertical XY sign is inverted before mapping so upward pointer motion gives
wheel up; horizontal sign preserved. Physical direction/feel still pending.

Selected speed7/8, temporary precision9, temporary scroll10; conditional
contexts11..19 (20 trackpad layers,7 keyboard-only). All42 combo scopes retained.
LEFT receiver listener priority: scroll (XY scaler1/16, Y invert, XY-to-wheel),
precision1/4, fast2/1. Keyboard-only sources and RIGHT sensor configuration
are unchanged. No native driver changes; built-in processors only.

Passed old native snapshot first, then extended native fixture with synthetic
pad events (12 keys). Verified sticky Alt, four wheel directions, no cursor
leakage during scrolling, restoration to16/32/4-count Normal/Fast/Precision
cursor movement, NAV release-before-Z, concurrent precision hold, and explicit
reset while held. Full six-build/validator/native gate passed. No diagnostics.
Flashed LEFT artifact:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-pad-scroll.uf2`.
SHA256 `4e88ddea5a02d565cf48081f09a248f0e42cdae5c7ceebad91d758132d7e04aa`.
Verified against `build-kairos44-left-trackpad-verified/zephyr/zmk.uf2` in the
existing workspace. Copied/synced to verified LEFT serial6A5D691ABAC1CDB3
after mount/hash checks; same serial returned as ZMK Kairos44. The user
cancelled the physical confirmation question, so acceptance remains pending.
RIGHT stays on orientation-user diagnostic firmware. Prior wheel-tap image
retained for rollback. Printable reference updated; no commits/pushes or
bonds/settings/power changes. Preserve V+B caution and avoid EP_OFF.

## Previous Checkpoint: Wheel Tap Fix Flashed And Accepted (2026-10-08)

User reports NAV Y/H short taps produce no browser scrolling; explicitly
confirmed that holding either key for at least0.5 seconds does scroll.
Root cause: pinned default `msc` rate10 steps/s at16 ms periods takes about
112 ms to accumulate one step and drops fractional movement on release.
Trackpad-only NAV Y/H and horizontal U/O now use `nav_scroll` macro-two-param:
initial20 ms `nav_scroll_step` pulse at64 steps/s (one step after16 ms), then
standard `msc` held at original10 steps/s until release. Direction parameters
are forwarded separately; early physical release is balanced by the queue.
No driver changes, host smooth-scrolling changes or keyboard-only NAV changes.
The precision-hold and tap-cycle features remain included (18 trackpad layers).

Native tests now enable pointing via `tests/kairos-behaviors/native_posix_64.conf`
and check actual HID wheel reports for20 ms tap,5 ms early release, downward
tap, and initial step plus held repeat. Prior tap/hold-mode/restoration/typing/
combo/recovery tests also pass. Full six-build/validator/native gate passed.
Flashed LEFT image:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-hold-scroll-tap.uf2`.
SHA256 `33209f677b9451bc10643ac9c2af70ec3970f1b99db6defe67dfeaa11fd8dca9`.
Package verified against `build-kairos44-left-trackpad-verified` in the existing
workspace. User entered LEFT bootloader; verified serial `6A5D691ABAC1CDB3`,
mount and checksum immediately before UF2 copy/sync. Bootloader disappeared;
the same serial returned as ZMK `Kairos44`. User then explicitly confirmed
that both short Y/H taps now scroll up/down in the browser. Browser wheel-tap
acceptance PASSED. Native held-repeat checks passed; physical horizontal
scrolling and hold-for-precision timing/restoration/drag acceptance are still
pending. RIGHT stays on orientation-user debug firmware. No sensor/orientation/
power/bonds/settings changes, commits or pushes.

Earlier precision-hold flash completed copy/sync successfully; the first
post-flash tool response was interrupted, but during this wheel investigation
USB enumeration verified the same LEFT serial running ZMK `Kairos44`.
Physical precision-hold timing/drag acceptance remains pending.
Reference now cautions that existing global V+B sends private text: hold B
until Precision activates before pressing V for dragging. That combo was
preserved, not silently changed. Do not print/test its payload. Avoid EP_OFF.

## Previous Checkpoint: Hold Precision Flashed (2026-10-08)

Implemented the requested same-key tap/hold extension on LEFT NAV physical B:
short taps keep Normal1x -> Fast2x -> Precision1/4x -> Normal cycling;
holding at least200 ms temporarily selects Precision, and release restores
the prior selected mode without cycling. Tap-preferred hold/tap wrappers
invoke the original cycle macros on tap or `&mo POINTER_HOLD_PRECISION` on
hold. Selected speed states7/8 are untouched by a hold; momentary state9
has precision-priority listener handling. Contexts are now10..17; trackpad
builds have18 layers and keyboard-only builds retain7. 42 combos unchanged.

Passed the existing short-tap native snapshot before extending tests, then
new hold tests from Normal/Fast/Precision, NAV release-before-B, scoped combos,
explicit reset during a hold, and simultaneous three-key recovery. Corrected
the old recovery fixture: Lower was held too early for the50 ms combo window,
so it did not actually test recovery. The full six-build/validator/native
gate passed with the process-local Git trust setting noted below.

Flashed LEFT image:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-hold-precision.uf2`.
SHA256 `76525698ad2da28fa4d5e9a71453a2cc14e8b02fd8e9971883b29e9923d7c28d`.
Package verified against `build-kairos44-left-trackpad-verified` in
`/tmp/kairos44-diagnostic-workspace`. Flashed to verified LEFT bootloader
serial `6A5D691ABAC1CDB3` after checksum/mount verification; copy/sync completed.
The same serial was later observed running ZMK `Kairos44` during the wheel
investigation. RIGHT remains on the earlier orientation-user diagnostic
firmware; no right flash or sensor change is needed. Prior tap-only image is
preserved. Physical timing, restored pointer speed, clicking/dragging and
typing acceptance remain pending. No bonds/settings reset, commit or push.
Printable reference updated with the new gesture; avoid EP_OFF as before.

## Previous Checkpoint: Speed Cycle Flashed (2026-10-08)

Implemented the approved single LEFT NAV position29 cycle:
Normal1x -> Fast2x -> Precision1/4x -> Normal. Each independent tap advances
one mode. Mode survives momentary NAV release/reentry and ordinary typing;
reboot and explicit `&to` switches (including BASE recovery and UTILS lock)
restore Normal. No sensor, power, orientation or bond changes.

Built-in macros toggle mutually exclusive speed states7/8. Transparent
conditional context layers9..16 preserve original layer priority and combos;
trackpad builds have17 layers and keyboard-only builds still have7.
LEFT listener selects `zip_xy_scaler`2/1 or1/4, with fractional remainders;
buttons and scroll are untouched. Main definitions are in
`boards/shields/common/kairos/helpers/pointer-speeds.keymap`; ratio overrides
are in `boards/shields/kairos44_trackpad_receiver/kairos44_trackpad_receiver.overlay`.

The current source New Console COMBOS shortcut used LEFT15/16, conflicting
with New Window. User explicitly chose to retain New Console and remove the
COMBOS New Window shortcut; BASE New Window remains. All builds now have42
combos. This is the only approved shared shortcut change outside speed modes.

Passed focused receiver compiled validator against pre-change keyboard
baseline, extended native fixture, and full six-build regression gate:
`env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=/tmp/kairos44-diagnostic-workspace/cirque-input-module sh scripts/verify-local.sh /tmp/kairos44-diagnostic-workspace --trackpad`.
The process-local trust exception handles container ownership without global
Git changes. Native tests cover independent taps, NAV release/reentry,
BASE typing, BASE/NAV/COMBOS scopes, and explicit/recovery reset paths.

Flashed LEFT image:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-cycle.uf2`.
SHA256 `69bae87e6b5802a13b020af4d4cbae405aabfa0c2b2ff0197a65f7ed6bc036d1`.
Built/package-verified from `build-kairos44-left-trackpad-verified` in
`/tmp/kairos44-diagnostic-workspace`; focused build is
`build-kairos44-left-trackpad-speed`. User entered LEFT bootloader; verified
serial `6A5D691ABAC1CDB3`, mount and checksum immediately before copying UF2
and syncing. Bootloader disappeared; the same serial returned as ZMK
`Kairos44`. Only LEFT was flashed. Next: user tests three speeds, fine swipes,
click/drag, both-half typing and shortcuts. These physical checks are pending.
RIGHT stays on its existing orientation-user debug image. No commits/pushes,
bond resets or settings resets. Avoid EP_OFF as before.

## Previous Checkpoint: NAV Pair Flashed (2026-10-08)

At the user's request, rebuilt and flashed both trackpad halves. Both builds
passed the compiled-keymap and keyboard-only-baseline validator. LEFT now has
NAV right/middle/left clicks at the former plain Alt/Mirror/Home positions,
and Home/End on the RIGHT top row's outer pair. Left arrows, Page Up/Down,
sticky Alt and layer shortcuts are preserved; keyboard-only layouts are unchanged.

- LEFT: `artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-nav-mouse.uf2`.
  SHA256 `911381e901fdd5e6b83ca1ddb92c1b6509fb35969a2a7ca51e1a10ed243336a1`.
  User entered LEFT bootloader; verified serial `6A5D691ABAC1CDB3`, copied UF2
  and synced. Bootloader disappeared; USB returned as ZMK `Kairos44` with the
  same serial. Build directory: `build-kairos44-left-trackpad-keymap` in the
  existing `/tmp/kairos44-diagnostic-workspace`.
- RIGHT: rebuilt `build-kairos44-right-trackpad-orientation-debug` with the
  existing `zmk-usb-logging` snippet and debug config. UF2 is byte-identical
  to `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation-user.uf2`.
  SHA256 `3e60eabe49afcba3780c42560b1478b5924c8ba17505756b4b838b46bef51deb`.
  Reflashed verified bootloader serial `820E0FAE437DFBDF`; same serial returned
  as ZMK at `/dev/ttyACM0` before the LEFT flash.

Current user sensor orientation (`rotate-90`, `y-invert`, no `x-invert`),
power fixes, and RIGHT diagnostic shell are preserved. No bonds/settings reset,
source orientation change, commit, or push was performed. Next physical gate:
both-half typing, trackpad pointing, NAV clicks/hold-to-drag, and Home/End.
Automatic EP-cycle recovery remains unimplemented; avoid EP_OFF.
This checkpoint supersedes earlier statements that LEFT was untouched.

## Orientation Follow-Up (2026-10-08)

### Latest Image: User Orientation

The user changed the sensor overlay to `rotate-90` and `y-invert`, with no
`x-invert`, and requested rebuild/flash. These user settings supersede v2 below;
source was preserved exactly. The focused RIGHT debug build and existing
trackpad/keyboard-baseline validator passed; generated DTS confirms the flags.

Flashed `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation-user.uf2`
to verified RIGHT bootloader serial `820E0FAE437DFBDF`. SHA256:
`3e60eabe49afcba3780c42560b1478b5924c8ba17505756b4b838b46bef51deb`;
checksum file: `SHA256SUMS-orientation-user`. RIGHT returned as ZMK at
`/dev/ttyACM0`; LEFT was untouched. Physical acceptance is pending. Expected
FEED_CFG1/FEED_CFG2 are `81`/`c1`. Previous images are retained; automatic
EP-cycle recovery remains unimplemented. The orientation-debug directory now
contains this user build.

### Previous Image: Orientation V2

The first orientation flash corrected LEFT/RIGHT, but the user reported UP
moved DOWN and DOWN moved UP. Removed `y-invert`, retaining `rotate-90` and
`x-invert` only. This physical result supersedes the first inference below.

The corrected RIGHT debug build and trackpad/keyboard-baseline validator passed.
Generated DTS confirms no Y inversion. Packaged and flashed
`artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation-v2.uf2`
after checksum and RIGHT bootloader serial `820E0FAE437DFBDF` verification.
SHA256: `761a2bb23c0b5f365185d3aae590c833ba1d1e9941495f2c3e5f7dca1eaa7e2c`;
checksum file: `SHA256SUMS-orientation-v2`. RIGHT returned as ZMK at
`/dev/ttyACM0`; LEFT and bonds were untouched. Physical v2 acceptance is pending:
all four swipes, circles, typing, cold boot and LED-idle operation.

Expected v2 FEED_CFG1/FEED_CFG2 are `41`/`c1`; old recovery writes would remove
orientation. Automatic EP-cycle recovery remains unimplemented. Both earlier
images are retained. The orientation-debug build directory below now holds v2.

### First Attempt: Superseded

The user reports the keyboard working well and the trackpad tracking, but
physical UP moves the cursor RIGHT, DOWN moves LEFT, LEFT moves DOWN, and
RIGHT moves UP. The first RIGHT sensor overlay set `rotate-90`, `x-invert`,
and `y-invert`. The pinned driver's header describes `ROTATE_90` as swapping
X and Y; the initial inference that both sensor inversions were needed was
falsified by physical testing. Sensor coordinate conventions cannot be inferred
solely from the reported host-relative deltas.

The RIGHT debug orientation build and existing trackpad-role/keyboard-baseline
validator passed. Generated DTS contains all three flags. Power/pull-up fixes,
keyboard mappings and LEFT configuration remain unchanged. The missing temporary
west workspace was reconstructed from the pinned manifest.

- New test image: `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation.uf2`.
- SHA256: `707dee7c575a1f58052a20fd0f4a8a866a263da4d16e657465a45d60d6338dd6`.
  Checksum file: `SHA256SUMS-orientation` in the same directory.
- Build directory: `/tmp/kairos44-diagnostic-workspace/build-kairos44-right-trackpad-orientation-debug`.
  Same board, debug snippet/config, pinned modules and build image as October 7.
- Flashed RIGHT on 2026-10-08 after the user entered bootloader mode. The mounted
  NICENANO volume had the recorded RIGHT serial `820E0FAE437DFBDF`; checksum
  verification passed before copying the UF2. The bootloader volume disappeared
  and the same serial returned as ZMK at `/dev/ttyACM0`. LEFT was not flashed.
  Physical direction acceptance is pending: test all four swipes, circles,
  both-half typing, cold boot and LED-idle pointing. Leave BLE bonds untouched.
- The October 7 working image is preserved with its original checksum as rollback.
  Automatic EP-cycle recovery is still unimplemented; avoid EP_OFF/EP_ON.
  Historical manual recovery values below would erase orientation settings.
  With these flags, expected FEED_CFG1/FEED_CFG2 values are `c1`/`c1`, rather
  than `01`/`41`; do not blindly reuse the old recovery writes.

## Current Trackpad Checkpoint (2026-10-07)

This section and the next-work sequence supersede the October 1 checkpoint
below. Detailed diagnostic evidence is in
[Trackpad Setup](kairos44-trackpad.md).

### Confirmed Outcome

Restoring the sensor registers recovered host pointing **without a reboot**.
EP_OFF removes sensor power and clears its volatile configuration; EP_ON
currently restores power but does not restore that configuration. Automatic
firmware recovery remains to be implemented. Avoid EP_OFF for now; normal LED
timeout and touch-triggered LED wake are already working.

The user confirmed both-half typing, immediate pointing after disconnecting
both USB cables for nearly one minute, continued pointing after LED timeout,
and LED wake on touch. After the controlled EP cycle and register recovery,
the user reported: "Yes, the LEDs turned on and the trackpad is working!!"
No batteries were connected. Battery, sleep and repeated-cycle reliability
are not established by these tests.

### Hardware And Firmware In Use

- RIGHT has the physical `TM040040-2024-302` Cirque Pinnacle sensor and sends
  input over BLE. LEFT is central, has nice!view, and sends host HID reports.
  Both use split-input channel 0. Right USB is power/debug, not normal mouse HID.
- RIGHT runs `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-power-pullups.uf2`.
  SHA256: `1a215465068a13a0581cbe362aea00f5289f31c4a3d702061dae8c30ab10464f`.
  Its checksum file is `SHA256SUMS-power-pullups` in that directory. Previous
  images are retained for rollback. A normal non-debug image including the
  pull-up fix has not yet been built.
- RIGHT bootloader serial: `820E0FAE437DFBDF`. LEFT was not flashed during this
  diagnostic sequence; its image provenance is unknown, but this working
  pair is user-confirmed. Do not flash LEFT merely to establish provenance.
- I2C1/TWIM1 is 100 kHz, address `0x2a`, SDA P0.31, SCL P0.29, active-high
  DRDY P0.08. PCB R1/R2 are 4.7 kOhm series resistors, not pull-ups. The user
  removed the module mode-select R1 for I2C and performed the isolated DRDY rework.
- Firmware repository: `/home/richard/dev/zmk-config-kairos`.
  Hardware: `/home/richard/dev/keyboards/kairos44_choc_trackpad-flip`.
  Preserve all existing tracked and untracked changes. No commit or push was
  made during this diagnostic sequence.

### Implemented Fixes And Remaining Cause

1. The right sensor shield sets `CONFIG_ZMK_RGB_UNDERGLOW_EXT_POWER=n` in
   [its configuration](../boards/shields/kairos44_trackpad/kairos44_trackpad.conf).
   RGB blanking no longer cuts the shared LED/sensor rail. Explicit EP controls
   retain their power-switching semantics.
2. The right I2C default pinctrl group has `bias-pull-up;` in
   [its overlay](../boards/shields/kairos44_trackpad/kairos44_trackpad.overlay).
   Earlier idle signals were about 2.2-2.3 V; internal pull-ups raised them to
   about 3.3 V and stabilized identity reads. The flashed image applies this
   at boot: both PIN_CNF registers read `0x60c`, replacing `0x600`. Sensor
   initialization then succeeded. Sleep pinctrl was not changed.
3. The controlled test started from a working baseline: EP_OFF, wait about
   five seconds, EP_ON. Pointing stopped while I2C remained responsive.
   Zephyr still reported READY, illustrating that driver readiness is not
   proof that an externally power-cycled sensor retains its configuration.

| Readback | Working | After controlled EP cycle | After temporary recovery |
| --- | --- | --- | --- |
| Identity/version | `07 3a` | `07 3a` | Not reread in recovery probe |
| SYS_CFG / FEED_CFG1 / FEED_CFG2 | `00 01 41` | `00 00 00` | `00 01 41` |
| Z_IDLE | `05` | `1e` | `05` |
| SLEEP_INTERVAL | `ff` | `49` | `ff` |
| DRDY sample | 0 | 1 | 0 |
| Host pointing | Working | Failed | User-confirmed working |

The diagnostic shell restored volatile settings in this order, enabling feed
last. These are the commands already executed, not a request to run them again:

```text
i2c write i2c@40004000 0x2a 0x8a 0x05
i2c write i2c@40004000 0x2a 0x8c 0xff
i2c write i2c@40004000 0x2a 0x85 0x41
i2c write i2c@40004000 0x2a 0x82 0x00
i2c write i2c@40004000 0x2a 0x84 0x01
```

`0x82` clears status. Immediate readback passed, then the user confirmed
pointing without unplugging. This probe does not repeat calibration or
extended-register tuning and is not a permanent recovery implementation.

### Resume Environment

- Local west workspace: `/tmp/kairos44-diagnostic-workspace`. ZMK is pinned to
  `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (v0.3.0); Cirque module to
  `0de55f36bc720b5be3d8880dc856d4d78baf5214`. Temporary paths may disappear.
- Current debug build directory: `build-kairos44-right-trackpad-power-debug`.
  It uses shields `kairos44_right kairos44_trackpad`, board `nice_nano_v2`,
  snippet `zmk-usb-logging`, and `config/kairos44-trackpad-debug.conf`.
  Focused build and right-role/baseline validator passed for the flashed image.
  The six-build/native gate passed before these latest power/pull-up fixes;
  it was not rerun for this documentation checkpoint.
- Build container remains the digest-pinned image in the historical notes
  below. Validator containers require `ZEPHYR_BASE=/work/zmk/zephyr`.
  See [Trackpad Setup](kairos44-trackpad.md) for build commands and role checks.
- RIGHT serial endpoint:
  `/dev/serial/by-id/usb-ZMK_Project_615e_820E0FAE437DFBDF-if00`, last mapped to
  `/dev/ttyACM0`. Access worked at the checkpoint; reconnecting can reset ACLs.
  If needed, the user runs `sudo setfacl -m u:richard:rw /dev/ttyACM0` directly
  after verifying the current device mapping. Never collect a sudo password.
- Serial is 115200 baud, raw mode, DTR asserted, prompt `trackpad>`. No PySerial
  is installed; stdlib `os/tty/termios/fcntl/select` worked. Wait for the echoed
  command and trailing prompt before sending another; drain initial duplicate
  prompts. Do not use 1200 baud or repeat full failing I2C scans.
- The shell log backend is disabled and `log list_backends` was empty. No
  sensor reinitialization shell command has been established.
- Last observed physical state: both USB cables connected, rail enabled,
  pointer working after temporary recovery. Recheck state on resume rather
  than assuming it survived overnight. Do not intentionally reset it just
  to repeat evidence already obtained.

## Read First

For day-to-day configuration edits and builds, use
[the repository guide](repository-guide.md).

1. [Development plan](kairos-development-plan.md): approved scope and exclusions.
2. [Development log](development-log.md): decisions, hardware map, dependency
   provenance, test evidence and open issue closure conditions.
3. [User guide](../README.md): targets, bindings, build/flash/pairing and acceptance.
4. This document: transfer, reconstruction and the next work sequence.

## Historical Checkpoint And Boundaries (2026-10-01)

The trackpad exclusions and unverified states in this historical section are
superseded by the October 7 checkpoint above. Transfer/reconstruction notes
below still provide useful keyboard-only baseline context.

- Shared 42/44-key keyboard implementation is complete in the local worktree.
  Existing 42-key electrical definitions and both displays are preserved; the
  new model has a left-only display and dedicated left Enter/right Space.
- Shared content lives under `boards/shields/common/kairos/`. Both model keymaps
  are wrappers. Positions 0-41 remain stable; new switches are appended at 42/43.
  Seven layers, 43 named combos and existing macro/dance/modifier mappings remain.
- Lower/Raise/Down/Up are direct momentary layers. HRM tapping/quick-tap are
  200/200 ms; Space and semicolon hold-taps have independent 220 ms terms.
- Preserve the release-order repair: lock UTILS from NAVIGATION's physical left
  Q, and select sticky NAVIGATION from UTILS' physical right L. This ZMK version
  clears a layer on `&mo` release even after same-layer `&to`/`&sl` activation.
- The last recorded full gate passed both original baselines, all four final
  builds, generated-firmware preservation checks and the native fixture.
  Python lint also passed. These are historical results, not a guarantee for
  subsequent edits or a freshly transferred checkout; rerun the gate below.
- **44-key artifacts are keyboard-only.** No Cirque driver, active trackpad bus,
  input-split device, tap-to-click or held trackpad-scroll mode is implemented.
  Existing keyboard mouse buttons/movement/scrolling are not trackpad acceptance.
- HW-01 (exact ribbon/pinout), HW-02 (series resistors/pull-ups), DRV-01 (exact
  protocol/driver) and ACCEPT-01 (physical keyboard acceptance) remain open.
- The [GitLab pipeline](../.gitlab-ci.yml) and [build helper](../scripts/build-gitlab.sh)
  provide four fresh-workspace builds in the digest-pinned amd64 image, firmware
  checks and 30-day successful artifacts with checksums/provenance. Native tests
  are excluded from CI. See [GitLab usage](repository-guide.md#build-with-gitlab).
  Homelab CI Lint and the first hosted pipeline remain unverified; no GitLab
  project URL or credentials have been supplied. No Kubernetes/DinD changes are
  required. Preserve the local full regression gate for shared behavior changes.
- No flashing, bond clearing, hardware modification, Git commit or push was
  performed by the implementation or this documentation update. Do not add a
  custom driver or hardware redesign without separate approval. RP2040/Elite-Pi
  and wired split remain excluded.

## Repository References

| Item | Checkpoint reference |
| --- | --- |
| Firmware remote | `https://github.com/Antebios/zmk-config-kairos.git` |
| Current local branch | `feature/kairo-44-trackpad` |
| Original configuration baseline | `7268ea34f01bc4bb29cdd53dcc3c3a9901ed2dd2` |
| Firmware HEAD before GitLab implementation | `430b675` (inspect current HEAD before transfer) |
| ZMK upstream pinned commit | `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (v0.3.0) |
| Hardware parent remote | `https://github.com/Antebios/keyboards.git` |
| Hardware parent HEAD | `b1c3429f02d2d331f5b72e9d9eca63b3ac761592` |
| Required hardware subdirectory | `kairos44_choc_trackpad-flip/` |

The worktree was clean at `430b675` before GitLab implementation. The new CI
files and related documentation are local changes until deliberately committed
and published or copied. Inspect current Git status rather than assuming an
old checkpoint's changes are still uncommitted. A remote clone cannot restore
unpublished commits or local files. The hardware
subdirectory is also untracked in its parent repository at this checkpoint;
the parent commit does not capture it. Other user changes exist in that parent
repository; do not reset, stage or overwrite them as part of resuming.

Some legacy helper files have reappeared in the worktree. The active legacy
keymap wrapper includes the common tree; do not assume every remaining old
helper is active or remove it without reviewing the user's changes.

Hardware reference fingerprints at this checkpoint, relative to the hardware
subdirectory (not a claim that they match previously measured physical hardware):

```text
1a2a3bd5325e5c38a273462555141453cdb6264ef77ec8eff5084efa54d24201  pcb/michele44_trackpad-splayed.kicad_pcb
cde35e30de419b1311cdeb38e5ba0f326111bebf81aa6ae270431e94280248a1  pcb/michele44_trackpad-splayed.kicad_sch
```

## Preserve Work Before Moving Computers

Choose one transfer method; these commands are instructions, not actions already
taken. No automatic commit/push is authorized by this checkpoint.

**Reviewed Git publication:** review the firmware diff and untracked files,
explicitly stage the intended source/docs/scripts/tests, commit and push the
branch when authorized. On the other computer clone/fetch that published branch
and record the new checkpoint commit here. Transfer or separately publish the
untracked hardware folder as well. Review for private files before publication.

**Worktree copy without a commit:** from the firmware repository root, create
an archive outside the repository. Unlike `git archive HEAD` or `git diff`, it
includes untracked files and Git metadata as well as current edits:

```sh
tar -czf ../kairos-zmk-session.tar.gz .
```

Separately archive the required hardware folder, running from its parent:

```sh
tar -czf ../kairos44-hardware-reference.tar.gz kairos44_choc_trackpad-flip
```

Transfer both archives and extract them into **new, empty directories**, not
over existing worktrees. The firmware archive restores this branch, history,
tracked changes and untracked implementation; the hardware archive is a source
snapshot, not the parent repository's history. To continue hardware repository
development, also preserve that full parent worktree separately. Check `git
status --short` after extraction and verify the hardware hashes with `sha256sum`.
Archives may include ignored/private files; review and transfer them securely.

Do not rely on `/tmp/kairos-zmk-baseline`, `/tmp/kairos-original-config`, built
UF2s, Docker caches or editor/session memory. None is required to resume.

## Reconstruct And Verify

Prerequisites: Git, Docker with usable daemon access, POSIX shell, `realpath`,
tar and network access to upstream repositories/container registry. Linux
Docker was tested; other host architectures/container emulation are unverified.
Run these commands from the restored firmware repository root. Use a fresh
`$HOME/kairos-build` directory, or choose another unused absolute path.

```sh
mkdir -p "$HOME/kairos-build"
git clone https://github.com/zmkfirmware/zmk.git "$HOME/kairos-build/zmk"
git -C "$HOME/kairos-build/zmk" checkout edf5c0814fd3ea202e43aad2d68fd32e882a518c
docker pull zmkfirmware/zmk-build-arm@sha256:edb1c953438c6f720ddb79c3762f3972013b7fbbaf4fff3592fc869983e7afc5
docker tag zmkfirmware/zmk-build-arm@sha256:edb1c953438c6f720ddb79c3762f3972013b7fbbaf4fff3592fc869983e7afc5 zmkfirmware/zmk-build-arm:stable
docker run --rm -v "$HOME/kairos-build/zmk:/work/zmk" -w /work/zmk zmkfirmware/zmk-build-arm:stable west init -l app
docker run --rm -v "$HOME/kairos-build/zmk:/work/zmk" -w /work/zmk zmkfirmware/zmk-build-arm:stable west update --fetch-opt=--filter=tree:0
mkdir -p "$HOME/kairos-build/original-config"
git archive 7268ea34f01bc4bb29cdd53dcc3c3a9901ed2dd2 | tar -x -C "$HOME/kairos-build/original-config"
sh scripts/verify-local.sh "$HOME/kairos-build/zmk" "$HOME/kairos-build/original-config"
```

The explicit tag command replaces the local `stable` alias with the recorded
image because the verification helper uses that alias. Perform it on the new
build machine only after checking that other local workflows do not depend on
a different image behind that tag. No host west or ARM compiler is required.
The snapshot must contain the original commit in Git history; a source-only
copy without `.git` cannot reconstruct it using `git archive`.

Expected final results: four `PASS` firmware validations and
`PASS: kairos-behaviors`, with a zero script exit code. Build logs may retain
the recorded deprecated-label/reboot-symbol warnings. The optional fresh lint
command, if `uv` is available, is:

```sh
uvx --from flake8 flake8 scripts/validate_firmware.py
```

UF2s are regenerated at `zephyr/zmk.uf2` in `build-shared-left`,
`build-shared-right`, `build-kairos44-left` and `build-kairos44-right` under the
new upstream workspace. Native evidence is under
`build-kairos-native/tests/kairos-behaviors/`. Do not interchange model/side
artifacts or flash them automatically.

## Next Work In Order

1. Inspect current Git state, read the October 7 checkpoint and trackpad
  diagnostic record, and establish current hardware state. Preserve later
  user edits. Do not repeat the successful cold-boot, idle or failure diagnosis
  merely to rediscover the documented result.
2. Implement automatic sensor recovery after explicit rail cycling while
  preserving EP_OFF/EP_ON semantics. The nearest owning code is the pinned
  ZMK `app/src/ext_power_generic.c` and Cirque
  `drivers/input/input_pinnacle.c` in the west workspace. External-power
  enable/disable currently only switches GPIO/settings; the sensor's PM
  resume only enables interrupts and does not restore configuration.
3. Choose a durable repository integration, not edits only in a temporary
  dependency checkout. Full `pinnacle_init()` is not an established safe
  runtime API: it also registers callbacks/initializes work, and calibration
  and ERA loops need failure/timeout review. The successful four-register
  probe proves this recovery path for one cycle, not complete reinitialization.
4. Build and validate a distinct RIGHT recovery debug image against the
  keyboard-only baseline. Preserve rollback artifacts. Coordinate flashing
  with the user and verify RIGHT bootloader serial before writing. Do not
  reset Bluetooth bonds or flash LEFT unnecessarily.
5. Verify repeated explicit power-cycle recovery and preserved typing/idle
  behavior on hardware. Then build and validate normal non-debug RIGHT
  firmware with the pull-up, LED-power and accepted recovery fixes.
6. Track remaining battery/sleep/long-duration and broader feature acceptance
  separately. No powered resistance measurements, speculative resistor
  bypasses or hardware redesign. Do not infer rail voltage from GPIO13 input
  reads. Use the exact TM040040 specification referenced in Trackpad Setup,
  not the different Gen6s HTML specification.

## Resume Prompt

> Read docs/session-handoff.md and docs/kairos44-trackpad.md in the Kairos ZMK
> configuration repository. Resume from the October 7 checkpoint: RIGHT sensor
> pointing, cold boot and LED-idle/touch wake work. EP_OFF/EP_ON loses sensor
> configuration; manual register restoration recovered pointing without reboot.
> Automatic recovery is not implemented. Inspect current worktree and hardware
> state, preserve the working pair and user changes, and continue with a durable,
> bounded sensor power-cycle recovery implementation when asked to resume work.
> Avoid EP_OFF until recovery is ready. Coordinate any RIGHT flash; do not flash
> LEFT, clear bonds, commit, push or change hardware without approval.
