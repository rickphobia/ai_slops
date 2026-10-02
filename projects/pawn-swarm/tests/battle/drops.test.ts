import { describe, expect, it } from "vitest";
import { dropCount } from "../../src/battle/drops";
import {
  battleWith,
  eventsOfType,
  knightOn,
  pawnAt,
  playSteps,
} from "./pieces";

describe("dropCount (crowding)", () => {
  it("drops the full amount with no swarm", () => {
    expect(dropCount(3, 0, 0.99)).toBe(3);
  });

  it("shrinks the drop by swarm / 300 and rolls the fraction as a chance", () => {
    // 1 × (1 − 150 / 300) = 0.5
    expect(dropCount(1, 150, 0.49)).toBe(1);
    expect(dropCount(1, 150, 0.5)).toBe(0);
    // 5 × (1 − 75 / 300) = 3.75
    expect(dropCount(5, 75, 0.74)).toBe(4);
    expect(dropCount(5, 75, 0.76)).toBe(3);
  });

  it("never drops less than 10% of the normal drop, however big the swarm", () => {
    // 3 × 0.1 = 0.3
    expect(dropCount(3, 1000, 0.29)).toBe(1);
    expect(dropCount(3, 1000, 0.31)).toBe(0);
    expect(dropCount(20, 300, 0.99)).toBe(2);
  });
});

describe("drops in battle", () => {
  // The pawn stands 0.8 from a 1-HP knight: in reach, but not close enough to push the drop.
  const start = (seed: number) =>
    battleWith({
      pawns: [pawnAt(1, 5.5, 4.7)],
      blackPieces: [
        knightOn(2, { file: 5, rank: 5 }, { hp: 1 }),
        knightOn(3, { file: 15, rank: 10 }),
      ],
      rng: seed,
    });

  it("spawns plain pawns on the dead piece's square mid-battle, bursting outward", () => {
    let dropsSeen = 0;
    for (let seed = 0; seed < 10; seed++) {
      const [first] = playSteps(start(seed), 1);
      if (first === undefined) throw new Error("no step played");
      expect(first.outcome).toBe("ongoing");
      expect(eventsOfType([first], "death")).toEqual([
        {
          type: "death",
          id: 2,
          piece: { side: "black", kind: "knight" },
          at: { x: 5.5, y: 5.5 },
        },
      ]);
      const drops = eventsOfType([first], "drop");
      const dropped = first.pawns.filter((pawn) => pawn.id !== 1);
      expect(drops.reduce((sum, drop) => sum + drop.count, 0)).toBe(
        dropped.length,
      );
      for (const pawn of dropped) {
        dropsSeen += 1;
        expect(pawn).toMatchObject({ type: "plain", x: 5.5, y: 5.5, hp: 3 });
        const burstSpeed = Math.hypot(pawn.burstX, pawn.burstY);
        expect(burstSpeed).toBeGreaterThanOrEqual(1.875);
        expect(burstSpeed).toBeLessThanOrEqual(1.875 + 2.8);
      }
    }
    // One knight drops 1 pawn, times 1 − 1/300 for the one-pawn swarm.
    expect(dropsSeen).toBeGreaterThanOrEqual(9);
  });

  it("lets the burst carry dropped pawns away from the square", () => {
    const states = playSteps(start(0), 6);
    const dropped = states.at(-1)?.pawns.filter((pawn) => pawn.id !== 1) ?? [];
    expect(dropped.length).toBeGreaterThan(0);
    for (const pawn of dropped) {
      expect(Math.hypot(pawn.x - 5.5, pawn.y - 5.5)).toBeGreaterThan(0.1);
    }
  });
});
