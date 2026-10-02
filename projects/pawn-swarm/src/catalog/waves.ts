import type { EnemyKind } from "./pieces";

export interface Wave {
  readonly enemies: readonly {
    readonly kind: EnemyKind;
    readonly count: number;
  }[];
}

/** The enemies of each wave, in order. Wave 1 is a single knight so one pawn can win it. */
export const WAVES: readonly Wave[] = [
  { enemies: [{ kind: "knight", count: 1 }] },
];
