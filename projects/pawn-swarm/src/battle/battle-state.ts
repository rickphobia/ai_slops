import type { Side, Square } from "../board/square";
import type { RngState } from "../rng";

/** How a piece moves. */
export type PieceKind = "pawn" | "knight";

export interface Piece {
  readonly id: number;
  readonly side: Side;
  readonly kind: PieceKind;
  readonly square: Square;
  readonly hp: number;
  readonly maxHp: number;
  readonly attack: number;
  readonly cooldownTicks: number;
  /** Ticks until the piece acts again; 0 means it acts as soon as it can. */
  readonly cooldownLeft: number;
}

export type BattleOutcome = "ongoing" | "won" | "lost";

/** What happened during the last tick, for logs and (later) animation. */
export type BattleEvent =
  | {
      readonly type: "hit";
      readonly attackerId: number;
      readonly targetId: number;
      readonly damage: number;
    }
  | {
      readonly type: "death";
      readonly pieceId: number;
      readonly square: Square;
    };

export interface BattleState {
  readonly tick: number;
  readonly boardSize: number;
  /** Living pieces, sorted by id; that order is also the order they act in. */
  readonly pieces: readonly Piece[];
  readonly rng: RngState;
  readonly outcome: BattleOutcome;
  readonly events: readonly BattleEvent[];
}
