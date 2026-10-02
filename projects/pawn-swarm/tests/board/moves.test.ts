import { describe, expect, it } from "vitest";
import {
  type BoardView,
  knightMoves,
  knightStepsTo,
  pawnMoves,
} from "../../src/board/moves";
import type { Side, Square } from "../../src/board/square";

function boardWith(
  size: number,
  pieces: readonly { square: Square; side: Side }[],
): BoardView {
  return {
    size,
    occupantAt: (square) =>
      pieces.find(
        (piece) =>
          piece.square.file === square.file &&
          piece.square.rank === square.rank,
      )?.side,
  };
}

const sortSquares = (squares: readonly Square[]): Square[] =>
  [...squares].sort((a, b) => a.file - b.file || a.rank - b.rank);

describe("pawnMoves", () => {
  it("moves one square forward on an empty board", () => {
    const moves = pawnMoves({ file: 3, rank: 1 }, "white", 1, boardWith(8, []));
    expect(moves).toEqual([{ to: { file: 3, rank: 2 }, isCapture: false }]);
  });

  it("captures diagonally forward and cannot move into a blocker", () => {
    const board = boardWith(8, [
      { square: { file: 3, rank: 2 }, side: "black" },
      { square: { file: 2, rank: 2 }, side: "black" },
      { square: { file: 4, rank: 2 }, side: "white" },
    ]);
    const moves = pawnMoves({ file: 3, rank: 1 }, "white", 1, board);
    expect(moves).toEqual([{ to: { file: 2, rank: 2 }, isCapture: true }]);
  });

  it("does not capture backwards or sideways", () => {
    const board = boardWith(8, [
      { square: { file: 2, rank: 0 }, side: "black" },
      { square: { file: 2, rank: 1 }, side: "black" },
      { square: { file: 3, rank: 2 }, side: "white" },
    ]);
    expect(pawnMoves({ file: 3, rank: 1 }, "white", 1, board)).toEqual([]);
  });

  it("has no moves on the last rank", () => {
    expect(
      pawnMoves({ file: 0, rank: 7 }, "white", 1, boardWith(8, [])),
    ).toEqual([]);
  });
});

describe("knightMoves", () => {
  it("has eight L-jumps from the middle of an empty board", () => {
    const moves = knightMoves({ file: 4, rank: 4 }, "black", boardWith(8, []));
    expect(sortSquares(moves.map((move) => move.to))).toEqual([
      { file: 2, rank: 3 },
      { file: 2, rank: 5 },
      { file: 3, rank: 2 },
      { file: 3, rank: 6 },
      { file: 5, rank: 2 },
      { file: 5, rank: 6 },
      { file: 6, rank: 3 },
      { file: 6, rank: 5 },
    ]);
  });

  it("stays on the board in a corner", () => {
    const moves = knightMoves({ file: 0, rank: 0 }, "black", boardWith(8, []));
    expect(sortSquares(moves.map((move) => move.to))).toEqual([
      { file: 1, rank: 2 },
      { file: 2, rank: 1 },
    ]);
  });

  it("jumps over a ring of blockers, captures enemies and avoids friends", () => {
    const ring: { square: Square; side: Side }[] = [];
    for (let file = 0; file <= 2; file++) {
      for (let rank = 0; rank <= 2; rank++) {
        if (file !== 1 || rank !== 1) {
          ring.push({ square: { file, rank }, side: "white" });
        }
      }
    }
    const board = boardWith(5, [
      ...ring,
      { square: { file: 2, rank: 3 }, side: "white" },
      { square: { file: 3, rank: 2 }, side: "black" },
    ]);
    const moves = knightMoves({ file: 1, rank: 1 }, "black", board);
    expect(moves).toContainEqual({ to: { file: 2, rank: 3 }, isCapture: true });
    expect(moves).toContainEqual({
      to: { file: 0, rank: 3 },
      isCapture: false,
    });
    expect(moves).not.toContainEqual(
      expect.objectContaining({ to: { file: 3, rank: 2 } }),
    );
    expect(moves).toHaveLength(3);
  });
});

describe("knightStepsTo", () => {
  it("counts the fewest knight jumps to the nearest target", () => {
    const steps = knightStepsTo([{ file: 0, rank: 0 }], 8);
    expect(steps({ file: 0, rank: 0 })).toBe(0);
    expect(steps({ file: 1, rank: 2 })).toBe(1);
    expect(steps({ file: 1, rank: 0 })).toBe(3);
    expect(steps({ file: 1, rank: 1 })).toBe(4);
  });

  it("uses whichever target is closest", () => {
    const steps = knightStepsTo(
      [
        { file: 0, rank: 0 },
        { file: 7, rank: 7 },
      ],
      8,
    );
    expect(steps({ file: 6, rank: 5 })).toBe(1);
  });
});
