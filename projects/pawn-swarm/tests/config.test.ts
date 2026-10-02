import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/config";

const validEnv = { VITE_DEFAULT_SEED: "12345" };

describe("loadConfig", () => {
  it("reads the default seed from valid env vars", () => {
    expect(loadConfig(validEnv)).toEqual({ defaultSeed: 12345 });
  });

  it("fails with the variable's name when one is missing", () => {
    const env = { VITE_DEFAULT_SEED: undefined };
    expect(() => loadConfig(env)).toThrow(ConfigError);
    expect(() => loadConfig(env)).toThrow(/VITE_DEFAULT_SEED is missing/);
  });

  it.each([
    [
      "VITE_DEFAULT_SEED",
      "lucky",
      /VITE_DEFAULT_SEED must be a whole number, got "lucky"/,
    ],
    [
      "VITE_DEFAULT_SEED",
      "2.5",
      /VITE_DEFAULT_SEED must be a whole number, got "2.5"/,
    ],
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
