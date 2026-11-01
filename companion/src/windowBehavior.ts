import { createEffect, on, onCleanup, onMount, untrack } from "solid-js";
import {
  SETTINGS_KEY,
  isViewId,
  nextView,
  normalizeSize,
  type WindowSettings,
} from "./settings";
import {
  alwaysOnTop,
  clickThrough,
  followKeyboard,
  keyboard,
  opacity,
  setAlwaysOnTop,
  setClickThrough,
  setKeyboard,
  setManualOpen,
  setSelectedLayer,
  setView,
  setViewSize,
  skipTaskbar,
  view,
  viewSettings,
} from "./store";
import { activeLayer, type KeyboardLink } from "./keyboard";
import {
  applyAlwaysOnTop,
  applyClickThrough,
  applySkipTaskbar,
  applyWindowSize,
  currentKeyboard,
  inTauri,
  onCommand,
  onWindowResized,
} from "./windowing";

const RESIZE_SETTLE_MS = 500;
// The compositor reports intermediate sizes while it applies the size of a newly selected view.
const VIEW_SWITCH_QUIET_MS = 1200;

export function useWindowBehavior(): void {
  let lastViewChange = Date.now();

  createEffect(() => void applyAlwaysOnTop(alwaysOnTop()));
  createEffect(() => void applySkipTaskbar(skipTaskbar()));
  createEffect(() => void applyClickThrough(clickThrough()));

  createEffect(
    on(view, (id) => {
      lastViewChange = Date.now();
      void applyWindowSize(untrack(() => viewSettings()[id].size));
    }),
  );

  createEffect(() => {
    const current = keyboard();
    if (followKeyboard() && current.connected && current.state) {
      setSelectedLayer(activeLayer(current.state.layers));
    }
  });

  createEffect(() => {
    document.documentElement.style.setProperty(
      "--ui-opacity",
      String(opacity()),
    );
  });

  createEffect(() => {
    const snapshot: WindowSettings = {
      view: view(),
      skipTaskbar: skipTaskbar(),
      views: viewSettings(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot));
  });

  onMount(() => {
    document.documentElement.dataset.shell = inTauri() ? "tauri" : "browser";

    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    void currentKeyboard().then((initial) => {
      if (initial) setKeyboard(initial);
    });
    const listeners = Promise.all([
      onCommand<KeyboardLink>("keyboard-state", setKeyboard),
      onCommand("toggle-click-through", () => setClickThrough((on) => !on)),
      onCommand("toggle-pin", () => setAlwaysOnTop((on) => !on)),
      onCommand("next-view", () => setView(nextView(view()))),
      onCommand("toggle-manual", () => setManualOpen((open) => !open)),
      onCommand<string>("set-view", (name) => {
        if (isViewId(name)) setView(name);
      }),
      // Only a pinned window is a floating overlay; a tiled size would not be the user's choice.
      onWindowResized((size) => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          if (!alwaysOnTop()) return;
          if (Date.now() - lastViewChange < VIEW_SWITCH_QUIET_MS) return;
          const current = viewSettings()[view()].size;
          setViewSize(view(), normalizeSize(size, current));
        }, RESIZE_SETTLE_MS);
      }),
    ]);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setClickThrough(false);
        setManualOpen(false);
      } else if (event.key === "F1") {
        event.preventDefault();
        setManualOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);

    onCleanup(() => {
      clearTimeout(settleTimer);
      window.removeEventListener("keydown", onKey);
      void listeners.then((stops) => stops.forEach((stop) => stop()));
    });
  });
}
