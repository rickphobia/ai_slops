import { describe, expect, it } from "vitest";
import { formatReport } from "../../src/balance/format-report";
import { parseBalanceArgs } from "../../src/balance/parse-args";
import { playBotRun, playRuns } from "../../src/balance/play-runs";
import type { Wave } from "../../src/catalog/waves";

const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});

describe("playRuns", () => {
  it("plays runs on consecutive seeds and sums them up", () => {
    const waves = [knights(2), knights(8), knights(200)];
    const report = playRuns({ count: 4, firstSeed: 10, waves });
    expect(report.runs.map((run) => run.seed)).toEqual([10, 11, 12, 13]);
    expect(report.waveCount).toBe(3);
    // 200 knights at once is more than a few pawns can take.
    for (const run of report.runs) expect(run.outcome).toBe("lost");
    expect(report.winRate).toBe(0);
    expect(report.endedInWave.reduce((sum, count) => sum + count, 0)).toBe(4);
    const peaks = report.runs.map((run) => run.peakSwarm);
    expect(report.peakSwarm).toEqual({
      min: Math.min(...peaks),
      max: Math.max(...peaks),
    });
  });

  it("plays the same run for the same seed", () => {
    const waves = [knights(2), knights(8)];
    expect(playBotRun(5, waves)).toEqual(playBotRun(5, waves));
  });

  it("counts wins", () => {
    const report = playRuns({ count: 3, firstSeed: 1, waves: [knights(1)] });
    expect(report.winRate).toBe(1);
    expect(report.endedInWave).toEqual([3]);
  });
});

describe("formatReport", () => {
  it("prints each run, the win rate, the waves reached and the swarm range", () => {
    const lines = formatReport({
      runs: [
        { seed: 1, outcome: "lost", wave: 4, peakSwarm: 12, piecesTaken: 30 },
        { seed: 2, outcome: "won", wave: 10, peakSwarm: 80, piecesTaken: 300 },
      ],
      waveCount: 10,
      winRate: 0.5,
      endedInWave: [0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      peakSwarm: { min: 12, max: 80 },
    });
    expect(lines).toEqual([
      "seed 1: lost in wave 4/10, biggest swarm 12, pieces taken 30",
      "seed 2: won in wave 10/10, biggest swarm 80, pieces taken 300",
      "",
      "win rate: 50% (1 of 2)",
      "waves reached: 4: 1, 10: 1",
      "biggest swarm: 12 to 80",
    ]);
  });
});

describe("parseBalanceArgs", () => {
  it("defaults to 20 runs from seed 1", () => {
    expect(parseBalanceArgs([])).toEqual({ runs: 20, firstSeed: 1 });
  });

  it("reads --runs and --seed", () => {
    expect(parseBalanceArgs(["--runs", "50", "--seed", "7"])).toEqual({
      runs: 50,
      firstSeed: 7,
    });
  });

  it.each([
    [["--runs", "0"]],
    [["--runs", "many"]],
    [["--seed", "-1"]],
    [["--speed", "2"]],
    [["--runs"]],
  ])("explains what is wrong with %j", (args) => {
    const parsed = parseBalanceArgs(args);
    expect("error" in parsed && parsed.error).toContain("Usage");
  });
});
