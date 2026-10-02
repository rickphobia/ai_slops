import { describe, expect, it } from "vitest";
import type { BattleState } from "../../src/battle/battle-state";
import { step } from "../../src/battle/step";
import { PAWN_TYPES, type PawnTypeId } from "../../src/catalog/pieces";
import {
  after,
  battleWith,
  blackOn,
  blackPieceById,
  eventsOfType,
  pawnAt,
  pawnById,
  playSteps,
  stepsIn,
} from "./pieces";

const fire = (state: BattleState, ...skillUses: PawnTypeId[]): BattleState =>
  step(state, { skillUses });

/** A rook that stands still far from the action, so a battle stays ongoing. */
const farRook = blackOn("rook", 90, { file: 14, rank: 9 });

describe("Medic", () => {
  const medic = (healLeft: number) =>
    pawnAt(1, 4, 4, { type: "medic", healLeft });
  const hurt = (x: number, y: number) =>
    pawnAt(2, x, y, { hp: 1, strikeCooldownLeft: 99 });

  it("heals a hurt pawn near it by 1 HP when its timer runs out", () => {
    const state = after(
      battleWith({
        pawns: [medic(0.1), hurt(5, 4)],
        blackPieces: [farRook],
      }),
      stepsIn(0.2),
    );
    expect(pawnById(state, 2)?.hp).toBe(2);
  });

  it("heals again every 1.5 seconds and never past full HP", () => {
    const states = playSteps(
      battleWith({
        pawns: [medic(0.1), hurt(5, 4)],
        blackPieces: [farRook],
      }),
      stepsIn(5),
    );
    const last = states[states.length - 1];
    expect(last === undefined ? undefined : pawnById(last, 2)?.hp).toBe(
      PAWN_TYPES.plain.hp,
    );
    const heals = eventsOfType(states, "heal");
    expect(heals).toHaveLength(2);
    expect(heals.map((heal) => heal.amount)).toEqual([1, 1]);
  });

  it("leaves pawns out of its reach alone", () => {
    const state = after(
      battleWith({
        pawns: [medic(0.1), hurt(9, 4)],
        blackPieces: [farRook],
      }),
      stepsIn(0.2),
    );
    expect(pawnById(state, 2)?.hp).toBe(1);
  });

  it("doesn't fight: it never strikes, even with a black piece in reach", () => {
    const states = playSteps(
      battleWith({
        pawns: [pawnAt(1, 5.5, 5, { type: "medic", healLeft: 99 })],
        blackPieces: [blackOn("rook", 2, { file: 5, rank: 5 })],
      }),
      stepsIn(2),
    );
    expect(eventsOfType(states, "strike")).toEqual([]);
  });

  it("walks toward the other pawns instead of the black pieces", () => {
    const start = battleWith({
      pawns: [
        pawnAt(1, 2, 5, { type: "medic", healLeft: 99 }),
        pawnAt(2, 8, 5, { strikeCooldownLeft: 99 }),
      ],
      blackPieces: [blackOn("rook", 3, { file: 0, rank: 5 })],
    });
    expect(pawnById(after(start, stepsIn(1)), 1)?.x).toBeGreaterThan(2);
  });
});

describe("Triage", () => {
  it("fully heals every white pawn", () => {
    const start = battleWith({
      pawns: [
        pawnAt(1, 4, 4, { type: "medic", hp: 1, healLeft: 99 }),
        pawnAt(2, 9, 8, { hp: 1, strikeCooldownLeft: 99 }),
        pawnAt(3, 3, 8, { type: "shield", hp: 4, strikeCooldownLeft: 99 }),
      ],
      blackPieces: [farRook],
    });
    const next = fire(start, "medic");
    expect(next.pawns.map((pawn) => pawn.hp)).toEqual([
      PAWN_TYPES.medic.hp,
      PAWN_TYPES.plain.hp,
      PAWN_TYPES.shield.hp,
    ]);
    expect(eventsOfType([next], "heal")).toHaveLength(3);
    expect(next.skillCooldowns.medic).toBeGreaterThan(24);
  });
});

