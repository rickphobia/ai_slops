import { describe, expect, it } from "vitest";
import { buildSpatialGrid } from "../../src/battle/spatial-grid";
import type { Point } from "../../src/board/square";
import { createRandom } from "../../src/rng";

function near(items: readonly Point[], centre: Point, radius: number): Point[] {
  const found: Point[] = [];
  buildSpatialGrid(items, 1).forEachNear(centre, radius, (item) =>
    found.push(item),
  );
  return found;
}

describe("spatial grid", () => {
  it("finds items within the radius, across cell borders, and not beyond", () => {
    const inside = { x: 4.9, y: 5.1 };
    const acrossBorder = { x: 5.4, y: 4.6 };
    const onTheEdge = { x: 6, y: 5 };
    const outside = { x: 6.1, y: 5 };
    expect(
      new Set(
        near([inside, acrossBorder, onTheEdge, outside], { x: 5, y: 5 }, 1),
      ),
    ).toEqual(new Set([inside, acrossBorder, onTheEdge]));
  });

  it("finds exactly what checking every item would find", () => {
    const random = createRandom(3);
    const items = Array.from({ length: 300 }, () => ({
      x: random.next() * 20,
      y: random.next() * 14,
    }));
    for (let query = 0; query < 50; query++) {
      const centre = { x: random.next() * 20, y: random.next() * 14 };
      const radius = random.next() * 3;
      const expected = items.filter(
        (item) => Math.hypot(item.x - centre.x, item.y - centre.y) <= radius,
      );
      expect(new Set(near(items, centre, radius))).toEqual(new Set(expected));
    }
  });
});
