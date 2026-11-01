#include <zephyr/device.h>
#include <zephyr/init.h>
#include <zephyr/kernel.h>
#include <zephyr/logging/log.h>
#include <zephyr/sys/atomic.h>
// usb_device.h must come first: usb_hid.h refers to a struct it declares.
#include <zephyr/usb/usb_device.h>
#include <zephyr/usb/class/hid.h>
#include <zephyr/usb/class/usb_hid.h>
#include <dt-bindings/zmk/hid_usage.h>
#include <zmk/ble.h>
#include <zmk/endpoints.h>
#include <zmk/event_manager.h>
#include <zmk/events/ble_active_profile_changed.h>
#include <zmk/events/endpoint_changed.h>
#include <zmk/events/hid_indicators_changed.h>
#include <zmk/events/keycode_state_changed.h>
#include <zmk/events/layer_state_changed.h>
#include <zmk/events/usb_conn_state_changed.h>
#include <zmk/hid.h>
#include <zmk/keymap.h>
#include <zmk/usb.h>

#include "kairos44_telemetry.h"

LOG_MODULE_DECLARE(zmk, CONFIG_ZMK_LOG_LEVEL);

BUILD_ASSERT(CONFIG_USB_HID_DEVICE_COUNT >= 2,
             "host telemetry needs a second USB HID device: set CONFIG_USB_HID_DEVICE_COUNT=2");

#define HID_REPORT_TYPE_MASK 0xff00
#define HID_REPORT_TYPE_OUTPUT 0x200

static const uint8_t report_descriptor[] = {
    HID_ITEM(HID_ITEM_TAG_USAGE_PAGE, HID_ITEM_TYPE_GLOBAL, 2),
    KAIROS44_TELEMETRY_USAGE_PAGE & 0xFF,
    KAIROS44_TELEMETRY_USAGE_PAGE >> 8,
    HID_USAGE(KAIROS44_TELEMETRY_USAGE),
    HID_COLLECTION(0x01),
    HID_LOGICAL_MIN8(0x00),
    HID_LOGICAL_MAX16(0xFF, 0x00),
    HID_REPORT_SIZE(8),
    HID_REPORT_COUNT(KAIROS44_TELEMETRY_REPORT_SIZE),
    HID_USAGE(0x02),
    HID_INPUT(0x02), // Data, Variable, Absolute
    HID_USAGE(0x03),
    HID_OUTPUT(0x02),
    HID_END_COLLECTION,
};

static const struct device *telemetry_dev;
static struct kairos44_status status;
// Last state queued for sending, with the sequence byte zeroed, so unchanged states are not resent.
static uint8_t queued[KAIROS44_TELEMETRY_REPORT_SIZE];
static uint8_t sequence;
K_MUTEX_DEFINE(telemetry_lock);
// Bit 0 is set while a report is queued in the USB controller and the host has not yet read it.
// A host that is not listening (no app running) leaves it set, so sending must never wait for it:
// the system work queue is shared with key combo timeouts.
static atomic_t ep_busy;
// Set when a newer state is waiting for the endpoint to become free.
static atomic_t resend;

static void send_state(struct k_work *work);
K_WORK_DELAYABLE_DEFINE(send_work, send_state);

static void sample_modifiers(struct k_work *work);
K_WORK_DELAYABLE_DEFINE(sample_work, sample_modifiers);
// Last sampled modifier mask, so key events with none held cost nothing.
static atomic_t held_modifiers;

static void in_ready_cb(const struct device *dev) {
    ARG_UNUSED(dev);
    atomic_clear_bit(&ep_busy, 0);
    if (atomic_cas(&resend, 1, 0)) {
        k_work_reschedule(&send_work, K_NO_WAIT);
    }
}

static void refresh_endpoint_locked(void) {
    status.usb_output = zmk_endpoints_selected().transport == ZMK_TRANSPORT_USB;
    status.profile = zmk_ble_active_profile_index() + 1;
    status.profile_connected = zmk_ble_active_profile_is_connected();
}

static void refresh_layers_locked(void) {
    // The default layer is always active but is not part of ZMK's layer state mask.
    status.layers = zmk_keymap_layer_state() | BIT(zmk_keymap_layer_default());
}

// Called with the lock held. True when the state differs from what was last queued.
static bool state_changed_locked(void) {
    uint8_t current[KAIROS44_TELEMETRY_REPORT_SIZE];
    kairos44_telemetry_encode(&status, 0, current);
    if (memcmp(current, queued, sizeof(current)) == 0) {
        return false;
    }
    memcpy(queued, current, sizeof(current));
    return true;
}

static void send_state(struct k_work *work) {
    ARG_UNUSED(work);
    if (CONFIG_KAIROS44_HOST_TELEMETRY_DEBUG_STAGE == 2) {
        return;
    }
    if (zmk_usb_get_conn_state() != ZMK_USB_CONN_HID) {
        return;
    }
    if (atomic_test_and_set_bit(&ep_busy, 0)) {
        // The previous report is still in flight; in_ready_cb sends the newest state afterwards.
        atomic_set(&resend, 1);
        if (!atomic_test_bit(&ep_busy, 0)) {
            // It completed between the two checks above.
            k_work_reschedule(&send_work, K_NO_WAIT);
        }
        return;
    }
    // Static, because the USB controller reads it by DMA after this function returns.
    static uint8_t report[KAIROS44_TELEMETRY_REPORT_SIZE];
    k_mutex_lock(&telemetry_lock, K_FOREVER);
    kairos44_telemetry_encode(&status, sequence++, report);
    k_mutex_unlock(&telemetry_lock);

    int err = hid_int_ep_write(telemetry_dev, report, sizeof(report), NULL);
    if (err) {
        LOG_WRN("Telemetry report not sent: %d", err);
        atomic_clear_bit(&ep_busy, 0);
    }
}

