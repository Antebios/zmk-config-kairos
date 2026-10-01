# Using This Repository

This is a **ZMK configuration and custom-shield repository**, not the upstream
ZMK firmware source. Edit keyboard configuration here; build against the pinned
upstream checkout in a separate west workspace. All commands below assume the
current directory is the root of this configuration repository unless stated.

For keyboard operation and flashing, use [the user guide](../README.md). To
restore the current uncommitted work on another computer, follow
[the session handoff](session-handoff.md) before these instructions. A plain
remote clone cannot restore any uncommitted or unpublished checkpoint files;
check the current Git state before choosing a transfer method.

## Find The Right File

| Path | Purpose / when to edit |
| --- | --- |
| [build.yaml](../build.yaml) | Model/side build matrix and artifact names |
| [config/west.yml](../config/west.yml) | Pinned upstream ZMK version and imported dependencies |
| [Build workflow](../.github/workflows/build.yml) | GitHub Actions reusable workflow, pinned to the same ZMK commit |
| [zephyr/module.yml](../zephyr/module.yml) | Exposes this repository as a module with a custom board/shield root |
| [Legacy keymap wrapper](../boards/shields/kairos/kairos.keymap) | Selects the common keymap with no extra keys |
| [44-key wrapper](../boards/shields/kairos44/kairos44.keymap) | Adds Enter/Space and transparent extra-key expansions |
| [Common keymap](../boards/shields/common/kairos/keymap.keymap) | Includes shared helpers, behaviors, combos and ordered layers |
| [Named positions](../boards/shields/common/kairos/positions.keymap) | Physical switch IDs used by combos |
| [BASE bindings](../boards/shields/common/kairos/keymaps/0.base.keymap) | Ordinary typing keys and thumb bindings |
| [Layer IDs](../boards/shields/common/kairos/helpers/layers.keymap) | Stable numeric layer constants |
| [Behavior access macros](../boards/shields/common/kairos/helpers/macros_include.keymap) | HRM expansion and thumb/Shift/semicolon aliases |
| [Timing constants](../boards/shields/common/kairos/helpers/timings.keymap) | Independent HRM, Space and semicolon hold-tap timing |
| [Behavior definitions](../boards/shields/common/kairos/helpers/tap_dance.keymap) | Hold-tap and tap-dance behavior nodes |
| [Combo definitions](../boards/shields/common/kairos/helpers/combos.keymap) | Shortcut bindings, named positions and layer filters |
| [Combo helpers](../boards/shields/common/kairos/helpers/combos_include.keymap) | Combo declaration macros and shared timeout |
| [Macro definitions](../boards/shields/common/kairos/helpers/macros.keymap) | Ordered key sequences and existing application shortcuts |
| [42-key config](../config/kairos.conf) / [44-key config](../config/kairos44.conf) | Model-wide Kconfig feature settings |
| [Verification helper](../scripts/verify-local.sh) | Four-target build, generated-firmware checks and native test |
| [Generated-firmware validator](../scripts/validate_firmware.py) | Compiled matrix/layer/behavior contracts and original-baseline comparison |
| [Native fixture](../tests/kairos-behaviors/native_posix_64.keymap) | Focused behavior events, using the real shared definitions |

Layer binding files 0-6 are under `boards/shields/common/kairos/keymaps/`.
Hardware definitions live separately under `boards/shields/kairos/` and
`boards/shields/kairos44/`: Kconfig selects sides/central role, `.dtsi` files
define matrix/layout/buses, side `.overlay` files define pin order/display
ownership, side `.conf` files select side-specific features, and `.zmk.yml`
provides metadata. Legacy helper files that remain in the old shield directory
are not the shared entry point; follow actual `#include` paths before editing.

Do not edit generated `zephyr.dts`, `.config`, headers or UF2s in build folders.
They are inspection/output artifacts and will be regenerated.

## Change Keys And Layers

1. Locate the relevant common layer file and physical position. Shared changes
   affect **both models**; model-specific additions belong in the model wrapper
   or hardware configuration, not a copied fork of the entire shared keymap.
