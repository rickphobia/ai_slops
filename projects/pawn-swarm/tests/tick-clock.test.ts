import { describe, expect, it } from "vitest";
import { NO_INPUTS } from "../src/battle/battle-state";
import { REAL_MS_PER_STEP, STEPS_PER_SECOND } from "../src/battle/step";
import { WAVES } from "../src/catalog/waves";
import { advanceRun, type RunState, startRun } from "../src/run/run";
import {
  createTickClock,
  SPEEDS,
  type Speed,
  type TickClock,
} from "../src/tick-clock";

const FRAME_MS = 16;
/** The first three waves: long enough to cover pushes and bishops, short enough to replay at every speed. */
const EARLY_WAVES = WAVES.slice(0, 3);

function clockAt(maxTicksPerFrame = 100): TickClock {
  return createTickClock({ tickMs: 250, startMs: 0, maxTicksPerFrame });
}

/** Plays a run the way the game loop does: frames of real time, ticks as the clock allows. */
function playByClock(speed: Speed, pauseEveryFrames?: number): RunState {
  const clock = createTickClock({
    tickMs: REAL_MS_PER_STEP,
    startMs: 0,
    maxTicksPerFrame: 5,
  });
  clock.setSpeed(speed);
  let run = startRun({ seed: 7, plainPawns: 20, waves: EARLY_WAVES });
  for (let frame = 1; frame < 100_000 && run.phase === "battle"; frame++) {
    if (pauseEveryFrames !== undefined) {
      clock.setPaused(frame % pauseEveryFrames < pauseEveryFrames / 2);
    }
    const due = clock.takeDueTicks(frame * FRAME_MS);
    for (let tick = 0; tick < due && run.phase === "battle"; tick++) {
      run = advanceRun(run, NO_INPUTS);
    }
  }
  return run;
}

describe("tick clock", () => {
  it("makes one tick due per tick length at 1x", () => {
    const clock = clockAt();
    expect(clock.takeDueTicks(1000)).toBe(4);
  });

  it.each([
    [0.5, 2],
    [1.5, 6],
    [2, 8],
  ] as const)("at %sx makes %i ticks due in 1000 ms", (speed, ticks) => {
    const clock = clockAt();
    clock.setSpeed(speed);
    expect(clock.takeDueTicks(1000)).toBe(ticks);
  });

  it("applies a speed change only to time after it", () => {
    const clock = clockAt();
    expect(clock.takeDueTicks(375)).toBe(1); // 125 ms carried over at 1x
    clock.setSpeed(2);
    expect(clock.takeDueTicks(437.5)).toBe(1); // 125 + 62.5 * 2 = 250
  });

  it("reports its speed and whether it is paused", () => {
    const clock = clockAt();
    expect(clock.state()).toEqual({ paused: false, speed: 1 });
    clock.setSpeed(1.5);
    clock.setPaused(true);
    expect(clock.state()).toEqual({ paused: true, speed: 1.5 });
  });

  it("makes no ticks due while paused", () => {
    const clock = clockAt();
    clock.setPaused(true);
    expect(clock.takeDueTicks(10_000)).toBe(0);
  });

  it("resumes where it paused, keeping the part-tick it had built up", () => {
    const clock = clockAt();
    expect(clock.takeDueTicks(200)).toBe(0);
    clock.setPaused(true);
    expect(clock.takeDueTicks(5000)).toBe(0);
    clock.setPaused(false);
    expect(clock.takeDueTicks(5049)).toBe(0);
    expect(clock.takeDueTicks(5050)).toBe(1); // 200 before + 50 after the pause
  });

  it("caps the ticks of one frame and drops the rest of a long gap", () => {
    const clock = clockAt(5);
    expect(clock.takeDueTicks(60_000)).toBe(5); // a hidden tab for a minute
    expect(clock.takeDueTicks(60_250)).toBe(1);
  });

  it("runs 0.65 game seconds per real second at 1x", () => {
    const clock = createTickClock({
      tickMs: REAL_MS_PER_STEP,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    let steps = 0;
    const minuteOfFrames = 60_000 / FRAME_MS;
    for (let frame = 1; frame <= minuteOfFrames; frame++) {
      steps += clock.takeDueTicks(frame * FRAME_MS);
    }
    // 60 real seconds × 0.65 = 39 game seconds = 2340 steps, give or take the part-step left over.
    expect(steps / STEPS_PER_SECOND).toBeCloseTo(39, 1);
  });

  it("gives the same battle result at every speed and with pauses", () => {
    let reference = startRun({ seed: 7, plainPawns: 20, waves: EARLY_WAVES });
    while (reference.phase === "battle") {
      reference = advanceRun(reference, NO_INPUTS);
    }

    for (const speed of SPEEDS) {
      expect(playByClock(speed)).toEqual(reference);
    }
    expect(playByClock(1, 40)).toEqual(reference);
  });
});
