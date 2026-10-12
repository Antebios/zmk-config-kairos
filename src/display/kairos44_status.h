#ifndef KAIROS44_STATUS_H
#define KAIROS44_STATUS_H

#define KAIROS44_PORTRAIT_WIDTH 68
#define KAIROS44_PORTRAIT_HEIGHT 160
#define KAIROS44_PORTRAIT_LINE_COUNT 16
#define KAIROS44_PORTRAIT_LINE_CHARS 8
#define KAIROS44_ACTION_TIMEOUT_MS 3000
#define KAIROS44_TRACKPAD_TIMEOUT_MS 2000
#define KAIROS44_TRACKPAD_REFRESH_INTERVAL_MS 100

#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

#define KAIROS_TRACKPAD_NAV
#include "../../boards/shields/common/kairos/helpers/layers.keymap"
#undef KAIROS_TRACKPAD_NAV

struct kairos44_status {
    bool left_valid;
    bool right_valid;
    bool right_connected;
    bool usb_powered;
    bool usb_output;
    bool profile_connected;
    bool profile_bonded;
    bool locks_valid;
    uint8_t left_level;
    uint8_t right_level;
    uint8_t profile;
    uint8_t modifiers;
    uint8_t modifier_counts[8];
    uint8_t locks;
    uint32_t layers;
};

struct kairos44_status_frame {
    char left[10];
    char right[10];
    char output[28];
    char layer[20];
    char pointer[20];
    char portrait_lines[KAIROS44_PORTRAIT_LINE_COUNT][KAIROS44_PORTRAIT_LINE_CHARS + 1];
    uint8_t portrait_line_count;
};

enum kairos44_status_view {
    KAIROS44_VIEW_OVERVIEW,
    KAIROS44_VIEW_ACTION,
    KAIROS44_VIEW_TRACKPAD,
};

struct kairos44_status_activity {
    int64_t action_until_ms;
    int64_t trackpad_until_ms;
    bool modifier_held;
    char last_action[9];
    char trackpad_action[9];
    char direction[6];
    char buttons[9];
};

static inline bool kairos44_status_trackpad_refresh_due(uint32_t now_ms, uint32_t deadline_ms,
                                                        bool urgent) {
    return urgent || (int32_t)(now_ms - deadline_ms) >= 0;
}

static inline enum kairos44_status_view
kairos44_status_active_view(const struct kairos44_status_activity *activity, int64_t now_ms) {
    if (activity->modifier_held || now_ms < activity->action_until_ms) {
        return KAIROS44_VIEW_ACTION;
    }
    if (now_ms < activity->trackpad_until_ms) {
        return KAIROS44_VIEW_TRACKPAD;
    }
    return KAIROS44_VIEW_OVERVIEW;
}

static inline void kairos44_status_note_action(struct kairos44_status_activity *activity,
                                               int64_t now_ms, const char *action,
                                               bool modifier_held) {
    snprintf(activity->last_action, sizeof(activity->last_action), "%s", action);
    activity->modifier_held = modifier_held;
    activity->action_until_ms = now_ms + KAIROS44_ACTION_TIMEOUT_MS;
}

static inline void kairos44_status_note_trackpad(struct kairos44_status_activity *activity,
                                                 int64_t now_ms, const char *action,
                                                 const char *direction, const char *buttons) {
    snprintf(activity->trackpad_action, sizeof(activity->trackpad_action), "%s", action);
    snprintf(activity->direction, sizeof(activity->direction), "%s", direction);
    snprintf(activity->buttons, sizeof(activity->buttons), "%s", buttons);
    activity->trackpad_until_ms = now_ms + KAIROS44_TRACKPAD_TIMEOUT_MS;
}

static inline void kairos44_portrait_to_display(uint8_t x, uint8_t y, uint8_t *display_x,
                                               uint8_t *display_y) {
    *display_x = KAIROS44_PORTRAIT_HEIGHT - 1 - y;
    *display_y = x;
}

