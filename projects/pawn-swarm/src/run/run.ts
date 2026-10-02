import type { BattleState, StepInputs } from "../battle/battle-state";
import { createBattle } from "../battle/create-battle";
import { step } from "../battle/step";
import { WAVES, type Wave } from "../catalog/waves";
import type { RngState } from "../rng";

export class RunError extends Error {
  override name = "RunError";
}

/** A run starts with this many plain pawns. */
const STARTING_PLAIN_PAWNS = 1;

/**
 * One run, as a state machine: `battle → (next battle | won | lost)`.
 * The shop between waves arrives in a later ticket.
 */
export type RunState =
  | {
      readonly phase: "battle";
      readonly seed: RngState;
      /** 1-based, as shown to the player. */
      readonly wave: number;
      readonly waves: readonly Wave[];
      /** A battle whose outcome is `won` is a cleared wave: the next advance starts the next one. */
      readonly battle: BattleState;
    }
  | {
      readonly phase: "won" | "lost";
      readonly seed: RngState;
      readonly wave: number;
      readonly waves: readonly Wave[];
      /** The last battle as it ended, so the final board can still be shown. */
      readonly battle: BattleState;
    };

export interface RunSetup {
  readonly seed: RngState;
  /** The wave table; the catalog's unless a test passes its own. */
  readonly waves?: readonly Wave[];
  /** Plain pawns to start with; 1 unless a test or the `?pawns=` debug option asks for more. */
  readonly plainPawns?: number;
}

export function startRun(setup: RunSetup): RunState {
  const waves = setup.waves ?? WAVES;
  const firstWave = waves[0];
  if (firstWave === undefined) {
    throw new RunError("Cannot start a run with no waves.");
  }
  return {
    phase: "battle",
    seed: setup.seed,
    wave: 1,
    waves,
    battle: createBattle({
      plainPawns: setup.plainPawns ?? STARTING_PLAIN_PAWNS,
      wave: firstWave,
      seed: setup.seed,
    }),
  };
}

/** Advances the run by one battle step, or starts the next wave after a cleared one. Pure. */
export function advanceRun(run: RunState, inputs: StepInputs): RunState {
  if (run.phase !== "battle") return run;
  if (run.battle.outcome === "won") return startNextWave(run);

  const battle = step(run.battle, inputs);
  if (battle.outcome === "lost") return { ...run, phase: "lost", battle };
  if (battle.outcome === "won" && run.wave === run.waves.length) {
    return { ...run, phase: "won", battle };
  }
  return { ...run, battle };
}

/** Survivors carry over as fresh plain pawns at full HP; the RNG carries on from the last battle. */
function startNextWave(run: RunState & { phase: "battle" }): RunState {
  const wave = run.waves[run.wave];
  if (wave === undefined) {
    throw new RunError(
      `Wave ${String(run.wave + 1)} is not in the wave table.`,
    );
  }
  return {
    ...run,
    wave: run.wave + 1,
    battle: createBattle({
      plainPawns: run.battle.pawns.length,
      wave,
      seed: run.battle.rng,
    }),
  };
}