2. Replace the intended binding without inserting/removing entries accidentally.
   Positions 0-35 are three rows, each left six then right six. Positions 36-41
   are the original thumbs. Preserve `KAIROS_EXTRA_BASE` or `KAIROS_EXTRA_KEYS`
   at the end so each wrapper expands the layer to 42 or 44 bindings.
3. Preserve layer order/IDs: BASE=0, NAVIGATION=1, FUNCTIONS=2, SYMBOL_KP=3,
   UTILS=4, MIRROR=5, COMBOS=6. Append any approved new layer rather than
   renumbering existing layers; update all affected validation and recovery.
4. Update the binding table in the README and add focused tests for behavior
   changes. Verify all four builds, since shared edits can affect either side.

Common ZMK binding forms (illustrations, not edits to apply automatically):

```dts
&kp ESC
&mo NAVIGATION
&sl FUNCTIONS
&to BASE
&trans
&none
&ht LSHIFT D
```

`&kp` emits a key; `&mo` activates a layer while held; `&sl` is a sticky layer;
`&to` switches to a persistent layer selection. `&trans` falls through to lower
layers, whereas `&none` blocks the position. The custom `&ht` uses its first
parameter on hold and its second on tap. Use keycodes/behavior documentation
for the **pinned release**, not assumptions from current upstream main.

Keep BASE recovery available: Lower + Raise + original left Space. Do not
replace it with the new right Space. Avoid same-target sticky/locked actions
selected while holding that target's momentary key; release clears the layer
bit in this release. The existing cross-layer repair is explained in the log.

## Change Combos, Macros And Timing

For a combo, use named physical positions from the common position file, not
newly counted indices based on how the mirrored layer looks. `COMBO` declares
a name, behavior, positions and layer filter; `COMBO_ALL` currently covers the
seven existing layers. The helpers supply the existing 50 ms timeout.
Check that positions are unique/in range and that identical chords do not
share active layers. Escape/Delete intentionally exclude COMBOS because that
layer assigns different actions to the same chords.

For key-sequence macros, change the actual nodes in the common macro definitions.
The similarly named behavior-access helper instead supplies C preprocessor
aliases such as `tdLower()`; that alias currently expands to direct `&mo`, not
an active old layer dance. Unused old layer-dance nodes remain in the behavior
file. Their presence alone does not mean they are bound by a keyboard.

Tune HRMs through the timing constants, not by globally replacing every
`tapping-term-ms`. Preserve independently tuned Space and punctuation/Shift
behavior unless changing them deliberately. Record the old/new values, the
reason, native results and physical typing results. A native pass is not proof
of full-keyboard combo latency or real BLE typing ergonomics.

## Build And Test Locally

First create the initialized upstream workspace and original snapshot using
[the reconstruction instructions](session-handoff.md). No host west/ARM compiler
is required for the Docker workflow. In the following examples the workspace is
`$HOME/kairos-build/zmk` and the original snapshot is
`$HOME/kairos-build/original-config`; substitute your initialized absolute paths.

Run the required full gate after shared changes:

```sh
sh scripts/verify-local.sh "$HOME/kairos-build/zmk" "$HOME/kairos-build/original-config"
```

Without the optional second argument it still builds all four targets and runs
the firmware/native checks, but does not compare against the untouched baseline.
The original snapshot must be reconstructed from the recorded original commit,
not an archive of a later modified HEAD.

For a quick single-target build while iterating, this example selects 44 left:

```sh
docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
  -v "$HOME/kairos-build/zmk:/work/zmk" -v "$PWD:/config:ro" \
  -w /work/zmk zmkfirmware/zmk-build-arm:stable \
  west build -s app -d build-kairos44-left -b nice_nano_v2 -- \
  -DZMK_CONFIG=/config/config -DZMK_EXTRA_MODULES=/config \
  '-DSHIELD=kairos44_left nice_view'
```

Use the README's shield matrix for other targets and a separate build directory
for every model/side. Keep `nice_view` on both legacy halves and only new left.
`ZMK_CONFIG` selects the repository's configuration; `ZMK_EXTRA_MODULES` exposes
its custom shields. If reusing an incompatible build directory, use a fresh one
or deliberately add west's `-p always` option to regenerate it. Do not remove
unrelated work or alter the configuration to hide a stale-build problem.

