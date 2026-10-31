import { describe, expect, it } from "vitest";
import { keyPlacement } from "./geometry";

describe("keyPlacement", () => {
  it("gives every key a distinct grid cell", () => {
    const cells = new Set<string>();
    for (let index = 0; index < 44; index += 1) {
      const { row, col } = keyPlacement(index);
      cells.add(`${row}:${col}`);
    }
    expect(cells.size).toBe(44);
  });

  it("leaves the centre column free for the main rows", () => {
    for (let index = 0; index < 36; index += 1) {
      expect(keyPlacement(index).col).not.toBe(7);
    }
  });

  it("places mirrored thumbs symmetrically", () => {
    expect(keyPlacement(36)).toEqual({ row: 5, col: 4 });
    expect(keyPlacement(41)).toEqual({ row: 5, col: 10 });
    expect(keyPlacement(42).col + keyPlacement(43).col).toBe(14);
  });

  it("rejects indices outside the keyboard", () => {
    expect(() => keyPlacement(44)).toThrow(RangeError);
  });
});
