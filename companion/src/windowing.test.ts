import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

describe("native peek visibility", () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockReset();
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("awaits a show before issuing a subsequent hide", async () => {
    let finishShow!: () => void;
    invoke.mockImplementationOnce(() => new Promise<void>((resolve) => {
      finishShow = resolve;
    })).mockResolvedValue(undefined);
    const { applyWindowVisibility } = await import("./windowing");
    const shown = applyWindowVisibility(true);
    const hidden = applyWindowVisibility(false);
    await Promise.resolve();
    expect(invoke.mock.calls).toEqual([["set_window_visible", { visible: true }]]);
    finishShow();
    await Promise.all([shown, hidden]);
    expect(invoke.mock.calls).toEqual([
      ["set_window_visible", { visible: true }],
      ["set_window_visible", { visible: false }],
    ]);
  });

  it("logs failures and still processes the next request", async () => {
    const error = new Error("compositor unavailable");
    invoke.mockRejectedValueOnce(error).mockResolvedValue(undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { applyWindowVisibility } = await import("./windowing");
    await applyWindowVisibility(true);
    await applyWindowVisibility(false);
    expect(warn).toHaveBeenCalledWith("Changing window visibility failed", error);
    expect(invoke).toHaveBeenLastCalledWith("set_window_visible", { visible: false });
  });

  it("does not hide the browser preview", async () => {
    vi.stubGlobal("window", {});
    const { applyWindowVisibility } = await import("./windowing");
    await applyWindowVisibility(false);
    expect(invoke).not.toHaveBeenCalled();
  });
});
