import type { EnemyKind } from "./pieces";

export interface Wave {
  readonly enemies: readonly {
    readonly kind: EnemyKind;
    readonly count: number;
  }[];
}

/**
 * The enemies of each wave, in order. Wave 1 is a single knight so one pawn can win it.
 * Each kind first appears in the wave the spec sets: bishop 3, rook 5, queen 7, king 10.
 * The counts are first guesses, to be balanced after playtesting.
 */
export const WAVES: readonly Wave[] = [
  { enemies: [{ kind: "knight", count: 1 }] },
  { enemies: [{ kind: "knight", count: 2 }] },
  {
    enemies: [
      { kind: "knight", count: 2 },
      { kind: "bishop", count: 1 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 3 },
      { kind: "bishop", count: 2 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 3 },
      { kind: "bishop", count: 2 },
      { kind: "rook", count: 1 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 4 },
      { kind: "bishop", count: 3 },
      { kind: "rook", count: 1 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 4 },
      { kind: "bishop", count: 3 },
      { kind: "rook", count: 2 },
      { kind: "queen", count: 1 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 5 },
      { kind: "bishop", count: 4 },
      { kind: "rook", count: 2 },
      { kind: "queen", count: 1 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 6 },
      { kind: "bishop", count: 4 },
      { kind: "rook", count: 3 },
      { kind: "queen", count: 2 },
    ],
  },
  {
    enemies: [
      { kind: "knight", count: 4 },
      { kind: "bishop", count: 3 },
      { kind: "rook", count: 2 },
      { kind: "queen", count: 2 },
      { kind: "king", count: 1 },
    ],
  },
];
