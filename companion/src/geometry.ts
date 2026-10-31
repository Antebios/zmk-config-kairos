export interface Placement {
  row: number;
  col: number;
}

// 13-column grid: six left keys, one spacer column, six right keys.
export function keyPlacement(index: number): Placement {
  if (index < 0 || index > 43) {
    throw new RangeError(`Key index ${index} is outside 0-43`);
  }
  if (index < 36) {
    const column = index % 12;
    return { row: Math.floor(index / 12) + 1, col: column < 6 ? column + 1 : column + 2 };
  }
  if (index <= 38) {
    return { row: 5, col: index - 32 };
  }
  if (index <= 41) {
    return { row: 5, col: index - 31 };
  }
  return { row: 4, col: index === 42 ? 6 : 8 };
}
