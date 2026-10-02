import { NO_INPUTS, type StepInputs } from "../battle/battle-state";
import { WAVES, type Wave } from "../catalog/waves";
import { actInShop, advanceRun, type RunState, startRun } from "../run/run";
import { recruitBlocker } from "../shop/shop";

/** How one headless run ended. */
export interface RunSummary {
  readonly seed: number;
  readonly outcome: "won" | "lost";
  readonly wave: number;
  readonly peakSwarm: number;
  readonly piecesTaken: number;
}

export interface BalanceReport {
  readonly runs: readonly RunSummary[];
  readonly waveCount: number;
  /** Share of runs won, 0 to 1. */
  readonly winRate: number;
  /** How many runs ended in each wave, indexed by wave − 1. */
  readonly endedInWave: readonly number[];
  readonly peakSwarm: { readonly min: number; readonly max: number };
}

export interface BalanceSetup {
  readonly count: number;
  readonly firstSeed: number;
  /** The catalog's waves unless a test passes its own. */
  readonly waves?: readonly Wave[];
}

/** A run went on far longer than any real one could: a rule is stuck. */
export class RunStuckError extends Error {
  override name = "RunStuckError";
}

/** About 4.6 hours of game time: no real run gets close. */
const MAX_STEPS_PER_RUN = 1_000_000;

/**
 * What the bot does each battle step. There are no skills yet, so it does
 * nothing; ticket 07 teaches it to fire skills when ready.
 */
function botInputs(): StepInputs {
  return NO_INPUTS;
}

/** The bot's shop visit: recruits from the first offer it can, over and over, then starts the wave. */
function shopGreedily(start: RunState & { phase: "shop" }): RunState {
  let run: RunState = start;
  while (run.phase === "shop") {
    const { shop, army } = run;
    const offer = shop.offers.findIndex(
      (_, index) => recruitBlocker(shop, army, index) === undefined,
    );
    run = actInShop(
      run,
      offer < 0 ? { type: "start-wave" } : { type: "recruit", offer },
    );
  }
  return run;
}

/** Plays one run to the end with the bot. */
export function playBotRun(seed: number, waves: readonly Wave[]): RunSummary {
  let run: RunState = startRun({ seed, waves });
  for (let index = 0; run.phase === "battle" || run.phase === "shop"; index++) {
    if (index >= MAX_STEPS_PER_RUN) {
      throw new RunStuckError(
        `The run with seed ${String(seed)} was still in wave ${String(run.wave)} after ${String(MAX_STEPS_PER_RUN)} steps.`,
      );
    }
    run =
      run.phase === "shop" ? shopGreedily(run) : advanceRun(run, botInputs());
  }
  return {
    seed,
    outcome: run.phase,
    wave: run.wave,
    peakSwarm: run.peakSwarm,
    piecesTaken: run.piecesTaken,
  };
}

/** Plays `count` runs on seeds `firstSeed`, `firstSeed + 1`, ... and sums them up. */
export function playRuns(setup: BalanceSetup): BalanceReport {
  const waves = setup.waves ?? WAVES;
  const runs = Array.from({ length: setup.count }, (_, index) =>
    playBotRun(setup.firstSeed + index, waves),
  );
  const peaks = runs.map((run) => run.peakSwarm);
  return {
    runs,
    waveCount: waves.length,
    winRate: runs.filter((run) => run.outcome === "won").length / setup.count,
    endedInWave: waves.map(
      (_, index) => runs.filter((run) => run.wave === index + 1).length,
    ),
    peakSwarm: { min: Math.min(...peaks), max: Math.max(...peaks) },
  };
}
