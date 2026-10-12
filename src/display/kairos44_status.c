#include <lvgl.h>
#include <zephyr/devicetree.h>
#include <zephyr/dt-bindings/input/input-event-codes.h>
#include <zephyr/input/input.h>
#include <zephyr/kernel.h>
#include <zephyr/sys/__assert.h>
#include <zmk/battery.h>
#include <zmk/ble.h>
#include <zmk/display.h>
#include <zmk/display/status_screen.h>
#include <zmk/endpoints.h>
#include <zmk/event_manager.h>
#include <zmk/events/battery_state_changed.h>
#include <zmk/events/ble_active_profile_changed.h>
#include <zmk/events/endpoint_changed.h>
#include <zmk/events/hid_indicators_changed.h>
#include <zmk/events/keycode_state_changed.h>
#include <zmk/events/layer_state_changed.h>
#include <zmk/events/usb_conn_state_changed.h>
#include <dt-bindings/zmk/hid_usage.h>
#include <dt-bindings/zmk/modifiers.h>
#include <zmk/keymap.h>
#include <zmk/hid_indicators.h>
#include <zmk/split/central.h>
#include <zmk/split/transport/central.h>
#include <zmk/usb.h>

#include "kairos44_status.h"

static struct kairos44_status status;
static struct kairos44_status_activity activity;
static struct kairos44_status_frame last_frame;
static lv_obj_t *portrait_canvas;
static lv_obj_t *display_canvas;
static lv_color_t portrait_buffer[KAIROS44_PORTRAIT_WIDTH * KAIROS44_PORTRAIT_HEIGHT];
static lv_color_t display_buffer[160 * 68];
static bool frame_valid;
static bool screen_ready;
static uint8_t trackpad_buttons;
static uint32_t next_trackpad_refresh_ms;
K_MUTEX_DEFINE(status_lock);

static void refresh_status(struct k_work *work);
K_WORK_DELAYABLE_DEFINE(status_work, refresh_status);

static bool right_connected(void) {
    STRUCT_SECTION_FOREACH(zmk_split_transport_central, transport) {
        if (!transport->api || !transport->api->get_available_source_ids) {
            continue;
        }
        if (transport->api->get_status) {
            struct zmk_split_transport_status current = transport->api->get_status();
            if (!current.available || !current.enabled) {
                continue;
            }
        }
        uint8_t sources[ZMK_SPLIT_CENTRAL_PERIPHERAL_COUNT];
        int count = transport->api->get_available_source_ids(sources);
        for (int index = 0; index < count; index++) {
            if (sources[index] == 0) {
                return true;
            }
        }
    }
    return false;
}

static void render_portrait(const struct kairos44_status_frame *frame) {
    lv_draw_label_dsc_t label;
    lv_draw_label_dsc_init(&label);
    label.color = lv_color_black();
    label.font = &lv_font_unscii_8;
    label.align = LV_TEXT_ALIGN_LEFT;

    lv_canvas_fill_bg(portrait_canvas, lv_color_white(), LV_OPA_COVER);
    for (uint8_t line = 0; line < frame->portrait_line_count; line++) {
        __ASSERT_NO_MSG(strlen(frame->portrait_lines[line]) <= KAIROS44_PORTRAIT_LINE_CHARS);
        lv_canvas_draw_text(portrait_canvas, 2, 2 + line * 9, 64, &label,
                            frame->portrait_lines[line]);
    }

    lv_canvas_fill_bg(display_canvas, lv_color_white(), LV_OPA_COVER);
    for (lv_coord_t y = 0; y < KAIROS44_PORTRAIT_HEIGHT; y++) {
        for (lv_coord_t x = 0; x < KAIROS44_PORTRAIT_WIDTH; x++) {
            uint8_t display_x;
            uint8_t display_y;
            kairos44_portrait_to_display(x, y, &display_x, &display_y);
            lv_canvas_set_px_color(display_canvas, display_x, display_y,
                                   lv_canvas_get_px(portrait_canvas, x, y));
        }
    }
}

static void refresh_status(struct k_work *work) {
    ARG_UNUSED(work);
    bool connected = right_connected();
    k_mutex_lock(&status_lock, K_FOREVER);
    kairos44_status_connection(&status, connected);
    status.usb_powered = zmk_usb_is_powered();
    status.usb_output = zmk_endpoints_selected().transport == ZMK_TRANSPORT_USB;
    status.profile = zmk_ble_active_profile_index() + 1;
    status.profile_connected = zmk_ble_active_profile_is_connected();
    status.profile_bonded = !zmk_ble_active_profile_is_open();
    status.layers = zmk_keymap_layer_state();
    int64_t now_ms = k_uptime_get();
    struct kairos44_status_frame frame;
    kairos44_status_format_view(&status, &activity, now_ms, &frame);
    int64_t next_update_ms = 0;
    if (!activity.modifier_held) {
        if (now_ms < activity.action_until_ms) {
            next_update_ms = activity.action_until_ms;
        } else if (now_ms < activity.trackpad_until_ms) {
            next_update_ms = activity.trackpad_until_ms;
        }
    }
    bool ready = screen_ready;
    k_mutex_unlock(&status_lock);
    if (ready && next_update_ms > now_ms) {
        k_work_reschedule_for_queue(zmk_display_work_q(), &status_work,
                                    K_MSEC(next_update_ms - now_ms));
    }
    if (!ready || (frame_valid && memcmp(&frame, &last_frame, sizeof(frame)) == 0)) {
        return;
    }
    render_portrait(&frame);
    last_frame = frame;
    frame_valid = true;
}

