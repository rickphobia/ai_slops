import { describe, expect, it } from "vitest";
import type { BattleState, WhitePawn } from "../../src/battle/battle-state";
import { createBattle } from "../../src/battle/create-battle";
import { step } from "../../src/battle/step";
import { PAWN_TYPES, type PawnTypeId } from "../../src/catalog/pieces";
import {
  after,
  battleWith,
  blackOn,
  eventsOfType,
  knightOn,
  pawnAt,
  pawnById,
  playSteps,
  stepsIn,
} from "./pieces";

const fire = (state: BattleState, ...skillUses: PawnTypeId[]): BattleState =>
  step(state, { skillUses });

/** A rook that stands still far from the action, so a battle stays ongoing. */
const farRook = blackOn("rook", 90, { file: 14, rank: 9 });
/** A king has so much HP that a long test never wins the battle by accident. */
const farKing = blackOn("king", 91, { file: 14, rank: 9 });

const plainCount = (state: BattleState): number =>
  state.pawns.filter((pawn) => pawn.type === "plain").length;

describe("Recruiter", () => {
  const recruiter = (overrides: Partial<WhitePawn> = {}) =>
    pawnAt(1, 4, 4, {
      type: "recruiter",
      strikeCooldownLeft: 99,
      recruitLeft: 0.05,
      ...overrides,
    });

  it("spawns a plain pawn when its timer runs out", () => {
    const states = playSteps(
      battleWith({ pawns: [recruiter()], blackPieces: [farRook] }),
      stepsIn(0.2),
    );
    expect(eventsOfType(states, "recruit")).toMatchObject([
      { pawnId: 1, count: 1 },
    ]);
    expect(
      plainCount(states[states.length - 1] ?? battleWith({ pawns: [] })),
    ).toBe(1);
  });

  it("spawns another every 8 seconds", () => {
    const states = playSteps(
      battleWith({ pawns: [recruiter()], blackPieces: [farKing] }),
      stepsIn(17),
    );
    // At 0.05s, 8.05s and 16.05s.
    expect(eventsOfType(states, "recruit")).toHaveLength(3);
  });

  it("starts the first timer at 8 seconds", () => {
    const state = createBattle({
      army: { recruiter: 1 },
      wave: { blackPieces: [{ kind: "knight", count: 1 }] },
      waveNumber: 1,
      seed: 1,
    });
    expect(state.pawns[0]?.recruitLeft).toBe(8);
  });

  it("waits while stunned", () => {
    const states = playSteps(
      battleWith({
        pawns: [recruiter({ stunLeft: 1 })],
        blackPieces: [farRook],
      }),
      stepsIn(0.5),
    );
    expect(eventsOfType(states, "recruit")).toEqual([]);
  });

  it("Call to arms spawns 2 plain pawns for each recruiter", () => {
    const next = fire(
      battleWith({
        pawns: [
          recruiter({ recruitLeft: 99 }),
          recruiter({ id: 2, x: 8, recruitLeft: 99 }),
        ],
        blackPieces: [farRook],
      }),
      "recruiter",
    );
    expect(plainCount(next)).toBe(4);
    expect(next.skillCooldowns.recruiter).toBeGreaterThan(24);
  });
});

