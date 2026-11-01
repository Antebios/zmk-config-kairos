mod hyprland;
mod keyboard;
mod tray;

use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, State, WebviewWindow, WindowEvent};
use tauri_plugin_window_state::StateFlags;

#[derive(Default)]
struct AppState {
    // Last pin requested by the UI, re-applied when the window is shown again.
    pinned: Mutex<bool>,
    // Latest keyboard connection and state, for a UI that starts after the first event.
    keyboard: Mutex<keyboard::KeyboardEvent>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Command {
    // A plain launch: show the window and give it focus.
    Show,
    ShowQuietly,
    Hide,
    Toggle,
    ToggleClickThrough,
    TogglePin,
    NextView,
    SetView(String),
    Manual,
    // Ends the app; closing the window only hides it to the tray.
    Quit,
}

// Lets a window-manager keybinding drive a running instance, since a hidden or click-through window cannot be clicked.
pub fn parse_command(args: &[String]) -> Command {
    let mut rest = args.iter().skip(1);
    while let Some(arg) = rest.next() {
        match arg.as_str() {
            "--show" => return Command::ShowQuietly,
            "--hide" => return Command::Hide,
            "--toggle" => return Command::Toggle,
            "--toggle-click-through" => return Command::ToggleClickThrough,
            "--toggle-pin" => return Command::TogglePin,
            "--next-view" => return Command::NextView,
            "--manual" => return Command::Manual,
            "--quit" => return Command::Quit,
            "--view" => {
                if let Some(name) = rest.next() {
                    return Command::SetView(name.clone());
                }
            }
            other => {
                if let Some(name) = other.strip_prefix("--view=") {
                    return Command::SetView(name.to_string());
                }
            }
        }
    }
    Command::Show
}

fn is_hidden(window: &WebviewWindow) -> bool {
    if hyprland::is_available() {
        if let Some(hidden) = hyprland::is_hidden(std::process::id()) {
            return hidden;
        }
    }
    !window.is_visible().unwrap_or(true)
}

fn present(app: &AppHandle, take_focus: bool) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if hyprland::is_available() {
        let pinned = *app.state::<AppState>().pinned.lock().unwrap();
        let pid = std::process::id();
        thread::spawn(move || {
            // Showing a window can pull focus to it, which would swallow what the user is typing.
            let previous = if take_focus {
                None
            } else {
                hyprland::active_address()
            };
            if hyprland::is_hidden(pid) == Some(true) {
                hyprland::show(pid, pinned);
            }
            if take_focus {
                hyprland::focus(pid);
            } else if let Some(address) = previous {
                if hyprland::active_address().as_deref() != Some(address.as_str()) {
                    hyprland::focus_address(&address);
                }
            }
        });
        return;
    }
    let _ = window.show();
    let _ = window.unminimize();
    if take_focus {
        let _ = window.set_focus();
    }
}

fn dismiss(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    if hyprland::is_available() {
        thread::spawn(|| hyprland::hide(std::process::id()));
        return;
    }
    let _ = window.hide();
}

fn handle_command(app: &AppHandle, command: Command) {
    match command {
        Command::Show => present(app, true),
        Command::ShowQuietly => present(app, false),
        Command::Hide => dismiss(app),
        Command::Toggle => {
            let hidden = app
                .get_webview_window("main")
                .is_some_and(|window| is_hidden(&window));
            if hidden {
                present(app, false);
            } else {
                dismiss(app);
            }
        }
        Command::ToggleClickThrough => {
            let _ = app.emit("toggle-click-through", ());
        }
        Command::TogglePin => {
            let _ = app.emit("toggle-pin", ());
        }
        Command::NextView => {
            let _ = app.emit("next-view", ());
        }
        Command::SetView(name) => {
            let _ = app.emit("set-view", name);
        }
        Command::Manual => {
            present(app, false);
            let _ = app.emit("toggle-manual", ());
        }
        Command::Quit => app.exit(0),
    }
}

// On Hyprland the compositor, not the toolkit, decides stacking, so pinning is done through it.
#[tauri::command]
fn set_always_on_top(window: WebviewWindow, state: State<AppState>, pinned: bool) {
    *state.pinned.lock().unwrap() = pinned;
    let _ = window.set_always_on_top(pinned);
    if hyprland::is_available() {
        let pid = std::process::id();
        thread::spawn(move || {
            if hyprland::is_hidden(pid) != Some(true) {
                hyprland::set_pinned(pid, pinned);
            }
        });
    }
}

#[tauri::command]
fn set_window_size(window: WebviewWindow, width: u32, height: u32) {
    let _ = window.set_size(LogicalSize::new(f64::from(width), f64::from(height)));
    if hyprland::is_available() {
        thread::spawn(move || hyprland::resize(std::process::id(), width, height));
    }
}

#[tauri::command]
fn get_keyboard(state: State<AppState>) -> keyboard::KeyboardEvent {
    state.keyboard.lock().unwrap().clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            handle_command(app, parse_command(&args));
        }))
        // Size is stored per view by the UI, so only the position is restored here.
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::POSITION)
                .build(),
        )
        .manage(AppState::default())
        .setup(|app| {
            // A menu bar app on macOS: no Dock icon, only the tray icon.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            // Without a tray host (a bar with no tray) the app still works as a plain window.
            if let Err(error) = tray::create(app) {
                eprintln!("Tray icon unavailable: {error}");
            }
            keyboard::start(app.handle().clone());
            Ok(())
        })
        // The window close button and a window manager close both hide to the tray.
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                dismiss(window.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![
            set_always_on_top,
            set_window_size,
            get_keyboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kairos44 Companion");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    fn parse(values: &[&str]) -> Command {
        parse_command(&args(values))
    }

    #[test]
    fn no_flags_shows_the_window() {
        assert_eq!(parse(&["kairos44-companion"]), Command::Show);
    }

    #[test]
    fn recognises_visibility_flags() {
        assert_eq!(parse(&["k", "--show"]), Command::ShowQuietly);
        assert_eq!(parse(&["k", "--hide"]), Command::Hide);
        assert_eq!(parse(&["k", "--toggle"]), Command::Toggle);
    }

    #[test]
    fn recognises_toggle_flags() {
        assert_eq!(
            parse(&["k", "--toggle-click-through"]),
            Command::ToggleClickThrough
        );
        assert_eq!(parse(&["k", "--toggle-pin"]), Command::TogglePin);
    }

    #[test]
    fn recognises_view_flags() {
        assert_eq!(parse(&["k", "--next-view"]), Command::NextView);
        assert_eq!(
            parse(&["k", "--view", "compact"]),
            Command::SetView("compact".to_string())
        );
        assert_eq!(
            parse(&["k", "--view=shortcuts"]),
            Command::SetView("shortcuts".to_string())
        );
    }

    #[test]
    fn recognises_the_manual_flag() {
        assert_eq!(parse(&["k", "--manual"]), Command::Manual);
    }

    #[test]
    fn recognises_the_quit_flag() {
        assert_eq!(parse(&["k", "--quit"]), Command::Quit);
    }

    #[test]
    fn a_view_flag_without_a_name_is_ignored() {
        assert_eq!(parse(&["k", "--view"]), Command::Show);
    }

    #[test]
    fn ignores_unknown_flags_and_the_executable_name() {
        assert_eq!(parse(&["--toggle", "--other"]), Command::Show);
    }
}
