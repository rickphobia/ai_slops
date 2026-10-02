import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/config";

const validEnv = {
  VITE_TICK_MS: "250",
  VITE_BOARD_SIZE: "16",
  VITE_DEFAULT_SEED: "12345",
};

describe("loadConfig", () => {
  it("reads tick length, board size and default seed from valid env vars", () => {
    expect(loadConfig(validEnv)).toEqual({
      tickMs: 250,
      boardSize: 16,
      defaultSeed: 12345,
    });
  });

  it("fails with the variable's name when one is missing", () => {
    const env = { ...validEnv, VITE_BOARD_SIZE: undefined };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(/VITE_BOARD_SIZE is missing/);
  });

  it.each([
    ["VITE_TICK_MS", "fast", /VITE_TICK_MS must be a whole number, got "fast"/],
    ["VITE_TICK_MS", "2.5", /VITE_TICK_MS must be a whole number, got "2.5"/],
    ["VITE_TICK_MS", "0", /VITE_TICK_MS must be from 1 to/],
    ["VITE_BOARD_SIZE", "3", /VITE_BOARD_SIZE must be from 4 to 64, got 3/],
    ["VITE_BOARD_SIZE", "65", /VITE_BOARD_SIZE must be from 4 to 64, got 65/],
    [
      "VITE_DEFAULT_SEED",
      "-1",
      /VITE_DEFAULT_SEED must be from 0 to 4294967295, got -1/,
    ],
    [
      "VITE_DEFAULT_SEED",
      "4294967296",
      /VITE_DEFAULT_SEED must be from 0 to 4294967295/,
    ],
  ])("rejects %s=%s", (name, value, message) => {
    const env = { ...validEnv, [name]: value };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(message);
  });
});
