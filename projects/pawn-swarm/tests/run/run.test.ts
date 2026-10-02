import { describe, expect, it } from "vitest";
import type { Wave } from "../../src/catalog/waves";
import {
  advanceRun,
  RunError,
  type RunState,
  startRun,
} from "../../src/run/run";

function playRun(start: RunState, maxTicks = 5000): RunState {
  let run = start;
  for (let tick = 0; tick < maxTicks && run.phase === "battle"; tick++) {
    run = advanceRun(run);
  }
  return run;
}

describe("run", () => {
  it("starts in wave 1 with one plain pawn against the wave's enemies", () => {
    const run = startRun({ seed: 12345, boardSize: 16 });
    expect(run).toMatchObject({ phase: "battle", seed: 12345, wave: 1 });
    if (run.phase !== "battle") throw new Error("expected a battle");
    expect(
      run.battle.pieces.filter((piece) => piece.side === "white"),
    ).toHaveLength(1);
    expect(
      run.battle.pieces.filter((piece) => piece.side === "black"),
    ).toHaveLength(1);
  });

  it("reaches won when the last wave is cleared", () => {
    // Wave 1 is the only wave so far. Who wins depends on the seed, so play
    // seeds until the pawn wins one.
    let won: RunState | undefined;
    for (let seed = 0; seed < 50 && won === undefined; seed++) {
      const end = playRun(startRun({ seed, boardSize: 16 }));
      if (end.phase === "won") won = end;
    }
    expect(won).toMatchObject({ phase: "won", wave: 1 });
  });

  it("reaches lost, at the wave reached, when every white pawn dies", () => {
    const fiveKnights: Wave = { enemies: [{ kind: "knight", count: 5 }] };
    const end = playRun(
      startRun({ seed: 1, boardSize: 16, waves: [fiveKnights] }),
    );
    expect(end).toMatchObject({ phase: "lost", seed: 1, wave: 1 });
    expect(end.battle.pieces.some((piece) => piece.side === "white")).toBe(
      false,
    );
  });

  it("stays put once the run is over", () => {
    const end = playRun(startRun({ seed: 1, boardSize: 16 }));
    expect(end.phase).not.toBe("battle");
    expect(advanceRun(end)).toBe(end);
  });

  it("refuses to start without any waves", () => {
    const start = (): RunState =>
      startRun({ seed: 1, boardSize: 16, waves: [] });
    expect(start).toThrow(RunError);
    expect(start).toThrow(/no waves/);
  });
});
