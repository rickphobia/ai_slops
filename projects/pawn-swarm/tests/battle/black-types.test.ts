import { describe, expect, it } from "vitest";
import { blackHp } from "../../src/battle/black-pieces";
import {
  attackOf,
  baseDropOf,
  blackTypeChance,
  movePatternOf,
  rollBlackType,
} from "../../src/battle/black-type-rules";
import { createBattle } from "../../src/battle/create-battle";
import { planPushLandings } from "../../src/battle/landing-squares";
import { blockAround } from "../../src/board/moves";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
import { BLACK_TYPE_IDS, BLACK_TYPES } from "../../src/catalog/black-types";
import { WAVES } from "../../src/catalog/waves";
import { createRandom } from "../../src/rng";
import {
  after,
  battleWith,
  blackPieceById,
  eventsOfType,
  knightOn,
  landingOn,
  pawnAt,
  pawnById,
  playSteps,
  stepsIn,
  typedOn,
} from "./pieces";

const BOARD = BATTLE_RULES.board;
/** A pawn that stays put and never strikes: a target to hurt, not a fighter. */
const bystander = { strikeCooldownLeft: 99, hp: 20, maxHp: 20 } as const;

describe("which black pieces turn out special", () => {
  it("lists every type of the spec table with its piece and first wave", () => {
    const table = BLACK_TYPE_IDS.map((id) => [
      id,
      BLACK_TYPES[id].piece,
      BLACK_TYPES[id].fromWave,
    ]);
    expect(table).toEqual([
      ["stomper", "knight", 3],
      ["priest", "bishop", 4],
      ["hunter", "knight", 5],
      ["tower", "rook", 5],
      ["sniper", "bishop", 6],
      ["cannon", "rook", 7],
      ["storm", "queen", 7],
      ["summoner", "queen", 8],
    ]);
  });

  it("is 18% the wave a type unlocks, +7% per wave after, at most 45%", () => {
    expect(blackTypeChance("stomper", 3)).toBeCloseTo(0.18);
    expect(blackTypeChance("stomper", 4)).toBeCloseTo(0.25);
    expect(blackTypeChance("stomper", 6)).toBeCloseTo(0.39);
    expect(blackTypeChance("stomper", 7)).toBeCloseTo(0.45);
    expect(blackTypeChance("stomper", 10)).toBeCloseTo(0.45);
  });

  it("never rolls a type before its wave, and draws no random number then", () => {
    const random = createRandom(7);
    const before = random.state();
    expect(rollBlackType("knight", 2, random)).toBeUndefined();
    expect(rollBlackType("king", 10, random)).toBeUndefined();
    expect(random.state()).toBe(before);
  });

  it("only gives a piece types of its own kind", () => {
    const random = createRandom(11);
    for (let roll = 0; roll < 300; roll++) {
      const type = rollBlackType("rook", 10, random);
      if (type !== undefined) expect(BLACK_TYPES[type].piece).toBe("rook");
    }
  });

  it("makes about the catalog's share of knights special in wave 5", () => {
    const random = createRandom(3);
    const rolls = Array.from({ length: 2000 }, () =>
      rollBlackType("knight", 5, random),
    );
    const stomper = rolls.filter((type) => type === "stomper").length / 2000;
    // Stomper is 32% in wave 5; hunter (18%) only rolls when stomper missed.
    expect(stomper).toBeGreaterThan(0.29);
    expect(stomper).toBeLessThan(0.35);
    expect(rolls.filter((type) => type === "hunter").length).toBeGreaterThan(0);
  });

  it("gives landings a type in later waves and none in early ones", () => {
    const kinds = Array.from({ length: 40 }, () => "knight" as const);
    const plan = (wave: number) =>
      planPushLandings(
        kinds,
        { board: BOARD, wave, pawns: [], blackPieces: [], landings: [] },
        createRandom(5),
      );
    expect(plan(2).every((landing) => landing.type === undefined)).toBe(true);
    expect(plan(8).some((landing) => landing.type === "stomper")).toBe(true);
  });

  it("rolls types for the pieces of a wave when the battle is created", () => {
    const battle = createBattle({
      army: { plain: 1 },
      wave: WAVES[7] ?? { blackPieces: [] },
      waveNumber: 8,
      seed: 4,
    });
    const typed = battle.landings.filter((landing) => landing.type);
    expect(typed.length).toBeGreaterThan(0);
  });
});

