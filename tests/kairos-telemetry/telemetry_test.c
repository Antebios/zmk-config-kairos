#include <assert.h>
#include <stdio.h>

#include "../../src/telemetry/kairos44_telemetry.h"

static void expect_report(const struct kairos44_status *state, uint8_t sequence,
                          const uint8_t expected[KAIROS44_TELEMETRY_REPORT_SIZE]) {
    uint8_t actual[KAIROS44_TELEMETRY_REPORT_SIZE];
    kairos44_telemetry_encode(state, sequence, actual);
    if (memcmp(actual, expected, sizeof(actual)) != 0) {
        for (int index = 0; index < KAIROS44_TELEMETRY_REPORT_SIZE; index++) {
            fprintf(stderr, "%02x/%02x ", actual[index], expected[index]);
        }
        fprintf(stderr, "\n");
        assert(!"report differs from the golden bytes");
    }
}

int main(void) {
    // These golden bytes are also listed in docs/kairos44-host-telemetry.md for the host parser.
    struct kairos44_status state = {
        .layers = (1u << 0) | (1u << 1),
        .modifiers = 0x02,
        .locks = 0x02,
        .locks_valid = true,
        .usb_output = true,
        .profile = 1,
    };
    const uint8_t first[] = {0x4b, 0x01, 0x01, 0x07, 0x03, 0x00, 0x00, 0x00,
                             0x01, 0x02, 0x82, 0x01, 0x01, 0x00, 0x00, 0x00};
    expect_report(&state, 7, first);

    // The highest layer on a trackpad build is a pointer layer, above the keyboard layers.
    struct kairos44_status pointer = {.layers = (1u << 0) | (1u << POINTER_COMBOS), .profile = 2,
                                      .profile_connected = true};
    const uint8_t second[] = {0x4b, 0x01, 0x01, 0xff, 0x01, 0x00, 0x20, 0x00,
                              0x15, 0x00, 0x00, 0x02, 0x02, 0x00, 0x00, 0x00};
    expect_report(&pointer, 255, second);

    // Locks the host has not reported are marked invalid, not shown as off.
    struct kairos44_status unknown_locks = {.layers = 1};
    uint8_t report[KAIROS44_TELEMETRY_REPORT_SIZE];
    kairos44_telemetry_encode(&unknown_locks, 0, report);
    assert((report[10] & KAIROS44_TELEMETRY_LOCKS_VALID) == 0);
    kairos44_status_locks(&unknown_locks, 0x07);
    kairos44_telemetry_encode(&unknown_locks, 0, report);
    assert(report[10] == (0x07 | KAIROS44_TELEMETRY_LOCKS_VALID));

    // Reserved bytes stay zero so a later version can use them.
    for (int index = 13; index < KAIROS44_TELEMETRY_REPORT_SIZE; index++) {
        assert(report[index] == 0);
    }

    assert(kairos44_telemetry_highest_layer(0) == KAIROS44_TELEMETRY_NO_LAYER);
    assert(kairos44_telemetry_highest_layer(1) == 0);
    assert(kairos44_telemetry_highest_layer(0x80000000u) == 31);

    assert(kairos44_telemetry_key_modifiers(0, 0, true, 0x04) == 0);
    assert(kairos44_telemetry_key_modifiers(0x02, 0x01, true, 0x04) == 0x03);
    assert(kairos44_telemetry_key_modifiers(0, 0, true, 0xE1) == 0x02);
    assert(kairos44_telemetry_key_modifiers(0, 0, true, 0xE7) == 0x80);
    assert(kairos44_telemetry_key_modifiers(0, 0, false, 0xE1) == 0);
    assert(kairos44_telemetry_key_modifiers(0, 0, true, 0xE8) == 0);

    const uint8_t request[] = {0x4b, 0x01, 0x01, 0x00, 0x00};
    assert(kairos44_telemetry_is_snapshot_request(request, sizeof(request)));
    assert(kairos44_telemetry_is_snapshot_request(request, 3));
    assert(!kairos44_telemetry_is_snapshot_request(request, 2));
    const uint8_t wrong_magic[] = {0x4c, 0x01, 0x01};
    const uint8_t wrong_version[] = {0x4b, 0x02, 0x01};
    const uint8_t wrong_type[] = {0x4b, 0x01, 0x02};
    assert(!kairos44_telemetry_is_snapshot_request(wrong_magic, sizeof(wrong_magic)));
    assert(!kairos44_telemetry_is_snapshot_request(wrong_version, sizeof(wrong_version)));
    assert(!kairos44_telemetry_is_snapshot_request(wrong_type, sizeof(wrong_type)));

    puts("PASS: kairos44-telemetry");
    return 0;
}
