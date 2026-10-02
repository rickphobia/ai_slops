import { describe, expect, it } from "vitest";
import { type BattleState, NO_INPUTS } from "../../src/battle/battle-state";
import { createBattle } from "../../src/battle/create-battle";
import { step } from "../../src/battle/step";
import type { Wave } from "../../src/catalog/waves";
import {
  after,
  battleWith,
  knightOn,
  landingOn,
  pawnAt,
  playToEnd,
} from "./pieces";

const EIGHT_KNIGHTS: Wave = { blackPieces: [{ kind: "knight", count: 8 }] };

/** Every state of a battle, start to finish. */
function history(start: BattleState): BattleState[] {
  const states = [start];
  let state = start;
  while (state.outcome === "ongoing" && state.stepNumber < 20_000) {
    state = step(state, NO_INPUTS);
    states.push(state);
  }
  return states;
}

describe("step", () => {
  it("does not change the state it is given", () => {
    const start = createBattle({
      plainPawns: 30,
      wave: EIGHT_KNIGHTS,
      seed: 4,
    });
    const midBattle = after(start, 200);
    const snapshot = structuredClone(midBattle);
    step(midBattle, NO_INPUTS);
    expect(midBattle).toEqual(snapshot);
  });

  it("plays out exactly the same battle for the same seed", () => {
    const setup = { plainPawns: 12, wave: EIGHT_KNIGHTS };
    const first = history(createBattle({ ...setup, seed: 777 }));
    const second = history(createBattle({ ...setup, seed: 777 }));
    expect(first.at(-1)?.outcome).not.toBe("ongoing");
    expect(second).toEqual(first);
  });

  it("plays out differently for different seeds", () => {
    const endings = new Set<string>();
    for (let seed = 0; seed < 5; seed++) {
      const end = playToEnd(
        createBattle({ plainPawns: 12, wave: EIGHT_KNIGHTS, seed }),
      );
      endings.add(JSON.stringify(end));
    }
    expect(endings.size).toBe(5);
  });

  it("counts steps", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 3, 3)],
      blackPieces: [knightOn(2, { file: 15, rank: 10 })],
    });
    expect(after(start, 3).stepNumber).toBe(3);
  });

  it("is won once every black piece is dead and none is still to land", () => {
    const lastKnight = knightOn(2, { file: 5, rank: 5 });
    const pawn = pawnAt(1, 5.5, 4.7);
    expect(
      after(battleWith({ pawns: [pawn], blackPieces: [lastKnight] }), 1)
        .outcome,
    ).toBe("won");
    expect(
      after(
        battleWith({
          pawns: [pawn],
          blackPieces: [lastKnight],
          landings: [landingOn({ file: 18, rank: 1 })],
        }),
        1,
      ).outcome,
    ).toBe("ongoing");
  });

  it("is lost once the last white pawn dies", () => {
    const start = battleWith({
      pawns: [pawnAt(1, 5.5, 5.5, { hp: 1, strikeCooldownLeft: 99 })],
      blackPieces: [knightOn(2, { file: 5, rank: 5 }, { contactLeft: 0 })],
    });
    expect(after(start, 1).outcome).toBe("lost");
  });

  it("returns a finished battle unchanged", () => {
    const finished: BattleState = {
      ...battleWith({ pawns: [] }),
      outcome: "won",
    };
    expect(step(finished, NO_INPUTS)).toBe(finished);
  });
});