describe("a special piece when it lands", () => {
  it("keeps its type and goes on the board with it", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      landings: [landingOn({ file: 9, rank: 9 }, 0.01, "knight", "stomper")],
    });
    const next = after(start, 1);
    expect(next.blackPieces[0]).toMatchObject({
      kind: "knight",
      type: "stomper",
    });
  });

  it("has 3× HP as a tower", () => {
    expect(blackHp("rook", 1, "tower")).toBe(36);
    expect(blackHp("rook", 3, "tower")).toBe(Math.ceil(12 * 1.7 * 3));
    expect(blackHp("rook", 3)).toBe(Math.ceil(12 * 1.7));
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      landings: [landingOn({ file: 9, rank: 9 }, 0.01, "rook", "tower")],
      wave: 5,
    });
    expect(after(start, 1).blackPieces[0]?.maxHp).toBe(
      blackHp("rook", 5, "tower"),
    );
  });

  it("starts its power timer a second or three out", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      landings: [landingOn({ file: 9, rank: 9 }, 0.01, "bishop", "priest")],
      wave: 5,
    });
    const priest = after(start, 1).blackPieces[0];
    expect(priest?.powerLeft).toBeGreaterThan(0.9);
    expect(priest?.powerLeft).toBeLessThan(3.1);
  });
});

describe("Stomper", () => {
  it("hits the 3×3 block and a cross two squares out, for 1 more damage", () => {
    const stomper = typedOn(
      "stomper",
      2,
      { file: 8, rank: 3 },
      { actLeft: 0.001 },
    );
    const start = battleWith({
      pawns: [pawnAt(1, 8.5, 7.5, bystander)],
      blackPieces: [stomper],
    });
    const move = blackPieceById(after(start, 1), 2)?.move;
    const to = move?.to ?? { file: -1, rank: -1 };
    const squares = new Set(
      (move?.hitSquares ?? []).map(
        (square) => `${String(square.file)},${String(square.rank)}`,
      ),
    );
    // Away from the board edge: the block (9) plus the four cross arms.
    expect(squares.size).toBe(13);
    for (const square of blockAround(to, BOARD)) {
      expect(squares.has(`${String(square.file)},${String(square.rank)}`)).toBe(
        true,
      );
    }
    for (const [fileStep, rankStep] of [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ] as const) {
      const arm = { file: to.file + fileStep, rank: to.rank + rankStep };
      expect(squares.has(`${String(arm.file)},${String(arm.rank)}`)).toBe(true);
    }
  });

  it("hurts a pawn on the cross for 2 where a plain knight does 1", () => {
    const landing = (type: "stomper" | undefined) => {
      const knight = knightOn(
        2,
        { file: 4, rank: 4 },
        {
          type,
          move: {
            phase: "moving",
            to: { file: 8, rank: 5 },
            // Two squares right of the landing: on the stomper's cross only.
            hitSquares:
              type === undefined
                ? blockAround({ file: 8, rank: 5 }, BOARD)
                : [
                    ...blockAround({ file: 8, rank: 5 }, BOARD),
                    { file: 10, rank: 5 },
                  ],
            secondsLeft: 0.01,
            phaseSeconds: 0.28,
          },
        },
      );
      const start = battleWith({
        pawns: [pawnAt(1, 10.5, 5.5, bystander)],
        blackPieces: [knight],
      });
      return after(start, 1);
    };
    expect(pawnById(landing("stomper"), 1)?.hp).toBe(18);
    expect(pawnById(landing(undefined), 1)?.hp).toBe(20);
    expect(attackOf({ kind: "knight", type: "stomper" })).toBe(2);
    expect(attackOf({ kind: "knight", type: undefined })).toBe(1);
  });
});

