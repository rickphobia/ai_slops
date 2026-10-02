import type { BalanceReport } from "./play-runs";

/** The balance report as plain text lines: one per run, then the totals. */
export function formatReport(report: BalanceReport): string[] {
  const percent = (share: number): string => `${(share * 100).toFixed(0)}%`;
  const total = report.runs.length;
  const wins = report.runs.filter((run) => run.outcome === "won").length;
  return [
    ...report.runs.map(
      (run) =>
        `seed ${String(run.seed)}: ${run.outcome} in wave ${String(run.wave)}/${String(report.waveCount)}, biggest swarm ${String(run.peakSwarm)}, pieces taken ${String(run.piecesTaken)}`,
    ),
    "",
    `win rate: ${percent(report.winRate)} (${String(wins)} of ${String(total)})`,
    `waves reached: ${report.endedInWave
      .map((count, index) =>
        count > 0 ? `${String(index + 1)}: ${String(count)}` : "",
      )
      .filter((part) => part !== "")
      .join(", ")}`,
    `biggest swarm: ${String(report.peakSwarm.min)} to ${String(report.peakSwarm.max)}`,
  ];
}
