# Install and run

## Requirements

The app is built from source. These are the versions it was developed with.

| Tool                                             | Version used   | Notes                                                |
| ------------------------------------------------ | -------------- | ---------------------------------------------------- |
| Node.js and npm                                  | 24.11 and 11.6 | `pnpm` is not needed                                 |
| Rust (stable)                                    | 1.99           | `cargo` and `rustc`                                  |
| WebKitGTK                                        | 4.1 (2.54)     | `webkit2gtk-4.1` development files                   |
| GTK 3, libsoup 3, JavaScriptCoreGTK 4.1, librsvg | current        | Needed by Tauri on Linux                             |
| libudev, hidapi (hidraw)                         | current        | Not used yet; needed for the planned live layer sync |

On Arch Linux the Tauri packages are `webkit2gtk-4.1`, `gtk3`, `libsoup3`,
`librsvg` and `base-devel`. See the Tauri documentation for other
distributions.

No elevated rights are needed to build or run the app. The planned live layer
sync will need a one-time udev rule on Linux so a normal user can read the
keyboard's raw HID device.

## Build and run

Run everything from the `companion` folder.

```sh
npm install              # once, and after dependency changes
npm run dev:app          # native window with hot reload, for development
npm run build:bin        # release binary without installers
```

The release binary is
`src-tauri/target/release/kairos44-companion`. Start it directly, or bind it to
a key ([Key bindings](keybindings.md)) so the first key press starts it and
later presses toggle it.

`npm run build:app` also builds installers. That path has not been tried.

## Install it as a tray app

The app runs from the tray (Windows), the status notifier tray (Linux) or the
menu bar (macOS), so you can see whether it is running. The install script
stops a running copy, builds, installs and registers a launcher entry for your
platform:

```sh
npm run app:install     # build, install and register the launcher entry
npm run app:start       # start the installed app
npm run app:kill        # stop the running app
npm run app:uninstall   # stop it and remove it (settings are kept)
```

Add `-- --skip-build` to `app:install` to reuse the last build.

| Platform | What `app:install` does                                                                                                                | Where you start it                        | Tested |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------ |
| Linux    | Copies the binary to `~/.local/bin`, adds icons under `~/.local/share/icons/hicolor` and `~/.local/share/applications/*.desktop` file | The application launcher (Omarchy: Walker) | Yes    |
| Windows  | Builds the NSIS installer and runs it silently for the current user; it adds a Start menu entry (Kairos44) and an uninstaller           | Start menu                                | No     |
| macOS    | Builds the app bundle and copies it to `~/Applications`                                                                                | Launchpad or Spotlight                    | No     |

The Windows and macOS paths are written but have not been run, because the
development machine is Linux. The Windows installer needs the NSIS tools, which
Tauri downloads on first use. A build for macOS is not signed or notarized, so
the first start needs a right click and Open.

Because the window hides to the tray when closed, a key binding that runs
`kairos44-companion --toggle` and the tray icon both bring it back
([Window controls](window-controls.md)). If you bound the binary under
`src-tauri/target/release`, point the binding at the installed one
(`~/.local/bin/kairos44-companion`) so it always runs what was last installed.

## All scripts

| Script                         | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `dev`                          | Web UI only, in a browser, with hot reload                              |
| `dev:app`                      | Native window with hot reload                                           |
| `preview`                      | Serve the built web bundle                                              |
| `build`                        | Typecheck, then build the web bundle                                    |
| `build:bin`                    | Release binary without installers                                       |
| `build:app`                    | Release binary plus installers                                          |
| `app:build`                    | Build the artifact `app:install` needs on this platform                 |
| `app:install`                  | Stop the app, build, install and register the launcher entry            |
| `app:uninstall`                | Stop the app and remove it                                              |
| `app:start`                    | Start the installed app                                                 |
| `app:kill`                     | Stop the running app                                                    |
| `typecheck`, `typecheck:watch` | TypeScript check, once or watching                                      |
| `test`, `test:watch`           | Frontend tests, once or watching                                        |
| `test:rust`, `test:all`        | Rust tests, or frontend and Rust together                               |
| `check:rust`                   | `cargo check`                                                           |
| `check`                        | Typecheck, all tests and `cargo check`; run this before committing      |
| `docs:reference`               | Regenerate the generated reference page ([Development](development.md)) |
| `docs:serve`, `docs:build`     | Preview or build this manual as a MkDocs site                           |
| `audit`                        | `npm audit`                                                             |
| `clean`, `clean:rust`          | Remove the web bundle, or the Rust build output                         |

`rustfmt` and `clippy` are not installed on the development machine, so there
are no format or lint scripts yet.

## Where the app keeps its data

| Location                               | Holds                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `~/.local/share/dev.kairos.companion/` | The web view's storage, including your view, pin, opacity and size settings |
| `~/.config/dev.kairos.companion/`      | The saved window position                                                   |

To reset every setting, close the app and delete those two folders.

## Starting with your session

On Hyprland you can start the app when you log in by adding a line to
`~/.config/hypr/autostart.lua` (or the `autostart.conf` your setup uses) that
launches the release binary. The app opens in the view and pin state you used
last. Hide it straight away with `kairos44-companion --hide` if you would
rather call it up on demand. This has not been set up for you.
