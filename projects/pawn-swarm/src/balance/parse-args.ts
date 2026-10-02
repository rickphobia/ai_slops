export interface BalanceArgs {
  readonly runs: number;
  readonly firstSeed: number;
}

const DEFAULTS: BalanceArgs = { runs: 20, firstSeed: 1 };
const USAGE = "Usage: npm run balance -- [--runs N] [--seed FIRST_SEED]";

/** Reads `--runs N` and `--seed S` from the command line, or explains what was wrong. */
export function parseBalanceArgs(
  args: readonly string[],
): BalanceArgs | { readonly error: string } {
  let runs = DEFAULTS.runs;
  let firstSeed = DEFAULTS.firstSeed;
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = Number(args[index + 1]);
    if (flag === "--runs" && Number.isInteger(value) && value >= 1) {
      runs = value;
    } else if (
      flag === "--seed" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 0xffffffff
    ) {
      firstSeed = value;
    } else {
      return {
        error: `Can't read "${args.slice(index, index + 2).join(" ")}". ${USAGE}`,
      };
    }
  }
  return { runs, firstSeed };
}
