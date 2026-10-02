import type { BattleEvent, BattleState } from "../battle/battle-state";
import { STEP_SECONDS } from "../battle/step";

/** What happened in one wave, recorded by the run as the battle plays. The shop only reads it. */
export interface WaveReport {
  /** Black pieces killed, summoned knights included. */
  readonly piecesTaken: number;
  /** Plain pawns dropped by kills. */
  readonly pawnsGained: number;
  /** White pawns killed. */
  readonly pawnsLost: number;
  /** The most white pawns alive at once. */
  readonly biggestSwarm: number;
  /** Game seconds the wave has run. */
  readonly seconds: number;
}

/** The report for a battle that has not played a step yet. */
export function startWaveReport(battle: BattleState): WaveReport {
  return {
    piecesTaken: 0,
    pawnsGained: 0,
    pawnsLost: 0,
    biggestSwarm: battle.pawns.length,
    seconds: 0,
  };
}

/** Adds one battle step to the report. `battle` is the state after the step. */
export function recordStep(
  report: WaveReport,
  battle: BattleState,
): WaveReport {
  return {
    piecesTaken: report.piecesTaken + deathsOf(battle.events, "black"),
    pawnsGained: report.pawnsGained + dropped(battle.events),
    pawnsLost: report.pawnsLost + deathsOf(battle.events, "white"),
    biggestSwarm: Math.max(report.biggestSwarm, battle.pawns.length),
    seconds: battle.stepNumber * STEP_SECONDS,
  };
}

function deathsOf(
  events: readonly BattleEvent[],
  side: "white" | "black",
): number {
  return events.filter(
    (event) => event.type === "death" && event.piece.side === side,
  ).length;
}

function dropped(events: readonly BattleEvent[]): number {
  return events.reduce(
    (total, event) => total + (event.type === "drop" ? event.count : 0),
    0,
  );
}
