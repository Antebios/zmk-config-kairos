//! Window control for Hyprland, which ignores app-requested always-on-top and keeps windows mapped when "hidden".
//! Uses the Lua-config dispatcher syntax of Hyprland 0.5x and later; other setups simply skip these calls.

use serde_json::Value;
use std::process::Command;
use std::thread::sleep;
use std::time::Duration;

pub const HIDDEN_WORKSPACE: &str = "special:kairos44";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Client {
    pub pid: u32,
    pub floating: bool,
    pub pinned: bool,
    pub workspace: String,
    pub at: (i64, i64),
    pub size: (i64, i64),
    pub monitor: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Monitor {
    pub id: i64,
    pub x: i64,
    pub y: i64,
    // Logical size: pixels divided by the scale.
    pub width: i64,
    pub height: i64,
    // Space taken by bars: left, top, right, bottom.
    pub reserved: [i64; 4],
}

pub fn is_available() -> bool {
    std::env::var_os("HYPRLAND_INSTANCE_SIGNATURE").is_some()
}

fn pair(value: &Value) -> Option<(i64, i64)> {
    let items = value.as_array()?;
    Some((items.first()?.as_i64()?, items.get(1)?.as_i64()?))
}

pub fn parse_clients(json: &str) -> Vec<Client> {
    let Ok(Value::Array(items)) = serde_json::from_str::<Value>(json) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            Some(Client {
                pid: u32::try_from(item.get("pid")?.as_u64()?).ok()?,
                floating: item.get("floating")?.as_bool()?,
                pinned: item.get("pinned")?.as_bool()?,
                workspace: item.get("workspace")?.get("name")?.as_str()?.to_string(),
                at: pair(item.get("at")?)?,
                size: pair(item.get("size")?)?,
                monitor: item.get("monitor")?.as_i64()?,
            })
        })
        .collect()
}

pub fn parse_monitors(json: &str) -> Vec<Monitor> {
    let Ok(Value::Array(items)) = serde_json::from_str::<Value>(json) else {
        return Vec::new();
    };
    items
        .iter()
        .filter_map(|item| {
            let scale = item.get("scale")?.as_f64()?;
            let reserved = item.get("reserved")?.as_array()?;
            if scale <= 0.0 || reserved.len() < 4 {
                return None;
            }
            Some(Monitor {
                id: item.get("id")?.as_i64()?,
                x: item.get("x")?.as_i64()?,
                y: item.get("y")?.as_i64()?,
                width: (item.get("width")?.as_f64()? / scale).floor() as i64,
                height: (item.get("height")?.as_f64()? / scale).floor() as i64,
                reserved: [
                    reserved[0].as_i64()?,
                    reserved[1].as_i64()?,
                    reserved[2].as_i64()?,
                    reserved[3].as_i64()?,
                ],
            })
        })
        .collect()
}

// Moves a window that sticks out of the monitor's usable area back inside it; a window larger than the area keeps its top-left corner.
pub fn clamp_into(at: (i64, i64), size: (i64, i64), monitor: &Monitor) -> (i64, i64) {
    let left = monitor.x + monitor.reserved[0];
    let top = monitor.y + monitor.reserved[1];
    let right = monitor.x + monitor.width - monitor.reserved[2];
    let bottom = monitor.y + monitor.height - monitor.reserved[3];
    (
        at.0.min(right - size.0).max(left),
        at.1.min(bottom - size.1).max(top),
    )
}

pub fn parse_workspace_id(json: &str) -> Option<i64> {
    serde_json::from_str::<Value>(json).ok()?.get("id")?.as_i64()
}

// `hyprctl activewindow -j` prints an empty object when nothing has focus.
pub fn parse_address(json: &str) -> Option<String> {
    let address = serde_json::from_str::<Value>(json).ok()?;
    let address = address.get("address")?.as_str()?;
    (!address.is_empty()).then(|| address.to_string())
}

fn toggle_word(enable: bool) -> &'static str {
    if enable {
        "enable"
    } else {
        "disable"
    }
}

pub fn float_expr(pid: u32, enable: bool) -> String {
    format!(
        "hl.dsp.window.float({{ action = \"{}\", window = \"pid:{pid}\" }})",
        toggle_word(enable)
    )
}

pub fn pin_expr(pid: u32, enable: bool) -> String {
    format!(
        "hl.dsp.window.pin({{ action = \"{}\", window = \"pid:{pid}\" }})",
        toggle_word(enable)
    )
}

