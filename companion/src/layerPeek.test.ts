import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLayerPeek, type PeekState } from "./layerPeek";
import { NO_KEYBOARD, type KeyboardLink } from "./keyboard";

function link(layers = 1): KeyboardLink {
  return {
    connected: true,
    state: {
      layers, highest: 0, modifiers: 0,
      numLock: null, capsLock: null, scrollLock: null,
      usb: true, bleConnected: false, profile: 0,
    },
  };
}

function setup(patch: Partial<PeekState> = {}) {
  const visibility = vi.fn();
  const peek = createLayerPeek(visibility);
  let state: PeekState = {
    enabled: true, durationMs: 5000, following: true,
    browsing: false, keyboard: link(), ...patch,
  };
  const update = (patch: Partial<PeekState>) => {
    state = { ...state, ...patch };
    peek.update(state);
  };
  peek.update(state);
  return { ...peek, update, visibility };
}

describe("layer peek", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts hidden and does not peek on initial connection or reconnect", () => {
    const peek = setup({ keyboard: NO_KEYBOARD });
    peek.update({ keyboard: link(3) });
    peek.update({ keyboard: NO_KEYBOARD });
    peek.update({ keyboard: { connected: true, state: null } });
    peek.update({ keyboard: link(5) });
    expect(peek.visibility.mock.calls).toEqual([[false]]);
  });

  it("shows on a layer change, hides at exactly 5 seconds and includes BASE", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(4999);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(1);
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
    peek.update({ keyboard: link() });
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(5000);
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
  });

  it("restarts the timer for rapid changes but not repeated telemetry", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    vi.advanceTimersByTime(4000);
    peek.update({ keyboard: link(5) });
    vi.advanceTimersByTime(4000);
    peek.update({ keyboard: link(5) });
    vi.advanceTimersByTime(999);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(1);
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
  });

  it("ignores pointer modes, modifiers, locks, output, and changes below the top layer", () => {
    const peek = setup({ keyboard: link(5) });
    const keyboard = link(7 | (1 << 10));
    keyboard.state = { ...keyboard.state!, modifiers: 2, capsLock: true, usb: false, profile: 3 };
    peek.update({ keyboard });
    expect(peek.visibility.mock.calls).toEqual([[false]]);
  });

  it("cancels the peek on disconnect", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    peek.update({ keyboard: NO_KEYBOARD });
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not change normal visibility on telemetry when disabled", () => {
    const peek = setup({ enabled: false });
    peek.manualVisibility(false);
    peek.update({ keyboard: link(3) });
    expect(peek.visibility.mock.calls).toEqual([[true], [false]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("hides on enable and restores visibility on disable, cancelling pending timers", () => {
    const peek = setup({ enabled: false });
    peek.update({ enabled: true });
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
    peek.update({ keyboard: link(3) });
    peek.update({ enabled: false });
    vi.advanceTimersByTime(10000);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps explicit show open until explicit hide, which rearms the next change", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    peek.manualVisibility(true);
    peek.update({ keyboard: link(5) });
    vi.advanceTimersByTime(10000);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    peek.manualVisibility(false);
    peek.update({ keyboard: link(5) });
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
    peek.update({ keyboard: link() });
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
  });

  it.each(["browsing", "following"] as const)("suspends auto-hide for %s", (key) => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    peek.update(key === "browsing" ? { browsing: true } : { following: false });
    vi.advanceTimersByTime(10000);
    peek.update({ keyboard: link(5), browsing: false, following: true });
    vi.advanceTimersByTime(10000);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    peek.manualVisibility(false);
    peek.update({ keyboard: link() });
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
  });

  it("respects manual hide while follow is off", () => {
    const peek = setup({ following: false });
    peek.manualVisibility(false);
    peek.update({ keyboard: link(3) });
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
  });

  it("uses an adjusted duration and restarts an in-flight deadline", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    vi.advanceTimersByTime(1000);
    peek.update({ durationMs: 1500 });
    vi.advanceTimersByTime(1499);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    vi.advanceTimersByTime(1);
    expect(peek.visibility).toHaveBeenLastCalledWith(false);
  });

  it("cancels timers on disposal", () => {
    const peek = setup();
    peek.update({ keyboard: link(3) });
    peek.dispose();
    vi.advanceTimersByTime(10000);
    expect(peek.visibility).toHaveBeenLastCalledWith(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
