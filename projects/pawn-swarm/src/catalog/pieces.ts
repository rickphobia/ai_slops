/** Balance numbers for every piece. Change these to rebalance; no logic lives here. */
export interface PieceStats {
  readonly name: string;
  readonly hp: number;
  readonly attack: number;
  /** Ticks between moves. */
  readonly cooldownTicks: number;
}

export type PawnTypeId = "plain";

export const PAWN_TYPES: Readonly<Record<PawnTypeId, PieceStats>> = {
  plain: { name: "Plain pawn", hp: 3, attack: 1, cooldownTicks: 2 },
};

export type EnemyKind = "knight";

export const ENEMY_TYPES: Readonly<Record<EnemyKind, PieceStats>> = {
  knight: { name: "Knight", hp: 2, attack: 1, cooldownTicks: 3 },
};
