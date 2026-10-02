import type {
  BattleEvent,
  BattleState,
  StepInputs,
} from "../battle/battle-state";
import { createBattle } from "../battle/create-battle";
import { step } from "../battle/step";
import type { Army } from "../catalog/pieces";
import { WAVES, type Wave } from "../catalog/waves";
import type { RngState } from "../rng";
import {
  lockedOffers,
  type Offer,
  openShop,
  recruit,
  reroll,
  type ShopState,
  toggleLock,
} from "../shop/shop";
import { describeShop, type ShopView } from "../shop/shop-view";

export class RunError extends Error {
  override name = "RunError";
}

/** A run starts with this many plain pawns. */
const STARTING_PLAIN_PAWNS = 1;

/** What the end screen shows about a run. */
export interface RunScore {
  /** The most white pawns alive at once. */
  readonly peakSwarm: number;
  /** Black pieces killed, summoned knights included. */
  readonly piecesTaken: number;
}

interface RunCommon extends RunScore {
  readonly seed: RngState;
  /** 1-based, as shown to the player: the wave being fought, or the last one fought. */
  readonly wave: number;
  readonly waves: readonly Wave[];
  /** Offers the player locked, carried to the next shop visit. */
  readonly lockedOffers: readonly Offer[];
}

/**
 * One run, as a state machine: `battle → (shop → battle | won | lost)`.
 */
export type RunState = RunCommon &
  (
    | {
        readonly phase: "battle";
        /** A battle whose outcome is `won` is a cleared wave: the next advance opens the shop. */
        readonly battle: BattleState;
      }
    | {
        readonly phase: "shop";
        /** The wave just cleared, so the board behind the shop still shows it. */
        readonly battle: BattleState;
        readonly shop: ShopState;
        /** The pawns that will fight the next wave, changed by recruiting and rerolling. */
        readonly army: Army;
      }
    | {
        readonly phase: "won" | "lost";
        /** The last battle as it ended, so the final board can still be shown. */
        readonly battle: BattleState;
      }
  );

/** What the player can do in the shop. `offer` is the offer's slot, from 0. */
export type ShopAction =
  | { readonly type: "recruit"; readonly offer: number }
  | { readonly type: "lock"; readonly offer: number }
  | { readonly type: "reroll" }
  | { readonly type: "start-wave" };

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
  const battle = createBattle({
    army: { plain: setup.plainPawns ?? STARTING_PLAIN_PAWNS },
    wave: firstWave,
    waveNumber: 1,
    seed: setup.seed,
  });
  return {
    phase: "battle",
    seed: setup.seed,
    wave: 1,
    waves,
    lockedOffers: [],
    battle,
    peakSwarm: battle.pawns.length,
    piecesTaken: 0,
  };
}

/** Advances the run by one battle step, or opens the shop after a cleared wave. Pure; does nothing outside a battle. */
export function advanceRun(run: RunState, inputs: StepInputs): RunState {
  if (run.phase !== "battle") return run;
  if (run.battle.outcome === "won") return enterShop(run);

  const battle = step(run.battle, inputs);
  const score: RunScore = {
    peakSwarm: Math.max(run.peakSwarm, battle.pawns.length),
    piecesTaken: run.piecesTaken + blackDeaths(battle.events),
  };
  if (battle.outcome === "lost") {
    return { ...run, ...score, phase: "lost", battle };
  }
  if (battle.outcome === "won" && run.wave === run.waves.length) {
    return { ...run, ...score, phase: "won", battle };
  }
  return { ...run, ...score, battle };
}

function blackDeaths(events: readonly BattleEvent[]): number {
  return events.filter(
    (event) => event.type === "death" && event.piece.side === "black",
  ).length;
}

/** Applies one shop action. Pure; throws `ShopError` for an action the shop doesn't allow. */
export function actInShop(run: RunState, action: ShopAction): RunState {
  if (run.phase !== "shop") {
    throw new RunError(
      `Can't ${action.type} in the shop during the ${run.phase} phase.`,
    );
  }
  switch (action.type) {
    case "recruit":
      return { ...run, ...recruit(run.shop, run.army, action.offer) };
    case "reroll":
      return { ...run, ...reroll(run.shop, run.army) };
    case "lock":
      return { ...run, shop: toggleLock(run.shop, action.offer) };
    case "start-wave":
      return startNextWave(run);
  }
}

/** Survivors join the army at full HP, each keeping its type; the shop rolls on from the battle's RNG. */
function enterShop(run: RunState & { phase: "battle" }): RunState {
  return {
    ...run,
    phase: "shop",
    army: armyOf(run.battle.pawns),
    shop: openShop({
      wave: run.wave + 1,
      locked: run.lockedOffers,
      rng: run.battle.rng,
    }),
  };
}

function startNextWave(run: RunState & { phase: "shop" }): RunState {
  const wave = run.waves[run.wave];
  if (wave === undefined) {
    throw new RunError(
      `Wave ${String(run.wave + 1)} is not in the wave table.`,
    );
  }
  const battle = createBattle({
    army: run.army,
    wave,
    waveNumber: run.wave + 1,
    seed: run.shop.rng,
  });
  return {
    phase: "battle",
    seed: run.seed,
    wave: run.wave + 1,
    waves: run.waves,
    lockedOffers: lockedOffers(run.shop),
    battle,
    peakSwarm: Math.max(run.peakSwarm, battle.pawns.length),
    piecesTaken: run.piecesTaken,
  };
}

/** What the shop screen shows for this run's shop visit. */
export function shopView(run: RunState & { phase: "shop" }): ShopView {
  const nextWave = run.waves[run.shop.wave - 1];
  if (nextWave === undefined) {
    throw new RunError(
      `The shop leads into wave ${String(run.shop.wave)}, which is not in the wave table.`,
    );
  }
  return describeShop(run.shop, run.army, nextWave);
}

/** Pawns in the army, all types together. */
export function armySize(army: Army): number {
  return Object.values(army).reduce((total, count) => total + count, 0);
}

function armyOf(pawns: readonly { readonly type: keyof Army }[]): Army {
  const army: Partial<Record<keyof Army, number>> = {};
  for (const pawn of pawns) army[pawn.type] = (army[pawn.type] ?? 0) + 1;
  return army;
}