Run only the native behavior fixture while editing behavior tests:

```sh
docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
  -e ZMK_BUILD_DIR=/work/zmk/build-kairos-native \
  -v "$HOME/kairos-build/zmk:/work/zmk" -v "$PWD:/config:ro" \
  -w /work/zmk/app zmkfirmware/zmk-build-arm:stable \
  ./run-test.sh /config/tests/kairos-behaviors
```

Write expected events in [the snapshot](../tests/kairos-behaviors/keycode_events.snapshot)
before running a new regression. Do not enable automatic snapshot acceptance to
make a failure disappear. Inspect the actual event log and determine whether
the behavior or expectation is wrong. The reduced native matrix does not test
the full combo engine or physical devices.

The validator intentionally rejects changes to preserved original bindings,
macros, combo positions/actions and timing contracts. An approved deliberate
change may require updating its specific expectations and relevant native
fixture; document the changed contract, keep unaffected comparisons, and do
not simply disable preservation checks to get a pass.

## Outputs And Troubleshooting

| Output | Location under the upstream workspace |
| --- | --- |
| 42 left/right UF2 | `build-shared-left/right/zephyr/zmk.uf2` |
| 44 left/right UF2 | `build-kairos44-left/right/zephyr/zmk.uf2` |
| Compiled Devicetree and Kconfig | Each build's `zephyr/zephyr.dts` and `zephyr/.config` |
| Native full/filtered events | `build-kairos-native/tests/kairos-behaviors/keycode_events_full.log` and `keycode_events.log` |

For GitHub builds, use **Actions -> Build ZMK firmware**, select the appropriate
branch/run, inspect each matrix job and download its named firmware artifacts.
Triggers are push, pull request and manual workflow dispatch. Workflow success
does not establish physical acceptance; do not assume the local custom validator
or native fixture ran unless that workflow explicitly invokes them. GitHub CI
has not been exercised as part of the recorded local implementation.

For a build failure, inspect the first meaningful Devicetree/Kconfig/compiler
error, verify the pinned revision, board/shield and module mount, and confirm
the intended source file is included. For a validator failure, use its assertion
and compiled DTS/config to check the relevant contract. Deprecated labels and
the recorded Nordic reboot-symbol warning are known; new warnings/errors should
not be dismissed as that existing noise.

The trackpad remains blocked. `CONFIG_ZMK_POINTING=y` supports existing keyboard
mouse behaviors; it does not enable or prove a Cirque device. Do not guess bus
pins, supply voltage, pull-ups or a compatible string to bypass hardware gates.

## Git And Development Records

Start a session by inspecting the existing worktree:

```sh
git status --short
git branch --show-current
git diff --stat
git diff
git ls-files --others --exclude-standard
```

`git diff` does not show new untracked file contents. Review those separately,
especially the common shield tree, tests, scripts and docs. Do not discard later
user edits, treat a remote clone as a full checkpoint, or run destructive reset
commands to make a worktree look clean. Pull/switch branches only after preserving
local changes. Commits, pushes and flashing are explicit user decisions.

Before an authorized commit, rerun the full gate and review the intended staged
changes with `git diff --cached` and whitespace checks. Stage reviewed paths
explicitly; do not sweep unrelated keyboard/CAD work into the commit. Publish
the intended branch only after review. Preserve untracked work with the handoff's
archive method when moving machines without a commit.

Keep the records synchronized with the code:

- [Development plan](kairos-development-plan.md): approved scope, dependencies
  and acceptance checklist; change scope only with approval.
- [Development log](development-log.md): dated changes, exact commands/revisions,
  actual pass/fail results and open issue closure evidence.
- [README](../README.md): user-visible bindings, target names and operation.
- [Session handoff](session-handoff.md): current checkpoint, transfer state,
  reproducible environment and next actions for a new session/computer.

Record software compilation separately from physical keyboard and trackpad
acceptance. Keep artifacts labeled keyboard-only until pointing genuinely works.