static inline void kairos44_status_connection(struct kairos44_status *state, bool connected) {
    if (!connected || connected != state->right_connected) {
        state->right_valid = false;
    }
    state->right_connected = connected;
}

static inline void kairos44_status_battery(struct kairos44_status *state, bool peripheral,
                                         uint8_t source, uint8_t level) {
    if (peripheral) {
        if (source != 0 || !state->right_connected) {
            return;
        }
        state->right_valid = level <= 100;
        state->right_level = level;
    } else {
        state->left_valid = level <= 100;
        state->left_level = level;
    }
}

static inline void kairos44_status_modifiers(struct kairos44_status *state, uint8_t modifiers,
                                            bool pressed) {
    for (uint8_t index = 0; index < 8; index++) {
        if (!(modifiers & (1u << index))) {
            continue;
        }
        if (pressed) {
            if (state->modifier_counts[index] < UINT8_MAX) {
                state->modifier_counts[index]++;
            }
        } else if (state->modifier_counts[index] > 0) {
            state->modifier_counts[index]--;
        }
        if (state->modifier_counts[index] > 0) {
            state->modifiers |= 1u << index;
        } else {
            state->modifiers &= ~(1u << index);
        }
    }
}

static inline void kairos44_status_locks(struct kairos44_status *state, uint8_t indicators) {
    state->locks = indicators & 0x07;
    state->locks_valid = true;
}

static inline const char *kairos44_status_pointer(uint32_t layers) {
    if (layers & ((1u << POINTER_SCROLL) | (1u << POINTER_EXTRA_SCROLL))) {
        return "SCROLL";
    }
    if (layers & ((1u << POINTER_PRECISION) | (1u << POINTER_HOLD_PRECISION) |
                  (1u << POINTER_EXTRA_PRECISION))) {
        return "PREC";
    }
    return layers & (1u << POINTER_FAST) ? "FAST" : "NORMAL";
}

