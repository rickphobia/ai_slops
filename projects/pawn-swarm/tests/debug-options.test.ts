import { describe, expect, it } from "vitest";
import {
  autoSkillsFromQuery,
  startingPawnsFromQuery,
} from "../src/debug-options";

describe("startingPawnsFromQuery", () => {
  it("is undefined without ?pawns=", () => {
    expect(startingPawnsFromQuery("?debug=1")).toEqual({ pawns: undefined });
  });

  it("reads a whole number of pawns", () => {
    expect(startingPawnsFromQuery("?pawns=300")).toEqual({ pawns: 300 });
  });

  it.each(["0", "1001", "2.5", "lots", ""])(
    "explains what is wrong with ?pawns=%s",
    (value) => {
      const result = startingPawnsFromQuery(`?pawns=${value}`);
      expect("error" in result && result.error).toMatch(
        /\?pawns= must be a whole number from 1 to 1000/,
      );
    },
  );
});

describe("autoSkillsFromQuery", () => {
  it("is on with ?autoskills", () => {
    expect(autoSkillsFromQuery("?pawns=5&autoskills")).toBe(true);
  });

  it("is off without it", () => {
    expect(autoSkillsFromQuery("?pawns=5")).toBe(false);
  });
});
