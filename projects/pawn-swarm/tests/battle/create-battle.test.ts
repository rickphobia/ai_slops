import { describe, expect, it } from "vitest";
import { BattleSetupError, createBattle } from "../../src/battle/create-battle";
import { centreOf } from "../../src/board/square";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
import { PAWN_TYPES } from "../../src/catalog/pieces";
import type { Wave } from "../../src/catalog/waves";

const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});
const CENTRE = { x: 10, y: 7 };

describe("createBattle", () => {
  it("starts a single pawn in the middle of the 20×14 board", () => {
    const battle = createBattle({ plainPawns: 1, wave: knights(3), seed: 1 });
    expect(battle.board).toEqual({ files: 20, ranks: 14 });
    expect(battle.pawns).toHaveLength(1);
    expect(battle.pawns[0]).toMatchObject({
      type: "plain",
      ...CENTRE,
      hp: PAWN_TYPES.plain.hp,
    });
    expect(battle).toMatchObject({
      stepNumber: 0,
      outcome: "ongoing",
      events: [],
    });
  });

  it("places the army in a tight spiral around the centre, no two pawns on one spot", () => {
    const battle = createBattle({ plainPawns: 60, wave: knights(3), seed: 1 });
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

  it("schedules the whole wave to land at once after a 1.2s warning", () => {
    const battle = createBattle({ plainPawns: 1, wave: knights(8), seed: 5 });
    expect(battle.blackPieces).toEqual([]);
    expect(battle.landings).toHaveLength(8);
    for (const landing of battle.landings) {
      expect(landing).toMatchObject({
        kind: "knight",
        secondsLeft: 1.2,
        warningSeconds: 1.2,
      });
    }
  });

  it("lands every piece on its own square, away from the centre", () => {
    for (let seed = 0; seed < 30; seed++) {
      const battle = createBattle({ plainPawns: 1, wave: knights(60), seed });
      const squares = battle.landings.map((landing) => landing.square);
      expect(
        new Set(
          squares.map(
            (square) => `${String(square.file)},${String(square.rank)}`,
          ),
        ).size,
      ).toBe(60);
      for (const square of squares) {
        const centre = centreOf(square);
        expect(
          Math.hypot(centre.x - CENTRE.x, centre.y - CENTRE.y),
        ).toBeGreaterThan(BATTLE_RULES.landing.keepClearOfCentre);
        expect(square.file).toBeGreaterThanOrEqual(0);
        expect(square.file).toBeLessThan(20);
        expect(square.rank).toBeGreaterThanOrEqual(0);
        expect(square.rank).toBeLessThan(14);
      }
    }
  });

  it("fails clearly when the wave has more pieces than free squares", () => {
    expect(() =>
      createBattle({ plainPawns: 1, wave: knights(280), seed: 1 }),
    ).toThrow(BattleSetupError);
  });

  it("gives different landing squares for different seeds and the same for the same seed", () => {
    const squaresFor = (seed: number) =>
      createBattle({ plainPawns: 1, wave: knights(8), seed }).landings.map(
        (landing) => landing.square,
      );
    expect(squaresFor(3)).toEqual(squaresFor(3));
    expect(squaresFor(3)).not.toEqual(squaresFor(4));
  });
});
