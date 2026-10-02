import { describe, expect, it } from "vitest";
import { knightHitSquares, knightJumps } from "../../src/board/moves";
import {
  type BoardSize,
  isSameSquare,
  type Square,
} from "../../src/board/square";

const BOARD: BoardSize = { files: 20, ranks: 14 };
const nothingBlocks = (): boolean => false;

const sortSquares = (squares: readonly Square[]): Square[] =>
  [...squares].sort((a, b) => a.file - b.file || a.rank - b.rank);

describe("knightJumps", () => {
  it("has eight L-jumps from the middle of an empty board", () => {
    expect(
      sortSquares(knightJumps({ file: 4, rank: 4 }, BOARD, nothingBlocks)),
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

  it("stays on the board in the top-right corner of a wide board", () => {
    expect(
      sortSquares(knightJumps({ file: 19, rank: 13 }, BOARD, nothingBlocks)),
    ).toEqual([
      { file: 17, rank: 12 },
      { file: 18, rank: 11 },
    ]);
  });

  it("skips blocked squares", () => {
    const blocked: Square = { file: 18, rank: 11 };
    expect(
      knightJumps({ file: 19, rank: 13 }, BOARD, (square) =>
        isSameSquare(square, blocked),
      ),
    ).toEqual([{ file: 17, rank: 12 }]);
  });
});

describe("knightHitSquares", () => {
  it("is the 3×3 block around the landing square", () => {
    expect(sortSquares(knightHitSquares({ file: 5, rank: 5 }, BOARD))).toEqual(
      [4, 5, 6].flatMap((file) => [4, 5, 6].map((rank) => ({ file, rank }))),
    );
  });

  it("is cut at the board edge", () => {
    expect(sortSquares(knightHitSquares({ file: 0, rank: 13 }, BOARD))).toEqual(
      [
        { file: 0, rank: 12 },
        { file: 0, rank: 13 },
        { file: 1, rank: 12 },
        { file: 1, rank: 13 },
      ],
    );
  });
});
