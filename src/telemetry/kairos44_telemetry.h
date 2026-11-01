#ifndef KAIROS44_TELEMETRY_H
#define KAIROS44_TELEMETRY_H

// Wire format of the USB report that tells a host which layer the keyboard is on.
// Specified in docs/kairos44-host-telemetry.md; keep the two in step.

#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#include "../display/kairos44_status.h"

// 16 bytes fit one interrupt packet at the default endpoint size, so no global USB setting changes.
#define KAIROS44_TELEMETRY_REPORT_SIZE 16
#define KAIROS44_TELEMETRY_USAGE_PAGE 0xFF4B
#define KAIROS44_TELEMETRY_USAGE 0x01

#define KAIROS44_TELEMETRY_MAGIC 0x4B
#define KAIROS44_TELEMETRY_VERSION 1

enum kairos44_telemetry_type {
    KAIROS44_TELEMETRY_TYPE_STATE = 0x01,            // device to host
    KAIROS44_TELEMETRY_TYPE_REQUEST_SNAPSHOT = 0x01, // host to device
};

#define KAIROS44_TELEMETRY_NO_LAYER 0xFF
#define KAIROS44_TELEMETRY_LOCKS_VALID 0x80
#define KAIROS44_TELEMETRY_FLAG_USB_OUTPUT 0x01
#define KAIROS44_TELEMETRY_FLAG_PROFILE_CONNECTED 0x02

static inline uint8_t kairos44_telemetry_highest_layer(uint32_t layers) {
    for (int layer = 31; layer >= 0; layer--) {
        if (layers & (1u << layer)) {
            return (uint8_t)layer;
        }
    }
    return KAIROS44_TELEMETRY_NO_LAYER;
}

// The modifier bits (bit 0 left Ctrl to bit 7 right GUI) a key event presses or releases.
static inline uint8_t kairos44_telemetry_key_modifiers(uint8_t implicit, uint8_t explicit_mods,
                                                       bool keyboard_page, uint16_t keycode) {
    uint8_t modifiers = implicit | explicit_mods;
    // 0xE0 to 0xE7 are the HID keyboard usages of the modifier keys themselves.
    if (keyboard_page && keycode >= 0xE0 && keycode <= 0xE7) {
        modifiers |= 1u << (keycode - 0xE0);
    }
    return modifiers;
}

static inline void kairos44_telemetry_encode(const struct kairos44_status *state, uint8_t sequence,
                                             uint8_t out[KAIROS44_TELEMETRY_REPORT_SIZE]) {
    memset(out, 0, KAIROS44_TELEMETRY_REPORT_SIZE);
    out[0] = KAIROS44_TELEMETRY_MAGIC;
    out[1] = KAIROS44_TELEMETRY_VERSION;
    out[2] = KAIROS44_TELEMETRY_TYPE_STATE;
    out[3] = sequence;
    out[4] = (uint8_t)(state->layers);
    out[5] = (uint8_t)(state->layers >> 8);
    out[6] = (uint8_t)(state->layers >> 16);
    out[7] = (uint8_t)(state->layers >> 24);
    out[8] = kairos44_telemetry_highest_layer(state->layers);
    out[9] = state->modifiers;
    out[10] = (state->locks & 0x07) | (state->locks_valid ? KAIROS44_TELEMETRY_LOCKS_VALID : 0);
    out[11] = (state->usb_output ? KAIROS44_TELEMETRY_FLAG_USB_OUTPUT : 0) |
              (state->profile_connected ? KAIROS44_TELEMETRY_FLAG_PROFILE_CONNECTED : 0);
    out[12] = state->profile;
}

static inline bool kairos44_telemetry_is_snapshot_request(const uint8_t *data, size_t length) {
    return length >= 3 && data[0] == KAIROS44_TELEMETRY_MAGIC &&
           data[1] == KAIROS44_TELEMETRY_VERSION &&
           data[2] == KAIROS44_TELEMETRY_TYPE_REQUEST_SNAPSHOT;
}

#endif
