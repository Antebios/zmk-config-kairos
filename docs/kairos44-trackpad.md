# Kairos44 Right Trackpad

## Windows BLE Pointer Latency Trial (Flashed 2026-10-12)

The user confirmed that pointer motion is smooth with USB on both Linux and
Windows, but laggy over Bluetooth on Windows. This isolates the remaining issue
to the BLE host/transport path rather than the trackpad sensor or speed mode.
The LEFT trackpad receiver requests a fixed 7.5 ms BLE connection
interval (min/max 6 units) and peripheral latency 0, replacing ZMK's default
7.5-15 ms interval and 30-event peripheral latency. Zephyr automatically sends
the connection-parameter update after connection. The shorter interval and
zero latency may increase BLE radio activity and reduce battery life. Windows
may reject or renegotiate the requested parameters, so actual host behavior
must be tested.

Flashed trial image:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-ble-low-latency.uf2`
SHA256 `ea82cbc544d962b7fcf4a381d6da9bae95ad4d185088bf46fd18872c9dec8b29`.
The LEFT-only generated config confirms min/max6, latency0 and automatic update;
the complete six-target firmware/validator/native gate passes. Before flashing,
verified LEFT bootloader serial `6A5D691ABAC1CDB3`, mount and image checksum;
after sync, udev confirmed the same serial returned as ZMK. No CDC tty node
appeared. Test Windows BLE cursor response and battery impact. RIGHT firmware,
keymap, sensor, RGB and bonds are unchanged.

## Context-Aware Nice!view Screen (Low-Overhead Observer Flashed 2026-10-12)

The LEFT receiver's portrait screen now selects among three views without a
manual page key. Overview remains the idle view. Modifier, host lock LED and
operational-layer changes select Action, showing modifier/lock/layer state and
the last short action label. A held modifier keeps Action visible; otherwise it
lasts three seconds after the latest action. Nonzero pad motion, scroll and
button transitions select Trackpad for two seconds after the latest event.
Action has priority; after it expires, a live Trackpad view resumes, otherwise
Overview returns. Every view retains both battery readings and local USB power.

Trackpad shows effective pointer mode, move/scroll/click and the current
button state. `NONE` means no button is held. The live direction label was
removed because it changed almost every motion sample and forced continuous
full-screen redraws. Steady motion now only extends the Trackpad deadline;
redraws happen when the view appears or action/button text changes. The
portrait-to-panel rotation is a direct buffer copy with one invalidation,
replacing 10,880 `lv_canvas_set_px_color` calls that each invalidated the
canvas. Those CPU bursts ran on the priority-5 nice!view display thread. That
thread preempts the Bluetooth host threads (6-8) and the input thread, and
blocks the equal-priority BLE HID sender, which explains BLE-only jitter. The
passive observer is scoped to the LEFT `trackpad_split` proxy and does not
replace the ZMK input listener. Button transitions remain immediate. Pointer
events sent to ZMK's listener are not filtered or changed.

The implementation passes the portable display tests and the complete
six-target build/validator/native behavior gate. Flashed image:
`artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-context-screen-low-overhead.uf2`
SHA256 `fac03432e1c5e5dcf96d2a6a6810c73eeb50d27cc208cf9a428331090712a4c6`.
Before copying, verified LEFT bootloader serial `6A5D691ABAC1CDB3`, the
`NICENANO` mount and UF2 checksum. After sync, the volume disappeared and udev
reported the same serial as `ZMK_Project_Kairos44_6A5D691ABAC1CDB3`; USB
identified Kairos44. No CDC tty node appeared. Physical cursor smoothness,
view behavior and direction labels still need acceptance. No RIGHT firmware,
keymap, sensor configuration, RGB or bond/settings changes.

## Dual-Half Nice!view Portrait Layout Updated (2026-10-09)

The user confirmed that the default LEFT nice!view screen works. The approved
custom receiver screen now shows both battery percentages, selected USB/BLE
output and 1-based BLE profile status, RIGHT split-link status, operational layer,
held GUI/Alt/Shift/Ctrl in the LEFT home-row order, host Caps/Num/Scroll LED state, and effective pointer
mode. See the [printable reference](kairos44-reference.md#niceview-status-screen)
for the portrait line sequence, future ideas and caveats. The renderer composes
a 68 x 160 logical frame (16 lines, at most eight 8-pixel glyphs per line) and
rotates it 90 degrees clockwise into the nice!view's native 160 x 68 framebuffer.
Canvas pixel mapping uses a bounded 68 x 160 to 160 x 68 transform; the panel
driver orientation and wiring are unchanged.

Only the LEFT trackpad receiver opts into the repository display module and
central battery fetching. RIGHT already has `CONFIG_BT_BAS=y`, including the
currently flashed diagnostic build; no RIGHT reflash is required. The four
keyboard-only variants retain their screen behavior. Neither keymap, sensor,
orientation, rail policy, display wiring nor bonds/settings were changed.

Battery events are captured before display initialization. RIGHT source0 must
have an actual report before a percentage is shown; the central getter's
zero-initialized persistent cache is not treated as a fresh sample. Detected
disconnects invalidate it. Read-only transport polling does not replace ZMK's
connection callback. Rendering is on the display queue, with 10 ms event
coalescing and once-per-second link polling; unchanged frames are not redrawn.
Both installed batteries are 3200 mAh, but no capacity calibration or runtime
estimate is added. A USB power tag is not a charging indication.

Modifier indicators aggregate pinned-ZMK keycode state transitions, including
explicit/implicit modifiers and direct modifier key usages. Lock indicators
consume host HID LED reports; `???` is shown until a real report arrives
rather than treating the zero-initialized cache as known-off. The receiver opts
into `CONFIG_ZMK_HID_INDICATORS=y` for this. Portrait modifier slots follow the
LEFT home-row order GUI, Alt, Shift, Ctrl; lock slots are Caps, Num, Scroll.
The headings `BATTERY:`, `HOST:`, `LINK:`, `MOD:`, `LOCK:`, `LAYER:` and `PAD:`
are colon-terminated. Battery values use `L:` and `R:` prefixes (`R:OFF` when
disconnected, `R:--` while connected and awaiting a report). Portrait output abbreviates
the operational layers (`FUNCTIONS` as `FUNC`, `SYMBOL_KP` as `SYM-KP`).

Portable tests cover unknown versus valid0%, invalid/source filtering,
disconnect/reconnect and unchanged-reading retention, USB/BLE profiles, all
seven operational layers, portrait labels and line bounds, four corners of the
90-degree coordinate map, pointer priority, overlapping modifier counts and
lock LED mapping. The LEFT build, compiled validator, six-build regression gate
and existing native key/pointer fixture passed. One strong screen provider was
verified in the ELF. Final LEFT rebuild after the mapping helper passed; flash
use is 362404 B and RAM use is 92420 B.
Physical readability and live remote readings remain unverified.

Implemented now: modifier and Caps/Num/Scroll indicators in the portrait layout.
Future-only candidates are low-battery emphasis after observing real battery
behavior, an optional idle animation inspired by Furglitch's fork, a WPM metric
if useful, and host-provided time/volume/layout/weather/media via separately
evaluated RAW-HID companion software. These are not current requirements or
dependencies.

Updated portrait LEFT image (labels/order):
[kairos44-left-trackpad-receiver-portrait-status.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-portrait-status.uf2).
SHA256: `addde36f3c4428d956fb8ea15fc6cf9979c1a8bcf20eff907107c6dbb43201b8`.
`SHA256SUMS-portrait-status` is beside the UF2. Flashed to LEFT after verifying
bootloader serial `6A5D691ABAC1CDB3`, `/dev/sda` mount and checksum immediately
before copy/sync. The bootloader volume disappeared and the same serial returned
as ZMK `ZMK_Project_Kairos44_6A5D691ABAC1CDB3`. The previous portrait image
(`9ead8328...`), landscape image and extra-thumb-holds image remain available
for rollback. No RIGHT flash, bond reset or EP_OFF testing.

After flashing, check both batteries (allow 60 seconds), all layers and pointer
modes, thumb tap/hold actions, typing/pointing/scroll and host output changes.
Powering off RIGHT should show OFF and invalidate its percentage; unplugging
RIGHT USB alone is not a disconnect test if its battery keeps it running.
Physical readability of the revised punctuation/prefixes and modifier order,
both battery values and lock LED reports remain pending user acceptance.

## Extra Thumb Holds (2026-10-08)

Only the approved tap/hold actions are added in Kairos44 trackpad builds:

| Extra key | Tap | Hold for 200 ms |
| --------- | --- | --------------- |
| LEFT Enter (42) | Enter | Pad scrolling |
| RIGHT Space (43) | Space | Temporary Precision (1/4x) |

These are available directly from BASE, without Lower, and through transparent
extra bindings on the other layers. Tap sends the normal key on release;
hold sends no Enter/Space and no longer performs normal key auto-repeat.
Keyboard-only Kairos44 keeps plain Enter/Space; Kairos42 and all original
thumb bindings are unchanged. No new combos, double-taps or alternatives.

Separate momentary states11 (extra Precision) and12 (extra Scroll) avoid the
pinned `&mo` release clearing a state still held by NAV B or Z. Selected
speed7/8 and existing temporary states9/10 are unchanged. Listener scroll
mask10/12 takes priority over precision8/9/11 and Fast7. Both extra thumbs
held means scrolling; release Enter first to use Precision until Space is
released. Any remaining same-function hold continues in either release order.
Explicit `&to` reset clears modes without release resurrecting them.
Contexts13..21 preserve all42 combo scopes (22 trackpad layers,7 keyboard-only).

Native sixteen-key fixture passes Enter/Space taps and typing-roll order,
BASE four-axis scrolling/precision, speed restoration, concurrent thumbs,
both release orders with Z/B, and reset while both extra thumbs are held.
The focused LEFT compiled validator and full six-build regression gate passed.
New LEFT image:
[kairos44-left-trackpad-receiver-extra-thumb-holds.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-extra-thumb-holds.uf2).
SHA256: `c32af7fc4d73850b5857203e37de7e5254d28e038f62ea1ba2fa851e10c09512`.
Flashed LEFT on 2026-10-08 after verifying bootloader serial
`6A5D691ABAC1CDB3`, mount and checksum; copy/sync completed and the same serial
returned as ZMK `Kairos44`. RIGHT and bonds/settings remain unchanged. Previous
pad-scroll image is retained for rollback. Physical thumb acceptance is pending.

## Held Pad Scrolling (2026-10-08)

Trackpad-only NAV physical LEFT Z (position25) now taps for sticky left Alt
or holds for pad scrolling, using a 200 ms tap-preferred decision. Hold Lower
and Z, wait200 ms, then slide one finger vertically/horizontally to scroll.
Release Z to restore pointer movement at the selected Normal/Fast/Precision
speed. Scroll does not overwrite the selected mode; B precision hold remains.
Release-before-NAV and NAV-before-Z ordering both preserve normal key handling.
Explicit `&to` recovery clears the temporary scroll state.

Independent scroll state10 selects the first LEFT listener override:
XY scaler1/16 with fractional remainders, Y inversion for wheel direction,
then `zip_xy_to_scroll_mapper`. It suppresses cursor motion and bypasses speed
scalers while leaving buttons unchanged. States7/8/9 remain speed/precision;
contexts are now11..19, for20 trackpad layers versus7 keyboard-only. Existing
42 combo scopes and keyboard wheel keys are preserved.

Native synthetic pad events verify sticky Alt on tap, up/down/left/right wheel
reports without cursor motion, Normal/Fast/Precision restoration, simultaneous
precision hold, release ordering and reset. The full six-build/validator/native
gate passed. New LEFT image:
[kairos44-left-trackpad-receiver-pad-scroll.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-pad-scroll.uf2).
SHA256: `4e88ddea5a02d565cf48081f09a248f0e42cdae5c7ceebad91d758132d7e04aa`.
Flashed LEFT on 2026-10-08 after verified serial/checksum/mount and copy/sync;
serial `6A5D691ABAC1CDB3` returned as ZMK `Kairos44`. The user cancelled the
physical acceptance question, so direction/sensitivity acceptance is pending.
RIGHT remained untouched; no sensor or bond changes.
This is held-key scrolling, not native two-finger gestures.

## NAV Wheel Taps (2026-10-08)

The user reported no scrolling from short NAV Y/H presses but confirmed
scrolling when held for at least half a second. Pinned ZMK's default scroll
rate is 10 steps/second at a 16 ms tick; the first whole step takes about
112 ms, and release discards fractional remainder. This explains the tap issue.

Trackpad-only NAV now sends one initial wheel step on Y/H key-down, followed
by the original 10-step/second repeat if held. U/O use the same mechanism for
horizontal scrolling. A 20 ms pulse at 64 steps/second emits one step on the
first 16 ms tick; the standard `msc` behavior then runs until key release.
Macro parameter forwarding keeps direction correct and balances press/release
even if the physical key is released before the pulse completes. Pointer
speed scaling and keyboard-only NAV scroll bindings are unchanged.

Native HID reports verify a 20 ms upward tap, a 5 ms early release, a downward
tap, and initial-step plus held repeat. Existing speed/precision-hold tests
and the six-build firmware/validator gate pass.
New LEFT image: [kairos44-left-trackpad-receiver-speed-hold-scroll-tap.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-hold-scroll-tap.uf2).
SHA256: `33209f677b9451bc10643ac9c2af70ec3970f1b99db6defe67dfeaa11fd8dca9`.
Flashed LEFT on 2026-10-08 after checksum/mount and serial
`6A5D691ABAC1CDB3` verification. Copy/sync completed; the same serial returned
as ZMK `Kairos44`. The user then confirmed both short Y/H taps scroll up/down
correctly in the browser. RIGHT and bonds remain untouched. Horizontal
wheel taps and physical hold-for-precision/drag acceptance remain pending.

## Pointer Speed Cycle (2026-10-08)

On trackpad builds only, tap the former LEFT End key (NAV position 29) to cycle
**Normal (1x) -> Fast (2x) -> Precision (1/4x) -> Normal**. Each separate tap
advances one mode; this is not double/triple-tap counting. Boot starts at Normal.
The mode stays selected when momentary NAV is released and re-entered.
Existing explicit `&to` layer switches, including BASE recovery and UTILS lock,
clear speed states and return pointing to Normal.

### Hold For Precision

On the same NAV key (physical LEFT B), a hold of at least 200 ms temporarily
selects Precision (1/4x). Releasing B restores the previously selected
Normal, Fast or Precision mode; the hold never advances the cycle. Short
taps cycle on release. The behavior is tap-preferred, with a 200 ms decision
delay. Start with NAV active; once the hold is recognized, NAV may be released
first without losing the temporary state until B is released.

This uses a separate momentary precision state9, leaving selected states7/8
unchanged. An explicit `&to` reset while held clears all speed states;
releasing B afterward does not resurrect the old mode.

Native hold/restoration tests and the complete six-build regression gate pass.
The recovery fixture now presses all three chord keys within the real 50 ms
combo window; it previously held Lower too early to exercise the combo.
New LEFT image: [kairos44-left-trackpad-receiver-speed-hold-precision.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-hold-precision.uf2).
SHA256: `76525698ad2da28fa4d5e9a71453a2cc14e8b02fd8e9971883b29e9923d7c28d`.
Flashed LEFT on 2026-10-08 after serial/checksum verification and copy/sync;
the same serial `6A5D691ABAC1CDB3` was subsequently observed as ZMK `Kairos44`.
RIGHT remains unchanged.
The earlier tap-only speed-cycle image below is preserved for rollback.
Physical hold timing and drag acceptance remain pending.

Do not press V+B together within the 50 ms combo window: that pre-existing
global chord sends a private text macro. For precision dragging, hold B
until Precision activates before pressing V for left-click.

Scaling is applied to relative X/Y events on the LEFT split-input receiver,
not to sensor ADC sensitivity. Fractions accumulate across events. Mouse
buttons and scrolling are not scaled; host pointer acceleration still applies.
Conditional transparent contexts preserve typing, NAV clicks, and combo scopes.
Keyboard-only builds retain seven layers; trackpad builds have twenty-two.

The native fixture passes independent-tap cycling, mode persistence, BASE
typing, BASE/NAV/COMBOS shortcut scopes, and explicit/recovery reset checks.
The six-build gate (four keyboard-only, two trackpad) and compiled validators
passed. Physical speed, fine movement, clicking and dragging remain unverified.

LEFT image: [kairos44-left-trackpad-receiver-speed-cycle.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-speed-cycle.uf2).
SHA256: `69bae87e6b5802a13b020af4d4cbae405aabfa0c2b2ff0197a65f7ed6bc036d1`.
Flashed LEFT on 2026-10-08 after checksum and bootloader serial
`6A5D691ABAC1CDB3` verification. Copy/sync completed; the bootloader disappeared
and the same serial returned as ZMK `Kairos44`. RIGHT orientation/debug firmware
remains unchanged. No bonds/settings reset was performed. The previous NAV
mouse image is preserved for rollback. Physical acceptance is pending.

During validation, the user's current New Console combo at LEFT positions
15/16 conflicted with New Window on COMBOS. The user chose to keep New Console
there and remove the COMBOS New Window binding. BASE New Window remains.
This shared shortcut change applies to all builds; there are now 42 combos.

## Navigation Keymap (2026-10-08)

Only the paired trackpad builds change the NAV layer. Left-hand arrow keys,
Page Up/Down, sticky Alt, and sticky layer shortcuts remain in place.

| Position | Trackpad NAV binding |
| -------- | -------------------- |
| Left bottom row, former plain Alt | Right mouse button |
| Left bottom row, former Mirror | Middle mouse button |
| Left bottom row, former Home | Left mouse button |
| Right top row, two outermost keys (inner to outer) | Home, End |

The right-hand mouse-button positions are unassigned. The former left-hand
End now cycles pointer speed as described above.
Buttons can be held for dragging while the right hand operates the trackpad.
Keyboard-only Kairos44 and Kairos42 retain their original NAV bindings.
This change requires a rebuilt LEFT receiver image for host-side key handling;
both halves were rebuilt, validated, and flashed on 2026-10-08 at the user's
request. LEFT bootloader serial `6A5D691ABAC1CDB3` returned as ZMK `Kairos44`.

Both trackpad builds passed compiled-binding and keyboard-only-baseline
validation; the LEFT keyboard-only fallback also built and passed validation.
The RIGHT firmware need not be replaced for this keymap-only change.
LEFT image: [kairos44-left-trackpad-receiver-nav-mouse.uf2](../artifacts/kairos44-left-trackpad-receiver/kairos44-left-trackpad-receiver-nav-mouse.uf2).
SHA256: `911381e901fdd5e6b83ca1ddb92c1b6509fb35969a2a7ca51e1a10ed243336a1`.
The rebuilt RIGHT diagnostic UF2 was byte-identical to the latest user
orientation image (SHA256 `3e60eabe49afcba3780c42560b1478b5924c8ba17505756b4b838b46bef51deb`)
and was reflashed to verified serial `820E0FAE437DFBDF`, which returned as ZMK.
Current `rotate-90`/`y-invert`, power fixes, and diagnostic shell were retained;
no bond reset or settings reset was performed.
Physical click, hold-to-drag, and Home/End acceptance is pending.

## Orientation Update (2026-10-08)

### Latest User Orientation

The user changed the sensor settings to `rotate-90` and `y-invert`, removing
`x-invert`, and requested a rebuild/flash. Built those settings unchanged using
the same RIGHT debug target; focused build and trackpad/keyboard-baseline
validator passed. Generated DTS confirms both flags and no X inversion.

Flashed `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation-user.uf2`
to verified RIGHT serial `820E0FAE437DFBDF`; it returned as ZMK at `/dev/ttyACM0`.
SHA256: `3e60eabe49afcba3780c42560b1478b5924c8ba17505756b4b838b46bef51deb`.
LEFT and user source were untouched; physical acceptance is pending. Expected
FEED_CFG1/FEED_CFG2 are `81`/`c1`. This supersedes v2 below; earlier artifacts
remain available. Automatic EP-cycle recovery is still unimplemented.

### Previous V2 Correction

The first orientation image corrected LEFT/RIGHT, but UP moved DOWN and DOWN
moved UP per the user's physical test. Removed `y-invert`, retaining `rotate-90`
and `x-invert`. This supersedes the initial inference below. The corrected RIGHT
build and keyboard-baseline/trackpad validator passed; generated DTS has no Y
inversion.

Flashed `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation-v2.uf2`
to verified RIGHT serial `820E0FAE437DFBDF` after checksum verification. SHA256:
`761a2bb23c0b5f365185d3aae590c833ba1d1e9941495f2c3e5f7dca1eaa7e2c`.
RIGHT returned as ZMK; LEFT and bonds remain unchanged. V2 physical direction,
circle, typing, cold-boot and LED-idle acceptance is pending. Expected sensor
FEED_CFG1/FEED_CFG2 are now `41`/`c1`; old recovery writes would erase orientation.
Automatic EP-cycle recovery remains unimplemented. Previous images are retained.

### First Attempt: Superseded

The user confirms working keyboard and trackpad operation, superseding the
historical non-working status below. Physical UP currently moves RIGHT, DOWN
moves LEFT, LEFT moves DOWN, and RIGHT moves UP. The first RIGHT sensor node used
`rotate-90`, `x-invert`, and `y-invert`: the pinned sensor flag swaps axes, and
the initial two-inversion inference was falsified by physical testing.
No keymap or LEFT changes.

The separately packaged `artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-orientation.uf2`
passed the focused build and existing RIGHT trackpad/baseline validator.
SHA256: `707dee7c575a1f58052a20fd0f4a8a866a263da4d16e657465a45d60d6338dd6`.
All three flags are present in generated DTS. Flashed RIGHT on 2026-10-08 after
verifying its bootloader serial `820E0FAE437DFBDF` and the artifact checksum;
the same serial returned as ZMK at `/dev/ttyACM0`. LEFT was untouched.
Physical acceptance remains pending. Test matching directions for all four swipes, circles,
both-half typing, cold boot and LED-idle operation after a RIGHT-only flash.
The working power/pull-up UF2 remains available for rollback.

The explicit EP-cycle limitation remains. Historical recovery writes of
FEED_CFG1=`01` and FEED_CFG2=`41` would remove the new orientation; the new
flags produce `c1` for both registers. This is not automatic recovery.

## Status

Experimental, opt-in support for the RIGHT Cirque TM040040-2024-302 Pinnacle
module. The LEFT remains the central with nice!view and host HID output.
CI includes the matching `kairos44-left-trackpad-receiver` and
`kairos44-right-trackpad-i2c` images; four keyboard-only targets remain available
for rollback. Both halves typed with normal firmware per the user on
2026-10-03. The earlier left-sensor image was flashed but is obsolete for the
actual layout. The corrected pair compiles and passes local validation;
physical sensor operation is not working in the live diagnostic check below,
and corrected-pair flashing remains unverified.

The external [Pinnacle driver](https://github.com/petejohanson/cirque-input-module)
is pinned to `0de55f36bc720b5be3d8880dc856d4d78baf5214`; ZMK remains pinned to
`edf5c0814fd3ea202e43aad2d68fd32e882a518c`. It compiles with the existing
Zephyr 3.5 baseline. Some build files carry MIT identifiers, but the pinned
repository has no top-level licence and the driver sources lack explicit
licence headers. Full licensing remains unresolved; this is not a release or
redistribution clearance. No external source is vendored here.

## Hardware Gates

Disconnect USB and battery before inspecting or checking continuity.

The module is factory SPI. The supplied Pinnacle specification says its
470 kohm mode-select R1 must be absent for I2C. Confirm the actual module state;
the keyboard's 4.7 kohm R1/R2 are different components, in series with SDA/SCL,
not pull-ups. Verify suitable pull-ups and bus rise times rather than blindly
bypassing or adding resistors. Supply must meet the module's 2.5-3.6 V rating.

With reversed electrical ribbon pin order, the required mapping is:

| Signal     | Keyboard J2     | Module J1 | Controller                       |
| ---------- | --------------- | --------- | -------------------------------- |
| 3.3 V      | 1               | 12        | VCC                              |
| Ground     | 2               | 11        | GND                              |
| SDA        | 3               | 10        | D21 / P0.31, through keyboard R1 |
| SCL        | 4               | 9         | D20 / P0.29, through keyboard R2 |
| Data ready | 9, after rework | 4         | D0 / P0.08                       |

The approved rework is to **isolate J2 pad 7 from its controller-side DRDY
trace**, then connect J2 pad 9 to that controller-side DRDY net. Do not simply
bridge intact pads 7 and 9: that would tie module DR to module BTN2. Approval
did not establish completion. On 2026-10-05 the user confirmed the isolated
DRDY rework and continuity checks are complete, and subsequently reported
removing the module's mode-select R1. Powered I2C operation, supply and pull-up
measurements remain unverified; DR must reach P0.08 and not J2 pad 7.

The fitted Hirose FH12-12S-0.5SH(55) socket and ribbon orientation require
assembled continuity checks for all five signals and no supply short.
Molex 15166-0119/0121 have same-side contacts; 0120/0122 have opposite-side
contacts. Those classifications alone do not establish numbered-pin mapping.
Do not power an unverified assembly.

## Live Diagnostics (2026-10-05)

Both halves were visible over USB. The serial-only ZMK endpoint
`/dev/ttyACM0` exposed the `trackpad>` shell. Read-only checks returned:

```text
device list: i2c@40004000 (READY), trackpad@2a (DISABLED)
i2c scan i2c@40004000: 0 devices found
i2c read i2c@40004000 0x2a 0xa0 2: Failed to read from device: 0x2a
gpio get gpio@50000000 31: Value 0
gpio get gpio@50000000 29: Value 0
```

These are fresh runtime results, not the earlier saved captures. They show
that the running diagnostic firmware has not initialized the sensor and cannot
communicate with it on this bus. GPIO readings are not voltage measurements
and do not establish a short or missing pull-ups. The exact installed image
and the left receiver configuration have not been identified.

The next discriminating check is module VCC-to-GND voltage (2.5-3.6 V) and
idle SDA/SCL voltages at both the controller and module sides of the keyboard's
series R1/R2. Confirm the installed firmware's bus pins against the actual
wiring if those measurements are healthy. Disconnect USB and battery before
resistance/continuity checks or ribbon changes, and power-cycle after any
electrical or mode-select change before repeating initialization checks.
No firmware was flashed, Bluetooth bonds cleared, GPIOs driven, or hardware
modified during this diagnostic session.

## Switched Supply Finding (2026-10-06)

The user measured 3.285 V at the trackpad connector after activating `EP_ON`.
LED idle shutoff then reduced the supply to 0 V; pressing a key did not restore
it, but another `EP_ON` did. Pointer movement remained absent. This confirms
that the sensor supply is switched and was not continuously powered during
testing; it does not establish that the sensor itself is faulty.

ZMK's RGB underglow OFF path disables external power when
`CONFIG_ZMK_RGB_UNDERGLOW_EXT_POWER=y`. Its wake path restores the previous
logical RGB state, whereas `EP_ON` changes external power directly. The
right-trackpad shield now sets `CONFIG_ZMK_RGB_UNDERGLOW_EXT_POWER=n` so RGB
blanking no longer cuts the shared sensor supply. RGB idle blanking remains
enabled; keyboard-only and left-side builds are unchanged. Explicit `EP_OFF`
can still remove sensor power, and saved external-power state is preserved.

In the current keymap, hold the rightmost right thumb key (Up/UTILS) and tap
the base-position Y or T key to activate `EP_ON`. Do not tap U or R on this
layer: those select `EP_OFF`. The compiled settings-save debounce is 60000 ms;
wait at least 70 seconds after enabling power before restarting.
Restoring power alone does not retry a failed boot-time sensor initialization.

The corrected normal and USB-shell diagnostic builds are packaged separately
under `artifacts/kairos44-right-trackpad-i2c/` and
`artifacts/kairos44-right-trackpad-debug/`, with `-power-fix.uf2` filenames and
`SHA256SUMS-power-fix` checksums. Existing UF2 files remain rollback images.
Both corrected builds passed the right-sensor validator and keyboard baseline
comparison. The diagnostic power-fix image was checksum-verified and flashed
to the right controller (serial `820E0FAE437DFBDF`) on 2026-10-06. Its bootloader
volume disappeared and its ZMK USB serial endpoint returned. The recreated
`/dev/ttyACM0` initially denied access. After the user restored its ACL, fresh
shell checks showed `trackpad@2a (DISABLED)` and a failed identity read at
`0x2a`. GPIO P0.13 (external-power enable), P0.31 (SDA), and P0.29 (SCL) each
read 0. These digital readings alone do not establish supply voltage or the
saved external-power state. Enable `EP_ON`,
verify sustained module supply, and save the ON state before restarting and
rechecking initialization. The normal power-fix image remains unflashed.
No left-side image or Bluetooth settings were changed.

After the user activated `EP_ON`, fresh checks returned SDA=1, SCL=1, and
`i2c read i2c@40004000 0x2a 0xa0 2` successfully returned `03 7f`.
This establishes I2C communication with the sensor after enabling power.
P0.13 still read 0 despite the successful transaction, so its shell input
reading must not be used as proof that VCC is off.

The user subsequently confirmed USB-only operation with no battery attached.
After unplugging USB for 15-20 seconds and reconnecting, the LEDs lit and later
blanked, while connector VCC remained 3.285 V. This verifies the power fix
through a cold boot and RGB idle blanking. Fresh shell checks after that boot
still returned `trackpad@2a (DISABLED)` and a failed identity read at `0x2a`,
although SDA and SCL both read 1. Serial access remained available.

Stable connector supply does not yet establish reliable sensor communication
or successful initialization. The user measured the following idle voltages
relative to GND after that boot:

| Net | Voltage |
| --- | ------- |
| TP-SDA | 2.21 V |
| TP-SCL | 2.3 V |
| SDA | 2.3 V |
| SCL | 2.2 V |

Both sides are below the measured 3.285 V supply. These DC measurements do not
establish valid I2C timing or prove missing pull-ups. The right I2C pinctrl does
not configure internal pull-ups; PCB R1/R2 are series resistors. Check existing
pull-up paths with power disconnected before adding resistors or attributing
the failure to startup timing. Use the matching Pinnacle specification
`TM040040_SPI-I2C-PINNTrackpad_SPEC1-2.pdf`, not the separate Gen6s HTML document
with its different interface requirements. Sensor operation and the installed
left receiver remain separate acceptance gates; no left image or bonds have
been changed.

With USB disconnected and readings allowed to stabilize, the user measured
SDA-to-VCC 7.3 Mohm, TP-SDA-to-VCC 7.22 Mohm, and both SCL-to-VCC and
TP-SCL-to-VCC 6.95 Mohm. These in-circuit readings support, but do not
conclusively prove, the absence of effective pull-ups to VCC.

On 2026-10-07 both halves were reconnected over USB, with connector VCC still
3.285 V. The right serial endpoint was identified by serial
`820E0FAE437DFBDF`. Live P0.31/P0.29 PIN_CNF values were both `0x600`, confirming
disabled pull-ups. The initial read at `0xa0` returned `03 7f` on this boot.
A temporary diagnostic changed only the PULL fields to enabled pull-ups:
P0.31 register `0x5000077c` and P0.29 register `0x50000774` were changed to
`0x60c`, with both readbacks verified. Open-drain drive settings were preserved.
The subsequent read returned `07 3a`, but `trackpad@2a` remained DISABLED.
The read command matches the driver's I2C register encoding; changing identity
bytes are not proof of reliable communication or successful initialization.
Temporary pull-ups were left enabled for voltage measurements and clear on
reboot; no firmware, left-side settings, or bonds were changed by this test.

With those temporary pull-ups active, the user measured SDA and SCL at
3.297 V, and TP-SDA and TP-SCL at 3.295 V, all relative to GND. Both sides
of both series resistors now have idle levels near 3.3 V. A subsequent
serial check confirmed both PIN_CNF values remained `0x60c`; six consecutive
reads at `0xa0` returned `07 3a`. The device remained DISABLED. These results
establish repeatability in this short test, not waveform quality or successful
sensor initialization. Runtime pull-up changes do not retry failed boot init.

The right sensor overlay now enables `bias-pull-up` in the default I2C pin
group; the low-power sleep group is unchanged. The diagnostic build completed,
its generated devicetree contains the pull-ups, and the right sensor validator
passed against the keyboard-only baseline. The separate artifact
`artifacts/kairos44-right-trackpad-debug/kairos44-right-trackpad-debug-power-pullups.uf2`
matches the build output, with its checksum recorded in `SHA256SUMS-power-pullups`.
On 2026-10-07 this image was checksum-verified and flashed to the RIGHT
bootloader, whose USB serial matched `820E0FAE437DFBDF`. The copy completed
and the expected ZMK runtime endpoint returned at `/dev/ttyACM0`. Serial
access then failed with PermissionError after USB re-enumeration; boot-time
readiness, input events, and left receiver operation remain unverified.
Existing UF2 images are preserved; the left half and bonds were not changed.

After serial access was restored, `trackpad@2a` reported READY. Both SDA/SCL
PIN_CNF registers read `0x60c` without runtime writes, and the identity read
returned `07 3a`. DRDY sampled 0 at rest. The current diagnostic image lists
no logging backends, so no touch-event log capture was obtained.

On 2026-10-07 the user reported that the trackpad is working with the
right-side power-and-pull-up diagnostic image. This is the first user-confirmed
functional result after boot-time pull-ups were enabled. The left half was
not flashed during this diagnostic sequence; its installed firmware provenance
remains unknown. Preserve the working pair rather than flashing the left
solely because its image identity has not been established.

The confirmed fixes are disabling RGB control of the shared external-power
rail and enabling default-state I2C pull-ups. The right still runs diagnostic
firmware. The user then confirmed typing works on both halves. After the LEDs
timed out, finger movement on the touchpad moved the host pointer and brought
the LEDs back on. Typing, pointer operation after LED idle blanking, and LED
wake on touch therefore pass this user-observed test. The user then disconnected
both USB-powered halves for nearly one minute. After reconnecting, the touchpad
worked immediately and continued working through LED timeout and touch wake.
USB-only cold-boot acceptance therefore also passes for this diagnostic image.

Explicit external-power cycling remains an unresolved recovery issue. The user
reported that EP_OFF turned the LEDs off and EP_ON restored them, but the
touchpad stopped working until both halves were unplugged and reconnected.
This differs from automatic RGB idle blanking, which now leaves the sensor rail
powered. The pinned external-power driver only switches the rail and saves its
state; it does not notify the Pinnacle driver. Pinnacle configures the sensor at
boot, while its PM resume handler only re-enables the DRDY interrupt. Loss of
sensor configuration across rail removal is therefore a local hypothesis,
not yet confirmed by before/after register reads. Avoid EP_OFF for now; use RGB
controls to blank LEDs without removing sensor power. Sensor recovery after
EP_OFF/EP_ON and any final non-debug image remain acceptance checks. No recovery
firmware change or additional flash has been made.

After serial access was restored, a user-confirmed nonworking state still
reported `trackpad@2a` READY and identity `07 3a`. Read-only shell captures
showed system/feed registers `00 00 00`; individual reads confirmed both feed
registers were zero. Z-idle was `1e`, sleep interval `49`, and DRDY sampled 1.
The exact power-command sequence preceding this capture was not established.

The user then unplugged and reconnected both halves, confirmed pointer movement
and LEDs, and restored serial access again. The same read-only commands returned
identity `07 3a`, system/feed registers `00 01 41`, Z-idle `05`, sleep interval
`ff`, and DRDY 0. Individual reads confirmed feed configuration 1 = `01`
(reporting enabled) and feed configuration 2 = `41`, matching boot setup.
Thus the nonworking capture lacked the boot-programmed settings despite READY
status and successful I2C communication. A controlled EP_OFF/EP_ON comparison
from this known-working baseline remains the next diagnostic step. No sensor
registers were written during either capture.

The controlled test then reproduced failure: the user pressed EP_OFF, waited
about five seconds, pressed EP_ON, and reported no pointing while USB remained
connected. Readback still showed READY and identity `07 3a`, but system/feed
registers had changed from `00 01 41` to `00 00 00`, Z-idle from `05` to `1e`,
and sleep interval from `ff` to `49`; DRDY was 1. This establishes loss of the
boot-programmed register configuration across explicit rail cycling.

A temporary runtime recovery probe restored only the captured Z-idle `05`,
sleep interval `ff`, feed configuration 2 `41`, cleared status with `00`, and
enabled feed configuration 1 with `01` last. All writes completed; immediate
readback matched `00 01 41`, `05`, and `ff`, and DRDY sampled 0. Host pointer
recovery was then confirmed by the user: the LEDs came on and the trackpad
worked without a USB reboot. Restoring these registers therefore recovered
pointing in this controlled test. This probe is not full reinitialization:
it does not repeat calibration or extended-register tuning. No firmware was
flashed, and the restored volatile settings will not survive another rail
cycle without a recovery implementation.

## Firmware And Build

For testing, flash `kairos44-left-trackpad-receiver.uf2` on the LEFT and
`kairos44-right-trackpad-i2c.uf2` on the RIGHT. Both halves need updated images;
keyboard-only images do not provide this split-input path. The obsolete
`kairos44-left-trackpad-i2c` target assumed the wrong sensor location and has
been removed from both CI matrices. GitLab validates both new roles and records
`trackpad_role=receiver` or `trackpad_role=sensor` in build metadata.

Select `kairos44_left nice_view kairos44_trackpad_receiver` on the left and
`kairos44_right kairos44_trackpad` on the right. These add-ons are for the
44-key model only. The right sensor add-on enables I2C1/TWIM1 at 100 kHz,
sensor address `0x2a`,
and active-high DRDY. The default address is corroborated by
[QMK's Pinnacle register definitions](https://github.com/qmk/qmk_firmware/blob/master/drivers/sensors/cirque_pinnacle_regdefs.h),
but the installed module must still be checked.

On the right, I2C0, SPI0 and SPI1 stay disabled; RGB retains SPI3. On the left,
the display retains SPI0 and RGB retains SPI3, without a sensor driver.
Matching `zmk,input-split` channel 0 nodes forward right sensor events over
split BLE to the left proxy and input listener. The left delivers mouse HID
through its selected host output. Connecting the right USB alone does not
provide normal host mouse output. No keymap changes, sensor sleep integration
or smooth scrolling are enabled.

In a west workspace initialized from this repository's current manifest,
run `west update` to fetch the pinned module, then inside the pinned build
container run (substitute the repository path for `/config`):

```sh
west build -s zmk/app -d build-kairos44-left-trackpad-receiver -b nice_nano_v2 -- \
  -DZephyr_DIR="${ZEPHYR_BASE}/share/zephyr-package/cmake" \
  -DZMK_CONFIG=/config/config -DZMK_EXTRA_MODULES=/config \
  '-DSHIELD=kairos44_left nice_view kairos44_trackpad_receiver'
