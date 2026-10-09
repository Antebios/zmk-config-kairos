#include <lvgl.h>
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
static struct kairos44_status_frame last_frame;
static lv_obj_t *portrait_canvas;
static lv_obj_t *display_canvas;
static lv_color_t portrait_buffer[KAIROS44_PORTRAIT_WIDTH * KAIROS44_PORTRAIT_HEIGHT];
static lv_color_t display_buffer[160 * 68];
static bool frame_valid;
static bool screen_ready;
K_MUTEX_DEFINE(status_lock);

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
    struct kairos44_status_frame frame;
    kairos44_status_format(&status, &frame);
    bool ready = screen_ready;
    k_mutex_unlock(&status_lock);
    if (!ready || (frame_valid && memcmp(&frame, &last_frame, sizeof(frame)) == 0)) {
        return;
    }
    render_portrait(&frame);
    last_frame = frame;
    frame_valid = true;
}

K_WORK_DELAYABLE_DEFINE(status_work, refresh_status);

static void poll_status(lv_timer_t *timer) {
    ARG_UNUSED(timer);
    refresh_status(NULL);
}

static int status_event(const zmk_event_t *event) {
    const struct zmk_battery_state_changed *local = as_zmk_battery_state_changed(event);
    const struct zmk_peripheral_battery_state_changed *remote =
        as_zmk_peripheral_battery_state_changed(event);
    const struct zmk_keycode_state_changed *key = as_zmk_keycode_state_changed(event);
    const struct zmk_hid_indicators_changed *indicators =
        as_zmk_hid_indicators_changed(event);
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
        uint8_t modifiers = key->implicit_modifiers | key->explicit_modifiers;
        if (key->usage_page == HID_USAGE_KEY &&
            key->keycode >= HID_USAGE_KEY_KEYBOARD_LEFTCONTROL &&
            key->keycode <= HID_USAGE_KEY_KEYBOARD_RIGHT_GUI) {
            modifiers |= 1u << (key->keycode - HID_USAGE_KEY_KEYBOARD_LEFTCONTROL);
        }
        kairos44_status_modifiers(&status, modifiers, key->state);
    }
    if (indicators) {
        kairos44_status_locks(&status, indicators->indicators);
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