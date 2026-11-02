import { For, Show } from "solid-js";
import { MIN_OPACITY, VIEWS, VIEW_LABEL } from "../settings";
import {
  alwaysOnTop,
  clickThrough,
  manualOpen,
  layerPeek,
  setLayerPeek,
  settingsOpen,
  setSettingsOpen,
  opacity,
  setAlwaysOnTop,
  setClickThrough,
  setManualOpen,
  setOpacity,
  setSkipTaskbar,
  setView,
  skipTaskbar,
  view,
} from "../store";
import { closeWindow, inTauri, minimizeWindow } from "../windowing";
import { Settings } from "./Settings";

export function WindowBar() {
  return (
    <>
      <div class="titlebar" data-tauri-drag-region>
        <span class="app-title" data-tauri-drag-region>
          Kairos44
        </span>
        <div class="views" role="group" aria-label="View">
          <For each={VIEWS}>
            {(id) => (
              <button
                class="toggle"
                classList={{ on: view() === id }}
                aria-pressed={view() === id}
                title={`${VIEW_LABEL[id]} view`}
                onClick={() => setView(id)}
              >
                {VIEW_LABEL[id]}
              </button>
            )}
          </For>
        </div>
        <div class="bar-controls">
          <button
            class="toggle"
            classList={{ on: layerPeek() }}
            aria-pressed={layerPeek()}
            disabled={!inTauri()}
            title={inTauri()
              ? "Show briefly only when the keyboard layer changes"
              : "Layer peek requires the desktop app"}
            onClick={() => setLayerPeek(!layerPeek())}
          >
            Layer peek
          </button>
          <button
            class="toggle"
            classList={{ on: settingsOpen() }}
            aria-expanded={settingsOpen()}
            onClick={() => setSettingsOpen(!settingsOpen())}
          >
            Settings
          </button>
          <button
            class="toggle"
            classList={{ on: alwaysOnTop() }}
            aria-pressed={alwaysOnTop()}
            title="Keep this view above other windows"
            onClick={() => setAlwaysOnTop(!alwaysOnTop())}
          >
            Pin
          </button>
          <button
            class="toggle"
            classList={{ on: clickThrough() }}
            aria-pressed={clickThrough()}
            title="Let mouse clicks pass through the window"
            onClick={() => setClickThrough(!clickThrough())}
          >
            Click-through
          </button>
          <button
            class="toggle"
            classList={{ on: skipTaskbar() }}
            aria-pressed={skipTaskbar()}
            title="Hide from the taskbar"
            onClick={() => setSkipTaskbar(!skipTaskbar())}
          >
            No taskbar
          </button>
          <button
            class="toggle"
            classList={{ on: manualOpen() }}
            aria-pressed={manualOpen()}
            title="Open the manual (F1)"
            onClick={() => setManualOpen(!manualOpen())}
          >
            Manual
          </button>
          <label class="opacity">
            Opacity
            <input
              type="range"
              min={Math.round(MIN_OPACITY * 100)}
              max={100}
              value={Math.round(opacity() * 100)}
              onInput={(event) =>
                setOpacity(Number(event.currentTarget.value) / 100)
              }
            />
          </label>
          <button
            class="win-btn"
            aria-label="Minimize"
            onClick={minimizeWindow}
          >
            –
          </button>
          <button
            class="win-btn close"
            aria-label="Hide to tray"
            title="Hide to tray. Quit from the tray icon menu."
            onClick={closeWindow}
          >
            ×
          </button>
        </div>
        <Show when={settingsOpen()}>
          <Settings />
        </Show>
      </div>
      <Show when={clickThrough()}>
        <p class="banner">
          Click-through is on. Press Esc, or run{" "}
          <code>kairos44-companion --toggle-click-through</code>, to turn it
          off.
        </p>
      </Show>
    </>
  );
}
