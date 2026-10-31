export const SETTINGS_KEY = "kairos44.window";
export const MIN_OPACITY = 0.3;
export const MIN_SIZE = 240;
export const MAX_SIZE = 4000;

export const VIEWS = ["normal", "compact", "shortcuts"] as const;
export type ViewId = (typeof VIEWS)[number];

export const VIEW_LABEL: Record<ViewId, string> = {
  normal: "Normal",
  compact: "Compact",
  shortcuts: "Shortcuts",
};

export interface Size {
  width: number;
  height: number;
}

export interface ViewSettings {
  alwaysOnTop: boolean;
  opacity: number;
  size: Size;
}

export interface WindowSettings {
  view: ViewId;
  skipTaskbar: boolean;
  views: Record<ViewId, ViewSettings>;
}

export const DEFAULT_VIEW_SETTINGS: Record<ViewId, ViewSettings> = {
  normal: { alwaysOnTop: true, opacity: 1, size: { width: 1000, height: 780 } },
  compact: {
    alwaysOnTop: true,
    opacity: 1,
    size: { width: 1000, height: 620 },
  },
  shortcuts: {
    alwaysOnTop: true,
    opacity: 1,
    size: { width: 460, height: 760 },
  },
};

export function isViewId(value: unknown): value is ViewId {
  return (
    typeof value === "string" && (VIEWS as readonly string[]).includes(value)
  );
}

export function nextView(current: ViewId): ViewId {
  return VIEWS[(VIEWS.indexOf(current) + 1) % VIEWS.length];
}

export function defaultSettings(): WindowSettings {
  return {
    view: "normal",
    skipTaskbar: false,
    views: {
      normal: structuredClone(DEFAULT_VIEW_SETTINGS.normal),
      compact: structuredClone(DEFAULT_VIEW_SETTINGS.compact),
      shortcuts: structuredClone(DEFAULT_VIEW_SETTINGS.shortcuts),
    },
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clampOpacity = (value: number): number =>
  Math.min(1, Math.max(MIN_OPACITY, value));

const clampSize = (value: number): number =>
  Math.round(Math.min(MAX_SIZE, Math.max(MIN_SIZE, value)));

export function normalizeSize(value: unknown, fallback: Size): Size {
  if (!isRecord(value)) return { ...fallback };
  const { width, height } = value;
  return {
    width:
      typeof width === "number" && Number.isFinite(width)
        ? clampSize(width)
        : fallback.width,
    height:
      typeof height === "number" && Number.isFinite(height)
        ? clampSize(height)
        : fallback.height,
  };
}

function parseView(value: unknown, fallback: ViewSettings): ViewSettings {
  if (!isRecord(value)) return structuredClone(fallback);
  return {
    alwaysOnTop:
      typeof value.alwaysOnTop === "boolean"
        ? value.alwaysOnTop
        : fallback.alwaysOnTop,
    opacity:
      typeof value.opacity === "number" && Number.isFinite(value.opacity)
        ? clampOpacity(value.opacity)
        : fallback.opacity,
    size: normalizeSize(value.size, fallback.size),
  };
}

// Click-through is deliberately not stored: restoring it on launch could leave an unclickable window.
export function parseSettings(raw: string | null): WindowSettings {
  const result = defaultSettings();
  if (!raw) return result;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return result;
  }
  if (!isRecord(value)) return result;

  if (typeof value.skipTaskbar === "boolean")
    result.skipTaskbar = value.skipTaskbar;
  if (isViewId(value.view)) result.view = value.view;

  if (isRecord(value.views)) {
    for (const id of VIEWS) {
      result.views[id] = parseView(value.views[id], result.views[id]);
    }
  } else {
    // Settings from before views existed applied to the single window.
    for (const id of VIEWS) {
      result.views[id] = parseView(value, result.views[id]);
    }
  }
  return result;
}
