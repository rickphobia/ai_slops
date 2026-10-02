// Plays N headless runs with the bot and prints win rate, waves reached and biggest swarm.
// Vite loads the TypeScript rule modules, so this needs no build step and no extra tools.
import { runnerImport } from "vite";

const load = async (path) => (await runnerImport(path)).module;
const { parseBalanceArgs } = await load("./src/balance/parse-args.ts");
const { playRuns } = await load("./src/balance/play-runs.ts");
const { formatReport } = await load("./src/balance/format-report.ts");

const args = parseBalanceArgs(process.argv.slice(2));
if ("error" in args) {
  console.error(args.error);
  process.exit(1);
}
const startedMs = performance.now();
const report = playRuns({ count: args.runs, firstSeed: args.firstSeed });
for (const line of formatReport(report)) console.log(line);
console.log(
  `played in ${((performance.now() - startedMs) / 1000).toFixed(1)}s`,
);
