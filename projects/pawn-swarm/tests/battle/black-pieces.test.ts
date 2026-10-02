import { describe, expect, it } from "vitest";
import type { BlackMove } from "../../src/battle/battle-state";
import { knightHitSquares, knightJumps } from "../../src/board/moves";
import { isSameSquare } from "../../src/board/square";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
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
} from "./pieces";

const BOARD = BATTLE_RULES.board;

describe("knight moves", () => {
  // The pawn waits out of reach and won't strike; the knight is ready to act.
  const start = battleWith({
    pawns: [pawnAt(1, 9.5, 2.5, { strikeCooldownLeft: 99 })],
    blackPieces: [
      knightOn(2, { file: 10, rank: 6 }, { actLeft: 0.001, hp: 50 }),
    ],
  });

  it("warns on the 3×3 block for 0.4s, then L-jumps there", () => {
    const states = playSteps(start, stepsIn(1));
    const knightAt = (stepNumber: number) =>
      blackPieceById(states[stepNumber - 1] ?? start, 2);

    const move = knightAt(1)?.move;
    expect(move?.phase).toBe("warning");
    const to = move?.to ?? { file: -1, rank: -1 };
    expect(
      knightJumps({ file: 10, rank: 6 }, BOARD, () => false).some((jump) =>
        isSameSquare(jump, to),
      ),
    ).toBe(true);
    // Of the eight jumps, (9,4) and (11,4) land closest to the pawn at (9.5, 2.5).
    expect(to).toEqual({ file: 9, rank: 4 });
    expect(move?.hitSquares).toEqual(knightHitSquares(to, BOARD));

    // Still warning until 0.4s have passed, still on its square while moving.
    expect(knightAt(stepsIn(0.4))?.move?.phase).toBe("warning");
    expect(knightAt(1 + stepsIn(0.4))?.move?.phase).toBe("moving");
    expect(knightAt(stepsIn(0.4 + 0.28))?.square).toEqual({
      file: 10,
      rank: 6,
    });
    // Lands 0.28s later.
    const landed = knightAt(1 + stepsIn(0.4 + 0.28));
    expect(landed?.square).toEqual(to);
    expect(landed?.move).toBeUndefined();
  });

  it("never picks a square another black piece stands on, moves to or lands on", () => {
    // From (10,6) the best jump toward the pawn is (9,4), then (11,4), then (8,5).
    const blocked = battleWith({
      pawns: start.pawns,
      blackPieces: [
        ...start.blackPieces,
        knightOn(3, { file: 9, rank: 4 }),
        knightOn(
          4,
          { file: 0, rank: 0 },
          {
            move: {
              phase: "warning",
              to: { file: 11, rank: 4 },
              hitSquares: [],
              secondsLeft: 9,
              phaseSeconds: 9,
            },
          },
        ),
      ],
      landings: [landingOn({ file: 8, rank: 5 })],
    });
    const to = blackPieceById(after(blocked, 1), 2)?.move?.to;
    expect(to).toBeDefined();
    for (const taken of [
      { file: 9, rank: 4 },
      { file: 11, rank: 4 },
      { file: 8, rank: 5 },
    ]) {
      expect(to).not.toEqual(taken);
    }
  });
});

