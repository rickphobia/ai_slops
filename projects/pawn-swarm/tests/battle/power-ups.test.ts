import { describe, expect, it } from "vitest";
import type { PowerUpOrb } from "../../src/battle/battle-state";
import { orbChance } from "../../src/battle/orb-drops";
import { POWER_UP_IDS, POWER_UP_RULES } from "../../src/catalog/power-ups";
import {
  after,
  battleWith,
  blackOn,
  blackPieceById,
  eventsOfType,
  knightOn,
  pawnAt,
  pawnById,
  playSteps,
  stepsIn,
} from "./pieces";

const bystander = { strikeCooldownLeft: 99 } as const;

function orbAt(
  x: number,
  y: number,
  overrides: Partial<PowerUpOrb> = {},
): PowerUpOrb {
  // Past its first moments, so a pawn can pick it up.
  return { id: 50, powerUp: "heal", x, y, secondsLeft: 5, ...overrides };
}

describe("orb drops", () => {
  it("are 35% for rooks and queens, 20% for special types, 3% for the rest", () => {
    expect(orbChance({ kind: "rook", type: undefined })).toBe(0.35);
    expect(orbChance({ kind: "queen", type: undefined })).toBe(0.35);
    expect(orbChance({ kind: "rook", type: "tower" })).toBe(0.35);
    expect(orbChance({ kind: "knight", type: "stomper" })).toBe(0.2);
    expect(orbChance({ kind: "bishop", type: "priest" })).toBe(0.2);
    expect(orbChance({ kind: "knight", type: undefined })).toBe(0.03);
    expect(orbChance({ kind: "bishop", type: undefined })).toBe(0.03);
  });

  /** A pawn kills a 1 HP piece next to it on step 1; returns the orbs that fell. */
  function killsWithSeed(
    seed: number,
    piece: (id: number) => ReturnType<typeof knightOn>,
  ) {
    const start = battleWith({
      pawns: [pawnAt(1, 8.5, 6.2)],
      blackPieces: [piece(2)],
      rng: seed,
    });
    return eventsOfType([after(start, 1)], "orb-drop");
  }

  it("fall where the piece died, about as often as the chance says", () => {
    const seeds = Array.from({ length: 400 }, (_, index) => index + 1);
    const queens = seeds.map((seed) =>
      killsWithSeed(seed, (id) =>
        blackOn("queen", id, { file: 8, rank: 5 }, { hp: 1 }),
      ),
    );
    const dropped = queens.filter((orbs) => orbs.length > 0);
    expect(dropped.length / seeds.length).toBeGreaterThan(0.28);
    expect(dropped.length / seeds.length).toBeLessThan(0.42);
    expect(dropped[0]?.[0]?.at).toEqual({ x: 8.5, y: 5.5 });

    const knights = seeds.map((seed) =>
      killsWithSeed(seed, (id) =>
        knightOn(id, { file: 8, rank: 5 }, { hp: 1 }),
      ),
    );
    const knightRate =
      knights.filter((orbs) => orbs.length > 0).length / seeds.length;
    expect(knightRate).toBeLessThan(0.08);
  });

  it("put the orb on the board for 9 seconds, out of reach of the pawns the kill dropped", () => {
    const queen = (id: number) =>
      blackOn("queen", id, { file: 8, rank: 5 }, { hp: 1 });
    const seed =
      Array.from({ length: 400 }, (_, index) => index + 1).find(
        (candidate) => killsWithSeed(candidate, queen).length > 0,
      ) ?? 1;
    const start = battleWith({
      pawns: [pawnAt(1, 8.5, 6.2)],
      blackPieces: [queen(2)],
      rng: seed,
    });
    const next = after(start, 1);
    expect(next.orbs).toHaveLength(1);
    // One step old: it aged in the step it dropped in.
    expect(next.orbs[0]?.secondsLeft).toBeCloseTo(9, 1);
    expect(POWER_UP_IDS).toContain(next.orbs[0]?.powerUp);
    // The queen's 5 dropped pawns stand on the orb, yet it waits 0.4s.
    expect(next.pawns.length).toBeGreaterThan(1);
    expect(eventsOfType(playSteps(start, stepsIn(0.3)), "power-up")).toEqual(
      [],
    );
  });

  it("never fall from the king", () => {
    const seeds = Array.from({ length: 200 }, (_, index) => index + 1);
    for (const seed of seeds) {
      const start = battleWith({
        pawns: [pawnAt(1, 8.5, 6.2)],
        blackPieces: [blackOn("king", 2, { file: 8, rank: 5 }, { hp: 1 })],
        rng: seed,
      });
      expect(after(start, 1).orbs).toHaveLength(0);
    }
  });
});

