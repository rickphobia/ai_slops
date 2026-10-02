import { describe, expect, it } from "vitest";
import { NO_INPUTS } from "../../src/battle/battle-state";
import type { Wave } from "../../src/catalog/waves";
import {
  advanceRun,
  RunError,
  type RunState,
  startRun,
} from "../../src/run/run";

const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});

function playRun(start: RunState, maxSteps = 50_000): RunState {
  let run = start;
  for (let index = 0; index < maxSteps && run.phase === "battle"; index++) {
    run = advanceRun(run, NO_INPUTS);
  }
  return run;
}

describe("run", () => {
  it("starts wave 1 with one plain pawn and the wave's 3 knights about to land", () => {
    const run = startRun({ seed: 12345 });
    expect(run).toMatchObject({ phase: "battle", seed: 12345, wave: 1 });
    expect(run.battle.pawns).toHaveLength(1);
    expect(run.battle.landings).toHaveLength(3);
  });

  it("starts the next wave with the survivors at full HP once a wave is cleared", () => {
    let run = startRun({
      seed: 3,
      plainPawns: 20,
      waves: [knights(2), knights(4)],
    });
    while (run.phase === "battle" && run.battle.outcome !== "won") {
      run = advanceRun(run, NO_INPUTS);
    }
    expect(run).toMatchObject({ phase: "battle", wave: 1 });
    const survivors = run.battle.pawns.length;

    const next = advanceRun(run, NO_INPUTS);
    expect(next).toMatchObject({ phase: "battle", wave: 2 });
    expect(next.battle).toMatchObject({ stepNumber: 0, outcome: "ongoing" });
    expect(next.battle.pawns).toHaveLength(survivors);
    for (const pawn of next.battle.pawns) expect(pawn.hp).toBe(pawn.maxHp);
    expect(next.battle.landings).toHaveLength(4);
  });

  it("reaches won when the last wave is cleared", () => {
    const end = playRun(startRun({ seed: 1, plainPawns: 30 }));
    expect(end).toMatchObject({ phase: "won", wave: 2 });
    expect(end.battle.blackPieces).toEqual([]);
  });

  it("reaches lost, at the wave reached, when every white pawn dies", () => {
    // 200 knights land on most of the board: one pawn can't snowball out of that.
    const end = playRun(startRun({ seed: 1, waves: [knights(200)] }));
    expect(end).toMatchObject({ phase: "lost", seed: 1, wave: 1 });
    expect(end.battle.pawns).toEqual([]);
  });

  it("plays the catalog's waves from one pawn to a win or a loss", () => {
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 8; seed++) {
      outcomes.add(playRun(startRun({ seed })).phase);
    }
    expect(outcomes).not.toContain("battle");
  });

  it("stays put once the run is over", () => {
    const end = playRun(startRun({ seed: 1, waves: [knights(200)] }));
    expect(end.phase).toBe("lost");
    expect(advanceRun(end, NO_INPUTS)).toBe(end);
  });

  it("refuses to start without any waves", () => {
    const start = (): RunState => startRun({ seed: 1, waves: [] });
    expect(start).toThrow(RunError);
    expect(start).toThrow(/no waves/);
  });
});
