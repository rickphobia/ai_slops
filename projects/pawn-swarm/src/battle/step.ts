import { createRandom } from "../rng";
import type {
  BattleOutcome,
  BattleState,
  BlackPiece,
  StepInputs,
  WhitePawn,
} from "./battle-state";
import { actBlackPieces, landPieces } from "./black-pieces";
import { isAlive, type StepContext } from "./step-context";
import { actPawns, separatePawns } from "./white-pawns";

/** The inputs ask for something this build of the battle cannot do. */
export class BattleInputError extends Error {
  override name = "BattleInputError";
}

/** The simulation runs at 60 steps per game second, whatever the speed setting. */
export const STEPS_PER_SECOND = 60;
export const STEP_SECONDS = 1 / STEPS_PER_SECOND;

/**
 * Advances the battle by one step (1/60 game second). Pure: returns a new
 * state and leaves `state` alone. All randomness comes from `state.rng`, so the
 * same state and inputs always give the same next state.
 */
export function step(state: BattleState, inputs: StepInputs): BattleState {
  if (state.outcome !== "ongoing") return state;
  // A recorded replay from a later build may hold skill uses; refuse them rather than replay a different battle.
  if (inputs.skillUses.length > 0) {
    throw new BattleInputError("This build cannot play skill inputs yet.");
  }

  const context: StepContext = {
    board: state.board,
    seconds: STEP_SECONDS,
    random: createRandom(state.rng),
    events: [],
    pawns: state.pawns.map((pawn) => ({ ...pawn })),
    blackPieces: state.blackPieces.map((piece) => ({ ...piece })),
    landings: state.landings.map((landing) => ({ ...landing })),
    nextId: state.nextId,
  };

  landPieces(context);
  actPawns(context);
  separatePawns(context);
  actBlackPieces(context);

  const pawns: WhitePawn[] = context.pawns.filter(isAlive);
  const blackPieces: BlackPiece[] = context.blackPieces.filter(isAlive);
  return {
    stepNumber: state.stepNumber + 1,
    board: state.board,
    pawns,
    blackPieces,
    landings: context.landings,
    nextId: context.nextId,
    rng: context.random.state(),
    outcome: outcomeOf(pawns, blackPieces.length + context.landings.length),
    events: context.events,
  };
}

function outcomeOf(
  pawns: readonly WhitePawn[],
  blackLeft: number,
): BattleOutcome {
  if (pawns.length === 0) return "lost";
  if (blackLeft === 0) return "won";
  return "ongoing";
}
