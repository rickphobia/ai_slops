import type { BoardSize } from "../board/square";
import type { BlackKind } from "../catalog/pieces";
import type { Random } from "../rng";
import type { SkillTimers } from "../skills/skills";
import type {
  BattleEvent,
  BlackPiece,
  Landing,
  PowerUpOrb,
  PowerUpTimers,
  WhitePawn,
} from "./battle-state";

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

export type WorkingPawn = Mutable<WhitePawn>;
export type WorkingBlackPiece = Mutable<BlackPiece>;
export type WorkingLanding = Mutable<Landing>;
export type WorkingOrb = Mutable<PowerUpOrb>;

/**
 * The battle while one step is being worked out. `step` copies every piece into
 * here first, so the phases can change them in place without touching the old state.
 * A piece with 0 HP or less is dead and is left out of the next state.
 */
export interface StepContext {
  readonly board: BoardSize;
  readonly wave: number;
  /** Game seconds one step covers. */
  readonly seconds: number;
  readonly random: Random;
  readonly events: BattleEvent[];
  readonly pawns: WorkingPawn[];
  readonly blackPieces: WorkingBlackPiece[];
  landings: WorkingLanding[];
  orbs: WorkingOrb[];
  /** Timed power-ups running now; the step counts them down at its end. */
  powerUps: PowerUpTimers;
  pushes: readonly (readonly BlackKind[])[];
  pushSize: number;
  pushSecondsLeft: number;
  nextId: number;
  skillCooldowns: SkillTimers;
  lastingSkills: SkillTimers;
  /** Set when the king dies: the battle is won at the end of the step. */
  kingDown: boolean;
}

export function takeId(context: StepContext): number {
  const id = context.nextId;
  context.nextId += 1;
  return id;
}

export function isAlive(piece: { readonly hp: number }): boolean {
  return piece.hp > 0;
}

/**
 * Whether a countdown timer has run out. Subtracting 1/60 over and over drifts
 * a hair above 0 (0.4 s would take 25 steps, not 24), so allow for that.
 */
export function hasRunOut(secondsLeft: number): boolean {
  return secondsLeft <= 1e-9;
}
