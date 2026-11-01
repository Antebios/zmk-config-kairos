use std::thread;
use std::time::Duration;

use hidapi::{HidApi, HidDevice};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::AppState;

// Vendor-defined interface the left half exposes; see docs/kairos44-host-telemetry.md.
const USB_VENDOR: u16 = 0x1D50;
const USB_PRODUCT: u16 = 0x615E;
const USAGE_PAGE: u16 = 0xFF4B;
const USAGE: u16 = 0x01;
const REPORT_SIZE: usize = 16;
const MAGIC: u8 = 0x4B;
const VERSION: u8 = 1;
const TYPE_STATE: u8 = 0x01;
const LOCKS_VALID: u8 = 0x80;
const RETRY: Duration = Duration::from_secs(3);
const READ_TIMEOUT_MS: i32 = 1000;

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardState {
    // Bit n is set while layer n is active; the default layer is always set.
    pub layers: u32,
    pub highest: Option<u8>,
    // HID modifier bits: left Ctrl, Shift, Alt, Gui, then the same on the right.
    pub modifiers: u8,
    // None until the computer has reported its lock state to the keyboard.
    pub num_lock: Option<bool>,
    pub caps_lock: Option<bool>,
    pub scroll_lock: Option<bool>,
    pub usb: bool,
    pub ble_connected: bool,
    pub profile: u8,
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyboardEvent {
    pub connected: bool,
    pub state: Option<KeyboardState>,
}

pub fn parse_report(bytes: &[u8]) -> Option<KeyboardState> {
    if bytes.len() < 13 || bytes[0] != MAGIC || bytes[1] != VERSION || bytes[2] != TYPE_STATE {
        return None;
    }
    let locks = bytes[10];
    let lock = |bit: u8| (locks & LOCKS_VALID != 0).then_some(locks & (1 << bit) != 0);
    Some(KeyboardState {
        layers: u32::from_le_bytes([bytes[4], bytes[5], bytes[6], bytes[7]]),
        highest: (bytes[8] != 0xFF).then_some(bytes[8]),
        modifiers: bytes[9],
        num_lock: lock(0),
        caps_lock: lock(1),
        scroll_lock: lock(2),
        usb: bytes[11] & 0x01 != 0,
        ble_connected: bytes[11] & 0x02 != 0,
        profile: bytes[12],
    })
}

// The keyboard sends a report only when something changes, so ask for the current one.
fn snapshot_request() -> [u8; REPORT_SIZE + 1] {
    let mut request = [0u8; REPORT_SIZE + 1];
    // Leading zero is the report id; the interface has none.
    request[1] = MAGIC;
    request[2] = VERSION;
    request[3] = TYPE_STATE;
    request
}

fn publish(app: &AppHandle, last: &mut KeyboardEvent, event: KeyboardEvent) {
    if *last == event {
        return;
    }
    *app.state::<AppState>().keyboard.lock().unwrap() = event.clone();
    let _ = app.emit("keyboard-state", &event);
    *last = event;
}

fn find_and_open(api: &HidApi) -> Option<HidDevice> {
    api.device_list()
        .find(|info| {
            info.vendor_id() == USB_VENDOR
                && info.product_id() == USB_PRODUCT
                && info.usage_page() == USAGE_PAGE
                && info.usage() == USAGE
        })
        .and_then(|info| info.open_device(api).ok())
}

fn session(app: &AppHandle, last: &mut KeyboardEvent) {
    // The API object must outlive the device, so both live in this function.
    let Ok(api) = HidApi::new() else { return };
    let Some(device) = find_and_open(&api) else {
        return;
    };
    let _ = device.write(&snapshot_request());
    publish(
        app,
        last,
        KeyboardEvent {
            connected: true,
            state: None,
        },
    );
    let mut buffer = [0u8; 64];
    loop {
        match device.read_timeout(&mut buffer, READ_TIMEOUT_MS) {
            Ok(0) => continue,
            Ok(length) => {
                if let Some(state) = parse_report(&buffer[..length]) {
                    publish(
                        app,
                        last,
                        KeyboardEvent {
                            connected: true,
                            state: Some(state),
                        },
                    );
                }
            }
            Err(_) => break,
        }
    }
}

pub fn start(app: AppHandle) {
    thread::spawn(move || {
        let mut last = KeyboardEvent::default();
        loop {
            session(&app, &mut last);
            publish(&app, &mut last, KeyboardEvent::default());
            thread::sleep(RETRY);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn bytes(text: &str) -> Vec<u8> {
        text.split_whitespace()
            .map(|pair| u8::from_str_radix(pair, 16).unwrap())
            .collect()
    }

    #[test]
    fn parses_the_first_golden_report() {
        let state =
            parse_report(&bytes("4b 01 01 07 03 00 00 00 01 02 82 01 01 00 00 00")).unwrap();
        assert_eq!(state.layers, 0b11);
        assert_eq!(state.highest, Some(1));
        assert_eq!(state.modifiers, 0x02);
        assert_eq!(state.caps_lock, Some(true));
        assert_eq!(state.num_lock, Some(false));
        assert_eq!(state.scroll_lock, Some(false));
        assert!(state.usb && !state.ble_connected);
        assert_eq!(state.profile, 1);
    }

    #[test]
    fn parses_the_second_golden_report() {
        let state =
            parse_report(&bytes("4b 01 01 ff 01 00 20 00 15 00 00 02 02 00 00 00")).unwrap();
        assert_eq!(state.layers, 0x0020_0001);
        assert_eq!(state.highest, Some(21));
        assert_eq!(state.modifiers, 0);
        assert_eq!(state.num_lock, None);
        assert!(!state.usb && state.ble_connected);
        assert_eq!(state.profile, 2);
    }

    #[test]
    fn no_active_layer_is_none() {
        let state =
            parse_report(&bytes("4b 01 01 00 00 00 00 00 ff 00 00 00 01 00 00 00")).unwrap();
        assert_eq!(state.highest, None);
    }

    #[test]
    fn rejects_unknown_or_short_reports() {
        assert!(parse_report(&bytes("4c 01 01 00 00 00 00 00 00 00 00 00 00")).is_none());
        assert!(parse_report(&bytes("4b 02 01 00 00 00 00 00 00 00 00 00 00")).is_none());
        assert!(parse_report(&bytes("4b 01 02 00 00 00 00 00 00 00 00 00 00")).is_none());
        assert!(parse_report(&bytes("4b 01 01 00 00")).is_none());
    }

    #[test]
    fn the_snapshot_request_matches_the_firmware() {
        let request = snapshot_request();
        assert_eq!(request.len(), 17);
        assert_eq!(&request[..4], &[0x00, 0x4B, 0x01, 0x01]);
    }

    // Needs the keyboard on USB: cargo test live -- --ignored --nocapture
    #[test]
    #[ignore]
    fn live_keyboard_answers_a_snapshot_request() {
        let api = HidApi::new().unwrap();
        let device = find_and_open(&api).expect("keyboard interface not found or not readable");
        device.write(&snapshot_request()).unwrap();
        let mut buffer = [0u8; 64];
        let length = device.read_timeout(&mut buffer, 3000).unwrap();
        let state = parse_report(&buffer[..length]).expect("not a state report");
        println!("{state:?}");
        assert!(state.layers & 1 == 1, "the default layer is always on");
    }
}
