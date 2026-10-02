import { describe, expect, it } from "vitest";
import {
  bishopPattern,
  type BoardView,
  KING,
  KNIGHT,
  pawnMoves,
  patternMoves,
  queenPattern,
  rookPattern,
  stepsTo,
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

  it("moves and captures down the board when forward is -1", () => {
    const board = boardWith(8, [
      { square: { file: 4, rank: 4 }, side: "black" },
    ]);
    expect(pawnMoves({ file: 3, rank: 5 }, "white", -1, board)).toEqual([
      { to: { file: 3, rank: 4 }, isCapture: false },
      { to: { file: 4, rank: 4 }, isCapture: true },
    ]);
  });

  it("has no moves on the last rank", () => {
    expect(
      pawnMoves({ file: 0, rank: 7 }, "white", 1, boardWith(8, [])),
    ).toEqual([]);
  });
});

describe("knight moves", () => {
  it("has eight L-jumps from the middle of an empty board", () => {
    const moves = patternMoves(
      { file: 4, rank: 4 },
      "black",
      KNIGHT,
      boardWith(8, []),
    );
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
    const moves = patternMoves(
      { file: 0, rank: 0 },
      "black",
      KNIGHT,
      boardWith(8, []),
    );
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
    const moves = patternMoves({ file: 1, rank: 1 }, "black", KNIGHT, board);
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

const targetsOf = (
  from: Square,
  pattern: Parameters<typeof patternMoves>[2],
  board: BoardView,
): Square[] =>
  sortSquares(patternMoves(from, "black", pattern, board).map((m) => m.to));

describe("bishop moves", () => {
  it("slides diagonally up to its range on an empty board", () => {
    expect(
      targetsOf({ file: 3, rank: 3 }, bishopPattern(2), boardWith(8, [])),
    ).toEqual([
      { file: 1, rank: 1 },
      { file: 1, rank: 5 },
      { file: 2, rank: 2 },
      { file: 2, rank: 4 },
      { file: 4, rank: 2 },
      { file: 4, rank: 4 },
      { file: 5, rank: 1 },
      { file: 5, rank: 5 },
    ]);
  });

  it("stops before a friend and on an enemy, which it captures", () => {
    const board = boardWith(8, [
      { square: { file: 5, rank: 5 }, side: "black" },
      { square: { file: 1, rank: 1 }, side: "white" },
      { square: { file: 0, rank: 0 }, side: "white" },
    ]);
    const moves = patternMoves(
      { file: 3, rank: 3 },
      "black",
      bishopPattern(7),
      board,
    );
    expect(moves).toContainEqual({
      to: { file: 4, rank: 4 },
      isCapture: false,
    });
    expect(moves).not.toContainEqual(
      expect.objectContaining({ to: { file: 5, rank: 5 } }),
    );
    expect(moves).toContainEqual({ to: { file: 1, rank: 1 }, isCapture: true });
    expect(moves).not.toContainEqual(
      expect.objectContaining({ to: { file: 0, rank: 0 } }),
    );
  });
});

describe("rook moves", () => {
  it("slides straight up to its range and stays on the board", () => {
    expect(
      targetsOf({ file: 0, rank: 0 }, rookPattern(3), boardWith(8, [])),
    ).toEqual([
      { file: 0, rank: 1 },
      { file: 0, rank: 2 },
      { file: 0, rank: 3 },
      { file: 1, rank: 0 },
      { file: 2, rank: 0 },
      { file: 3, rank: 0 },
    ]);
  });

  it("is blocked by pieces in its line", () => {
    const board = boardWith(8, [
      { square: { file: 3, rank: 5 }, side: "white" },
      { square: { file: 5, rank: 3 }, side: "black" },
    ]);
    const moves = patternMoves(
      { file: 3, rank: 3 },
      "black",
      rookPattern(7),
      board,
    );
    const up = moves.filter((move) => move.to.file === 3 && move.to.rank > 3);
    expect(up).toEqual([
      { to: { file: 3, rank: 4 }, isCapture: false },
      { to: { file: 3, rank: 5 }, isCapture: true },
    ]);
    const right = moves.filter(
      (move) => move.to.rank === 3 && move.to.file > 3,
    );
    expect(right).toEqual([{ to: { file: 4, rank: 3 }, isCapture: false }]);
  });
});

describe("queen moves", () => {
  it("moves like a rook and a bishop together", () => {
    const board = boardWith(8, []);
    const from = { file: 3, rank: 3 };
    expect(targetsOf(from, queenPattern(2), board)).toEqual(
      sortSquares([
        ...targetsOf(from, rookPattern(2), board),
        ...targetsOf(from, bishopPattern(2), board),
      ]),
    );
    expect(targetsOf(from, queenPattern(2), board)).toHaveLength(16);
  });

  it("is blocked like a slider", () => {
    const board = boardWith(8, [
      { square: { file: 4, rank: 4 }, side: "black" },
    ]);
    const moves = patternMoves(
      { file: 3, rank: 3 },
      "black",
      queenPattern(7),
      board,
    );
    expect(
      moves.filter((move) => move.to.file > 3 && move.to.rank > 3),
    ).toEqual([]);
  });
});

describe("king moves", () => {
  it("steps one square in any direction", () => {
    expect(targetsOf({ file: 3, rank: 3 }, KING, boardWith(8, []))).toEqual([
      { file: 2, rank: 2 },
      { file: 2, rank: 3 },
      { file: 2, rank: 4 },
      { file: 3, rank: 2 },
      { file: 3, rank: 4 },
      { file: 4, rank: 2 },
      { file: 4, rank: 3 },
      { file: 4, rank: 4 },
    ]);
  });

  it("captures enemies next to it and avoids friends, in a corner", () => {
    const board = boardWith(8, [
      { square: { file: 0, rank: 1 }, side: "white" },
      { square: { file: 1, rank: 1 }, side: "black" },
    ]);
    expect(patternMoves({ file: 0, rank: 0 }, "black", KING, board)).toEqual(
      expect.arrayContaining([
        { to: { file: 0, rank: 1 }, isCapture: true },
        { to: { file: 1, rank: 0 }, isCapture: false },
      ]),
    );
    expect(
      patternMoves({ file: 0, rank: 0 }, "black", KING, board),
    ).toHaveLength(2);
  });
});

describe("stepsTo", () => {
  it("counts slider moves on an empty board, using the range", () => {
    const steps = stepsTo([{ file: 0, rank: 0 }], 8, rookPattern(3));
    expect(steps({ file: 0, rank: 3 })).toBe(1);
    expect(steps({ file: 0, rank: 4 })).toBe(2);
    expect(steps({ file: 4, rank: 4 })).toBe(4);
  });

  it("says a bishop can never reach a square of the other colour", () => {
    const steps = stepsTo([{ file: 0, rank: 0 }], 8, bishopPattern(7));
    expect(steps({ file: 7, rank: 7 })).toBe(1);
    expect(steps({ file: 1, rank: 0 })).toBe(Infinity);
  });

  it("counts the fewest knight jumps to the nearest target", () => {
    const steps = stepsTo([{ file: 0, rank: 0 }], 8, KNIGHT);
    expect(steps({ file: 0, rank: 0 })).toBe(0);
    expect(steps({ file: 1, rank: 2 })).toBe(1);
    expect(steps({ file: 1, rank: 0 })).toBe(3);
    expect(steps({ file: 1, rank: 1 })).toBe(4);
  });

  it("uses whichever target is closest", () => {
    const steps = stepsTo(
      [
        { file: 0, rank: 0 },
        { file: 7, rank: 7 },
      ],
      8,
      KNIGHT,
    );
    expect(steps({ file: 6, rank: 5 })).toBe(1);
  });
});
