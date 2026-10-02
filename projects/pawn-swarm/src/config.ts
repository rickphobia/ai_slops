/** Settings read once at startup. Vite bakes `VITE_*` env vars into the build. */
export interface Config {
  /** Length of one tick at 1x speed, in milliseconds. */
  tickMs: number;
  /** Files and ranks on the (square) board. */
  boardSize: number;
  /** Seed for a new run when none is given. */
  defaultSeed: number;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

type Env = Readonly<Record<string, string | undefined>>;

const MAX_SEED = 2 ** 32 - 1;

export function loadConfig(env: Env): Config {
  return {
    tickMs: readInteger(env, "VITE_TICK_MS", 1, 10_000),
    boardSize: readInteger(env, "VITE_BOARD_SIZE", 4, 64),
    defaultSeed: readInteger(env, "VITE_DEFAULT_SEED", 0, MAX_SEED),
  };
}

function readInteger(env: Env, name: string, min: number, max: number): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") {
    throw new ConfigError(
      `${name} is missing. Copy .env.example to .env and set it.`,
    );
  }
  // Number("") is 0 and Number("1e3") is 1000, so check the text, not just the parsed value.
  if (!/^-?\d+$/.test(raw.trim())) {
    throw new ConfigError(`${name} must be a whole number, got "${raw}".`);
  }
  const value = Number(raw);
  if (value < min || value > max) {
    throw new ConfigError(
      `${name} must be from ${String(min)} to ${String(max)}, got ${raw}.`,
    );
  }
  return value;
}
