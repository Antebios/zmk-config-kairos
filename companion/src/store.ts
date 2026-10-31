import { createMemo, createRoot, createSignal } from "solid-js";
import { LAYER } from "./layout";
import { FIRST_PAGE } from "./manual/pages";
import {
  SETTINGS_KEY,
  parseSettings,
  type Size,
  type ViewId,
  type ViewSettings,
} from "./settings";

export const [selectedLayer, setSelectedLayer] = createSignal<number>(
  LAYER.BASE,
);
export const [highlightedCombo, setHighlightedCombo] = createSignal<
  string | null
>(null);
export const [hoveredKey, setHoveredKey] = createSignal<number | null>(null);

const saved = parseSettings(
  typeof localStorage === "undefined"
    ? null
    : localStorage.getItem(SETTINGS_KEY),
);

export const [view, setView] = createSignal<ViewId>(saved.view);
export const [viewSettings, setViewSettings] = createSignal(saved.views);
export const [skipTaskbar, setSkipTaskbar] = createSignal(saved.skipTaskbar);
export const [clickThrough, setClickThrough] = createSignal(false);
// The manual replaces the current view while open and is never saved.
export const [manualOpen, setManualOpen] = createSignal(false);
export const [manualPage, setManualPage] = createSignal(FIRST_PAGE);

// Memos keep window effects from re-running when only another view's settings change.
export const { alwaysOnTop, opacity } = createRoot(() => ({
  alwaysOnTop: createMemo(() => viewSettings()[view()].alwaysOnTop),
  opacity: createMemo(() => viewSettings()[view()].opacity),
}));

function patchView(id: ViewId, patch: Partial<ViewSettings>): void {
  setViewSettings((current) => ({
    ...current,
    [id]: { ...current[id], ...patch },
  }));
}

export function setAlwaysOnTop(
  update: boolean | ((on: boolean) => boolean),
): void {
  patchView(view(), {
    alwaysOnTop: typeof update === "function" ? update(alwaysOnTop()) : update,
  });
}

export function setOpacity(value: number): void {
  patchView(view(), { opacity: value });
}

export function setViewSize(id: ViewId, size: Size): void {
  patchView(id, { size });
}