describe("orbs on the board", () => {
  it("vanish after 9 seconds", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [knightOn(2, { file: 1, rank: 9 })],
      orbs: [orbAt(12, 5, { secondsLeft: 9 })],
    });
    expect(after(start, stepsIn(8.9)).orbs).toHaveLength(1);
    expect(after(start, stepsIn(9) + 1).orbs).toHaveLength(0);
  });

  it("drift to the nearest pawn within 3 squares", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 5.5, bystander), pawnAt(2, 9.5, 5.5, bystander)],
      blackPieces: [knightOn(3, { file: 14, rank: 9 })],
      orbs: [orbAt(7, 5.5)],
    });
    const orb = after(start, 10).orbs[0];
    // Pawn 1 is 1.5 away, pawn 2 is 2.5 away: it moves toward pawn 1.
    expect(orb?.x).toBeLessThan(7);
    expect(orb?.x).toBeGreaterThan(6);
    expect(orb?.y).toBeCloseTo(5.5);
  });

  it("stay put when no pawn is within 3 squares", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [knightOn(3, { file: 14, rank: 9 })],
      orbs: [orbAt(8, 5.5)],
    });
    expect(after(start, 30).orbs[0]).toMatchObject({ x: 8, y: 5.5 });
  });

  it("trigger when a pawn touches them, and are used up", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 6.3, 5.5, { ...bystander, hp: 1, maxHp: 3 })],
      blackPieces: [knightOn(3, { file: 14, rank: 9 })],
      orbs: [orbAt(6.5, 5.5)],
    });
    const next = after(start, 1);
    expect(next.orbs).toHaveLength(0);
    expect(eventsOfType([next], "power-up")).toMatchObject([
      { id: 50, powerUp: "heal" },
    ]);
  });

  it("are picked up after a drift, not only on the spot", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 5.5, bystander)],
      blackPieces: [knightOn(3, { file: 14, rank: 9 })],
      orbs: [orbAt(7.5, 5.5)],
    });
    const states = playSteps(start, stepsIn(1));
    expect(eventsOfType(states, "power-up")).toHaveLength(1);
  });
});

