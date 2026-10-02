import type { TimedPowerUpId } from "../catalog/power-ups";
import { hasRunOut, type StepContext } from "./step-context";
import type { PowerUpTimers } from "./battle-state";

/** Whether a timed power-up is running this step. */
export function isRunning(
  context: Pick<StepContext, "powerUps">,
  powerUp: TimedPowerUpId,
): boolean {
  const secondsLeft = context.powerUps[powerUp];
  return secondsLeft !== undefined && !hasRunOut(secondsLeft);
}

/** Starts a timed power-up, or restarts it if it is already running. */
export function startPowerUp(
  timers: PowerUpTimers,
  powerUp: TimedPowerUpId,
  seconds: number,
): PowerUpTimers {
  return { ...timers, [powerUp]: seconds };
}

/** Counts every timer down by `seconds` and drops the ones that ran out. */
export function countDownPowerUps(
  timers: PowerUpTimers,
  seconds: number,
): PowerUpTimers {
  const left: Partial<Record<TimedPowerUpId, number>> = {};
  for (const [powerUp, secondsLeft] of Object.entries(timers) as [
    TimedPowerUpId,
    number,
  ][]) {
    const remaining = secondsLeft - seconds;
    if (!hasRunOut(remaining)) left[powerUp] = remaining;
  }
  return left;
}