static void poll_status(lv_timer_t *timer) {
    ARG_UNUSED(timer);
    refresh_status(NULL);
}

static const char *layer_action(uint8_t layer) {
    static const char *const names[] = {"BASE", "NAV", "FUNC", "SYM", "UTILS", "MIRROR",
                                        "COMBOS"};
    return layer < ARRAY_SIZE(names) ? names[layer] : "LAYER";
}

static void trackpad_event(struct input_event *event) {
    bool is_motion = event->type == INPUT_EV_REL && event->value != 0;
    bool is_button = event->type == INPUT_EV_KEY && event->code >= INPUT_BTN_0 &&
                     event->code <= INPUT_BTN_4;
    if (!is_motion && !is_button) {
        return;
    }
    uint32_t now_ms = k_uptime_get_32();
    if (!kairos44_status_trackpad_refresh_due(now_ms, next_trackpad_refresh_ms, is_button)) {
        return;
    }
    next_trackpad_refresh_ms = now_ms + KAIROS44_TRACKPAD_REFRESH_INTERVAL_MS;

    char action[9] = "MOVE";
    char direction[6] = "--";
    char buttons[9];
    k_mutex_lock(&status_lock, K_FOREVER);
    if (is_button) {
        uint8_t button = event->code - INPUT_BTN_0;
        if (event->value) {
            trackpad_buttons |= 1u << button;
        } else {
            trackpad_buttons &= ~(1u << button);
        }
        snprintf(action, sizeof(action), "CLICK");
    } else {
        bool scroll_layer = status.layers & ((1u << POINTER_SCROLL) |
                                             (1u << POINTER_EXTRA_SCROLL));
        if (event->code == INPUT_REL_X) {
            snprintf(direction, sizeof(direction), "%s", event->value > 0 ? "R" : "L");
            if (scroll_layer) {
                snprintf(action, sizeof(action), "SCROLL");
            }
        } else if (event->code == INPUT_REL_Y) {
            bool positive = event->value > 0;
            if (scroll_layer) {
                snprintf(action, sizeof(action), "SCROLL");
            }
            snprintf(direction, sizeof(direction), "%s", positive ? "D" : "U");
        } else if (event->code == INPUT_REL_WHEEL) {
            snprintf(direction, sizeof(direction), "%s", event->value > 0 ? "U" : "D");
            snprintf(action, sizeof(action), "SCROLL");
        } else if (event->code == INPUT_REL_HWHEEL) {
            snprintf(direction, sizeof(direction), "%s", event->value > 0 ? "R" : "L");
            snprintf(action, sizeof(action), "SCROLL");
        }
    }
    if (trackpad_buttons) {
        snprintf(buttons, sizeof(buttons), "%c%c%c%c%c",
                 trackpad_buttons & BIT(0) ? '1' : '-', trackpad_buttons & BIT(1) ? '2' : '-',
                 trackpad_buttons & BIT(2) ? '3' : '-', trackpad_buttons & BIT(3) ? '4' : '-',
                 trackpad_buttons & BIT(4) ? '5' : '-');
    } else {
        snprintf(buttons, sizeof(buttons), "NONE");
    }
    kairos44_status_note_trackpad(&activity, k_uptime_get(), action, direction, buttons);
    bool ready = screen_ready;
    k_mutex_unlock(&status_lock);
    if (ready) {
        k_work_reschedule_for_queue(zmk_display_work_q(), &status_work, K_MSEC(10));
    }
}

INPUT_CALLBACK_DEFINE(DEVICE_DT_GET(DT_NODELABEL(trackpad_split)), trackpad_event);