describe("Banner", () => {
  /** A plain pawn right next to a rook strikes on the first step. */
  const strikeDamages = (pawns: ReturnType<typeof pawnAt>[]): number[] =>
    eventsOfType(
      [
        step(
          battleWith({
            pawns,
            blackPieces: [blackOn("rook", 9, { file: 5, rank: 5 })],
          }),
          { skillUses: [] },
        ),
      ],
      "strike",
    ).map((strike) => strike.damage);

  const striker = pawnAt(1, 5.5, 4.8);

  it("gives pawns near it +1 attack", () => {
    const banner = pawnAt(2, 4.5, 4.8, {
      type: "banner",
      strikeCooldownLeft: 99,
    });
    expect(strikeDamages([striker, banner])).toEqual([2]);
  });

  it("gives nothing to pawns out of its reach", () => {
    const banner = pawnAt(2, 1, 1, { type: "banner", strikeCooldownLeft: 99 });
    expect(strikeDamages([striker, banner])).toEqual([1]);
  });

  it("doesn't buff itself", () => {
    const banner = pawnAt(2, 5.5, 4.8, { type: "banner" });
    expect(strikeDamages([banner])).toEqual([1]);
  });
});

describe("Rally", () => {
  const start = battleWith({
    pawns: [
      pawnAt(1, 2, 5.5, { strikeCooldownLeft: 99 }),
      pawnAt(2, 2, 2, { type: "banner", strikeCooldownLeft: 99 }),
    ],
    blackPieces: [blackOn("rook", 9, { file: 13, rank: 5 })],
  });

  it("makes every pawn, not just banners, walk 60% faster while it lasts", () => {
    const plain = (state: BattleState) => pawnById(state, 1)?.x ?? 0;
    const calm = plain(after(start, stepsIn(1))) - 2;
    const rallied = plain(after(fire(start, "banner"), stepsIn(1))) - 2;
    expect(rallied / calm).toBeCloseTo(1.6, 1);
  });

  it("makes every pawn strike 60% more often", () => {
    const near = battleWith({
      pawns: [pawnAt(1, 5.5, 4.8), pawnAt(2, 2, 2, { type: "banner" })],
      blackPieces: [
        blackOn("rook", 9, { file: 5, rank: 5 }, { hp: 999, maxHp: 999 }),
      ],
    });
    const strikesBy = (state: BattleState): number =>
      eventsOfType(playSteps(state, stepsIn(3)), "strike").filter(
        (strike) => strike.pawnType === "plain",
      ).length;
    const calm = strikesBy(near);
    const rallied = strikesBy(fire(near, "banner"));
    expect(rallied).toBeGreaterThan(calm);
  });

  it("wears off after 5 seconds", () => {
    const state = after(fire(start, "banner"), stepsIn(5.1));
    expect(state.lastingSkills.banner).toBeUndefined();
  });
});

