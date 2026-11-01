# Development

This page is for working on the app itself. The project plan and a dated log of
what was done are in `docs/kairos44-companion-app.md` in the repository root,
outside this manual.

## Layout of the code

```text
companion/
  docs/                  This manual (MkDocs pages, read in the app too)
  mkdocs.yml             MkDocs site configuration
  src/                   Web UI (SolidJS)
    index.tsx            Entry point
    App.tsx              Shell: title bar, layer tabs, the selected view
    store.ts             Signals: layer, view, per-view settings, manual
    settings.ts          Settings schema, defaults, parsing and migration
    windowing.ts         Calls into Tauri (window actions, resize, events)
    windowBehavior.ts    Effects: pin, opacity, size, saved settings, commands
    keys.ts              Key types, gestures, key builders
    layers.ts            The seven layers (hand-written key data)
    layout.ts            Combos, short names, hints, descriptions, filtering
    geometry.ts          Where each of the 44 keys sits on the grid
    components/          Keyboard, Legend, KeyDetails, ComboList, ShortcutsView,
                         LayerTabs, KeyboardStatus, WindowBar, Manual
    keyboard.ts          Layer, mode, modifier and lock logic for the live state
    manual/              Loads and renders the pages in docs/
  src-tauri/             Rust shell (Tauri 2)
    src/lib.rs           Commands, command-line parsing, show and hide
    src/tray.rs          Tray icon and menu
    src/keyboard.rs      Reads the keyboard's USB report (hidapi) on a thread
    src/hyprland.rs      Hyprland control through hyprctl
    tauri.conf.json      Window and bundle configuration
    capabilities/        Permissions the web UI is granted
```

## Data model

`src/keys.ts` defines the vocabulary.

- A `KeyCell` has a `label`, a `kind` (one of twelve), an optional `tap`
  description and a list of `gestures`. Transparent cells also carry the kind of
  the BASE key they inherit.
- Builders create cells: `key`, `homeRowMod`, `layerTap`, `tapDance`,
  `momentary`, `sticky`, `switchTo`, `mouse`, `system`, `media`, `unassigned`
  and `transparent`.

`src/layers.ts` builds the seven layers, each exactly 44 cells in the keymap's
order: three rows of twelve (six left then six right), then six thumb keys, then
the two extra Kairos44 thumbs. Transparent cells are resolved against BASE once
every layer exists.

`src/layout.ts` holds the combos. A `Combo` has a name, an action, a short name,
the key positions, the layers it applies to and a kind. Helper functions give a
layer's combos, the combos on one key (`comboHints`), the keys to press
(`comboKeyLabels`), a tooltip text (`describeKey`) and the Shortcuts filter
(`filterCombos`).

Key positions are numbered as in `boards/shields/common/kairos/positions.keymap`:
0 to 35 for the main rows, 36 to 41 for the thumbs, 42 and 43 for the extra
Kairos44 thumbs.

## Changing the keyboard data

| To change                 | Edit                                                                            | Then                                             |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| A key on a layer          | `src/layers.ts`                                                                 | Run the tests                                    |
| A combo or its short name | `src/layout.ts`                                                                 | `npm run docs:reference`                         |
| Add a layer               | `RAW_LAYERS` in `src/layers.ts`, `LAYER` and the layer lists in `src/layout.ts` | Update the layer count test and `docs:reference` |
| A key type or gesture     | `src/keys.ts` and the colours in `src/styles.css`                               | Update the legend text in `docs/reading-keys.md` |

The tests catch a wrong key count, a combo that uses an invalid position, two
combos on the same keys and layer, and key labels that are empty.

Never write what the private-text combos type. They are shown only as "Private
text macro", so the window is safe to share on screen.

## Settings

Settings are stored in the web view's `localStorage` under `kairos44.window` as
JSON:

```json
{
  "view": "normal",
  "skipTaskbar": false,
  "views": {
    "normal": {
      "alwaysOnTop": true,
      "opacity": 1,
      "size": { "width": 1000, "height": 780 }
    },
    "compact": {
      "alwaysOnTop": true,
      "opacity": 1,
      "size": { "width": 1000, "height": 620 }
    },
    "shortcuts": {
      "alwaysOnTop": true,
      "opacity": 1,
      "size": { "width": 460, "height": 760 }
    }
  }
}
```

`parseSettings` in `src/settings.ts` validates every field, clamps opacity to
0.3 to 1 and sizes to 240 to 4000, falls back to defaults for anything invalid,
and migrates the earlier single-window format (`alwaysOnTop`, `skipTaskbar`,
`opacity`) to every view. Click-through is deliberately never stored.

## Rust side