pub fn move_expr(pid: u32, workspace: &str) -> String {
    format!(
        "hl.dsp.window.move({{ workspace = \"{workspace}\", follow = false, window = \"pid:{pid}\" }})"
    )
}

pub fn resize_expr(pid: u32, width: u32, height: u32) -> String {
    format!("hl.dsp.window.resize({{ x = {width}, y = {height}, window = \"pid:{pid}\" }})")
}

pub fn move_to_expr(pid: u32, x: i64, y: i64) -> String {
    format!("hl.dsp.window.move({{ x = {x}, y = {y}, window = \"pid:{pid}\" }})")
}

pub fn focus_expr(pid: u32) -> String {
    format!("hl.dsp.focus({{ window = \"pid:{pid}\" }})")
}

pub fn focus_address_expr(address: &str) -> String {
    format!("hl.dsp.focus({{ window = \"address:{address}\" }})")
}

fn hyprctl(args: &[&str]) -> Option<String> {
    let output = Command::new("hyprctl").args(args).output().ok()?;
    output
        .status
        .success()
        .then(|| String::from_utf8_lossy(&output.stdout).into_owned())
}

fn dispatch(expression: &str) -> bool {
    hyprctl(&["dispatch", expression]).is_some_and(|reply| reply.trim() == "ok")
}

pub fn client(pid: u32) -> Option<Client> {
    parse_clients(&hyprctl(&["clients", "-j"])?)
        .into_iter()
        .find(|entry| entry.pid == pid)
}

// A newly mapped window appears in the client list a moment after it is shown.
fn wait_for_client(pid: u32) -> Option<Client> {
    for _ in 0..30 {
        if let Some(found) = client(pid) {
            return Some(found);
        }
        sleep(Duration::from_millis(50));
    }
    None
}

pub fn is_hidden(pid: u32) -> Option<bool> {
    client(pid).map(|entry| entry.workspace == HIDDEN_WORKSPACE)
}

// Hyprland only pins floating windows, so pinning also floats.
pub fn set_pinned(pid: u32, pinned: bool) {
    let Some(current) = wait_for_client(pid) else {
        return;
    };
    if pinned {
        if !current.floating {
            dispatch(&float_expr(pid, true));
        }
        if !current.pinned {
            dispatch(&pin_expr(pid, true));
        }
    } else if current.pinned {
        dispatch(&pin_expr(pid, false));
    }
}

// Pinned windows ignore workspace moves, so unpin first; the position and size survive the round trip.
pub fn hide(pid: u32) {
    if wait_for_client(pid).is_some_and(|current| current.pinned) {
        dispatch(&pin_expr(pid, false));
    }
    dispatch(&move_expr(pid, HIDDEN_WORKSPACE));
}

pub fn show(pid: u32, pinned: bool) {
    if let Some(id) = hyprctl(&["activeworkspace", "-j"]).and_then(|json| parse_workspace_id(&json)) {
        dispatch(&move_expr(pid, &id.to_string()));
    }
    if pinned {
        set_pinned(pid, true);
    }
}

pub fn focus(pid: u32) {
    dispatch(&focus_expr(pid));
}

pub fn active_address() -> Option<String> {
    hyprctl(&["activewindow", "-j"]).and_then(|json| parse_address(&json))
}

// Addresses come from Hyprland itself, but are checked before being placed in a dispatcher expression.
pub fn focus_address(address: &str) {
    if address.starts_with("0x") && address[2..].chars().all(|digit| digit.is_ascii_hexdigit()) {
        dispatch(&focus_address_expr(address));
    }
}

pub fn resize(pid: u32, width: u32, height: u32) {
    // The window may still be becoming floating, for example right after a pin at startup.
    for _ in 0..20 {
        if client(pid).is_some_and(|current| current.floating) {
            dispatch(&resize_expr(pid, width, height));
            keep_on_screen(pid, (i64::from(width), i64::from(height)));
            return;
        }
        sleep(Duration::from_millis(50));
    }
}

