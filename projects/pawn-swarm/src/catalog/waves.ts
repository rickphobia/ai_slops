import type { BlackKind } from "./pieces";

export interface Wave {
  readonly blackPieces: readonly {
    readonly kind: BlackKind;
    readonly count: number;
  }[];
}

/** The black pieces of each wave, in order. Wave 1 is 3 knights so one pawn can win it. */
export const WAVES: readonly Wave[] = [
  { blackPieces: [{ kind: "knight", count: 3 }] },
  { blackPieces: [{ kind: "knight", count: 8 }] },
];