describe("power-up effects", () => {
  /** An orb already on top of pawn 1, so it triggers on step 1. */
  const triggered = (
    powerUp: PowerUpOrb["powerUp"],
    parts: Partial<Parameters<typeof battleWith>[0]> = {},
  ) =>
    battleWith({
      pawns: [pawnAt(1, 5.5, 5.5, bystander)],
      blackPieces: [knightOn(3, { file: 14, rank: 9 })],
      orbs: [orbAt(5.5, 5.5, { powerUp })],
      ...parts,
    });

  it("Heal puts every pawn back to full HP", () => {
    const start = triggered("heal", {
      pawns: [
        pawnAt(1, 5.5, 5.5, { ...bystander, hp: 1 }),
        pawnAt(2, 0.5, 0.5, { ...bystander, hp: 2, type: "shield", maxHp: 10 }),
        pawnAt(3, 12.5, 0.5, bystander),
      ],
    });
    const next = after(start, 1);
    expect(next.pawns.map((pawn) => pawn.hp)).toEqual([3, 10, 3]);
  });

  it("Haste makes pawns 50% faster for 6s", () => {
    const farPawnWalk = (powerUp: "haste" | "heal") => {
      const start = battleWith({
        pawns: [pawnAt(1, 1.5, 5.5), pawnAt(2, 1.5, 9.5)],
        blackPieces: [knightOn(3, { file: 14, rank: 5 })],
        orbs: [orbAt(1.5, 5.5, { powerUp })],
      });
      const next = after(start, stepsIn(1));
      return pawnById(next, 2);
    };
    const hasted = farPawnWalk("haste");
    const normal = farPawnWalk("heal");
    // Pawn 2 walks along one axis toward the knight at x 14.5.
    const hastedWalk =
      Math.abs((hasted?.x ?? 0) - 1.5) + Math.abs((hasted?.y ?? 0) - 9.5);
    const normalWalk =
      Math.abs((normal?.x ?? 0) - 1.5) + Math.abs((normal?.y ?? 0) - 9.5);
    expect(hastedWalk / normalWalk).toBeGreaterThan(1.4);
    expect(hastedWalk / normalWalk).toBeLessThan(1.6);

    const running = after(triggered("haste"), 1);
    expect(running.powerUps.haste).toBeCloseTo(6 - 1 / 60);
    expect(
      after(triggered("haste"), stepsIn(6) + 1).powerUps.haste,
    ).toBeUndefined();
  });

  it("Fury adds 2 attack for 6s", () => {
    const damageOn = (powerUp: "fury" | "heal") => {
      const start = battleWith({
        // Pawn 1 collects the orb, pawn 2 strikes on the next step.
        pawns: [
          pawnAt(1, 5.5, 5.5, bystander),
          pawnAt(2, 8.5, 6.2, { strikeCooldownLeft: 0.02 }),
        ],
        blackPieces: [knightOn(3, { file: 8, rank: 5 }, { hp: 50, maxHp: 50 })],
        orbs: [orbAt(5.5, 5.5, { powerUp })],
      });
      const next = after(start, 2);
      return 50 - (blackPieceById(next, 3)?.hp ?? 0);
    };
    expect(damageOn("heal")).toBe(1);
    expect(damageOn("fury")).toBe(3);
    expect(after(triggered("fury"), 1).powerUps.fury).toBeCloseTo(6 - 1 / 60);
  });

  it("Freeze stops black pieces for 3s", () => {
    const start = triggered("freeze", {
      pawns: [pawnAt(1, 5.5, 5.5, bystander), pawnAt(2, 1.5, 1.5, bystander)],
      blackPieces: [
        knightOn(3, { file: 14, rank: 9 }, { actLeft: 0.5, contactLeft: 0.5 }),
      ],
    });
    const frozen = after(start, stepsIn(2.9));
    expect(blackPieceById(frozen, 3)?.actLeft).toBeCloseTo(0.5, 1);
    expect(blackPieceById(frozen, 3)?.move).toBeUndefined();
    // Once the 3s are over, it moves again.
    const later = after(start, stepsIn(3.7));
    expect(blackPieceById(later, 3)?.move).toBeDefined();
    expect(later.powerUps.freeze).toBeUndefined();
  });

  it("Freeze also stops a move that is under way", () => {
    const start = triggered("freeze", {
      blackPieces: [
        knightOn(
          3,
          { file: 14, rank: 9 },
          {
            move: {
              phase: "warning",
              to: { file: 12, rank: 8 },
              hitSquares: [],
              secondsLeft: 0.3,
              phaseSeconds: 0.4,
            },
          },
        ),
      ],
    });
    const frozen = after(start, stepsIn(2));
    expect(blackPieceById(frozen, 3)?.move?.secondsLeft).toBeCloseTo(0.3, 1);
  });

  it("Bounty doubles drops before crowding rounds them", () => {
    // 150 pawns: crowding leaves half. A knight drops 1 × 0.5 → 0 or 1 by
    // chance; with Bounty it is 2 × 0.5 = exactly 1. Doubling after the
    // rounding would give 0 or 2, never exactly 1.
    const crowd = Array.from({ length: 149 }, (_, index) =>
      pawnAt(
        10 + index,
        0.5 + (index % 15),
        0.5 + Math.floor(index / 15) * 0.3,
        bystander,
      ),
    );
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const start = battleWith({
        pawns: [pawnAt(1, 8.5, 6.2), ...crowd],
        blackPieces: [knightOn(3, { file: 8, rank: 5 }, { hp: 1 })],
        powerUps: { bounty: 8 },
        rng: seed,
      });
      expect(eventsOfType([after(start, 1)], "drop")).toMatchObject([
        { count: 1 },
      ]);
    }
    expect(after(triggered("bounty"), 1).powerUps.bounty).toBeCloseTo(
      8 - 1 / 60,
    );
  });

  it("Reinforcements adds 3 plain pawns where the orb was", () => {
    const next = after(triggered("reinforcements"), 1);
    expect(next.pawns).toHaveLength(4);
    for (const pawn of next.pawns.slice(1)) {
      expect(pawn.type).toBe("plain");
      expect(Math.hypot(pawn.x - 5.5, pawn.y - 5.5)).toBeLessThan(0.5);
    }
  });

  it("reports each pickup for the toast", () => {
    for (const powerUp of POWER_UP_IDS) {
      const next = after(triggered(powerUp), 1);
      expect(eventsOfType([next], "power-up")).toMatchObject([{ powerUp }]);
    }
  });
});

describe("power-up catalog", () => {
  it("has the six power-ups of the spec with the spec's numbers", () => {
    expect([...POWER_UP_IDS].sort()).toEqual(
      ["bounty", "freeze", "fury", "haste", "heal", "reinforcements"].sort(),
    );
    expect(POWER_UP_RULES.lifetimeSeconds).toBe(9);
    expect(POWER_UP_RULES.attractRadius).toBe(3);
  });
});
