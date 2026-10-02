import type { BoardSize, Point, Square } from "../board/square";
import type { BlackKind, PawnTypeId } from "../catalog/pieces";
import type { RngState } from "../rng";

export type Axis = "x" | "y";

/** Which kind of piece something is: a white pawn type or a black piece kind. */
export type PieceIdentity =
  | { readonly side: "white"; readonly type: PawnTypeId }
  | { readonly side: "black"; readonly kind: BlackKind };

/** A white pawn. It moves freely in board units, along one axis at a time. */
export interface WhitePawn {
  readonly id: number;
  readonly type: PawnTypeId;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHp: number;
  /** Seconds until it can strike again; goes below 0 while it walks, so it strikes on arrival. */
  readonly strikeCooldownLeft: number;
  /** The axis it is walking along. */
  readonly axis: Axis;
  /** Velocity from a drop burst, in squares per second. It fades out on its own. */
  readonly burstX: number;
  readonly burstY: number;
}

/**
 * A black move in progress. During `warning` its hit squares glow red; during
 * `moving` the piece is on its way and touches nothing; it lands when `secondsLeft` runs out.
 */
export interface BlackMove {
  readonly phase: "warning" | "moving";
  readonly to: Square;
  readonly hitSquares: readonly Square[];
  readonly secondsLeft: number;
  /** Length of the current phase, so a renderer can show progress. */
  readonly phaseSeconds: number;
}

/** A black piece. It always stands on a square centre and moves only by its chess move. */
export interface BlackPiece {
  readonly id: number;
  readonly kind: BlackKind;
  readonly square: Square;
  readonly hp: number;
  readonly maxHp: number;
  /** Seconds until it picks its next move. Only counts down while it has no move. */
  readonly actLeft: number;
  /** Seconds until it next hurts the pawns touching it. */
  readonly contactLeft: number;
  readonly move: BlackMove | undefined;
}

/** A black piece about to land at wave start, shown as a warning square. */
export interface Landing {
  readonly kind: BlackKind;
  readonly square: Square;
  readonly secondsLeft: number;
  readonly warningSeconds: number;
}

export type BattleOutcome = "ongoing" | "won" | "lost";

/** What happened during the last step: for logs and on-screen effects. Rules never read these. */
export type BattleEvent =
  | {
      readonly type: "strike";
      readonly pawnId: number;
      readonly pawnType: PawnTypeId;
      readonly targetId: number;
      readonly damage: number;
      readonly from: Point;
      readonly at: Point;
    }
  | {
      readonly type: "pawn-hurt";
      readonly pawnId: number;
      readonly damage: number;
      readonly cause: "stomp" | "contact";
      readonly at: Point;
    }
  | {
      readonly type: "death";
      readonly id: number;
      readonly piece: PieceIdentity;
      readonly at: Point;
    }
  | { readonly type: "drop"; readonly count: number; readonly at: Point }
  | {
      readonly type: "landed";
      readonly id: number;
      readonly kind: BlackKind;
      readonly at: Point;
    }
  | { readonly type: "stomp"; readonly id: number; readonly at: Point };

export interface BattleState {
  /** Steps played so far. */
  readonly stepNumber: number;
  readonly board: BoardSize;
  /** Living white pawns. */
  readonly pawns: readonly WhitePawn[];
  /** Living black pieces on the board. */
  readonly blackPieces: readonly BlackPiece[];
  /** Black pieces still to land. */
  readonly landings: readonly Landing[];
  /** The id the next new piece gets. */
  readonly nextId: number;
  readonly rng: RngState;
  readonly outcome: BattleOutcome;
  readonly events: readonly BattleEvent[];
}

/** What the player did this step, so a seed plus the recorded inputs replays a battle exactly. */
export interface StepInputs {
  /** Skills fired this step. Skills arrive in ticket 07; until then there are none to fire. */
  readonly skillUses: readonly never[];
}

export const NO_INPUTS: StepInputs = { skillUses: [] };