describe("Bomb", () => {
  /** A bomb pawn with 1 HP touching a rook that hurts on the first step, a plain pawn beside it and one far away. */
  const rookOnSquare = (): ReturnType<typeof blackOn> =>
    blackOn("rook", 9, { file: 5, rank: 5 }, { contactLeft: 0 });
  const start = battleWith({
    pawns: [
      pawnAt(1, 5.5, 5, { type: "bomb", hp: 1, strikeCooldownLeft: 99 }),
      pawnAt(2, 6.5, 5.5, { hp: 2, strikeCooldownLeft: 99 }),
      pawnAt(3, 12, 9, { hp: 2, strikeCooldownLeft: 99 }),
    ],
    blackPieces: [rookOnSquare(), farRook],
  });

  it("explodes on death: black pieces nearby take 4", () => {
    const next = step(start, { skillUses: [] });
    expect(pawnById(next, 1)).toBeUndefined();
    expect(blackPieceById(next, 9)?.hp).toBe(8);
    expect(blackPieceById(next, 90)?.hp).toBe(12);
  });

  it("stuns white pawns in the blast for 2s without hurting them", () => {
    const next = step(start, { skillUses: [] });
    const beside = pawnById(next, 2);
    expect(beside?.hp).toBe(2);
    expect(beside?.stunLeft).toBeCloseTo(2);
    expect(
      eventsOfType([next], "pawn-hurt").map((hurt) => hurt.pawnId),
    ).toEqual([1]);
    expect(eventsOfType([next], "blast")).toMatchObject([
      { pawnId: 1, stunned: 1 },
    ]);
  });

  it("leaves white pawns outside the blast awake", () => {
    expect(pawnById(step(start, { skillUses: [] }), 3)?.stunLeft).toBe(0);
  });

  it("wakes the stunned pawns after the 2 seconds", () => {
    const blown = step(start, { skillUses: [] });
    expect(pawnById(after(blown, stepsIn(2.1)), 2)?.stunLeft).toBe(0);
  });

  it("kills black pieces the blast takes to 0 HP", () => {
    const weak = battleWith({
      pawns: [
        pawnAt(1, 5.5, 5, { type: "bomb", hp: 1, strikeCooldownLeft: 99 }),
      ],
      blackPieces: [{ ...rookOnSquare(), hp: 3 }, farRook],
    });
    const next = step(weak, { skillUses: [] });
    expect(blackPieceById(next, 9)).toBeUndefined();
    expect(eventsOfType([next], "drop")).toHaveLength(1);
  });

  it("Detonate blows up every bomb pawn now, stunning the rest", () => {
    const calm = battleWith({
      pawns: [
        pawnAt(1, 3, 3, { type: "bomb", strikeCooldownLeft: 99 }),
        pawnAt(2, 9, 3, { type: "bomb", strikeCooldownLeft: 99 }),
        pawnAt(3, 3.5, 3.5, { strikeCooldownLeft: 99 }),
      ],
      blackPieces: [blackOn("rook", 9, { file: 3, rank: 4 }), farRook],
    });
    const next = fire(calm, "bomb");
    expect(next.pawns.map((pawn) => pawn.id)).toEqual([3]);
    expect(pawnById(next, 3)?.hp).toBe(PAWN_TYPES.plain.hp);
    expect(pawnById(next, 3)?.stunLeft).toBeGreaterThan(1.9);
    expect(blackPieceById(next, 9)?.hp).toBe(8);
    expect(eventsOfType([next], "blast")).toHaveLength(2);
    expect(next.skillCooldowns.bomb).toBeGreaterThan(7);
  });

  it("a bomb in another bomb's blast is stunned, not set off", () => {
    const pair = battleWith({
      pawns: [
        pawnAt(1, 5.5, 5, { type: "bomb", hp: 1, strikeCooldownLeft: 99 }),
        pawnAt(2, 6.5, 5, { type: "bomb", strikeCooldownLeft: 99 }),
      ],
      blackPieces: [rookOnSquare(), farRook],
    });
    const next = step(pair, { skillUses: [] });
    expect(pawnById(next, 2)?.hp).toBe(PAWN_TYPES.bomb.hp);
    expect(pawnById(next, 2)?.stunLeft).toBeGreaterThan(1.9);
  });
});

describe("Stun", () => {
  const stunned = battleWith({
    pawns: [pawnAt(1, 3, 5.5, { stunLeft: 1 })],
    blackPieces: [blackOn("rook", 9, { file: 13, rank: 5 })],
  });

  it("stops a pawn moving", () => {
    expect(pawnById(after(stunned, stepsIn(0.5)), 1)?.x).toBe(3);
  });

  it("stops a pawn striking", () => {
    const next = battleWith({
      pawns: [pawnAt(1, 5.5, 4.8, { stunLeft: 1 })],
      blackPieces: [blackOn("rook", 9, { file: 5, rank: 5 })],
    });
    expect(eventsOfType(playSteps(next, stepsIn(0.5)), "strike")).toEqual([]);
  });

  it("wears off and the pawn moves again", () => {
    const state = after(stunned, stepsIn(1.5));
    expect(pawnById(state, 1)?.stunLeft).toBe(0);
    expect(pawnById(state, 1)?.x).toBeGreaterThan(3);
  });

  it("still lets black pieces hurt the pawn", () => {
    const next = battleWith({
      pawns: [pawnAt(1, 5.5, 5, { stunLeft: 1, hp: 3 })],
      blackPieces: [
        blackOn("rook", 9, { file: 5, rank: 5 }, { contactLeft: 0 }),
      ],
    });
    expect(pawnById(step(next, { skillUses: [] }), 1)?.hp).toBe(2);
  });
});
