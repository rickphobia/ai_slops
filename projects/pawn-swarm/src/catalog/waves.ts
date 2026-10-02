import type { BlackKind } from "./pieces";

export interface Wave {
  readonly blackPieces: readonly {
    readonly kind: BlackKind;
    readonly count: number;
  }[];
}

type WaveRow = readonly [
  knights: number,
  bishops: number,
  rooks: number,
  queens: number,
  kings: number,
];

const ROW_KINDS: readonly BlackKind[] = [
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
];

function wave(row: WaveRow): Wave {
  return {
    blackPieces: ROW_KINDS.map((kind, index) => ({
      kind,
      count: row[index] ?? 0,
    })).filter((group) => group.count > 0),
  };
}

/**
 * The black pieces of each wave, in order: knights, bishops, rooks, queens, king.
 * Wave 1 is 2 knights so one pawn can win it; killing the king in wave 10 wins the run.
 */
export const WAVES: readonly Wave[] = [
  wave([2, 0, 0, 0, 0]),
  wave([8, 0, 0, 0, 0]),
  wave([12, 3, 0, 0, 0]),
  wave([16, 6, 0, 0, 0]),
  wave([20, 8, 2, 0, 0]),
  wave([26, 12, 4, 0, 0]),
  wave([30, 14, 6, 1, 0]),
  wave([36, 18, 8, 2, 0]),
  wave([42, 20, 10, 3, 0]),
  wave([30, 14, 8, 4, 1]),
];