fn keep_on_screen(pid: u32, size: (i64, i64)) {
    let Some(current) = client(pid) else {
        return;
    };
    let Some(monitors) = hyprctl(&["monitors", "-j"]).map(|json| parse_monitors(&json)) else {
        return;
    };
    let Some(monitor) = monitors.iter().find(|entry| entry.id == current.monitor) else {
        return;
    };
    let target = clamp_into(current.at, size, monitor);
    if target != current.at {
        dispatch(&move_to_expr(pid, target.0, target.1));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CLIENTS: &str = r#"[
        {"address":"0x1","pid":100,"floating":false,"pinned":false,"at":[6,32],"size":[790,962],"monitor":0,"workspace":{"id":1,"name":"1"}},
        {"address":"0x2","pid":200,"floating":true,"pinned":true,"at":[695,120],"size":[1000,780],"monitor":0,"workspace":{"id":-98,"name":"special:kairos44"}},
        {"address":"0x3","pid":"bad"}
    ]"#;

    const MONITORS: &str = r#"[{"id":0,"x":0,"y":0,"width":2560,"height":1600,"scale":1.6,"reserved":[0,26,0,0]}]"#;

    fn monitor() -> Monitor {
        parse_monitors(MONITORS).remove(0)
    }

    #[test]
    fn parses_clients_and_skips_malformed_entries() {
        let clients = parse_clients(CLIENTS);
        assert_eq!(clients.len(), 2);
        assert_eq!(clients[1].pid, 200);
        assert!(clients[1].floating && clients[1].pinned);
        assert_eq!(clients[1].workspace, HIDDEN_WORKSPACE);
        assert_eq!(clients[1].at, (695, 120));
        assert_eq!(clients[1].size, (1000, 780));
    }

    #[test]
    fn parses_monitors_in_logical_pixels() {
        let monitor = monitor();
        assert_eq!((monitor.width, monitor.height), (1600, 1000));
        assert_eq!(monitor.reserved, [0, 26, 0, 0]);
    }

    #[test]
    fn pulls_a_window_that_sticks_out_back_inside() {
        let monitor = monitor();
        // The case seen on screen: a 1000 px wide window at x=695 on a 1600 px wide monitor.
        assert_eq!(clamp_into((695, 200), (1000, 620), &monitor), (600, 200));
        assert_eq!(clamp_into((10, 5), (400, 300), &monitor), (10, 26));
        assert_eq!(clamp_into((100, 100), (400, 300), &monitor), (100, 100));
    }

    #[test]
    fn a_window_bigger_than_the_screen_keeps_its_top_left() {
        assert_eq!(clamp_into((50, 50), (3000, 2000), &monitor()), (0, 26));
    }

    #[test]
    fn invalid_json_gives_no_clients() {
        assert!(parse_clients("not json").is_empty());
        assert!(parse_clients("{}").is_empty());
    }

    #[test]
    fn reads_the_active_workspace_id() {
        assert_eq!(parse_workspace_id(r#"{"id":3,"name":"3"}"#), Some(3));
        assert_eq!(parse_workspace_id("{}"), None);
    }

    #[test]
    fn reads_the_active_window_address() {
        assert_eq!(
            parse_address(r#"{"address":"0x5624f2a9cda0","class":"x"}"#),
            Some("0x5624f2a9cda0".to_string())
        );
        assert_eq!(parse_address("{}"), None);
        assert_eq!(parse_address(r#"{"address":""}"#), None);
    }

    #[test]
    fn builds_the_dispatcher_expressions_verified_on_hyprland() {
        assert_eq!(
            pin_expr(42, true),
            r#"hl.dsp.window.pin({ action = "enable", window = "pid:42" })"#
        );
        assert_eq!(
            float_expr(42, false),
            r#"hl.dsp.window.float({ action = "disable", window = "pid:42" })"#
        );
        assert_eq!(
            move_expr(42, HIDDEN_WORKSPACE),
            r#"hl.dsp.window.move({ workspace = "special:kairos44", follow = false, window = "pid:42" })"#
        );
        assert_eq!(
            resize_expr(42, 700, 500),
            r#"hl.dsp.window.resize({ x = 700, y = 500, window = "pid:42" })"#
        );
        assert_eq!(focus_expr(42), r#"hl.dsp.focus({ window = "pid:42" })"#);
        assert_eq!(
            focus_address_expr("0xabc"),
            r#"hl.dsp.focus({ window = "address:0xabc" })"#
        );
        assert_eq!(
            move_to_expr(42, 300, 200),
            r#"hl.dsp.window.move({ x = 300, y = 200, window = "pid:42" })"#
        );
    }
}
