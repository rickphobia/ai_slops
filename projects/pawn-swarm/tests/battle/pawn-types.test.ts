import { describe, expect, it } from "vitest";
import { createBattle } from "../../src/battle/create-battle";
import { PAWN_TYPES } from "../../src/catalog/pieces";
import type { Wave } from "../../src/catalog/waves";
import {
  after,
  battleWith,
  blackPieceById,
  eventsOfType,
  knightOn,
  pawnAt,
  playSteps,
} from "./pieces";

const CENTRE = { x: 8, y: 5.5 };
const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});

describe("an army of pawn types", () => {
  it("places every pawn with its type's stats, tanky types in the middle of the spiral", () => {
    const battle = createBattle({
      army: { plain: 10, spear: 2, shield: 3, twin: 1 },
      wave: knights(3),
      waveNumber: 2,
      seed: 1,
    });
    expect(battle.pawns).toHaveLength(16);
    const byDistance = [...battle.pawns].sort(
      (a, b) =>
        Math.hypot(a.x - CENTRE.x, a.y - CENTRE.y) -
        Math.hypot(b.x - CENTRE.x, b.y - CENTRE.y),
    );
    // Shields have 10 HP, the rest 3: the three shields stand innermost.
    expect(byDistance.slice(0, 3).map((pawn) => pawn.type)).toEqual([
      "shield",
      "shield",
      "shield",
    ]);
    const count = (type: string): number =>
      battle.pawns.filter((pawn) => pawn.type === type).length;
    expect([
      count("plain"),
      count("spear"),
      count("shield"),
      count("twin"),
    ]).toEqual([10, 2, 3, 1]);
    for (const pawn of battle.pawns) {
      expect(pawn.hp).toBe(PAWN_TYPES[pawn.type].hp);
      expect(pawn.maxHp).toBe(PAWN_TYPES[pawn.type].hp);
    }
    expect(new Set(battle.pawns.map((pawn) => pawn.id)).size).toBe(16);
  });
});

describe("spear pawn", () => {
  // The knight's centre is (5.5, 5.5); a pawn 1.9 below it is out of a plain pawn's reach (0.875 + 0.325).
  const strikesFrom = (type: "plain" | "spear") =>
    eventsOfType(
      [
        after(
          battleWith({
            pawns: [pawnAt(1, 5.5, 3.6, { type })],
            blackPieces: [knightOn(2, { file: 5, rank: 5 }, { hp: 10 })],
          }),
          1,
        ),
      ],
      "strike",
    );

  it("strikes from twice as far as a plain pawn, for 2", () => {
    expect(strikesFrom("plain")).toEqual([]);
    expect(strikesFrom("spear")).toMatchObject([
      { pawnType: "spear", targetId: 2, damage: 2 },
    ]);
  });
});

describe("twin pawn", () => {
  it("strikes two black pieces in reach at once", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 6, 5.5, { type: "twin" })],
      blackPieces: [
        knightOn(2, { file: 5, rank: 5 }, { hp: 10 }),
        knightOn(3, { file: 6, rank: 5 }, { hp: 10 }),
        knightOn(4, { file: 12, rank: 5 }, { hp: 10 }),
      ],
    });
    const next = after(start, 1);
    expect(
      eventsOfType([next], "strike")
        .map((strike) => strike.targetId)
        .sort(),
    ).toEqual([2, 3]);
    expect(blackPieceById(next, 2)?.hp).toBe(9);
    expect(blackPieceById(next, 3)?.hp).toBe(9);
    expect(blackPieceById(next, 4)?.hp).toBe(10);
  });

  it("strikes only one when only one is in reach", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 4.8, { type: "twin" })],
      blackPieces: [
        knightOn(2, { file: 5, rank: 5 }, { hp: 10 }),
        knightOn(3, { file: 12, rank: 5 }, { hp: 10 }),
      ],
    });
    expect(eventsOfType([after(start, 1)], "strike")).toHaveLength(1);
  });
});

describe("shield pawn", () => {
  // A knight at (10.5, 6.5) about to pick a move; a plain pawn 2 squares below it.
  const knightTarget = (shieldX: number): number => {
    const start = battleWith({
      pawns: [
        pawnAt(1, 10.5, 4.5, { strikeCooldownLeft: 99 }),
        pawnAt(2, shieldX, 6.5, { type: "shield", strikeCooldownLeft: 99 }),
      ],
      blackPieces: [knightOn(3, { file: 10, rank: 6 }, { actLeft: 0.001 })],
    });
    const [first] = playSteps(start, 1);
    return blackPieceById(first ?? start, 3)?.move?.to.file ?? -1;
  };

  it("draws black pieces within 3.4 squares, even past a nearer pawn", () => {
    // 2.7 squares away: the knight jumps toward the shield, to file 12.
    expect(knightTarget(13.2)).toBe(12);
  });

  it("doesn't draw black pieces from further away", () => {
    // 4 squares away: the knight goes for the nearer plain pawn, to file 9 or 11.
    expect([9, 11]).toContain(knightTarget(14.5));
  });
});
