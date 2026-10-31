import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW_SETTINGS,
  MIN_OPACITY,
  MIN_SIZE,
  VIEWS,
  defaultSettings,
  isViewId,
  nextView,
  parseSettings,
} from "./settings";

describe("parseSettings", () => {
  it("uses defaults when nothing is stored", () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
  });

  it("uses defaults for invalid JSON or non-objects", () => {
    expect(parseSettings("{nope")).toEqual(defaultSettings());
    expect(parseSettings("42")).toEqual(defaultSettings());
    expect(parseSettings("null")).toEqual(defaultSettings());
  });

  it("restores per-view values independently", () => {
    const settings = parseSettings(
      JSON.stringify({
        view: "compact",
        skipTaskbar: true,
        views: {
          normal: { alwaysOnTop: false, opacity: 0.6 },
          compact: {
            alwaysOnTop: true,
            opacity: 0.8,
            size: { width: 900, height: 500 },
          },
        },
      }),
    );
    expect(settings.view).toBe("compact");
    expect(settings.skipTaskbar).toBe(true);
    expect(settings.views.normal.alwaysOnTop).toBe(false);
    expect(settings.views.normal.opacity).toBe(0.6);
    expect(settings.views.normal.size).toEqual(
      DEFAULT_VIEW_SETTINGS.normal.size,
    );
    expect(settings.views.compact.size).toEqual({ width: 900, height: 500 });
    expect(settings.views.shortcuts).toEqual(DEFAULT_VIEW_SETTINGS.shortcuts);
  });

  it("clamps opacity and size so the window can never vanish", () => {
    const settings = parseSettings(
      JSON.stringify({
        views: { normal: { opacity: 0, size: { width: 1, height: 99999 } } },
      }),
    );
    expect(settings.views.normal.opacity).toBe(MIN_OPACITY);
    expect(settings.views.normal.size.width).toBe(MIN_SIZE);
    expect(settings.views.normal.size.height).toBe(4000);
  });

  it("ignores values of the wrong type", () => {
    expect(
      parseSettings(
        JSON.stringify({
          view: "tiny",
          skipTaskbar: 1,
          views: {
            normal: { alwaysOnTop: "yes", opacity: "high", size: "big" },
          },
        }),
      ),
    ).toEqual(defaultSettings());
  });

  it("migrates the earlier single-window settings to every view", () => {
    const settings = parseSettings(
      JSON.stringify({ alwaysOnTop: false, skipTaskbar: true, opacity: 0.7 }),
    );
    expect(settings.skipTaskbar).toBe(true);
    for (const id of VIEWS) {
      expect(settings.views[id].alwaysOnTop).toBe(false);
      expect(settings.views[id].opacity).toBe(0.7);
    }
  });

  it("never restores click-through", () => {
    expect(
      parseSettings(JSON.stringify({ clickThrough: true })),
    ).not.toHaveProperty("clickThrough");
  });
});

describe("views", () => {
  it("cycles through every view and wraps", () => {
    expect(nextView("normal")).toBe("compact");
    expect(nextView("compact")).toBe("shortcuts");
    expect(nextView("shortcuts")).toBe("normal");
  });

  it("recognises only known view ids", () => {
    expect(isViewId("compact")).toBe(true);
    expect(isViewId("tiny")).toBe(false);
    expect(isViewId(3)).toBe(false);
  });

  it("starts every view pinned", () => {
    for (const id of VIEWS)
      expect(DEFAULT_VIEW_SETTINGS[id].alwaysOnTop).toBe(true);
  });
});