describe("Priest", () => {
  const priest = typedOn(
    "priest",
    2,
    { file: 8, rank: 5 },
    { powerLeft: 0.001 },
  );
  const hurt = (id: number, file: number, rank: number) =>
    knightOn(id, { file, rank }, { hp: 3, maxHp: 10 });

  it("heals black pieces within 3 squares by 2, and leaves farther ones alone", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [priest, hurt(3, 10, 5), hurt(4, 8, 8), hurt(5, 12, 5)],
    });
    const next = after(start, 1);
    expect(blackPieceById(next, 3)?.hp).toBe(5);
    // (8,8) is exactly 3 squares away.
    expect(blackPieceById(next, 4)?.hp).toBe(5);
    expect(blackPieceById(next, 5)?.hp).toBe(3);
    expect(eventsOfType([next], "black-power")).toMatchObject([
      { id: 2, blackType: "priest" },
    ]);
  });

  it("never heals past full HP and does not heal itself", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [
        { ...priest, hp: 1 },
        knightOn(3, { file: 9, rank: 5 }, { hp: 9, maxHp: 10 }),
      ],
    });
    const next = after(start, 1);
    expect(blackPieceById(next, 3)?.hp).toBe(10);
    expect(blackPieceById(next, 2)?.hp).toBe(1);
  });

  it("heals again every 2 seconds", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [priest, hurt(3, 10, 5)],
    });
    const states = playSteps(start, stepsIn(4.1));
    expect(eventsOfType(states, "black-power")).toHaveLength(3);
    const healedSteps = states
      .filter((state) => eventsOfType([state], "black-power").length > 0)
      .map((state) => state.stepNumber);
    expect(healedSteps).toEqual([1, 1 + stepsIn(2), 1 + stepsIn(4)]);
  });
});

describe("Hunter", () => {
  it("acts twice as often", () => {
    const hunter = typedOn(
      "hunter",
      2,
      { file: 8, rank: 5 },
      { actLeft: 0.001 },
    );
    const start = battleWith({
      pawns: [pawnAt(1, 3.5, 5.5, bystander)],
      blackPieces: [hunter],
    });
    const next = after(start, 1);
    expect(blackPieceById(next, 2)?.actLeft).toBeCloseTo(1.1 * 0.5, 6);
  });

  it("goes for the nearest special pawn even when a plain pawn is nearer", () => {
    const hunter = typedOn(
      "hunter",
      3,
      { file: 8, rank: 5 },
      { actLeft: 0.001 },
    );
    const start = battleWith({
      pawns: [
        // Plain pawn nearer, shield farther: a hunter heads for the shield.
        pawnAt(1, 8.5, 8.5, bystander),
        pawnAt(2, 8.5, 0.5, { ...bystander, type: "shield" }),
      ],
      blackPieces: [hunter],
    });
    const to = blackPieceById(after(start, 1), 3)?.move?.to;
    expect(to?.rank).toBeLessThan(5);
    const plainKnight = knightOn(3, { file: 8, rank: 5 }, { actLeft: 0.001 });
    const plainTo = blackPieceById(
      after({ ...start, blackPieces: [plainKnight] }, 1),
      3,
    )?.move?.to;
    expect(plainTo?.rank).toBeGreaterThan(5);
  });
});

describe("Tower", () => {
  it("acts 50% slower", () => {
    const tower = typedOn("tower", 2, { file: 8, rank: 5 }, { actLeft: 0.001 });
    const start = battleWith({
      pawns: [pawnAt(1, 3.5, 5.5, bystander)],
      blackPieces: [tower],
    });
    expect(blackPieceById(after(start, 1), 2)?.actLeft).toBeCloseTo(2 * 1.5, 6);
  });
});

describe("Sniper", () => {
  it("dashes up to 8 squares where a bishop goes 4", () => {
    const target = pawnAt(1, 9.5, 9.5, bystander);
    const dash = (type: "sniper" | undefined) =>
      blackPieceById(
        after(
          battleWith({
            pawns: [target],
            blackPieces: [
              type === undefined
                ? typedOn(
                    "sniper",
                    2,
                    { file: 1, rank: 1 },
                    { actLeft: 0.001, type: undefined },
                  )
                : typedOn(type, 2, { file: 1, rank: 1 }, { actLeft: 0.001 }),
            ],
          }),
          1,
        ),
        2,
      )?.move?.to;
    expect(dash("sniper")).toEqual({ file: 9, rank: 9 });
    expect(dash(undefined)).toEqual({ file: 5, rank: 5 });
    expect(movePatternOf({ kind: "bishop", type: "sniper" }).reach).toBe(8);
  });
});

