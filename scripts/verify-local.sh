#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    printf 'Usage: sh scripts/verify-local.sh <initialized-west-workspace> [original-config-snapshot]\n' >&2
    exit 1
fi

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
workspace=$(realpath "$1")
image=zmkfirmware/zmk-build-arm:stable

build() {
    docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
        -v "$workspace:/work/zmk" -v "$1:/config:ro" -w /work/zmk "$image" \
        west build -s app -d "$2" -b nice_nano_v2 -- \
        -DZMK_CONFIG=/config/config -DZMK_EXTRA_MODULES=/config "-DSHIELD=$3"
}

baseline=${2:-}
if [ -n "$baseline" ]; then
    baseline=$(realpath "$baseline")
    for side in left right; do
        build "$baseline" "build-original-$side" "kairos_$side nice_view"
    done
fi

for model in 42 44; do
    for side in left right; do
        if [ "$model" = 42 ]; then
            shield="kairos_$side"
            build_dir="build-shared-$side"
        else
            shield="kairos44_$side"
            build_dir="build-kairos44-$side"
        fi
        if [ "$model" = 42 ] || [ "$side" = left ]; then
            shield="$shield nice_view"
        fi
        build "$root" "$build_dir" "$shield"
        set -- "/work/zmk/$build_dir" --keys "$model" --side "$side"
        if [ -n "$baseline" ]; then
            set -- "$@" --baseline "/work/zmk/build-original-$side"
        fi
        docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
            -v "$workspace:/work/zmk" -v "$root:/config:ro" "$image" \
            python3 /config/scripts/validate_firmware.py "$@"
    done
done

docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
    -e ZMK_BUILD_DIR=/work/zmk/build-kairos-native \
    -v "$workspace:/work/zmk" -v "$root:/config:ro" -w /work/zmk/app "$image" \
    ./run-test.sh /config/tests/kairos-behaviors