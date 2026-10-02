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

export type EnemyKind = "knight" | "bishop" | "rook" | "queen" | "king";

export interface EnemyStats extends PieceStats {
  /** Most squares a bishop, rook or queen slides in one move. A knight or king always moves once. */
  readonly range: number;
  /** Plain pawns that appear where it dies. Killing the king wins the wave instead. */
  readonly pawnDrop: number;
}

// The spec gives no slider range; 4 is a first guess, short enough that a 16-square board still takes a few moves to cross.
export const ENEMY_TYPES: Readonly<Record<EnemyKind, EnemyStats>> = {
  knight: {
    name: "Knight",
    hp: 2,
    attack: 1,
    cooldownTicks: 3,
    range: 1,
    pawnDrop: 1,
  },
  bishop: {
    name: "Bishop",
    hp: 3,
    attack: 1,
    cooldownTicks: 4,
    range: 4,
    pawnDrop: 2,
  },
  rook: {
    name: "Rook",
    hp: 6,
    attack: 2,
    cooldownTicks: 5,
    range: 4,
    pawnDrop: 3,
  },
  queen: {
    name: "Queen",
    hp: 10,
    attack: 3,
    cooldownTicks: 4,
    range: 4,
    pawnDrop: 6,
  },
  king: {
    name: "King",
    hp: 30,
    attack: 4,
    cooldownTicks: 3,
    range: 1,
    pawnDrop: 0,
  },
};
