/** The battle speeds the player can pick, as multiples of 1x. */
export const SPEEDS = [0.5, 1, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

export interface TickClockSetup {
  /** Length of one tick at 1x speed. */
  readonly tickMs: number;
  /** Time of the first frame, in the same units as the frame times passed later. */
  readonly startMs: number;
  /** After a long gap (hidden tab) don't fast-forward through all of it in one frame. */
  readonly maxTicksPerFrame: number;
}

export interface TickClock {
  /** Returns how many ticks are due at `nowMs` and counts them as taken. */
  takeDueTicks(nowMs: number): number;
  /** Takes effect from the last `takeDueTicks` call, at most one frame early. */
  setSpeed(speed: Speed): void;
  /** While paused no time builds up, so resuming carries on from the same point. */
  setPaused(paused: boolean): void;
}

/** Turns real time into battle ticks. It never touches battle state, so it can't change a result. */
export function createTickClock(setup: TickClockSetup): TickClock {
  let lastMs = setup.startMs;
  let speed: Speed = 1;
  let paused = false;
  // Battle time not yet spent on a tick: real time scaled by the speed it passed at.
  let pendingMs = 0;
  return {
    takeDueTicks: (nowMs) => {
      if (!paused) pendingMs += (nowMs - lastMs) * speed;
      lastMs = nowMs;
      const due = Math.floor(pendingMs / setup.tickMs);
      if (due > setup.maxTicksPerFrame) {
        pendingMs = 0;
        return setup.maxTicksPerFrame;
      }
      pendingMs -= due * setup.tickMs;
      return due;
    },
    setSpeed: (next) => {
      speed = next;
    },
    setPaused: (next) => {
      paused = next;
    },
  };
}
