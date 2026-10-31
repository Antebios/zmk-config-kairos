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

## All scripts

| Script                         | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `dev`                          | Web UI only, in a browser, with hot reload                              |
| `dev:app`                      | Native window with hot reload                                           |
| `preview`                      | Serve the built web bundle                                              |
| `build`                        | Typecheck, then build the web bundle                                    |
| `build:bin`                    | Release binary without installers                                       |
| `build:app`                    | Release binary plus installers                                          |
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
