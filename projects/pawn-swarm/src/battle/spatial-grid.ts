import type { Point } from "../board/square";

/** Rows are keyed as `cellX + cellY * ROW_STRIDE`; boards are far narrower than this. */
const ROW_STRIDE = 4096;

export interface SpatialGrid<T extends Point> {
  /** Calls `visit` for every item within `radius` of `centre`: cell by cell, then in the order items were added, so the order is the same every run. */
  forEachNear(centre: Point, radius: number, visit: (item: T) => void): void;
}

/**
 * Buckets items by the square-sized cell they are in, so "who is near this
 * point" only looks at a few cells instead of every pawn. Items are bucketed
 * where they stand when the grid is built; a query checks where they stand now,
 * so build a fresh grid after a phase that moves things a lot.
 */
export function buildSpatialGrid<T extends Point>(
  items: readonly T[],
  cellSize: number,
): SpatialGrid<T> {
  const cells = new Map<number, T[]>();
  const cellOf = (value: number): number => Math.floor(value / cellSize);
  for (const item of items) {
    const key = cellOf(item.x) + cellOf(item.y) * ROW_STRIDE;
    const cell = cells.get(key);
    if (cell === undefined) cells.set(key, [item]);
    else cell.push(item);
  }

  return {
    forEachNear: (centre, radius, visit) => {
      const radiusSquared = radius * radius;
      for (
        let cellY = cellOf(centre.y - radius);
        cellY <= cellOf(centre.y + radius);
        cellY++
      ) {
        for (
          let cellX = cellOf(centre.x - radius);
          cellX <= cellOf(centre.x + radius);
          cellX++
        ) {
          const cell = cells.get(cellX + cellY * ROW_STRIDE);
          if (cell === undefined) continue;
          for (const item of cell) {
            const dx = item.x - centre.x;
            const dy = item.y - centre.y;
            if (dx * dx + dy * dy <= radiusSquared) visit(item);
          }
        }
      }
    },
  };
}
