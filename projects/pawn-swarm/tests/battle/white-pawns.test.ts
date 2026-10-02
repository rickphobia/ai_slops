import { describe, expect, it } from "vitest";
import { PAWN_TYPES } from "../../src/catalog/pieces";
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

describe("white pawn movement", () => {
  it("walks toward the nearest black piece without ever changing x and y in the same step", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 2.3, 2.2)],
      blackPieces: [
        knightOn(2, { file: 15, rank: 10 }),
        knightOn(3, { file: 1, rank: 10 }),
      ],
    });
    const states = playSteps(start, stepsIn(6));
    let previous = start.pawns[0];
    for (const state of states) {
      const pawn = pawnById(state, 1);
      if (pawn === undefined || previous === undefined)
        throw new Error("pawn missing");
      const movedX = pawn.x !== previous.x;
      const movedY = pawn.y !== previous.y;
      expect(movedX && movedY).toBe(false);
      previous = pawn;
    }
    // It went for the nearer knight at (1.5, 10.5), not the one at (15.5, 10.5).
    const end = pawnById(states.at(-1) ?? start, 1);
    expect(Math.hypot((end?.x ?? 0) - 1.5, (end?.y ?? 0) - 10.5)).toBeLessThan(
      Math.hypot(2.3 - 1.5, 2.2 - 10.5) - 5,
    );
  });

  it("chases a moving black piece where it is now, not the square it left", () => {
    // A rook halfway through a slide from (0,5) to (6,5): it is at (3.5, 5.5).
    const rook = blackOn(
      "rook",
      2,
      { file: 0, rank: 5 },
      {
        move: {
          phase: "moving",
          to: { file: 6, rank: 5 },
          hitSquares: [],
          secondsLeft: 0.15,
          phaseSeconds: 0.3,
        },
      },
    );
    const start = battleWith({
      pawns: [pawnAt(1, 3.5, 8.5, { axis: "x", strikeCooldownLeft: 99 })],
      blackPieces: [rook],
    });
    const pawn = pawnById(after(start, 1), 1);
    // Lined up with the rook, it turns straight down; toward the square the rook left it would keep walking left.
    expect(pawn?.x).toBe(3.5);
    expect(pawn?.y).toBeLessThan(8.5);
  });

  it("keeps its axis until the other one is more than 30% longer", () => {
    const knight = knightOn(2, { file: 10, rank: 10 }); // centre (10.5, 10.5)
    const move = (y: number) => {
      const start = battleWith({
        pawns: [pawnAt(1, 6.5, y, { axis: "x" })],
        blackPieces: [knight],
      });
      const pawn = pawnById(after(start, 1), 1);
      return { dx: (pawn?.x ?? 0) - 6.5, dy: (pawn?.y ?? 0) - y };
    };
    // 4 across, 5 up: 5 is less than 4 × 1.3 = 5.2, so it keeps walking along x.
    const stepLength = PAWN_TYPES.plain.speed / 60;
    const alongX = move(5.5);
    expect(alongX.dx).toBeCloseTo(stepLength);
    expect(alongX.dy).toBe(0);
    // 4 across, 5.3 up: more than 5.2, so it turns to y.
    const alongY = move(5.2);
    expect(alongY.dx).toBe(0);
    expect(alongY.dy).toBeCloseTo(stepLength);
  });

  it("pushes apart from pawns standing too close", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5, 5), pawnAt(2, 5.1, 5)],
      blackPieces: [knightOn(3, { file: 15, rank: 10 })],
    });
    const next = after(start, 1);
    const [first, second] = [pawnById(next, 1), pawnById(next, 2)];
    expect(
      Math.hypot(
        (first?.x ?? 0) - (second?.x ?? 0),
        (first?.y ?? 0) - (second?.y ?? 0),
      ),
    ).toBeGreaterThan(0.2); // from 0.1 apart
  });

  it("stays inside the board edge", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 0.1, 10.9, { burstX: -5, burstY: 5 })],
      blackPieces: [knightOn(2, { file: 0, rank: 10 }, { hp: 50 })],
    });
    for (const state of playSteps(start, 30)) {
      const pawn = pawnById(state, 1);
      expect(pawn?.x).toBeGreaterThanOrEqual(0.25);
      expect(pawn?.y).toBeLessThanOrEqual(11 - 0.25);
    }
  });
});

describe("white pawn strikes", () => {
  it("strikes a black piece in reach, then waits out its 0.7s cooldown", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 4.8)],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { hp: 10 })],
    });
    const states = playSteps(start, stepsIn(1.5));
    const strikeSteps = states
      .filter((state) => eventsOfType([state], "strike").length > 0)
      .map((state) => state.stepNumber);
    expect(strikeSteps).toEqual([1, 1 + stepsIn(0.7), 1 + stepsIn(1.4)]);
    expect(eventsOfType(states, "strike")[0]).toEqual({
      type: "strike",
      pawnId: 1,
      pawnType: "plain",
      targetId: 2,
      damage: 1,
      from: { x: 5.5, y: 4.8 },
      at: { x: 5.5, y: 5.5 },
    });
    expect(blackPieceById(states.at(-1) ?? start, 2)?.hp).toBe(7);
  });

  it("walks instead of striking when the piece is out of reach", () => {
    // Reach is the pawn's range 0.875 plus the knight's half-width 0.325.
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 4.2)],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { hp: 10 })],
    });
    const next = after(start, 1);
    expect(eventsOfType([next], "strike")).toEqual([]);
    expect(pawnById(next, 1)?.y).toBeGreaterThan(4.2);
  });
});