static int status_event(const zmk_event_t *event) {
    const struct zmk_battery_state_changed *local = as_zmk_battery_state_changed(event);
    const struct zmk_peripheral_battery_state_changed *remote =
        as_zmk_peripheral_battery_state_changed(event);
    const struct zmk_keycode_state_changed *key = as_zmk_keycode_state_changed(event);
    const struct zmk_hid_indicators_changed *indicators =
        as_zmk_hid_indicators_changed(event);
    const struct zmk_layer_state_changed *layer = as_zmk_layer_state_changed(event);
    bool connected = remote ? right_connected() : false;
    k_mutex_lock(&status_lock, K_FOREVER);
    if (local) {
        kairos44_status_battery(&status, false, 0, local->state_of_charge);
    }
    if (remote) {
        kairos44_status_connection(&status, connected);
        kairos44_status_battery(&status, true, remote->source, remote->state_of_charge);
    }
    if (key) {
        uint8_t previous_modifiers = status.modifiers;
        uint8_t modifiers = key->implicit_modifiers | key->explicit_modifiers;
        if (key->usage_page == HID_USAGE_KEY &&
            key->keycode >= HID_USAGE_KEY_KEYBOARD_LEFTCONTROL &&
            key->keycode <= HID_USAGE_KEY_KEYBOARD_RIGHT_GUI) {
            modifiers |= 1u << (key->keycode - HID_USAGE_KEY_KEYBOARD_LEFTCONTROL);
        }
        kairos44_status_modifiers(&status, modifiers, key->state);
        if (status.modifiers != previous_modifiers) {
            kairos44_status_note_action(&activity, k_uptime_get(),
                                        status.modifiers & ~previous_modifiers ? "MOD+" : "MOD-",
                                        status.modifiers != 0);
        }
    }
    if (indicators) {
        uint8_t previous_locks = status.locks;
        bool previous_valid = status.locks_valid;
        kairos44_status_locks(&status, indicators->indicators);
        if (!previous_valid || previous_locks != status.locks) {
            const char *action = "LOCK";
            if ((previous_locks ^ status.locks) & 0x01) {
                action = status.locks & 0x01 ? "NUM+" : "NUM-";
            } else if ((previous_locks ^ status.locks) & 0x02) {
                action = status.locks & 0x02 ? "CAPS+" : "CAPS-";
            } else if ((previous_locks ^ status.locks) & 0x04) {
                action = status.locks & 0x04 ? "SCROLL+" : "SCROLL-";
            }
            kairos44_status_note_action(&activity, k_uptime_get(), action,
                                        status.modifiers != 0);
        }
    }
    if (layer && layer->layer <= COMBOS) {
        char action[9];
        snprintf(action, sizeof(action), "%s%c", layer_action(layer->layer),
                 layer->state ? '+' : '-');
        kairos44_status_note_action(&activity, k_uptime_get(), action, status.modifiers != 0);
    }
    bool ready = screen_ready;
    k_mutex_unlock(&status_lock);
    if (ready) {
        k_work_reschedule_for_queue(zmk_display_work_q(), &status_work, K_MSEC(10));
    }
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(kairos44_status, status_event);
ZMK_SUBSCRIPTION(kairos44_status, zmk_battery_state_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_peripheral_battery_state_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_ble_active_profile_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_endpoint_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_hid_indicators_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_keycode_state_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_layer_state_changed);
ZMK_SUBSCRIPTION(kairos44_status, zmk_usb_conn_state_changed);

lv_obj_t *zmk_display_status_screen(void) {
    lv_obj_t *screen = lv_obj_create(NULL);
    lv_obj_set_style_bg_color(screen, lv_color_white(), LV_PART_MAIN);
    lv_obj_set_style_bg_opa(screen, LV_OPA_COVER, LV_PART_MAIN);
    lv_obj_set_style_pad_all(screen, 0, LV_PART_MAIN);
    lv_obj_clear_flag(screen, LV_OBJ_FLAG_SCROLLABLE);
    display_canvas = lv_canvas_create(screen);
    lv_canvas_set_buffer(display_canvas, display_buffer, 160, 68, LV_IMG_CF_TRUE_COLOR);
    lv_obj_set_pos(display_canvas, 0, 0);
    portrait_canvas = lv_canvas_create(screen);
    lv_canvas_set_buffer(portrait_canvas, portrait_buffer, KAIROS44_PORTRAIT_WIDTH,
                         KAIROS44_PORTRAIT_HEIGHT, LV_IMG_CF_TRUE_COLOR);
    lv_obj_add_flag(portrait_canvas, LV_OBJ_FLAG_HIDDEN);
    k_mutex_lock(&status_lock, K_FOREVER);
    status.modifiers = zmk_hid_get_explicit_mods();
    for (uint8_t index = 0; index < 8; index++) {
        if (status.modifiers & (1u << index)) {
            status.modifier_counts[index] = 1;
        }
    }
    if (!status.left_valid && zmk_battery_state_of_charge() > 0) {
        kairos44_status_battery(&status, false, 0, zmk_battery_state_of_charge());
    }
    screen_ready = true;
    k_mutex_unlock(&status_lock);
    refresh_status(NULL);
    lv_timer_create(poll_status, 1000, NULL);
    return screen;
}