import { describe, expect, it } from "vitest";
import {
  activeLayer,
  activeLocks,
  heldModifiers,
  outputLabel,
  pointerMode,
  type KeyboardState,
} from "./keyboard";

const bits = (...layers: number[]) =>
  layers.reduce((mask, layer) => mask | (1 << layer), 0);

function state(patch: Partial<KeyboardState> = {}): KeyboardState {
  return {
    layers: 1,
    highest: 0,
    modifiers: 0,
    numLock: null,
    capsLock: null,
    scrollLock: null,
    usb: true,
    bleConnected: false,
    profile: 1,
    ...patch,
  };
}

describe("activeLayer", () => {
  it("is BASE when only the default layer is on", () => {
    expect(activeLayer(bits(0))).toBe(0);
  });

  it("is the highest keyboard layer that is on", () => {
    expect(activeLayer(bits(0, 1))).toBe(1);
    expect(activeLayer(bits(0, 1, 4))).toBe(4);
    expect(activeLayer(bits(0, 6))).toBe(6);
  });

  it("ignores trackpad mode and context layers above the keyboard layers", () => {
    expect(activeLayer(bits(0, 7, 10, 13))).toBe(0);
    expect(activeLayer(bits(0, 1, 14, 21))).toBe(1);
  });

  it("handles every layer bit up to 31 without overflowing", () => {
    expect(activeLayer(bits(0, 2, 31))).toBe(2);
  });
});

describe("pointerMode", () => {
  it("is normal without a mode layer", () => {
    expect(pointerMode(bits(0, 1))).toBe("normal");
  });

  it("recognises each mode", () => {
    expect(pointerMode(bits(0, 7))).toBe("fast");
    for (const layer of [8, 9, 11]) {
      expect(pointerMode(bits(0, layer))).toBe("precision");
    }
    for (const layer of [10, 12]) {
      expect(pointerMode(bits(0, layer))).toBe("scroll");
    }
  });

  it("prefers scroll over precision over fast", () => {
    expect(pointerMode(bits(0, 7, 8))).toBe("precision");
    expect(pointerMode(bits(0, 8, 10))).toBe("scroll");
  });
});

describe("heldModifiers", () => {
  it("names the held modifiers with their side", () => {
    expect(heldModifiers(0)).toEqual([]);
    expect(heldModifiers(0b0000_0010)).toEqual(["L Shift"]);
    expect(heldModifiers(0b1001_0001)).toEqual(["L Ctrl", "R Ctrl", "R Gui"]);
  });
});

describe("locks and output", () => {
  it("lists only the locks that are on", () => {
    expect(activeLocks(state())).toEqual([]);
    expect(activeLocks(state({ numLock: true, capsLock: false }))).toEqual([
      "Num",
    ]);
    expect(
      activeLocks(state({ numLock: true, capsLock: true, scrollLock: true })),
    ).toEqual(["Num", "Caps", "Scroll"]);
  });

  it("names the output", () => {
    expect(outputLabel(state())).toBe("USB");
    expect(
      outputLabel(state({ usb: false, bleConnected: true, profile: 2 })),
    ).toBe("Bluetooth 2");
    expect(
      outputLabel(state({ usb: false, bleConnected: false, profile: 1 })),
    ).toBe("Bluetooth 1 (not connected)");
  });
});