describe("Cannon", () => {
  const cannon = typedOn(
    "cannon",
    2,
    { file: 8, rank: 5 },
    { powerLeft: 0.001 },
  );

  it("hits pawns in its row and column within 7 squares for 2", () => {
    const start = battleWith({
      pawns: [
        pawnAt(10, 12.5, 5.5, bystander),
        pawnAt(11, 8.5, 1.5, bystander),
        pawnAt(12, 1.5, 5.5, bystander),
        // Off the lines, and in line but 8 squares away.
        pawnAt(13, 11.5, 8.5, bystander),
        pawnAt(14, 0.5, 5.5, bystander),
      ],
      blackPieces: [cannon],
    });
    const next = after(start, 1);
    expect(pawnById(next, 10)?.hp).toBe(18);
    expect(pawnById(next, 11)?.hp).toBe(18);
    expect(pawnById(next, 12)?.hp).toBe(18);
    expect(pawnById(next, 13)?.hp).toBe(20);
    expect(pawnById(next, 14)?.hp).toBe(20);
    expect(eventsOfType([next], "black-power")).toMatchObject([
      { id: 2, blackType: "cannon" },
    ]);
  });

  it("fires every 3 seconds", () => {
    const start = battleWith({
      pawns: [pawnAt(10, 12.5, 5.5, bystander)],
      blackPieces: [cannon],
    });
    const states = playSteps(start, stepsIn(6.1));
    const steps = states
      .filter((state) => eventsOfType([state], "black-power").length > 0)
      .map((state) => state.stepNumber);
    expect(steps).toEqual([1, 1 + stepsIn(3), 1 + stepsIn(6)]);
  });
});

describe("Storm", () => {
  it("hits every pawn within about 2 squares for 2 every 4 seconds", () => {
    const storm = typedOn(
      "storm",
      2,
      { file: 8, rank: 5 },
      { powerLeft: 0.001 },
    );
    const start = battleWith({
      pawns: [
        pawnAt(10, 8.5, 5.5, bystander),
        pawnAt(11, 10, 6.5, bystander),
        pawnAt(12, 8.5, 8.5, bystander),
      ],
      blackPieces: [storm],
    });
    const states = playSteps(start, stepsIn(4.1));
    const first = states[0];
    expect(pawnById(first ?? start, 10)?.hp).toBe(18);
    expect(pawnById(first ?? start, 11)?.hp).toBe(18);
    expect(pawnById(first ?? start, 12)?.hp).toBe(20);
    expect(eventsOfType(states, "black-power")).toHaveLength(2);
  });
});

describe("Summoner", () => {
  it("calls 2 knights next to her every 6 seconds", () => {
    const summoner = typedOn(
      "summoner",
      2,
      { file: 8, rank: 5 },
      { summonLeft: 0.001 },
    );
    const start = battleWith({
      pawns: [pawnAt(1, 1.5, 1.5, bystander)],
      blackPieces: [summoner],
    });
    const states = playSteps(start, stepsIn(6.1));
    const calls = eventsOfType(states, "summon");
    expect(calls).toMatchObject([
      { id: 2, count: 2 },
      { id: 2, count: 2 },
    ]);
    const landings = states[0]?.landings ?? [];
    expect(landings).toHaveLength(2);
    for (const landing of landings) {
      expect(landing.kind).toBe("knight");
      expect(landing.type).toBeUndefined();
      expect(Math.abs(landing.square.file - 8)).toBeLessThanOrEqual(1);
      expect(Math.abs(landing.square.rank - 5)).toBeLessThanOrEqual(1);
    }
  });
});

describe("drops", () => {
  it("are 1 pawn more for a special type", () => {
    expect(baseDropOf({ kind: "knight", type: undefined })).toBe(1);
    expect(baseDropOf({ kind: "knight", type: "stomper" })).toBe(2);
    expect(baseDropOf({ kind: "queen", type: "storm" })).toBe(6);
  });

  it("drop on the battlefield when a special piece dies", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 8.5, 6.2)],
      blackPieces: [
        typedOn("stomper", 2, { file: 8, rank: 5 }, { hp: 1, actLeft: 99 }),
      ],
    });
    const drops = eventsOfType(playSteps(start, 1), "drop");
    expect(drops).toHaveLength(1);
    // One plain pawn alive of 300: 2 × (1 − 1/300) is just under 2.
    expect([1, 2]).toContain(drops[0]?.count);
  });

  it("report the type in the death event", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 8.5, 6.2)],
      blackPieces: [
        typedOn("stomper", 2, { file: 8, rank: 5 }, { hp: 1, actLeft: 99 }),
      ],
    });
    expect(eventsOfType(playSteps(start, 1), "death")).toMatchObject([
      { piece: { side: "black", kind: "knight", type: "stomper" } },
    ]);
  });
});
