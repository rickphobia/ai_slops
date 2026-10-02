import type { BattleState } from "../battle/battle-state";
import { createBattle } from "../battle/create-battle";
import { step } from "../battle/step";
import { WAVES, type Wave } from "../catalog/waves";
import type { RngState } from "../rng";

/** A run starts with this many plain pawns. */
const STARTING_PLAIN_PAWNS = 1;

/**
 * One run, as a state machine: `battle → won | lost`.
 * The shop between waves arrives in a later ticket.
 */
export type RunState =
  | {
      readonly phase: "battle";
      readonly seed: RngState;
      /** 1-based, as shown to the player. */
      readonly wave: number;
      readonly waves: readonly Wave[];
      readonly battle: BattleState;
    }
  | {
      readonly phase: "won" | "lost";
      readonly seed: RngState;
      readonly wave: number;
      /** The last battle as it ended, so the final board can still be shown. */
      readonly battle: BattleState;
    };

export interface RunSetup {
  readonly seed: RngState;
  readonly boardSize: number;
  /** The wave table; the catalog's unless a test passes its own. */
  readonly waves?: readonly Wave[];
}

export function startRun(setup: RunSetup): RunState {
  const waves = setup.waves ?? WAVES;
  const firstWave = waves[0];
  if (firstWave === undefined) {
    throw new RangeError("Cannot start a run with no waves.");
  }
  return {
    phase: "battle",
    seed: setup.seed,
    wave: 1,
    waves,
    battle: createBattle({
      boardSize: setup.boardSize,
      plainPawns: STARTING_PLAIN_PAWNS,
      wave: firstWave,
      seed: setup.seed,
    }),
  };
}

/** Advances the run by one battle tick. Pure. */
export function advanceRun(run: RunState): RunState {
  if (run.phase !== "battle") return run;
  const battle = step(run.battle);
  switch (battle.outcome) {
    case "ongoing":
      return { ...run, battle };
    case "lost":
      return { phase: "lost", seed: run.seed, wave: run.wave, battle };
    case "won":
      if (run.wave === run.waves.length) {
        return { phase: "won", seed: run.seed, wave: run.wave, battle };
      }
      // Moving on to the next wave comes with the full wave table (ticket 04).
      throw new RangeError(
        `Wave ${String(run.wave)} is cleared but moving to the next wave is not built yet.`,
      );
  }
}