| Item                                     | Purpose                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Command `set_always_on_top(pinned)`      | Sets the toolkit's always-on-top and, on Hyprland, floats and pins the window                 |
| Command `set_window_size(width, height)` | Resizes the window; on Hyprland also resizes it through the compositor and keeps it on screen |
| Event `toggle-click-through`             | Emitted by `--toggle-click-through`                                                           |
| Event `toggle-pin`                       | Emitted by `--toggle-pin`                                                                     |
| Event `next-view`                        | Emitted by `--next-view`                                                                      |
| Event `set-view`                         | Emitted by `--view <name>`, carrying the name                                                 |
| Event `toggle-manual`                    | Emitted by `--manual`                                                                         |
| Command `get_keyboard()`                 | Returns the latest keyboard connection and state, for a UI that starts after the first event  |
| Event `keyboard-state`                   | Emitted by the keyboard reader when the connection or the reported state changes              |
| Plugin single-instance                   | Forwards a second launch's arguments to the running app                                       |
| Plugin window-state                      | Restores the window position only; sizes belong to the views                                  |

`parse_command` in `src/lib.rs` turns the arguments into a `Command`. All
Hyprland calls are in `src/hyprland.rs`; pure parts (parsing `hyprctl` JSON,
building dispatcher expressions, keeping a window on screen) are unit tested.
The `hyprctl` calls themselves were checked against a running Hyprland.

The keyboard reader in `src/keyboard.rs` finds the keyboard's vendor interface
(usage page `0xFF4B`, usage `1`), asks for a snapshot, then reads reports and
emits `keyboard-state`. It retries every 3 seconds while the keyboard is absent.
`parse_report` is checked against the golden bytes in
`docs/kairos44-host-telemetry.md` in the repository root, so the format cannot
drift from the firmware. The UI side, which layer to show and what the chips
say, is in `src/keyboard.ts`.

## Tests

```sh
npm run check          # typecheck, frontend tests, Rust tests, cargo check
npm test               # frontend tests only
npm run test:rust      # Rust tests only
```

| File                        | Covers                                                                          |
| --------------------------- | ------------------------------------------------------------------------------- |
| `src/layout.test.ts`        | Layer sizes, labels, transparent keys, combo validity and conflicts, key labels |
| `src/views.test.ts`         | Combo hints, key descriptions, the filter, private-text safety                  |
| `src/geometry.test.ts`      | The grid position of every key                                                  |
| `src/settings.test.ts`      | Settings parsing, clamping, migration and view cycling                          |
| `src/keyboard.test.ts`      | Active layer, pointer mode, modifiers, locks and output labels                  |
| `src/reference.test.ts`     | The generated reference page is up to date                                      |
| `src/docs.test.ts`          | Manual pages, navigation, links and images are consistent                       |
| `src-tauri/src/lib.rs`      | The command-line parser                                                         |
| `src-tauri/src/tray.rs`     | Tray menu ids map to commands                                                   |
| `src-tauri/src/hyprland.rs` | `hyprctl` parsing, dispatcher expressions, on-screen clamping                   |
| `src-tauri/src/keyboard.rs` | Keyboard report parsing against the golden bytes, and the snapshot request      |

## The manual

The pages in `docs/` are plain Markdown with relative links between pages and
images in `docs/img/`. The same files are used twice.

- **In the app.** `src/manual/pages.ts` imports every page at build time and the
  Manual component renders it with the `marked` library. Links between pages
  switch page; other links are shown but do not open, so the web view can never
  navigate away from the app.
- **As a website.** `mkdocs.yml` points MkDocs at `docs/`. Install the tools with
  `pip install -r requirements-docs.txt`, then run `npm run docs:serve` to
  preview or `npm run docs:build` to write the site to `site/`. With `uv`
  installed, `uvx --from mkdocs-material mkdocs serve` works without installing.

Use only features both renderers understand: headings, paragraphs, lists,
tables, fenced code, inline code, bold and italic, images and links to other
pages. Do not use MkDocs-only syntax such as admonitions, tabs or in-page
anchors.

When you add a page, list it in three places: `mkdocs.yml`, `src/manual/pages.ts`
and the table in `docs/index.md`. `src/docs.test.ts` fails if they disagree or a
link or image is missing.

`docs/reference.md` is generated. After changing layers or combos, run
`npm run docs:reference`; `src/reference.test.ts` fails when the file is stale.

Screenshots in `docs/img/` are of the app at the default sizes. Retake them if
the look changes.

## Conventions

- Comments say only what the code cannot show; one short line.
- Anything a keyboard user could do by key is reachable from the command line.
- The app never opens a network connection and never runs a shell command except
  `hyprctl`.
- Keep `npm run check` green before committing. Nothing here is committed
  automatically.
