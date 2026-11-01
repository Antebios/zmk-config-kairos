# Install and run

## Requirements

The app is built from source. These are the versions it was developed with.

| Tool                                             | Version used   | Notes                                                |
| ------------------------------------------------ | -------------- | ---------------------------------------------------- |
| Node.js and npm                                  | 24.11 and 11.6 | `pnpm` is not needed                                 |
| Rust (stable)                                    | 1.99           | `cargo` and `rustc`                                  |
| WebKitGTK                                        | 4.1 (2.54)     | `webkit2gtk-4.1` development files                   |
| GTK 3, libsoup 3, JavaScriptCoreGTK 4.1, librsvg | current        | Needed by Tauri on Linux                             |
| libudev, hidapi (hidraw)                         | current        | Needed to read the keyboard ([Live layer sync](live-sync.md)) |

On Arch Linux the Tauri packages are `webkit2gtk-4.1`, `gtk3`, `libsoup3`,
`librsvg` and `base-devel`. See the Tauri documentation for other
distributions.

No elevated rights are needed to build or run the app. Reading the keyboard on
Linux needs a one-time udev rule, installed with `sudo` once (see the
live-sync section below).

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

## Packages

`npm run package` builds installable packages for the platform you run it on
and collects them in `release/` with a `SHA256SUMS` file. A package for another
platform has to be built on that platform.

| Platform                  | Produces                                                  | Install with                                  | Tested |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------- | ------ |
| Arch Linux and Omarchy    | `kairos44-companion-<version>-1-x86_64.pkg.tar.zst`       | `sudo pacman -U` that file                    | Built and inspected |
| Debian and Ubuntu         | `Kairos44-Companion_<version>_amd64.deb`                  | `sudo apt install ./` that file               | Built and inspected |
| Fedora and openSUSE       | `Kairos44-Companion-<version>-1.x86_64.rpm`               | `sudo dnf install ./` that file               | Built and inspected |
| Any Linux                 | `Kairos44-Companion_<version>_amd64.AppImage`             | Make it executable and run it                 | Starts |
| Windows                   | `Kairos44 Companion_<version>_x64-setup.exe` (NSIS)       | Run it; adds the Start menu entry             | No     |
| macOS                     | `.dmg` containing the app                                 | Drag the app to Applications                  | No     |

The Arch, Debian and RPM packages install the udev rule, so reading the keyboard
needs no extra step. The AppImage cannot install system files, so use the rule
from the section below with it. Arch packaging needs `makepkg`, `rust`, `nodejs`
and `npm`; the package is built from this checkout (`packaging/arch/PKGBUILD`),
not from a downloaded source, and its licence field says `custom` because the
project has no licence file yet. If you installed with `npm run app:install`,
run `npm run app:uninstall` first so the packaged copy is the one that starts, and delete
`/etc/udev/rules.d/70-kairos44-companion.rules` if you installed the rule by hand.

The Windows installer is built by `npm run package` on Windows with Node.js, Rust
(MSVC) and the WebView2 runtime; Tauri downloads the NSIS tools on first use. It
installs for the current user and needs no administrator rights. The Windows and
macOS packages have not been built.

## Reading the keyboard on Linux

The keyboard's state report is a raw HID device that only root can open by
default. This rule lets the logged-in user read just that interface (USB
interface 1, not the one that types). Run it once from the `companion` folder:

```sh
sudo install -m 644 contrib/udev/70-kairos44-companion.rules /etc/udev/rules.d/
sudo udevadm control --reload
sudo udevadm trigger --subsystem-match=hidraw --action=add
```

Then unplug and replug the left half if the app still says Keyboard not found.
The rule uses the `uaccess` tag, so access follows whoever is logged in at the
keyboard. Nothing is needed on Windows or macOS ([Live layer sync](live-sync.md)).

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
| `package`                      | Build distributable packages for this platform into `release/`         |
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
| `keymap:generate`              | Refresh the compiled keymap data from the firmware build (developer)    |
| `keymap:check`                 | Fail if that data is out of date (developer)                            |
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
