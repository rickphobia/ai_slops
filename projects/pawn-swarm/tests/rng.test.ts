import { describe, expect, it } from "vitest";
import { createRandom, nextInt, pickOne } from "../src/rng";

describe("seeded RNG", () => {
  it("gives the same sequence for the same seed", () => {
    const rollTen = (seed: number): number[] => {
      const values: number[] = [];
      let state = seed;
      for (let i = 0; i < 10; i++) {
        const roll = nextInt(state, 1000);
        values.push(roll.value);
        state = roll.state;
      }
      return values;
    };
    expect(rollTen(42)).toEqual(rollTen(42));
    expect(rollTen(42)).not.toEqual(rollTen(43));
  });

  it("keeps whole numbers in [0, max)", () => {
    let state = 7;
    for (let i = 0; i < 1000; i++) {
      const roll = nextInt(state, 3);
      expect([0, 1, 2]).toContain(roll.value);
      state = roll.state;
    }
  });

  it("picks one item from a list", () => {
    const pick = pickOne(1, ["a", "b", "c"]);
    expect(["a", "b", "c"]).toContain(pick.value);
  });

  it("refuses to pick from an empty list", () => {
    expect(() => pickOne(1, [])).toThrow(/empty/);
  });
});

describe("createRandom", () => {
  it("rolls the same numbers in [0, 1) for the same start and reports where it got to", () => {
    const rollFive = (start: number): { values: number[]; end: number } => {
      const random = createRandom(start);
      const values = Array.from({ length: 5 }, () => random.next());
      return { values, end: random.state() };
    };
    const first = rollFive(9);
    expect(rollFive(9)).toEqual(first);
    expect(first.end).not.toBe(9);
    for (const value of first.values) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("carries on from a stored state exactly where it stopped", () => {
    const random = createRandom(9);
    random.next();
    const resumed = createRandom(random.state());
    expect(resumed.next()).toBe(random.next());
  });
});
