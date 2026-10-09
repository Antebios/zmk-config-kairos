#!/bin/sh
set -eu

if [ "$#" -lt 1 ] || [ "$#" -gt 3 ]; then
    printf 'Usage: sh scripts/verify-local.sh <initialized-west-workspace> [original-config-snapshot] [--trackpad]\n' >&2
    exit 1
fi

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
workspace=$(realpath "$1")
shift
baseline=
trackpad=false
if [ "$#" -gt 0 ] && [ "$1" != --trackpad ]; then
    baseline=$(realpath "$1")
    shift
fi
if [ "$#" -gt 0 ]; then
    [ "$#" -eq 1 ] && [ "$1" = --trackpad ] || exit 1
    trackpad=true
fi
image=zmkfirmware/zmk-build-arm@sha256:edb1c953438c6f720ddb79c3762f3972013b7fbbaf4fff3592fc869983e7afc5
app=app
if [ -d "$workspace/zmk/app" ]; then
    app=zmk/app
fi
modules=/config
if [ -d "$workspace/cirque-input-module" ]; then
    revision=$(git -C "$workspace/cirque-input-module" rev-parse HEAD)
    [ "$revision" = 0de55f36bc720b5be3d8880dc856d4d78baf5214 ] || exit 1
    modules="$modules;/work/zmk/cirque-input-module"
elif [ "$trackpad" = true ]; then
    printf 'Fetch the pinned cirque-input-module into the west workspace first.\n' >&2
    exit 1
fi

docker run --rm -v "$workspace:/work/zmk" -v "$root:/config:ro" "$image" \
    gcc -std=c11 -Wall -Wextra -Werror /config/tests/kairos-display/status_test.c \
    -o /work/zmk/kairos44-display-status-test
docker run --rm -v "$workspace:/work/zmk" "$image" /work/zmk/kairos44-display-status-test

build() {
    docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
        -v "$workspace:/work/zmk" -v "$1:/config:ro" -w /work/zmk "$image" \
        west build -s "$app" -d "$2" -b nice_nano_v2 -- \
        -DZephyr_DIR=/work/zmk/zephyr/share/zephyr-package/cmake \
        -DZMK_CONFIG=/config/config "-DZMK_EXTRA_MODULES=$modules" "-DSHIELD=$3"
}

if [ -n "$baseline" ]; then
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

if [ "$trackpad" = true ]; then
    for side in left right; do
        if [ "$side" = left ]; then
            shield="kairos44_left nice_view kairos44_trackpad_receiver"
        else
            shield="kairos44_right kairos44_trackpad"
        fi
        build_dir="build-kairos44-$side-trackpad-verified"
        build "$root" "$build_dir" "$shield"
        docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
            -v "$workspace:/work/zmk" -v "$root:/config:ro" "$image" \
            python3 /config/scripts/validate_firmware.py \
            "/work/zmk/$build_dir" --keys 44 --side "$side" --trackpad \
            --baseline "/work/zmk/build-kairos44-$side"
    done
fi

docker run --rm -e ZEPHYR_BASE=/work/zmk/zephyr \
    -e Zephyr_DIR=/work/zmk/zephyr/share/zephyr-package/cmake \
    -e ZMK_BUILD_DIR=/work/zmk/build-kairos-native \
    -v "$workspace:/work/zmk" -v "$root:/config:ro" -w "/work/zmk/$app" "$image" \
    ./run-test.sh /config/tests/kairos-behaviors