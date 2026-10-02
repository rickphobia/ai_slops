import { describe, expect, it } from "vitest";
import type { BattleState } from "../../src/battle/battle-state";
import { createBattle } from "../../src/battle/create-battle";
import { step } from "../../src/battle/step";
import { PAWN_TYPES, type PawnTypeId } from "../../src/catalog/pieces";
import { WAVES } from "../../src/catalog/waves";
import { type SkillUse, skillsUsedAt } from "../../src/skills/skills";
import {
  after,
  battleWith,
  blackPieceById,
  eventsOfType,
  knightOn,
  pawnAt,
  pawnById,
  stepsIn,
} from "./pieces";

/** One step with these skills fired. */
const fire = (state: BattleState, ...skillUses: PawnTypeId[]): BattleState =>
  step(state, { skillUses });

describe("firing a skill", () => {
  const start = battleWith({
    pawns: [pawnAt(1, 2.5, 9.5, { strikeCooldownLeft: 99 })],
    blackPieces: [knightOn(2, { file: 13, rank: 1 })],
  });

  it("starts its cooldown and says so in the step's events", () => {
    const next = fire(start, "plain");
    expect(eventsOfType([next], "skill")).toEqual([
      { type: "skill", pawnType: "plain", pawns: 1 },
    ]);
    expect(next.skillCooldowns.plain).toBeCloseTo(
      PAWN_TYPES.plain.skill.cooldown - 1 / 60,
    );
  });

  it("does nothing while it is on cooldown", () => {
    let state = fire(start, "plain");
    for (let index = 1; index < stepsIn(12); index++) {
      state = fire(state, "plain");
      expect(eventsOfType([state], "skill")).toEqual([]);
    }
    // 12 s after the first use it is ready again.
    expect(state.skillCooldowns.plain).toBeUndefined();
    expect(eventsOfType([fire(state, "plain")], "skill")).toHaveLength(1);
  });

  it("fires once when used twice in the same step", () => {
    expect(eventsOfType([fire(start, "plain", "plain")], "skill")).toHaveLength(
      1,
    );
  });

  it("does nothing with no pawn of its type on the board", () => {
    const next = fire(start, "twin");
    expect(eventsOfType([next], "skill")).toEqual([]);
    expect(next.skillCooldowns).toEqual({});
  });

  it("starts every wave ready", () => {
    const battle = createBattle({
      army: { plain: 3 },
      wave: WAVES[0] ?? { blackPieces: [] },
      waveNumber: 1,
      seed: 1,
    });
    expect(battle.skillCooldowns).toEqual({});
    expect(battle.lastingSkills).toEqual({});
  });
});

describe("Charge", () => {
  // A plain pawn far below a knight, walking up toward it.
  const walker = battleWith({
    pawns: [pawnAt(1, 5.5, 9.5, { strikeCooldownLeft: 99 })],
    blackPieces: [knightOn(2, { file: 5, rank: 1 })],
  });

  it("makes plain pawns walk twice as fast", () => {
    const walked = (next: BattleState): number =>
      9.5 - (pawnById(next, 1)?.y ?? 9.5);
    expect(walked(fire(walker, "plain"))).toBeCloseTo(
      (2 * PAWN_TYPES.plain.speed) / 60,
    );
    expect(walked(after(walker, 1))).toBeCloseTo(PAWN_TYPES.plain.speed / 60);
  });

  it("gives plain pawns +1 attack for 3 s, then wears off", () => {
    // A plain pawn in reach of a tough knight, striking every step.
    const striker = battleWith({
      pawns: [pawnAt(1, 5.5, 4.8)],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { hp: 100 })],
    });
    let state = fire(striker, "plain");
    expect(eventsOfType([state], "strike")[0]?.damage).toBe(2);
    for (let index = 1; index < stepsIn(3); index++)
      state = step(state, { skillUses: [] });
    expect(state.lastingSkills).toEqual({});
    state = step(
      {
        ...state,
        pawns: state.pawns.map((pawn) => ({ ...pawn, strikeCooldownLeft: 0 })),
      },
      { skillUses: [] },
    );
    expect(eventsOfType([state], "strike")[0]?.damage).toBe(1);
  });

  it("doesn't change other pawn types", () => {
    const spear = battleWith({
      pawns: [
        pawnAt(1, 1.5, 9.5, { strikeCooldownLeft: 99 }),
        pawnAt(3, 5.5, 9.5, { type: "spear", strikeCooldownLeft: 99 }),
      ],
      blackPieces: [knightOn(2, { file: 5, rank: 1 })],
    });
    const next = fire(spear, "plain");
    expect(9.5 - (pawnById(next, 3)?.y ?? 9.5)).toBeCloseTo(
      PAWN_TYPES.spear.speed / 60,
    );
  });
});