describe("Berserker", () => {
  const berserker = (overrides: Partial<WhitePawn> = {}) =>
    pawnAt(1, 4, 4, {
      type: "berserker",
      strikeCooldownLeft: 99,
      ...overrides,
    });
  /** A plain pawn about to die to a knight's touch. */
  const doomedBy = (x: number, y: number) =>
    battleWith({
      pawns: [
        berserker(),
        berserker({ id: 2, x: 12, y: 8 }),
        pawnAt(3, x, y, { hp: 1, strikeCooldownLeft: 99 }),
      ],
      blackPieces: [
        knightOn(9, { file: 4, rank: 6 }, { contactLeft: 0 }),
        farRook,
      ],
    });

  it("gains 1 attack when a white pawn dies near it, not when one dies far away", () => {
    const next = step(doomedBy(4.5, 6.5), { skillUses: [] });
    expect(pawnById(next, 3)).toBeUndefined();
    expect(pawnById(next, 1)?.rage).toBe(1);
    expect(pawnById(next, 2)?.rage).toBe(0);
  });

  it("strikes for its attack plus what it has gathered", () => {
    const states = playSteps(
      battleWith({
        pawns: [
          pawnAt(1, 5.5, 4.8, {
            type: "berserker",
            rage: 2,
            strikeCooldownLeft: 0,
          }),
        ],
        blackPieces: [blackOn("rook", 9, { file: 5, rank: 5 })],
      }),
      1,
    );
    expect(eventsOfType(states, "strike")[0]?.damage).toBe(
      PAWN_TYPES.berserker.attack + 2,
    );
  });

  it("starts every wave with nothing gathered", () => {
    const state = createBattle({
      army: { berserker: 1 },
      wave: { blackPieces: [{ kind: "knight", count: 1 }] },
      waveNumber: 1,
      seed: 1,
    });
    expect(state.pawns[0]?.rage).toBe(0);
  });

  it("Frenzy costs 1 HP and adds 3 attack for 5 seconds", () => {
    const start = battleWith({
      pawns: [
        pawnAt(1, 5.5, 4.8, { type: "berserker", strikeCooldownLeft: 0 }),
      ],
      blackPieces: [blackOn("king", 9, { file: 5, rank: 5 })],
    });
    const frenzied = fire(start, "berserker");
    expect(pawnById(frenzied, 1)?.hp).toBe(PAWN_TYPES.berserker.hp - 1);
    expect(eventsOfType([frenzied], "pawn-hurt")[0]).toMatchObject({
      cause: "skill",
      damage: 1,
    });
    expect(eventsOfType([frenzied], "strike")[0]?.damage).toBe(2 + 3);

    const calm = after(frenzied, stepsIn(5.5));
    const later = playSteps(
      {
        ...calm,
        pawns: calm.pawns.map((pawn) => ({ ...pawn, strikeCooldownLeft: 0 })),
      },
      1,
    );
    expect(eventsOfType(later, "strike")[0]?.damage).toBe(2);
  });

  it("Frenzy can kill a berserker on its last HP", () => {
    const next = fire(
      battleWith({
        pawns: [berserker({ hp: 1 }), pawnAt(2, 9, 9)],
        blackPieces: [farRook],
      }),
      "berserker",
    );
    expect(pawnById(next, 1)).toBeUndefined();
  });
});

describe("Promoter", () => {
  const promoter = (x: number, y: number, overrides: Partial<WhitePawn> = {}) =>
    pawnAt(1, x, y, { type: "promoter", strikeCooldownLeft: 99, ...overrides });
  const queen = PAWN_TYPES.promoter.passiveEffect?.promotesAtEdge;
  if (queen === undefined) throw new Error("The promoter has no queen stats.");

  it("becomes a white queen at full HP when it stands at a board edge", () => {
    const states = playSteps(
      battleWith({
        pawns: [promoter(0.25, 5, { hp: 1, stunLeft: 1 })],
        blackPieces: [farRook],
      }),
      1,
    );
    const next = states[0];
    expect(pawnById(next ?? battleWith({ pawns: [] }), 1)).toMatchObject({
      promoted: true,
      hp: queen.hp,
      maxHp: queen.hp,
    });
    expect(eventsOfType(states, "promote")).toHaveLength(1);
  });

  it.each([
    ["right", 15.75, 5],
    ["bottom", 8, 0.25],
    ["top", 8, 10.75],
  ])("promotes at the %s edge", (_edge, x, y) => {
    const next = step(
      battleWith({
        pawns: [promoter(x, y, { stunLeft: 1 })],
        blackPieces: [farRook],
      }),
      { skillUses: [] },
    );
    expect(pawnById(next, 1)?.promoted).toBe(true);
  });

  it("stays a pawn away from the edges, and promotes only once", () => {
    const middle = step(
      battleWith({ pawns: [promoter(8, 5)], blackPieces: [farRook] }),
      { skillUses: [] },
    );
    expect(pawnById(middle, 1)?.promoted).toBe(false);

    const edge = playSteps(
      battleWith({
        pawns: [promoter(0.25, 5, { stunLeft: 1 })],
        blackPieces: [farRook],
      }),
      10,
    );
    expect(eventsOfType(edge, "promote")).toHaveLength(1);
  });

  it("strikes as a queen once promoted", () => {
    const states = playSteps(
      battleWith({
        pawns: [
          pawnAt(1, 5.5, 4.8, {
            type: "promoter",
            promoted: true,
            hp: queen.hp,
            strikeCooldownLeft: 0,
          }),
        ],
        blackPieces: [blackOn("rook", 9, { file: 5, rank: 5 })],
      }),
      1,
    );
    expect(eventsOfType(states, "strike")[0]?.damage).toBe(queen.attack);
  });

  it("Rush leaps 5 squares toward the nearest black piece", () => {
    const next = fire(
      battleWith({
        pawns: [promoter(2.5, 5.5)],
        blackPieces: [blackOn("rook", 9, { file: 13, rank: 5 })],
      }),
      "promoter",
    );
    const rushed = pawnById(next, 1);
    expect(rushed?.x).toBeCloseTo(7.5, 1);
    expect(rushed?.y).toBeCloseTo(5.5, 1);
    expect(eventsOfType([next], "leap")).toMatchObject([
      { pawnId: 1, from: { x: 2.5, y: 5.5 }, at: { x: 7.5 } },
    ]);
    expect(next.skillCooldowns.promoter).toBeGreaterThan(17);
  });

  it("Rush stops where it can strike instead of landing on the piece", () => {
    const next = fire(
      battleWith({
        pawns: [promoter(2.5, 5.5)],
        blackPieces: [blackOn("rook", 9, { file: 6, rank: 5 })],
      }),
      "promoter",
    );
    const rushed = pawnById(next, 1);
    // The rook stands at 6.5: closer than 5 squares, so the leap ends inside strike range.
    expect(rushed?.x).toBeGreaterThan(5);
    expect(rushed?.x).toBeLessThan(6.5 - 0.375);
  });

  it("Rush does nothing with no black piece to leap at, or when stunned", () => {
    const none = fire(battleWith({ pawns: [promoter(2.5, 5.5)] }), "promoter");
    expect(eventsOfType([none], "leap")).toEqual([]);
    const stunned = fire(
      battleWith({
        pawns: [promoter(2.5, 5.5, { stunLeft: 1 })],
        blackPieces: [farRook],
      }),
      "promoter",
    );
    expect(eventsOfType([stunned], "leap")).toEqual([]);
  });
});

