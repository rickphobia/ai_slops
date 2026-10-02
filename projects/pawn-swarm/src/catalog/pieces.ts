import type { MovePattern } from "../board/moves";

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
  /** HP in wave 1; it grows each wave by `BATTLE_RULES.blackHpGrowthPerWave`. */
  readonly hp: number;
  readonly attack: number;
  /** Seconds between moves, not counting the warning and the move itself. */
  readonly actEvery: number;
  /** Plain pawns dropped on death, before crowding. */
  readonly drop: number;
  readonly move: MovePattern;
  /** Half the piece's width: pawns strike from `range` beyond this. */
  readonly bodyRadius: number;
  /** Pawns closer than this to the piece's centre are touching it. */
  readonly contactRadius: number;
  /** Seconds a move takes from leaving its square to landing. */
  readonly moveSeconds: number;
  /** Calls knights next to itself on a timer. */
  readonly summons?: {
    readonly knights: number;
    readonly everySeconds: number;
  };
  /** Its death wins the battle at once, whatever else is left. */
  readonly isKing?: boolean;
}

export type BlackKind = "knight" | "bishop" | "rook" | "queen" | "king";

export const BLACK_PIECES: Readonly<Record<BlackKind, BlackPieceStats>> = {
  knight: {
    name: "Knight",
    hp: 2,
    attack: 1,
    actEvery: 1.1,
    drop: 1,
    move: { lines: "L", reach: 1, hits: "landing-block" },
    bodyRadius: 0.325,
    contactRadius: 0.72,
    moveSeconds: 0.28,
  },
  bishop: {
    name: "Bishop",
    hp: 5,
    attack: 1,
    actEvery: 1.6,
    drop: 2,
    move: { lines: "diagonal", reach: 4, hits: "path" },
    bodyRadius: 0.35,
    contactRadius: 0.75,
    moveSeconds: 0.3,
  },
  rook: {
    name: "Rook",
    hp: 12,
    attack: 2,
    actEvery: 2,
    drop: 3,
    move: { lines: "straight", reach: 6, hits: "path" },
    bodyRadius: 0.375,
    contactRadius: 0.78,
    moveSeconds: 0.3,
  },
  queen: {
    name: "Queen",
    hp: 26,
    attack: 3,
    actEvery: 1.3,
    drop: 5,
    move: { lines: "any", reach: 5, hits: "path" },
    bodyRadius: 0.425,
    contactRadius: 0.84,
    moveSeconds: 0.3,
  },
  king: {
    name: "King",
    hp: 220,
    attack: 4,
    actEvery: 0.8,
    drop: 0,
    move: { lines: "any", reach: 1, hits: "landing-block" },
    bodyRadius: 0.575,
    contactRadius: 1.03,
    moveSeconds: 0.35,
    summons: { knights: 3, everySeconds: 6 },
    isKing: true,
  },
};
