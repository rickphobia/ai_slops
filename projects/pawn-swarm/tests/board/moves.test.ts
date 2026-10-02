import { describe, expect, it } from "vitest";
import { blockAround, type Move, pieceMoves } from "../../src/board/moves";
import {
  type BoardSize,
  isSameSquare,
  type Square,
} from "../../src/board/square";
import { BLACK_PIECES } from "../../src/catalog/pieces";

const BOARD: BoardSize = { files: 16, ranks: 11 };
const nothingBlocks = (): boolean => false;

const sortSquares = (squares: readonly Square[]): Square[] =>
  [...squares].sort((a, b) => a.file - b.file || a.rank - b.rank);
const targets = (moves: readonly Move[]): Square[] =>
  sortSquares(moves.map((move) => move.to));
const moveTo = (moves: readonly Move[], to: Square): Move | undefined =>
  moves.find((move) => isSameSquare(move.to, to));

const KNIGHT = BLACK_PIECES.knight.move;
const BISHOP = BLACK_PIECES.bishop.move;
const ROOK = BLACK_PIECES.rook.move;
const QUEEN = BLACK_PIECES.queen.move;
const KING = BLACK_PIECES.king.move;

describe("knight moves", () => {
  it("has eight L-jumps from the middle of an empty board", () => {
    expect(
      targets(pieceMoves({ file: 4, rank: 4 }, KNIGHT, BOARD, nothingBlocks)),
    ).toEqual([
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

  it("stays on the board in the top-right corner", () => {
    expect(
      targets(pieceMoves({ file: 15, rank: 10 }, KNIGHT, BOARD, nothingBlocks)),
    ).toEqual([
      { file: 13, rank: 9 },
      { file: 14, rank: 8 },
    ]);
  });

  it("skips blocked squares and jumps over the ones in between", () => {
    const blocked: Square[] = [
      { file: 14, rank: 8 },
      { file: 14, rank: 10 },
      { file: 15, rank: 9 },
    ];
    expect(
      targets(
        pieceMoves({ file: 15, rank: 10 }, KNIGHT, BOARD, (square) =>
          blocked.some((other) => isSameSquare(other, square)),
        ),
      ),
    ).toEqual([{ file: 13, rank: 9 }]);
  });

  it("hits the 3×3 block where it lands", () => {
    const moves = pieceMoves(
      { file: 4, rank: 4 },
      KNIGHT,
      BOARD,
      nothingBlocks,
    );
    expect(moveTo(moves, { file: 5, rank: 6 })?.hitSquares).toEqual(
      blockAround({ file: 5, rank: 6 }, BOARD),
    );
  });
});

describe("bishop moves", () => {
  it("goes diagonally up to 4 squares", () => {
    expect(BISHOP.reach).toBe(4);
    const moves = pieceMoves(
      { file: 7, rank: 5 },
      BISHOP,
      BOARD,
      nothingBlocks,
    );
    expect(moves).toHaveLength(16);
    for (const { to } of moves) {
      const fileGap = Math.abs(to.file - 7);
      expect(Math.abs(to.rank - 5)).toBe(fileGap);
      expect(fileGap).toBeGreaterThanOrEqual(1);
      expect(fileGap).toBeLessThanOrEqual(4);
    }
  });

  it("stops at the board edge", () => {
    expect(
      targets(pieceMoves({ file: 1, rank: 1 }, BISHOP, BOARD, nothingBlocks)),
    ).toEqual([
      { file: 0, rank: 0 },
      { file: 0, rank: 2 },
      { file: 2, rank: 0 },
      { file: 2, rank: 2 },
      { file: 3, rank: 3 },
      { file: 4, rank: 4 },
      { file: 5, rank: 5 },
    ]);
  });

  it("hits every square it passes through, landing square included", () => {
    const moves = pieceMoves(
      { file: 7, rank: 5 },
      BISHOP,
      BOARD,
      nothingBlocks,
    );
    expect(moveTo(moves, { file: 10, rank: 2 })?.hitSquares).toEqual([
      { file: 8, rank: 4 },
      { file: 9, rank: 3 },
      { file: 10, rank: 2 },
    ]);
  });
});

describe("rook moves", () => {
  it("goes straight up to 6 squares", () => {
    expect(ROOK.reach).toBe(6);
    expect(
      targets(pieceMoves({ file: 7, rank: 5 }, ROOK, BOARD, nothingBlocks)),
    ).toEqual(
      sortSquares([
        ...[1, 2, 3, 4, 5, 6].map((step) => ({ file: 7 + step, rank: 5 })),
        ...[1, 2, 3, 4, 5, 6].map((step) => ({ file: 7 - step, rank: 5 })),
        ...[1, 2, 3, 4, 5].map((step) => ({ file: 7, rank: 5 + step })),
        ...[1, 2, 3, 4, 5].map((step) => ({ file: 7, rank: 5 - step })),
      ]),
    );
  });

  it("can't pass through or land on a blocked square", () => {
    const blocker: Square = { file: 10, rank: 5 };
    const moves = pieceMoves({ file: 7, rank: 5 }, ROOK, BOARD, (square) =>
      isSameSquare(square, blocker),
    );
    const rightward = moves.filter(
      (move) => move.to.rank === 5 && move.to.file > 7,
    );
    expect(targets(rightward)).toEqual([
      { file: 8, rank: 5 },
      { file: 9, rank: 5 },
    ]);
  });

  it("hits every square along the line", () => {
    const moves = pieceMoves({ file: 7, rank: 5 }, ROOK, BOARD, nothingBlocks);
    expect(moveTo(moves, { file: 7, rank: 9 })?.hitSquares).toEqual([
      { file: 7, rank: 6 },
      { file: 7, rank: 7 },
      { file: 7, rank: 8 },
      { file: 7, rank: 9 },
    ]);
  });
});

describe("queen moves", () => {
  it("goes straight or diagonally up to 5 squares", () => {
    expect(QUEEN.reach).toBe(5);
    const moves = pieceMoves({ file: 7, rank: 5 }, QUEEN, BOARD, nothingBlocks);
    // From (7,5) every one of the 8 lines has room for all 5 squares.
    expect(moveTo(moves, { file: 12, rank: 5 })).toBeDefined();
    expect(moveTo(moves, { file: 13, rank: 5 })).toBeUndefined();
    expect(moveTo(moves, { file: 2, rank: 0 })).toBeDefined();
    expect(moveTo(moves, { file: 7, rank: 10 })).toBeDefined();
    expect(moveTo(moves, { file: 8, rank: 7 })).toBeUndefined(); // not on a line
    expect(moves).toHaveLength(8 * 5);
  });
});

describe("king moves", () => {
  it("goes one square any way and hits the 3×3 block where it lands", () => {
    expect(KING.reach).toBe(1);
    const moves = pieceMoves({ file: 7, rank: 5 }, KING, BOARD, nothingBlocks);
    expect(targets(moves)).toEqual(
      sortSquares(blockAround({ file: 7, rank: 5 }, BOARD)).filter(
        (square) => !isSameSquare(square, { file: 7, rank: 5 }),
      ),
    );
    expect(moveTo(moves, { file: 8, rank: 6 })?.hitSquares).toEqual(
      blockAround({ file: 8, rank: 6 }, BOARD),
    );
  });
});

describe("blockAround", () => {
  it("is the 3×3 block around the square", () => {
    expect(sortSquares(blockAround({ file: 5, rank: 5 }, BOARD))).toEqual(
      [4, 5, 6].flatMap((file) => [4, 5, 6].map((rank) => ({ file, rank }))),
    );
  });

  it("is cut at the board edge", () => {
    expect(sortSquares(blockAround({ file: 0, rank: 10 }, BOARD))).toEqual([
      { file: 0, rank: 9 },
      { file: 0, rank: 10 },
      { file: 1, rank: 9 },
      { file: 1, rank: 10 },
    ]);
  });
});