describe("En passant", () => {
  const dancer = (overrides: Partial<WhitePawn> = {}) =>
    pawnAt(1, 4.5, 6.5, {
      type: "enPassant",
      strikeCooldownLeft: 99,
      ...overrides,
    });
  /** A knight touching the pawn, with its touch due now and then every 1.5 seconds. */
  const touching = (pawn = dancer()) =>
    battleWith({
      pawns: [pawn],
      blackPieces: [knightOn(9, { file: 4, rank: 6 }, { contactLeft: 0 })],
    });

  it("starts each wave ready to dodge", () => {
    const state = createBattle({
      army: { enPassant: 1 },
      wave: { blackPieces: [{ kind: "knight", count: 1 }] },
      waveNumber: 1,
      seed: 1,
    });
    expect(state.pawns[0]?.dodgeReady).toBe(true);
  });

  it("dodges the first hit without losing HP", () => {
    const next = step(touching(), { skillUses: [] });
    expect(pawnById(next, 1)?.hp).toBe(PAWN_TYPES.enPassant.hp);
    expect(pawnById(next, 1)?.dodgeReady).toBe(false);
    expect(eventsOfType([next], "dodge")).toHaveLength(1);
    expect(eventsOfType([next], "pawn-hurt")).toEqual([]);
  });

  it("takes the second hit", () => {
    const states = playSteps(touching(), stepsIn(1.6));
    expect(eventsOfType(states, "dodge")).toHaveLength(1);
    const last = states[states.length - 1] ?? touching();
    expect(pawnById(last, 1)?.hp).toBe(PAWN_TYPES.enPassant.hp - 1);
  });

  it("dodges a black move landing on it too", () => {
    const state = battleWith({
      pawns: [dancer()],
      blackPieces: [
        knightOn(
          9,
          { file: 2, rank: 6 },
          {
            move: {
              phase: "moving",
              to: { file: 4, rank: 6 },
              hitSquares: [{ file: 4, rank: 6 }],
              secondsLeft: 0.01,
              phaseSeconds: 0.28,
            },
          },
        ),
      ],
    });
    const next = after(state, 2);
    expect(pawnById(next, 1)?.hp).toBe(PAWN_TYPES.enPassant.hp);
    expect(pawnById(next, 1)?.dodgeReady).toBe(false);
  });

  it("Sidestep readies the dodge again and dashes up to 3 squares", () => {
    const spent = dancer({ dodgeReady: false, x: 2.5, y: 5.5 });
    const next = fire(
      battleWith({
        pawns: [spent],
        blackPieces: [blackOn("rook", 9, { file: 13, rank: 5 })],
      }),
      "enPassant",
    );
    expect(pawnById(next, 1)?.dodgeReady).toBe(true);
    expect(pawnById(next, 1)?.x).toBeCloseTo(5.5, 1);
    expect(eventsOfType([next], "leap")).toHaveLength(1);
    expect(next.skillCooldowns.enPassant).toBeGreaterThan(14);
  });

  it("Frenzy's cost can't be dodged", () => {
    const next = fire(
      battleWith({
        pawns: [
          pawnAt(1, 4, 4, {
            type: "berserker",
            strikeCooldownLeft: 99,
            dodgeReady: true,
          }),
        ],
        blackPieces: [farRook],
      }),
      "berserker",
    );
    expect(pawnById(next, 1)?.hp).toBe(PAWN_TYPES.berserker.hp - 1);
  });
});
