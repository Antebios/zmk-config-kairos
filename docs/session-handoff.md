# Session Handoff

Checkpoint: 2026-10-01. This document is the starting point for continuing on
another session or computer. It requires neither Copilot memory nor the original
chat transcript. Update it when the checkpoint, gates or repository state change.

## Read First

For day-to-day configuration edits and builds, use
[the repository guide](repository-guide.md).

1. [Development plan](kairos-development-plan.md): approved scope and exclusions.
2. [Development log](development-log.md): decisions, hardware map, dependency
   provenance, test evidence and open issue closure conditions.
3. [User guide](../README.md): targets, bindings, build/flash/pairing and acceptance.
4. This document: transfer, reconstruction and the next work sequence.

## Checkpoint And Boundaries

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

1. Check the restored Git state and this handoff against current files. Preserve
   later user edits; rerun builds/tests before claiming a current pass.
2. Perform safe controller/mounting checks and the user guide's physical keyboard
   acceptance on both models. Record results, not just source expectations.
3. Obtain the exact `TM040040-2024-302` specification and verify both ribbon ends,
   contacts, power/ground/DRDY and voltage requirements (HW-01). Purchased parts
   also include `FH12-12S-0.5SH(55)`, `CRCW04024K70FKED` and Molex `15166-0122`.
   The saved specification is an HTML wrapper, not verified PDF content.
4. Verify real pull-ups and series-resistor suitability (HW-02); the 4.7k R1/R2
   are series SDA/SCL resistors, not demonstrated pull-ups. Do not power-test
   speculative wiring or infer compatibility from the Cirque brand alone.
5. Establish a maintained, licensed driver for the exact protocol/revision
   (DRV-01), not a guessed `cirque,pinnacle` compatible string. If no supported
   driver exists, report the blocker and obtain approval before custom work.
6. Only after all pointing gates close, implement the planned right input device,
   split input ID 0, left listener/processors and an appended held-scroll layer.
   Preserve layer IDs 0-6 and combo positions. Test motion/tap/click/drag/scroll,
   typing concurrency, sleep/wake and reconnection, then update docs/artifact
   labels only when pointing actually works.

## Resume Prompt

> Read docs/session-handoff.md, docs/kairos-development-plan.md,
> docs/development-log.md and README.md in the Kairos ZMK configuration repository.
> Inspect the current worktree before editing and preserve later user changes.
> Resume from the documented checkpoint, rerun the reproducible verification gate,
> and work on the next open gate. Keep the 44-key targets keyboard-only until
> exact trackpad wiring, electrical compatibility and driver support are proven.
> Do not commit, push, flash, clear bonds or redesign hardware without approval.
