import type { BoardSize, Point, Square } from "../board/square";
import type { BlackKind, PawnTypeId } from "../catalog/pieces";
import type { RngState } from "../rng";
import type { SkillTimers } from "../skills/skills";

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
  /** Seconds until it next calls knights; only counts for pieces that summon (the king). */
  readonly summonLeft: number;
  readonly move: BlackMove | undefined;
}

/** A black piece about to land (from a push or a summon), shown as a warning square. */
export interface Landing {
  readonly kind: BlackKind;
  readonly square: Square;
  readonly secondsLeft: number;
  readonly warningSeconds: number;
}

/** How a pawn got hurt: by a black move landing on its square, or by touching a black piece. */
export type HurtCause = "hit" | "contact";

export type BattleOutcome = "ongoing" | "won" | "lost";

/** What happened during the last step: for logs and on-screen effects. Rules never read these. */
export type BattleEvent =
  /** A pawn's blow to a black piece: its own strike, or a skill's hit (Volley, Fork). */
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
      readonly cause: HurtCause;
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
  /** A knight or the king landed its jump: a ring on the 3×3 block. */
  | { readonly type: "stomp"; readonly id: number; readonly at: Point }
  /** The next push of the wave started its landing warnings. */
  | {
      readonly type: "push";
      readonly count: number;
      readonly pushesLeft: number;
    }
  /** The player fired a skill: every pawn of the type took part. */
  | {
      readonly type: "skill";
      readonly pawnType: PawnTypeId;
      readonly pawns: number;
    }
  | {
      readonly type: "summon";
      readonly id: number;
      readonly count: number;
      readonly at: Point;
    };

export interface BattleState {
  /** Steps played so far. */
  readonly stepNumber: number;
  readonly board: BoardSize;
  /** 1-based wave number: black HP grows with it. */
  readonly wave: number;
  /** Living white pawns. */
  readonly pawns: readonly WhitePawn[];
  /** Living black pieces on the board. */
  readonly blackPieces: readonly BlackPiece[];
  /** Black pieces still to land. */
  readonly landings: readonly Landing[];
  /** The wave's pushes that haven't started landing yet, in order. */
  readonly pushes: readonly (readonly BlackKind[])[];
  /** How many pieces the last push brought: the next lands once few enough are left. */
  readonly pushSize: number;
  /** Seconds until the next push lands anyway. */
  readonly pushSecondsLeft: number;
  /** The id the next new piece gets. */
  readonly nextId: number;
  readonly rng: RngState;
  /** Game seconds until each type's skill can be used again. */
  readonly skillCooldowns: SkillTimers;
  /** Game seconds each type's lasting skill (Charge, Hold the line) still runs. */
  readonly lastingSkills: SkillTimers;
  readonly outcome: BattleOutcome;
  readonly events: readonly BattleEvent[];
}

/** What the player did this step, so a seed plus the recorded inputs replays a battle exactly. */
export interface StepInputs {
  /**
   * Skills fired this step, by pawn type. A use the rules refuse (no pawns of
   * the type, still on cooldown, or already used this step) does nothing.
   */
  readonly skillUses: readonly PawnTypeId[];
}

export const NO_INPUTS: StepInputs = { skillUses: [] };
