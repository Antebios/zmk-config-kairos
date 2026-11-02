use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{App, AppHandle};

use crate::{handle_command, Command};

const TOGGLE: &str = "toggle";
const NEXT_VIEW: &str = "next-view";
const TOGGLE_PIN: &str = "toggle-pin";
const TOGGLE_LAYER_PEEK: &str = "toggle-layer-peek";
const TOGGLE_CLICK_THROUGH: &str = "toggle-click-through";
const MANUAL: &str = "manual";
const QUIT: &str = "quit";

pub fn command_for_menu_id(id: &str) -> Option<Command> {
    match id {
        TOGGLE => Some(Command::Toggle),
        NEXT_VIEW => Some(Command::NextView),
        TOGGLE_PIN => Some(Command::TogglePin),
        TOGGLE_LAYER_PEEK => Some(Command::ToggleLayerPeek),
        TOGGLE_CLICK_THROUGH => Some(Command::ToggleClickThrough),
        MANUAL => Some(Command::Manual),
        QUIT => Some(Command::Quit),
        _ => None,
    }
}

// The tray icon is the "is it running" indicator, and its menu still works when the window is hidden or click-through.
pub fn create(app: &App) -> tauri::Result<()> {
    let handle = app.handle();
    let item = |id: &str, text: &str| MenuItem::with_id(handle, id, text, true, None::<&str>);
    let toggle = item(TOGGLE, "Show or hide window")?;
    let next_view = item(NEXT_VIEW, "Next view")?;
    let toggle_pin = item(TOGGLE_PIN, "Pin on top or unpin")?;
    let layer_peek = item(TOGGLE_LAYER_PEEK, "Layer peek on or off")?;
    let click_through = item(TOGGLE_CLICK_THROUGH, "Click-through on or off")?;
    let manual = item(MANUAL, "Open or close the manual")?;
    let separator = PredefinedMenuItem::separator(handle)?;
    let quit = item(QUIT, "Quit Kairos44 Companion")?;
    let menu = Menu::with_items(
        handle,
        &[
            &toggle,
            &next_view,
            &toggle_pin,
            &layer_peek,
            &click_through,
            &manual,
            &separator,
            &quit,
        ],
    )?;

    let mut builder = TrayIconBuilder::with_id("main")
        .tooltip("Kairos44 Companion")
        .menu(&menu)
        // Windows and macOS: a left click toggles the window and the menu opens on a right click.
        .show_menu_on_left_click(false)
        .on_menu_event(|app: &AppHandle, event| {
            if let Some(command) = command_for_menu_id(event.id().as_ref()) {
                handle_command(app, command);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                handle_command(tray.app_handle(), Command::Toggle);
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(handle)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_menu_entry_maps_to_a_command() {
        for id in [
            TOGGLE,
            NEXT_VIEW,
            TOGGLE_PIN,
            TOGGLE_LAYER_PEEK,
            TOGGLE_CLICK_THROUGH,
            MANUAL,
            QUIT,
        ] {
            assert!(command_for_menu_id(id).is_some(), "{id}");
        }
    }

    #[test]
    fn quit_entry_quits() {
        assert_eq!(command_for_menu_id(QUIT), Some(Command::Quit));
    }

    #[test]
    fn unknown_ids_do_nothing() {
        assert_eq!(command_for_menu_id("other"), None);
    }
}