static inline void kairos44_status_format(const struct kairos44_status *state,
                                        struct kairos44_status_frame *frame) {
    memset(frame, 0, sizeof(*frame));
    if (state->left_valid) {
        snprintf(frame->left, sizeof(frame->left), "L%u%%%s", state->left_level,
                 state->usb_powered ? " USB" : "");
    } else {
        snprintf(frame->left, sizeof(frame->left), "L--%s", state->usb_powered ? " USB" : "");
    }
    if (!state->right_connected) {
        snprintf(frame->right, sizeof(frame->right), "R OFF");
    } else if (state->right_valid) {
        snprintf(frame->right, sizeof(frame->right), "R%u%%", state->right_level);
    } else {
        snprintf(frame->right, sizeof(frame->right), "R--");
    }
    char modifiers[5] = {
        state->modifiers & ((1u << 3) | (1u << 7)) ? 'G' : '-',
        state->modifiers & ((1u << 2) | (1u << 6)) ? 'A' : '-',
        state->modifiers & ((1u << 1) | (1u << 5)) ? 'S' : '-',
        state->modifiers & ((1u << 0) | (1u << 4)) ? 'C' : '-',
        '\0',
    };
    char locks[6];
    if (state->locks_valid) {
        snprintf(locks, sizeof(locks), "%c-%c-%c", state->locks & 0x02 ? 'C' : '-',
                 state->locks & 0x01 ? 'N' : '-', state->locks & 0x04 ? 'S' : '-');
    } else {
        snprintf(locks, sizeof(locks), "???");
    }
    char host[8];
    if (state->usb_output) {
        snprintf(host, sizeof(host), "USB");
    } else {
        snprintf(host, sizeof(host), "B%u%c", state->profile,
                 state->profile_connected ? '+' : state->profile_bonded ? '-' : '?');
    }
    snprintf(frame->output, sizeof(frame->output), "%s R%c %s %s", host,
             state->right_connected ? '+' : '-', modifiers, locks);
    static const char *const names[] = {
        [BASE] = "BASE", [NAVIGATION] = "NAV", [FUNCTIONS] = "FUNCTIONS",
        [SYMBOL_KP] = "SYMBOL_KP", [UTILS] = "UTILS", [MIRROR] = "MIRROR",
        [COMBOS] = "COMBOS"};
    uint8_t layer = COMBOS;
    while (layer > BASE && !(state->layers & (1u << layer))) {
        layer--;
    }
    snprintf(frame->layer, sizeof(frame->layer), "LAYER %s", names[layer]);
    snprintf(frame->pointer, sizeof(frame->pointer), "PAD %s",
             kairos44_status_pointer(state->layers));

    static const char *const portrait_layer_names[] = {
        [BASE] = "BASE", [NAVIGATION] = "NAV", [FUNCTIONS] = "FUNC",
        [SYMBOL_KP] = "SYM-KP", [UTILS] = "UTILS", [MIRROR] = "MIRROR",
        [COMBOS] = "COMBOS"};
    snprintf(frame->portrait_lines[0], sizeof(frame->portrait_lines[0]), "KAIROS44");
    snprintf(frame->portrait_lines[1], sizeof(frame->portrait_lines[1]), "BATTERY:");
    snprintf(frame->portrait_lines[2], sizeof(frame->portrait_lines[2]), "L:%u%%",
             state->left_valid ? state->left_level : 0);
    if (!state->left_valid) {
        snprintf(frame->portrait_lines[2], sizeof(frame->portrait_lines[2]), "L:--");
    }
    if (!state->right_connected) {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:OFF");
    } else if (state->right_valid) {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:%u%%",
                 state->right_level);
    } else {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:--");
    }
    snprintf(frame->portrait_lines[4], sizeof(frame->portrait_lines[4]), "%s",
             state->usb_powered ? "USB PWR" : "ON BATT");
    snprintf(frame->portrait_lines[5], sizeof(frame->portrait_lines[5]), "HOST:");
    if (state->usb_output) {
        snprintf(frame->portrait_lines[6], sizeof(frame->portrait_lines[6]), "USB");
    } else {
        snprintf(frame->portrait_lines[6], sizeof(frame->portrait_lines[6]), "B%u%c", state->profile,
                 state->profile_connected ? '+' : state->profile_bonded ? '-' : '?');
    }
    snprintf(frame->portrait_lines[7], sizeof(frame->portrait_lines[7]), "LINK: R%c",
             state->right_connected ? '+' : '-');
    snprintf(frame->portrait_lines[8], sizeof(frame->portrait_lines[8]), "MOD:");
    snprintf(frame->portrait_lines[9], sizeof(frame->portrait_lines[9]), "%s", modifiers);
    snprintf(frame->portrait_lines[10], sizeof(frame->portrait_lines[10]), "LOCK:");
    snprintf(frame->portrait_lines[11], sizeof(frame->portrait_lines[11]), "%s", locks);
    snprintf(frame->portrait_lines[12], sizeof(frame->portrait_lines[12]), "LAYER:");
    snprintf(frame->portrait_lines[13], sizeof(frame->portrait_lines[13]), "%s",
             portrait_layer_names[layer]);
    snprintf(frame->portrait_lines[14], sizeof(frame->portrait_lines[14]), "PAD:");
    snprintf(frame->portrait_lines[15], sizeof(frame->portrait_lines[15]), "%s",
             kairos44_status_pointer(state->layers));
    frame->portrait_line_count = KAIROS44_PORTRAIT_LINE_COUNT;
}

