# Kairos44 Companion App

A Tauri v2 desktop app (SolidJS + Vite + TypeScript) in [companion/](../companion)
that shows a floating Kairos44 keyboard with the active layer, its combos and
shortcuts. Live layer sync over USB is a later phase that needs a firmware
telemetry addition; until then the layer is chosen manually.

## Decisions

- SolidJS with Vite as a single-page app; SolidStart is not needed for a local
  desktop app.
- `npm` is the package manager (`pnpm` is not installed on the dev machine).
- USB first. BLE telemetry stays out of scope until USB is accepted.
- Live sync uses [zzeneg/zmk-raw-hid](https://github.com/zzeneg/zmk-raw-hid),
  which pins ZMK v0.3 like this repository. Only the left (central) half sends.
- Nothing is flashed, pushed or committed without explicit confirmation.
- Key type is shown by border colour with a legend, not by short codes on the
  key. The type name is also in each key's accessible label and in the details
  panel, so colour is never the only cue. Gestures (hold, tap then hold, double
  tap, and so on) appear as small chips inside the key, and the details panel
  lists every gesture in full.
- Every one of the 44 positions is drawn on every layer. `&trans` keys are
  dashed and dimmed and show the BASE key they inherit; `&none` keys are
  dotted and labelled "none".
- A permanent combo marker on keys was removed because nearly every BASE key
  is in a combo. Hovering a combo highlights its keys, and hovering a key lists
  its combos.

## Phase Status

| #   | Phase                                                             | Status                                                                             |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 0   | Tracking document and links                                       | Done                                                                               |
| 1   | App scaffold and manual layer viewer                              | Done (accepted by user)                                                            |
| 2   | Window behavior, three views, per-view pin and opacity, show/hide | Implemented and verified on Hyprland; real-click pass-through and Windows untested |
| 3   | Firmware telemetry (raw HID report)                               | Not started                                                                        |
| 4   | Host HID bridge (Rust `hidapi`)                                   | Not started                                                                        |
| 5   | Generate and validate layout data from the compiled keymap        | Not started                                                                        |
| 6   | Packaging (Linux, Windows)                                        | Not started                                                                        |

## User manual

Everything about using, configuring and extending the app is documented in a
manual that is kept with the code, in [companion/docs/](../companion/docs). The
same pages are shown inside the app (Manual button, `F1` or
`kairos44-companion --manual`) and can be built as a MkDocs website
(`npm run docs:serve` or `npm run docs:build` in `companion/`, after
`pip install -r requirements-docs.txt`).

| Page                                                        | Covers                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| [Home](../companion/docs/index.md)                          | Overview, quick start, current limits                      |
| [Install and run](../companion/docs/install.md)             | Requirements, build, all npm scripts, where data is stored |
| [The three views](../companion/docs/views.md)               | Normal, Compact and Shortcuts                              |
| [Reading a key](../companion/docs/reading-keys.md)          | Key types, gestures, combo names, layers                   |
| [Window controls](../companion/docs/window-controls.md)     | Pin, opacity, click-through, sizes                         |
| [Command line](../companion/docs/command-line.md)           | Every flag                                                 |
| [Key bindings](../companion/docs/keybindings.md)            | The `SUPER + SHIFT + K/L/J/H` chords                       |
| [Hyprland](../companion/docs/hyprland.md)                   | How pinning, hiding and sizing work                        |
| [Layer and combo reference](../companion/docs/reference.md) | Generated from the app's data                              |
| [Troubleshooting](../companion/docs/troubleshooting.md)     | Common problems                                            |
| [Development](../companion/docs/development.md)             | Code layout, data model, tests, docs workflow              |
| [Roadmap](../companion/docs/roadmap.md)                     | Phases 3 to 6 and other planned work                       |

This tracker keeps the plan, decisions, risks and the dated log. Do not
duplicate manual content here.

Two tests keep the manual honest. `src/reference.test.ts` fails when the
generated reference page is stale (`npm run docs:reference` updates it), and
`src/docs.test.ts` fails when a page is missing from the navigation, a link or
image is broken, or a command-line flag, npm script or app event is not
documented.

## Known Risks

- Wayland compositors (Hyprland) ignore app-requested always-on-top; a
  Hyprland float and pin window rule is needed.
- Linux needs a one-time udev rule for hidraw access (needs root once). Running
  the app needs no elevated rights on Linux, Windows or macOS.
- Telemetry must not change typing, combo or trackpad behavior; compare with it
  enabled and disabled before accepting.
- macOS is supported by Tauri but is not planned or verified.

## Implementation Log

- 2026-10-31: Plan approved; toolchain check found node 24, npm 11, rust 1.99,
  webkit2gtk-4.1, libudev and hidapi-hidraw present; `pnpm` and `cargo tauri`
  absent.
- 2026-10-31: Phase 1 implemented in `companion/`. Vite 7, Solid 1.9,
  TypeScript 5.9, Vitest 5 (Vitest 3 was rejected: `npm audit` reported two
  critical advisories), Tauri 2.12 with the CLI from npm. Layer and combo data
  is curated in `src/layout.ts` for the trackpad NAVIGATION variant; the three
  private-text combos are shown as "Private text macro" so the window is safe
  to screen-share. Generated mobile icons were removed.
  Verified: `npm run typecheck`, `npm test` (11 tests: 44 keys per layer,
  unique non-conflicting combos, cut/copy/paste BASE-only, grid geometry),
  `npm run build`, `cargo check` and `npm run tauri dev` starting the window
  with no errors, `npm audit` clean.
- 2026-10-31: First review feedback applied. All 44 keys are now drawn on every
  layer (transparent and unassigned keys are explicit), keys carry a type
  (regular, home-row mod, layer/mode tap, tap dance, momentary, sticky or
  switch layer, mouse, system, media) and a gesture list. Data model moved to
  `src/keys.ts` (types, builders, kind and gesture info), `src/layers.ts`
  (seven layers) and `src/layout.ts` (combos). Added `Legend` and `KeyDetails`
  components. The default window is now 1000 by 780. Verified: typecheck,
  15 tests, `npm run build`, and screenshots of BASE, NAVIGATION and UTILS in
  a browser. Still to check: the native Tauri window, the keyboard-only
  NAVIGATION variant (not modeled), and the Phase 5 generated data.
- 2026-10-31: The combo list now shows the keys to press beside each action,
  for example Undo is `Shift` + `Z` and Cut is `Z` + `X`. Labels come from the
  selected layer; unassigned keys (the COMBOS layer) fall back to the BASE
  keycap, because the physical key is still the one to press. Added
  `comboKeyLabels()` with two tests (17 total). Verified: typecheck, tests and a
  browser screenshot of the combo list.
- 2026-10-31: Phase 1 marked complete (accepted by user). Phase 2 implemented:
  frameless transparent window with a custom title bar, Pin, Click-through,
  Hide from taskbar and Opacity controls, remembered settings, window-state and
  single-instance plugins, and the `--toggle-click-through` and `--toggle-pin`
  commands. New files: `src/settings.ts`, `src/windowing.ts`,
  `src/windowBehavior.ts`, `src/components/WindowBar.tsx`. Verified: typecheck,
  23 frontend tests, 3 Rust tests for the command parser, `npm run build`, and
  the native window under Hyprland 0.56 (class `kairos44-companion`; tiled and
  unpinned by default; floating and pinned after the dispatchers; title bar,
  banner and toggles rendered; `--toggle-click-through` from a second launch
  turned the banner on and off in the running window). Opacity now fades only
  the background; the unfocused fading seen earlier came from Hyprland, not the
  app. Not verified: that real mouse clicks pass through the window,
  Windows behavior, and `cargo clippy` (not installed).
- 2026-10-31: Three views added (Normal, Compact, Shortcuts) with per-view Pin,
  Opacity and size. Compact shows each key's gestures and combos with a
  tooltip; Shortcuts is a filterable combo list. Settings moved to a versioned
  per-view format that migrates the earlier single-window settings. Rust gained
  `src/hyprland.rs` (pin, hide, show, resize, keep on screen, focus restore,
  all through the `hyprctl` Lua dispatchers) and the commands `--toggle`,
  `--show`, `--hide`, `--next-view` and `--view <name>`. Window size is now
  stored per view, so only the position is restored by the window-state plugin.
  Verified on Hyprland 0.56 with the native app: it starts floating and pinned;
  `--view` resizes to each view's size; a 1000 px window that stuck out of a
  1600 px screen was moved back inside; per-view pin switches with the view;
  `--toggle` hides to `special:kairos44` and shows again on the active
  workspace with pin, position and size kept; three hide and show cycles left
  keyboard focus on the previous window. Also 36 frontend tests and 14 Rust
  tests. The key combos for show/hide are documented but not bound; the
  Hyprland config was not edited. Not verified: real clicks passing through in
  click-through mode, Windows and macOS, and older Hyprland versions that do not
  use the Lua dispatcher syntax.
- 2026-10-31: With your approval, the four show/hide, next-view, pin and
  click-through bindings (`SUPER + SHIFT + K`, `L`, `J`, `H`) were added to
  `~/.config/hypr/hyprland.lua`. Hyprland reloaded without config errors and
  listed all four. The optional unfocused-opacity rule was not added. The key
  presses themselves were not tested; the commands they run were.
- 2026-10-31: User manual written in `companion/docs/` (twelve pages, four
  screenshots in `docs/img/`) and wired three ways. In the app: a Manual
  button, `F1`, Esc to close and `--manual`, rendering the same Markdown files
  with `marked` (links between pages navigate, other links are inert). As a
  website: `mkdocs.yml`, `requirements-docs.txt`, `npm run docs:serve` and
  `docs:build`; `mkdocs build --strict` passes. The layer and combo reference
  is generated from the app's data (`npm run docs:reference`). Tests added:
  `src/reference.test.ts` (generated page up to date) and `src/docs.test.ts`
  (navigation, links, images, flags, scripts, events and key types all
  documented). Found while checking the output: MkDocs does not unescape
  `\|` inside code in tables, so the reference uses HTML `<code>` elements.
  Screenshots were taken from the dev server in a browser because the native
  window is translucent and would show whatever is behind it. Verified: 51+
  frontend tests, 15 Rust tests, strict MkDocs build, and the manual rendered
  in a browser (navigation, tables, images, the 13-column layer tables).
  Not verified: the `--manual` command in the native window by eye.
- Documentation tooling note: Material for MkDocs announces end of life on
  2027-05-05 and points to Zensical as its successor; the build works today.
