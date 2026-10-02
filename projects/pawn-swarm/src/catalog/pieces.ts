/**
 * Balance numbers for every piece. Change these to rebalance; no logic lives here.
 * Distances are in board units (1 square = 1), times in game seconds.
 */
export interface PawnStats {
  readonly name: string;
  readonly hp: number;
  readonly attack: number;
  /** Squares walked per second. */
  readonly speed: number;
  /** Seconds between strikes. */
  readonly strikeCooldown: number;
  /** How far from a black piece's edge the pawn can strike it. */
  readonly range: number;
}

export type PawnTypeId = "plain";

export const PAWN_TYPES: Readonly<Record<PawnTypeId, PawnStats>> = {
  plain: {
    name: "Plain pawn",
    hp: 3,
    attack: 1,
    speed: 1.44,
    strikeCooldown: 0.7,
    range: 0.875,
  },
};

export interface BlackPieceStats {
  readonly name: string;
  readonly hp: number;
  readonly attack: number;
  /** Seconds between moves, not counting the warning and the move itself. */
  readonly actEvery: number;
  /** Plain pawns dropped on death, before crowding. */
  readonly drop: number;
  /** Half the piece's width: pawns strike from `range` beyond this. */
  readonly bodyRadius: number;
  /** Pawns closer than this to the piece's centre are touching it. */
  readonly contactRadius: number;
  /** Seconds a move takes from leaving its square to landing. */
  readonly moveSeconds: number;
}

export type BlackKind = "knight";

export const BLACK_PIECES: Readonly<Record<BlackKind, BlackPieceStats>> = {
  knight: {
    name: "Knight",
    hp: 1,
    attack: 1,
    actEvery: 1.1,
    drop: 1,
    bodyRadius: 0.325,
    contactRadius: 0.72,
    moveSeconds: 0.28,
  },
};