describe("Hold the line", () => {
  // A knight touching a shield, about to hurt it.
  const touching = battleWith({
    pawns: [pawnAt(1, 5.5, 4.9, { type: "shield", strikeCooldownLeft: 99 })],
    blackPieces: [knightOn(2, { file: 5, rank: 5 }, { contactLeft: 0.001 })],
  });

  it("stops shields taking damage for 4 s", () => {
    expect(pawnById(after(touching, 1), 1)?.hp).toBe(9);
    const held = fire(touching, "shield");
    expect(pawnById(held, 1)?.hp).toBe(10);
    expect(eventsOfType([held], "pawn-hurt")).toEqual([]);
    expect(held.lastingSkills.shield).toBeCloseTo(4 - 1 / 60);
  });

  it("doesn't protect other pawn types", () => {
    const mixed = battleWith({
      pawns: [
        pawnAt(1, 5.5, 4.9, { type: "shield", strikeCooldownLeft: 99 }),
        pawnAt(3, 5.5, 6.1, { strikeCooldownLeft: 99 }),
      ],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { contactLeft: 0.001 })],
    });
    const held = fire(mixed, "shield");
    expect(pawnById(held, 3)?.hp).toBe(2);
  });

  it("draws black pieces from twice as far", () => {
    // A knight at (10.5, 6.5) about to pick a move; a plain pawn 2 squares
    // above it and a shield 4 squares to its right, past its usual pull.
    const start = battleWith({
      pawns: [
        pawnAt(1, 10.5, 4.5, { strikeCooldownLeft: 99 }),
        pawnAt(2, 14.5, 6.5, { type: "shield", strikeCooldownLeft: 99 }),
      ],
      blackPieces: [knightOn(3, { file: 10, rank: 6 }, { actLeft: 0.001 })],
    });
    const targetFile = (next: BattleState): number | undefined =>
      blackPieceById(next, 3)?.move?.to.file;
    expect([9, 11]).toContain(targetFile(after(start, 1)));
    expect(targetFile(fire(start, "shield"))).toBe(12);
  });
});

describe("Volley", () => {
  // A spear on (5.5, 5.5); knights 4 squares up its column and along its row,
  // one 5 squares away and one on a diagonal.
  const start = battleWith({
    pawns: [pawnAt(1, 5.5, 5.5, { type: "spear", strikeCooldownLeft: 99 })],
    blackPieces: [
      knightOn(2, { file: 5, rank: 1 }, { hp: 10 }),
      knightOn(3, { file: 9, rank: 5 }, { hp: 10 }),
      knightOn(4, { file: 10, rank: 5 }, { hp: 10 }),
      knightOn(5, { file: 7, rank: 7 }, { hp: 10 }),
    ],
  });

  it("hits every black piece within 4 squares in each spear's row and column for 3", () => {
    const next = fire(start, "spear");
    expect([2, 3, 4, 5].map((id) => blackPieceById(next, id)?.hp)).toEqual([
      7, 7, 10, 10,
    ]);
    expect(eventsOfType([next], "strike")).toMatchObject([
      { pawnId: 1, targetId: 2, damage: 3 },
      { pawnId: 1, targetId: 3, damage: 3 },
    ]);
  });

  it("hits once per spear", () => {
    const twoSpears = battleWith({
      pawns: [
        pawnAt(1, 5.5, 5.5, { type: "spear", strikeCooldownLeft: 99 }),
        pawnAt(6, 5.5, 3.5, { type: "spear", strikeCooldownLeft: 99 }),
      ],
      blackPieces: [knightOn(2, { file: 5, rank: 1 }, { hp: 10 })],
    });
    expect(blackPieceById(fire(twoSpears, "spear"), 2)?.hp).toBe(4);
  });
});

describe("Fork", () => {
  // A twin on (5.5, 5.5); knights on a side neighbour, on a diagonal
  // neighbour (1.41 away, just out of reach) and 2 squares away.
  const start = battleWith({
    pawns: [pawnAt(1, 5.5, 5.5, { type: "twin", strikeCooldownLeft: 99 })],
    blackPieces: [
      knightOn(2, { file: 6, rank: 6 }, { hp: 10 }),
      knightOn(3, { file: 4, rank: 5 }, { hp: 10 }),
      knightOn(4, { file: 7, rank: 5 }, { hp: 10 }),
    ],
  });

  it("hits every black piece within 1.375 squares of each twin for 2", () => {
    const next = fire(start, "twin");
    expect([2, 3, 4].map((id) => blackPieceById(next, id)?.hp)).toEqual([
      10, 8, 10,
    ]);
  });

  it("reaches a diagonal neighbour when the twin stands toward it", () => {
    const leaning = battleWith({
      pawns: [pawnAt(1, 5.8, 5.8, { type: "twin", strikeCooldownLeft: 99 })],
      blackPieces: [knightOn(2, { file: 6, rank: 6 }, { hp: 10 })],
    });
    expect(blackPieceById(fire(leaning, "twin"), 2)?.hp).toBe(8);
  });

  it("kills drop pawns like any kill", () => {
    const weak = battleWith({
      pawns: [pawnAt(1, 5.5, 5.5, { type: "twin", strikeCooldownLeft: 99 })],
      blackPieces: [knightOn(2, { file: 6, rank: 5 }, { hp: 2 })],
      pushes: [["knight"]],
    });
    const next = fire(weak, "twin");
    expect(blackPieceById(next, 2)).toBeUndefined();
    expect(eventsOfType([next], "death")).toMatchObject([{ id: 2 }]);
    expect(eventsOfType([next], "drop")).toHaveLength(1);
  });
});

describe("replaying a battle", () => {
  const play = (uses: readonly SkillUse[]): BattleState => {
    let state = createBattle({
      army: { plain: 6, shield: 2, spear: 2, twin: 2 },
      wave: WAVES[3] ?? { blackPieces: [] },
      waveNumber: 4,
      seed: 42,
    });
    for (let index = 0; index < stepsIn(20); index++) {
      state = step(state, {
        skillUses: skillsUsedAt(uses, state.stepNumber),
      });
    }
    return state;
  };
  const uses: SkillUse[] = [
    { step: 90, skill: "plain" },
    { step: 120, skill: "spear" },
    { step: 121, skill: "twin" },
    { step: 400, skill: "shield" },
    { step: 900, skill: "spear" },
  ];

  it("plays the same battle from the same seed and the same skill uses", () => {
    expect(play(uses)).toEqual(play(uses));
  });

  it("plays a different battle with different skill uses", () => {
    expect(play(uses)).not.toEqual(play([]));
  });
});
