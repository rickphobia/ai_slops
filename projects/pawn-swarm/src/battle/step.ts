import { BATTLE_RULES } from "../catalog/battle-rules";
import { createRandom } from "../rng";
import { countDown } from "../skills/skills";
import type {
  BattleOutcome,
  BattleState,
  BlackPiece,
  StepInputs,
  WhitePawn,
} from "./battle-state";
import { actBlackPieces, landPieces } from "./black-pieces";
import { pulseMedics } from "./passives";
import { landNextPushIfDue } from "./pushes";
import { fireSkills } from "./skill-effects";
import { isAlive, type StepContext } from "./step-context";
import { actPawns, separatePawns } from "./white-pawns";

/** The simulation runs at 60 steps per game second, whatever the speed setting. */
export const STEPS_PER_SECOND = 60;
export const STEP_SECONDS = 1 / STEPS_PER_SECOND;
/**
 * Real milliseconds between steps at 1× speed. The pace stretches every step
 * over more real time; like the speed setting it never changes what a step does.
 */
export const REAL_MS_PER_STEP = 1000 / (STEPS_PER_SECOND * BATTLE_RULES.pace);

/**
 * Advances the battle by one step (1/60 game second): first the skills the
 * player fired, then the phases below. Pure: returns a new
 * state and leaves `state` alone. All randomness comes from `state.rng`, so the
 * same state and inputs always give the same next state.
 */
export function step(state: BattleState, inputs: StepInputs): BattleState {
  if (state.outcome !== "ongoing") return state;

  const context: StepContext = {
    board: state.board,
    wave: state.wave,
    seconds: STEP_SECONDS,
    random: createRandom(state.rng),
    events: [],
    pawns: state.pawns.map((pawn) => ({ ...pawn })),
    blackPieces: state.blackPieces.map((piece) => ({ ...piece })),
    landings: state.landings.map((landing) => ({ ...landing })),
    pushes: state.pushes,
    pushSize: state.pushSize,
    pushSecondsLeft: state.pushSecondsLeft,
    nextId: state.nextId,
    skillCooldowns: state.skillCooldowns,
    lastingSkills: state.lastingSkills,
    kingDown: false,
  };

  fireSkills(context, inputs.skillUses);
  landPieces(context);
  pulseMedics(context);
  actPawns(context);
  separatePawns(context);
  actBlackPieces(context);
  landNextPushIfDue(context);

  const pawns: WhitePawn[] = context.pawns.filter(isAlive);
  const blackPieces: BlackPiece[] = context.blackPieces.filter(isAlive);
  return {
    stepNumber: state.stepNumber + 1,
    board: state.board,
    wave: state.wave,
    pawns,
    blackPieces,
    landings: context.landings,
    pushes: context.pushes,
    pushSize: context.pushSize,
    pushSecondsLeft: context.pushSecondsLeft,
    nextId: context.nextId,
    rng: context.random.state(),
    skillCooldowns: countDown(context.skillCooldowns, context.seconds),
    lastingSkills: countDown(context.lastingSkills, context.seconds),
    outcome: outcomeOf(
      pawns,
      context.kingDown,
      blackPiecesLeft({
        blackPieces,
        landings: context.landings,
        pushes: context.pushes,
      }),
    ),
    events: context.events,
  };
}

/** Losing the last pawn loses, even on the step the king falls. */
function outcomeOf(
  pawns: readonly WhitePawn[],
  kingDown: boolean,
  blackLeft: number,
): BattleOutcome {
  if (pawns.length === 0) return "lost";
  if (kingDown || blackLeft === 0) return "won";
  return "ongoing";
}

/** Black pieces still to beat: on the board, landing, and in pushes still to come. */
export function blackPiecesLeft(
  state: Pick<BattleState, "blackPieces" | "landings" | "pushes">,
): number {
  return (
    state.blackPieces.length +
    state.landings.length +
    state.pushes.reduce((total, push) => total + push.length, 0)
  );
}