describe("knight landing hits", () => {
  // A knight 1 step from landing on (8,6); its block is files 7–9, ranks 5–7.
  const landingMove: BlackMove = {
    phase: "moving",
    to: { file: 8, rank: 6 },
    hitSquares: knightHitSquares({ file: 8, rank: 6 }, BOARD),
    secondsLeft: 0.001,
    phaseSeconds: 0.28,
  };
  const knight = knightOn(1, { file: 6, rank: 5 }, { move: landingMove });
  const asleep = { strikeCooldownLeft: 99 };

  it("hits every pawn on the 3×3 landing squares once, and no pawn off them", () => {
    const start = battleWith({
      pawns: [
        pawnAt(10, 8.5, 6.5, asleep), // landing square
        pawnAt(11, 7.1, 5.1, asleep), // corner square of the block
        pawnAt(12, 8.0, 7.5, asleep), // on the line between two hit squares
        pawnAt(13, 6.3, 6.5, asleep), // one square left of the block
        pawnAt(14, 10.5, 6.5, asleep), // one square right of the block
        pawnAt(15, 8.5, 9.5, asleep), // two squares above
      ],
      blackPieces: [knight, knightOn(2, { file: 19, rank: 0 })],
    });
    const next = after(start, 1);
    const hpOf = (id: number) => pawnById(next, id)?.hp;
    expect([10, 11, 12].map(hpOf)).toEqual([2, 2, 2]);
    expect([13, 14, 15].map(hpOf)).toEqual([3, 3, 3]);
    expect(eventsOfType([next], "stomp")).toEqual([
      { type: "stomp", id: 1, at: { x: 8.5, y: 6.5 } },
    ]);
    expect(
      eventsOfType([next], "pawn-hurt")
        .map((event) => event.pawnId)
        .sort(),
    ).toEqual([10, 11, 12]);
  });

  it("kills a pawn whose HP runs out and reports its death", () => {
    const start = battleWith({
      pawns: [
        pawnAt(10, 8.5, 6.5, { ...asleep, hp: 1 }),
        pawnAt(11, 1.5, 1.5, asleep),
      ],
      blackPieces: [knight],
    });
    const next = after(start, 1);
    expect(pawnById(next, 10)).toBeUndefined();
    // The pawn walked one step toward the knight before it landed.
    expect(eventsOfType([next], "death")).toMatchObject([
      { type: "death", id: 10, piece: { side: "white", type: "plain" } },
    ]);
  });
});

describe("contact damage", () => {
  it("hurts a pawn touching a black piece by 1 every 1.5s", () => {
    const start = battleWith({
      pawns: [
        pawnAt(1, 5.5, 5.5, { strikeCooldownLeft: 99, hp: 10, maxHp: 10 }),
      ],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { contactLeft: 0 })],
    });
    const states = playSteps(start, stepsIn(3.1));
    const hurtSteps = eventsOfType(states, "pawn-hurt").map((event) => ({
      cause: event.cause,
      damage: event.damage,
    }));
    expect(hurtSteps).toEqual([
      { cause: "contact", damage: 1 },
      { cause: "contact", damage: 1 },
      { cause: "contact", damage: 1 },
    ]);
    const stepsWithHurt = states
      .filter((state) => eventsOfType([state], "pawn-hurt").length > 0)
      .map((state) => state.stepNumber);
    expect(stepsWithHurt).toEqual([1, 1 + stepsIn(1.5), 1 + stepsIn(3)]);
  });

  it("keeps its timer running through a jump and hurts on the step after landing", () => {
    // The timer runs out mid-jump (0.04s); the jump lands on step 3 (0.05s).
    const start = battleWith({
      pawns: [
        pawnAt(1, 7.5, 6.5, { strikeCooldownLeft: 99, hp: 10, maxHp: 10 }),
      ],
      blackPieces: [
        knightOn(
          2,
          { file: 5, rank: 5 },
          {
            contactLeft: 0.04,
            move: {
              phase: "moving",
              to: { file: 7, rank: 6 },
              hitSquares: [],
              secondsLeft: 0.05,
              phaseSeconds: 0.28,
            },
          },
        ),
      ],
    });
    const states = playSteps(start, 6);
    const contactSteps = states
      .filter((state) =>
        eventsOfType([state], "pawn-hurt").some(
          (event) => event.cause === "contact",
        ),
      )
      .map((state) => state.stepNumber);
    expect(eventsOfType(states.slice(0, 3), "stomp")).toHaveLength(1);
    expect(contactSteps).toEqual([4]);
  });

  it("doesn't hurt a pawn that isn't touching", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 6.5, { strikeCooldownLeft: 99 })],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { contactLeft: 0 })],
    });
    expect(eventsOfType(playSteps(start, 1), "pawn-hurt")).toEqual([]);
  });
});

describe("wave landings", () => {
  it("land after their warning and become black pieces", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 10, 7)],
      landings: [
        landingOn({ file: 2, rank: 2 }, 1.2),
        landingOn({ file: 17, rank: 11 }, 1.2),
      ],
    });
    const states = playSteps(start, stepsIn(1.2));
    expect(states.at(-2)?.blackPieces).toEqual([]);
    expect(states.at(-2)?.landings).toHaveLength(2);
    const landed = states.at(-1);
    expect(landed?.landings).toEqual([]);
    expect(landed?.blackPieces.map((piece) => piece.square)).toEqual([
      { file: 2, rank: 2 },
      { file: 17, rank: 11 },
    ]);
    expect(eventsOfType([landed ?? start], "landed")).toHaveLength(2);
  });
});
