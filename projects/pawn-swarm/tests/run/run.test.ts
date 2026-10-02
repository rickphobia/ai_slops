import { describe, expect, it } from "vitest";
import { NO_INPUTS } from "../../src/battle/battle-state";
import { blackPiecesLeft } from "../../src/battle/step";
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
  it("starts wave 1 with one plain pawn and the first of its 2 knights about to land", () => {
    const run = startRun({ seed: 12345 });
    expect(run).toMatchObject({
      phase: "battle",
      seed: 12345,
      wave: 1,
      peakSwarm: 1,
      piecesTaken: 0,
    });
    expect(run.waves).toHaveLength(10);
    expect(run.battle.pawns).toHaveLength(1);
    expect(run.battle.landings).toHaveLength(1);
    expect(run.battle.pushes).toEqual([["knight"]]);
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
    expect(next.battle.wave).toBe(2);
    expect(blackPiecesLeft(next.battle)).toBe(4);
  });

  it("reaches won when the last wave is cleared", () => {
    const end = playRun(
      startRun({ seed: 1, plainPawns: 30, waves: [knights(2), knights(3)] }),
    );
    expect(end).toMatchObject({ phase: "won", wave: 2 });
    expect(end.battle.blackPieces).toEqual([]);
  });

  it("reaches won the moment the king dies, even with black pieces left", () => {
    const kingWave: Wave = {
      blackPieces: [
        { kind: "knight", count: 6 },
        { kind: "king", count: 1 },
      ],
    };
    const ends = [0, 1, 2, 3].map((seed) =>
      playRun(startRun({ seed, plainPawns: 300, waves: [kingWave] })),
    );
    for (const end of ends) {
      expect(end).toMatchObject({ phase: "won", wave: 1 });
      expect(
        end.battle.events.some(
          (event) =>
            event.type === "death" &&
            event.piece.side === "black" &&
            event.piece.kind === "king",
        ),
      ).toBe(true);
    }
    // In some runs knights were still standing or landing when the king fell.
    expect(ends.some((end) => blackPiecesLeft(end.battle) > 0)).toBe(true);
  });

  it("keeps the biggest swarm and the black pieces taken", () => {
    let run = startRun({ seed: 4, plainPawns: 5, waves: [knights(12)] });
    let peak = run.battle.pawns.length;
    let taken = 0;
    while (run.phase === "battle") {
      run = advanceRun(run, NO_INPUTS);
      peak = Math.max(peak, run.battle.pawns.length);
      taken += run.battle.events.filter(
        (event) => event.type === "death" && event.piece.side === "black",
      ).length;
    }
    expect(run.phase).toBe("won");
    expect(taken).toBe(12);
    expect(run).toMatchObject({ peakSwarm: peak, piecesTaken: 12 });
    expect(peak).toBeGreaterThan(5);
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
