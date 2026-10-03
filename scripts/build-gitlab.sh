#!/bin/sh
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
: "${ARTIFACT_NAME:?Set ARTIFACT_NAME to a firmware target from build.yaml}"
: "${ZMK_BUILD_IMAGE:?Set ZMK_BUILD_IMAGE to the build container reference}"

case "$ARTIFACT_NAME" in
    kairos42-left) keys=42; side=left ;;
    kairos42-right) keys=42; side=right ;;
    kairos44-left-keyboard-only) keys=44; side=left ;;
    kairos44-right-keyboard-only) keys=44; side=right ;;
    *) printf 'Unsupported firmware target: %s\n' "$ARTIFACT_NAME" >&2; exit 1 ;;
esac

shield=$(python3 -c '
import sys, yaml
with open(sys.argv[1]) as source:
    targets = yaml.safe_load(source)["include"]
matches = [target for target in targets if target["artifact-name"] == sys.argv[2]]
assert len(matches) == 1, "Target must appear exactly once in build.yaml"
target = matches[0]
assert target["board"] == "nice_nano_v2", "Unsupported board"
assert set(target) == {"board", "shield", "artifact-name"}, "Unsupported build options"
print(target["shield"])
' "$root/build.yaml" "$ARTIFACT_NAME")

workspace=$(mktemp -d "${TMPDIR:-/tmp}/kairos-ci.XXXXXXXX")
trap 'rm -rf "$workspace"' EXIT
trap 'exit 1' HUP INT TERM
mkdir "$workspace/config"
cp "$root/config/west.yml" "$workspace/config/west.yml"
cd "$workspace"
west init -l config
west update
export ZEPHYR_BASE="$workspace/zephyr"
west zephyr-export

west build -s "$workspace/zmk/app" -d "$workspace/build" -b nice_nano_v2 -- \
    "-DZMK_CONFIG=$root/config" "-DZMK_EXTRA_MODULES=$root" "-DSHIELD=$shield"
python3 "$root/scripts/validate_firmware.py" "$workspace/build" --keys "$keys" --side "$side"

output="$root/artifacts/$ARTIFACT_NAME"
mkdir -p "$output"
cp "$workspace/build/zephyr/zmk.uf2" "$output/$ARTIFACT_NAME.uf2"
west manifest --freeze --active-only > "$output/west-manifest.yml"
commit=${CI_COMMIT_SHA:-$(git -C "$root" rev-parse HEAD)}
{
    printf 'config_commit=%s\n' "$commit"
    printf 'target=%s\nboard=nice_nano_v2\nshield=%s\nkeys=%s\nside=%s\n' "$ARTIFACT_NAME" "$shield" "$keys" "$side"
    printf 'build_image=%s\n' "$ZMK_BUILD_IMAGE"
    printf 'built_at_utc=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    printf 'pipeline_url=%s\njob_url=%s\n' "${CI_PIPELINE_URL:-local}" "${CI_JOB_URL:-local}"
    west --version
} > "$output/build-info.txt"
cd "$output"
sha256sum "$ARTIFACT_NAME.uf2" west-manifest.yml build-info.txt > SHA256SUMS
sha256sum -c SHA256SUMS