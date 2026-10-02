import { describe, expect, it } from "vitest";
import { advanceRun, type RunState, startRun } from "../src/run/run";
import { createTickClock, SPEEDS, type Speed } from "../src/tick-clock";

const FRAME_MS = 16;

/** Plays a run the way the game loop does: frames of real time, ticks as the clock allows. */
function playByClock(speed: Speed, pauseEveryFrames?: number): RunState {
  const clock = createTickClock({
    tickMs: 250,
    startMs: 0,
    maxTicksPerFrame: 5,
  });
  clock.setSpeed(speed);
  let run = startRun({ seed: 7, boardSize: 16 });
  for (let frame = 1; frame < 100_000 && run.phase === "battle"; frame++) {
    if (pauseEveryFrames !== undefined) {
      clock.setPaused(frame % pauseEveryFrames < pauseEveryFrames / 2);
    }
    const due = clock.takeDueTicks(frame * FRAME_MS);
    for (let tick = 0; tick < due && run.phase === "battle"; tick++) {
      run = advanceRun(run);
    }
  }
  return run;
}

describe("tick clock", () => {
  it("makes one tick due per tick length at 1x", () => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    expect(clock.takeDueTicks(1000)).toBe(4);
  });

  it.each([
    [0.5, 2],
    [1.5, 6],
    [2, 8],
  ] as const)("at %sx makes %i ticks due in 1000 ms", (speed, ticks) => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    clock.setSpeed(speed);
    expect(clock.takeDueTicks(1000)).toBe(ticks);
  });

  it("applies a speed change only to time after it", () => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    expect(clock.takeDueTicks(375)).toBe(1); // 125 ms carried over at 1x
    clock.setSpeed(2);
    expect(clock.takeDueTicks(437.5)).toBe(1); // 125 + 62.5 * 2 = 250
  });

  it("makes no ticks due while paused", () => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    clock.setPaused(true);
    expect(clock.takeDueTicks(10_000)).toBe(0);
  });

  it("resumes where it paused, keeping the part-tick it had built up", () => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 100,
    });
    expect(clock.takeDueTicks(200)).toBe(0);
    clock.setPaused(true);
    expect(clock.takeDueTicks(5000)).toBe(0);
    clock.setPaused(false);
    expect(clock.takeDueTicks(5049)).toBe(0);
    expect(clock.takeDueTicks(5050)).toBe(1); // 200 before + 50 after the pause
  });

  it("caps the ticks of one frame and drops the rest of a long gap", () => {
    const clock = createTickClock({
      tickMs: 250,
      startMs: 0,
      maxTicksPerFrame: 5,
    });
    expect(clock.takeDueTicks(60_000)).toBe(5); // a hidden tab for a minute
    expect(clock.takeDueTicks(60_250)).toBe(1);
  });

  it("gives the same battle result at every speed and with pauses", () => {
    let reference = startRun({ seed: 7, boardSize: 16 });
    while (reference.phase === "battle") reference = advanceRun(reference);

    for (const speed of SPEEDS) {
      expect(playByClock(speed)).toEqual(reference);
    }
    expect(playByClock(1, 40)).toEqual(reference);
  });
});