static void schedule_send(void) {
    k_work_reschedule(&send_work, K_MSEC(CONFIG_KAIROS44_HOST_TELEMETRY_COALESCE_MS));
}

// Counting key events drifts: Caps Word adds Shift to press events only. The report is the truth.
static void sample_modifiers(struct k_work *work) {
    ARG_UNUSED(work);
    uint8_t modifiers = zmk_hid_get_keyboard_report()->body.modifiers;
    atomic_set(&held_modifiers, modifiers);
    k_mutex_lock(&telemetry_lock, K_FOREVER);
    status.modifiers = modifiers;
    bool changed = state_changed_locked();
    k_mutex_unlock(&telemetry_lock);
    if (changed) {
        schedule_send();
    }
}

static int get_report_cb(const struct device *dev, struct usb_setup_packet *setup, int32_t *len,
                         uint8_t **data) {
    ARG_UNUSED(dev);
    ARG_UNUSED(setup);
    static uint8_t snapshot[KAIROS44_TELEMETRY_REPORT_SIZE];
    k_mutex_lock(&telemetry_lock, K_FOREVER);
    kairos44_telemetry_encode(&status, sequence, snapshot);
    k_mutex_unlock(&telemetry_lock);
    *data = snapshot;
    *len = sizeof(snapshot);
    return 0;
}

static int set_report_cb(const struct device *dev, struct usb_setup_packet *setup, int32_t *len,
                         uint8_t **data) {
    ARG_UNUSED(dev);
    if ((setup->wValue & HID_REPORT_TYPE_MASK) != HID_REPORT_TYPE_OUTPUT) {
        return -ENOTSUP;
    }
    if (*len < 0 || !kairos44_telemetry_is_snapshot_request(*data, (size_t)*len)) {
        return -EINVAL;
    }
    // Runs in the USB thread: only queue the work, never write from here.
    k_work_reschedule(&send_work, K_NO_WAIT);
    return 0;
}

static const struct hid_ops ops = {
    .int_in_ready = in_ready_cb,
    .get_report = get_report_cb,
    .set_report = set_report_cb,
};

static int telemetry_event(const zmk_event_t *event) {
    const struct zmk_keycode_state_changed *key = as_zmk_keycode_state_changed(event);
    if (key) {
        uint8_t modifiers = kairos44_telemetry_key_modifiers(
            key->implicit_modifiers, key->explicit_modifiers, key->usage_page == HID_USAGE_KEY,
            key->keycode);
        // Most key presses touch no modifier and none is held; leave them without any work.
        if (!modifiers && !atomic_get(&held_modifiers)) {
            return ZMK_EV_EVENT_BUBBLE;
        }
        // Sampled after ZMK has applied this event to its report.
        k_work_reschedule(&sample_work, K_MSEC(CONFIG_KAIROS44_HOST_TELEMETRY_COALESCE_MS));
        return ZMK_EV_EVENT_BUBBLE;
    }

    const struct zmk_hid_indicators_changed *indicators = as_zmk_hid_indicators_changed(event);
    const struct zmk_usb_conn_state_changed *usb = as_zmk_usb_conn_state_changed(event);
    if (usb) {
        // A report in flight when the cable was pulled never completes.
        atomic_clear_bit(&ep_busy, 0);
    }
    k_mutex_lock(&telemetry_lock, K_FOREVER);
    if (indicators) {
        kairos44_status_locks(&status, indicators->indicators);
    }
    refresh_layers_locked();
    refresh_endpoint_locked();
    bool changed = state_changed_locked();
    k_mutex_unlock(&telemetry_lock);
    // A host that has just connected has seen none of the earlier state.
    if (changed || (usb && usb->conn_state == ZMK_USB_CONN_HID)) {
        schedule_send();
    }
    return ZMK_EV_EVENT_BUBBLE;
}

ZMK_LISTENER(kairos44_telemetry, telemetry_event);
#if CONFIG_KAIROS44_HOST_TELEMETRY_DEBUG_STAGE != 1
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_keycode_state_changed);
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_layer_state_changed);
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_hid_indicators_changed);
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_endpoint_changed);
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_ble_active_profile_changed);
ZMK_SUBSCRIPTION(kairos44_telemetry, zmk_usb_conn_state_changed);
#endif

static int telemetry_init(void) {
    telemetry_dev = device_get_binding("HID_1");
    if (telemetry_dev == NULL) {
        LOG_ERR("Telemetry HID device HID_1 not found");
        return -EINVAL;
    }
    usb_hid_register_device(telemetry_dev, report_descriptor, sizeof(report_descriptor), &ops);
    usb_hid_init(telemetry_dev);

    k_mutex_lock(&telemetry_lock, K_FOREVER);
    status.modifiers = zmk_hid_get_keyboard_report()->body.modifiers;
    refresh_layers_locked();
    refresh_endpoint_locked();
    state_changed_locked();
    k_mutex_unlock(&telemetry_lock);
    return 0;
}

// After ZMK's own USB HID device, which registers at CONFIG_ZMK_USB_HID_INIT_PRIORITY.
BUILD_ASSERT(CONFIG_KAIROS44_HOST_TELEMETRY_INIT_PRIORITY > CONFIG_ZMK_USB_HID_INIT_PRIORITY,
             "telemetry must register its HID device after ZMK's");
SYS_INIT(telemetry_init, APPLICATION, CONFIG_KAIROS44_HOST_TELEMETRY_INIT_PRIORITY);
