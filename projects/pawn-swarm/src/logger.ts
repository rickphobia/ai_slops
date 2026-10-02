export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Readonly<Record<string, unknown>>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** `?debug=1` in the page URL turns on debug logging; otherwise info and above. */
export function logLevelFromQuery(search: string): LogLevel {
  return new URLSearchParams(search).get("debug") === "1" ? "debug" : "info";
}

/** Writes to the browser console, dropping messages below `minLevel`. */
export function createConsoleLogger(
  minLevel: LogLevel,
  sink: Console = console,
): Logger {
  const log = (
    level: LogLevel,
    message: string,
    fields: LogFields = {},
  ): void => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    sink[level](`[pawn-swarm] ${level.toUpperCase()} ${message}`, fields);
  };
  return {
    debug: (message, fields) => {
      log("debug", message, fields);
    },
    info: (message, fields) => {
      log("info", message, fields);
    },
    warn: (message, fields) => {
      log("warn", message, fields);
    },
    error: (message, fields) => {
      log("error", message, fields);
    },
  };
}