python3 /config/scripts/validate_firmware.py build-kairos44-left-trackpad-receiver \
  --keys 44 --side left --trackpad
west build -s zmk/app -d build-kairos44-right-trackpad-i2c -b nice_nano_v2 -- \
  -DZephyr_DIR="${ZEPHYR_BASE}/share/zephyr-package/cmake" \
  -DZMK_CONFIG=/config/config -DZMK_EXTRA_MODULES=/config \
  '-DSHIELD=kairos44_right kairos44_trackpad'
python3 /config/scripts/validate_firmware.py build-kairos44-right-trackpad-i2c \
  --keys 44 --side right --trackpad
```

The repeatable Docker regression gate from the repository root is:

```sh
sh scripts/verify-local.sh /path/to/west-workspace --trackpad
```

The workspace must contain the pinned `cirque-input-module` checkout, Zephyr,
ZMK and dependencies. Both `app/` and `zmk/app/` workspace layouts are supported.
This builds and validates the four normal targets and both trackpad targets,
compares each trackpad image against its keyboard-only side, and runs the native
fixture. It does not flash hardware. CI publishes the paired artifacts after these
changes are committed and pushed; no remote pipeline was started locally.

## Features And Acceptance

- Relative pointer movement and sensor button events are implemented.
- Sensor taps and secondary taps are left enabled; exact gestures need testing.
- Keyboard-assisted drag uses NAVIGATION V held for left click while moving
  on the pad. C and X are middle and right click. Avoid the existing V+B
  text-macro chord; hold B for precision before pressing V for dragging.
- Existing keyboard wheel controls remain available. NAV Z hold enables
  one-finger pad scrolling; Z tap remains sticky Alt. B taps cycle speed and
  B hold temporarily selects Precision. Ordinary NAV motion remains pointer
  movement unless Z is held, preserving dragging.
- Two-finger scroll, pinch, multitouch swipes and native edge/circular wheel
  events are not provided by this driver. Gesture-only tap-drag is unverified.

The driver contains unbounded calibration/register-access waits and incomplete
error handling. A malformed or unreliable bus can prevent initialization;
disconnected/faulty-device behavior has not been tested. Keep the normal UF2
available for rollback and do not treat compilation as fault-tolerance proof.

After the hardware gates pass and both corrected images are flashed, establish
the left host connection via BLE or left USB and test right-pad movement,
lift/re-touch, taps, drag/release and both-half typing. Then check display/RGB
coexistence, BLE battery operation, reconnect and sleep/wake. Record actual
results before calling this working trackpad support. Try normal reconnect
before considering any settings reset or bond clearing; neither was performed
for this location correction.
