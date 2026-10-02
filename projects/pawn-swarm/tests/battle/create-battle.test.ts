import { describe, expect, it } from "vitest";
import { createBattle } from "../../src/battle/create-battle";
import { BoardFullError } from "../../src/battle/landing-squares";
import { centreOf, type Square } from "../../src/board/square";
import { PAWN_TYPES } from "../../src/catalog/pieces";
import type { Wave } from "../../src/catalog/waves";

const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});
const CENTRE = { x: 8, y: 5.5 };
const setup = { waveNumber: 1, seed: 1 };
const key = (square: Square): string =>
  `${String(square.file)},${String(square.rank)}`;

describe("createBattle", () => {
  it("starts a single pawn in the middle of the 16×11 board", () => {
    const battle = createBattle({
      ...setup,
      army: { plain: 1 },
      wave: knights(3),
    });
    expect(battle.board).toEqual({ files: 16, ranks: 11 });
    expect(battle.pawns).toHaveLength(1);
    expect(battle.pawns[0]).toMatchObject({
      type: "plain",
      ...CENTRE,
      hp: PAWN_TYPES.plain.hp,
    });
    expect(battle).toMatchObject({
      stepNumber: 0,
      wave: 1,
      outcome: "ongoing",
      events: [],
    });
  });

  it("places the army in a tight spiral around the centre, no two pawns on one spot", () => {
    const battle = createBattle({
      ...setup,
      army: { plain: 60 },
      wave: knights(3),
    });
    const distances = battle.pawns.map((pawn) =>
      Math.hypot(pawn.x - CENTRE.x, pawn.y - CENTRE.y),
    );
    // Ring radius grows with the square root of the index: 0.28 × √59 ≈ 2.15.
    expect(Math.max(...distances)).toBeLessThan(2.2);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    const spots = new Set(
      battle.pawns.map((pawn) => `${String(pawn.x)},${String(pawn.y)}`),
    );
    expect(spots.size).toBe(60);
    // All the way round, not bunched on one side.
    const quadrants = new Set(
      battle.pawns
        .filter((pawn) => pawn.x !== CENTRE.x && pawn.y !== CENTRE.y)
        .map(
          (pawn) => `${String(pawn.x > CENTRE.x)},${String(pawn.y > CENTRE.y)}`,
        ),
    );
    expect(quadrants.size).toBe(4);
  });

  it("splits the wave into 3 pushes and starts the first one landing after a 1.2s warning", () => {
    const battle = createBattle({
      ...setup,
      army: { plain: 1 },
      wave: knights(9),
    });
    expect(battle.blackPieces).toEqual([]);
    expect(battle.landings).toHaveLength(3);
    for (const landing of battle.landings) {
      expect(landing).toMatchObject({
        kind: "knight",
        secondsLeft: 1.2,
        warningSeconds: 1.2,
      });
    }
    expect(battle.pushes).toEqual([
      ["knight", "knight", "knight"],
      ["knight", "knight", "knight"],
    ]);
    expect(battle).toMatchObject({ pushSize: 3, pushSecondsLeft: 25 });
  });

  it("lands every piece of the push on its own square, at least 3 squares from the pawns", () => {
    for (let seed = 0; seed < 30; seed++) {
      const battle = createBattle({
        army: { plain: 1 },
        wave: knights(60),
        waveNumber: 1,
        seed,
      });
      const squares = battle.landings.map((landing) => landing.square);
      expect(squares).toHaveLength(20);
      expect(new Set(squares.map(key)).size).toBe(20);
      for (const square of squares) {
        const centre = centreOf(square);
        expect(
          Math.max(
            Math.abs(centre.x - CENTRE.x),
            Math.abs(centre.y - CENTRE.y),
          ),
        ).toBeGreaterThanOrEqual(3);
        expect(square.file).toBeGreaterThanOrEqual(0);
        expect(square.file).toBeLessThan(16);
        expect(square.rank).toBeGreaterThanOrEqual(0);
        expect(square.rank).toBeLessThan(11);
      }
    }
  });

  it("fails clearly when a push has more pieces than the board has squares", () => {
    // 600 knights make pushes of 200; the board has 176 squares.
    expect(() =>
      createBattle({ ...setup, army: { plain: 1 }, wave: knights(600) }),
    ).toThrow(BoardFullError);
  });

  it("gives different landing squares for different seeds and the same for the same seed", () => {
    const squaresFor = (seed: number) =>
      createBattle({
        army: { plain: 1 },
        wave: knights(8),
        waveNumber: 1,
        seed,
      }).landings.map((landing) => landing.square);
    expect(squaresFor(3)).toEqual(squaresFor(3));
    expect(squaresFor(3)).not.toEqual(squaresFor(4));
  });
});