static inline void kairos44_status_format_view(const struct kairos44_status *state,
                                               const struct kairos44_status_activity *activity,
                                               int64_t now_ms,
                                               struct kairos44_status_frame *frame) {
    kairos44_status_format(state, frame);
    enum kairos44_status_view view = kairos44_status_active_view(activity, now_ms);
    if (view == KAIROS44_VIEW_OVERVIEW) {
        return;
    }

    char host[9];
    char layer[9];
    char modifiers[9];
    char locks[9];
    char pointer[9];
    snprintf(host, sizeof(host), "%s", frame->portrait_lines[6]);
    snprintf(layer, sizeof(layer), "%s", frame->portrait_lines[13]);
    snprintf(modifiers, sizeof(modifiers), "%s", frame->portrait_lines[9]);
    snprintf(locks, sizeof(locks), "%s", frame->portrait_lines[11]);
    snprintf(pointer, sizeof(pointer), "%s", frame->portrait_lines[15]);

    memset(frame->portrait_lines, 0, sizeof(frame->portrait_lines));
    snprintf(frame->portrait_lines[0], sizeof(frame->portrait_lines[0]), "KAIROS44");
    snprintf(frame->portrait_lines[1], sizeof(frame->portrait_lines[1]), "BATTERY:");
    snprintf(frame->portrait_lines[2], sizeof(frame->portrait_lines[2]), "L:%u%%",
             state->left_valid ? state->left_level : 0);
    if (!state->left_valid) {
        snprintf(frame->portrait_lines[2], sizeof(frame->portrait_lines[2]), "L:--");
    }
    if (!state->right_connected) {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:OFF");
    } else if (state->right_valid) {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:%u%%",
                 state->right_level);
    } else {
        snprintf(frame->portrait_lines[3], sizeof(frame->portrait_lines[3]), "R:--");
    }
    snprintf(frame->portrait_lines[4], sizeof(frame->portrait_lines[4]), "%s",
             state->usb_powered ? "USB PWR" : "ON BATT");

    if (view == KAIROS44_VIEW_ACTION) {
        snprintf(frame->portrait_lines[5], sizeof(frame->portrait_lines[5]), "ACTION:");
        snprintf(frame->portrait_lines[6], sizeof(frame->portrait_lines[6]), "MOD:");
        snprintf(frame->portrait_lines[7], sizeof(frame->portrait_lines[7]), "%s", modifiers);
        snprintf(frame->portrait_lines[8], sizeof(frame->portrait_lines[8]), "LOCK:");
        snprintf(frame->portrait_lines[9], sizeof(frame->portrait_lines[9]), "%s", locks);
        snprintf(frame->portrait_lines[10], sizeof(frame->portrait_lines[10]), "LAYER:");
        snprintf(frame->portrait_lines[11], sizeof(frame->portrait_lines[11]), "%s", layer);
        snprintf(frame->portrait_lines[12], sizeof(frame->portrait_lines[12]), "LAST:");
        snprintf(frame->portrait_lines[13], sizeof(frame->portrait_lines[13]), "%s",
                 activity->last_action[0] ? activity->last_action : "KEY");
        snprintf(frame->portrait_lines[14], sizeof(frame->portrait_lines[14]), "HOST:");
        snprintf(frame->portrait_lines[15], sizeof(frame->portrait_lines[15]), "%s", host);
    } else {
        snprintf(frame->portrait_lines[5], sizeof(frame->portrait_lines[5]), "TRACKPAD");
        snprintf(frame->portrait_lines[6], sizeof(frame->portrait_lines[6]), "MODE:");
        snprintf(frame->portrait_lines[7], sizeof(frame->portrait_lines[7]), "%s", pointer);
        snprintf(frame->portrait_lines[8], sizeof(frame->portrait_lines[8]), "ACTION:");
        snprintf(frame->portrait_lines[9], sizeof(frame->portrait_lines[9]), "%s",
                 activity->trackpad_action[0] ? activity->trackpad_action : "MOVE");
        snprintf(frame->portrait_lines[10], sizeof(frame->portrait_lines[10]), "DIR:");
        snprintf(frame->portrait_lines[11], sizeof(frame->portrait_lines[11]), "%s",
                 activity->direction[0] ? activity->direction : "--");
        snprintf(frame->portrait_lines[12], sizeof(frame->portrait_lines[12]), "BUTTONS:");
        snprintf(frame->portrait_lines[13], sizeof(frame->portrait_lines[13]), "%s",
                 activity->buttons[0] ? activity->buttons : "NONE");
        snprintf(frame->portrait_lines[14], sizeof(frame->portrait_lines[14]), "HOST:");
        snprintf(frame->portrait_lines[15], sizeof(frame->portrait_lines[15]), "%s", host);
    }
}

#endif