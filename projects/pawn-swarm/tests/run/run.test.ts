import { describe, expect, it } from "vitest";
import { NO_INPUTS } from "../../src/battle/battle-state";
import { blackPiecesLeft } from "../../src/battle/step";
import type { Wave } from "../../src/catalog/waves";
import {
  actInShop,
  advanceRun,
  armySize,
  RunError,
  type RunState,
  shopView,
  startRun,
} from "../../src/run/run";
import { ShopError } from "../../src/shop/shop";

const knights = (count: number): Wave => ({
  blackPieces: [{ kind: "knight", count }],
});

/** Plays to the end of the run, leaving every shop straight away. */
function playRun(start: RunState, maxSteps = 50_000): RunState {
  let run = start;
  for (let index = 0; index < maxSteps; index++) {
    if (run.phase === "shop") run = actInShop(run, { type: "start-wave" });
    else if (run.phase === "battle") run = advanceRun(run, NO_INPUTS);
    else break;
  }
  return run;
}

/** Plays the current wave until it is cleared, then opens the shop. */
function playToShop(start: RunState): RunState {
  let run = start;
  while (run.phase === "battle") run = advanceRun(run, NO_INPUTS);
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

  it("opens the shop for the next wave once a wave is cleared, with the survivors as the army", () => {
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

    const shop = advanceRun(run, NO_INPUTS);
    if (shop.phase !== "shop") throw new Error("expected the shop");
    expect(shop.wave).toBe(1);
    expect(shop.shop).toMatchObject({ wave: 2, rerolls: 0, recruited: {} });
    expect(shop.shop.offers).toHaveLength(3);
    expect(shop.army).toEqual({ plain: survivors });
    // The shop waits for the player: battle steps do nothing.
    expect(advanceRun(shop, NO_INPUTS)).toBe(shop);
  });

  it("records the wave as it plays and the shop reads it; the next wave starts a fresh record", () => {
    const run = playToShop(
      startRun({ seed: 3, plainPawns: 20, waves: [knights(2), knights(4)] }),
    );
    if (run.phase !== "shop") throw new Error("expected the shop");
    expect(run.waveReport.piecesTaken).toBe(2);
    expect(run.waveReport.pawnsGained).toBeGreaterThan(0);
    expect(run.waveReport.biggestSwarm).toBeGreaterThanOrEqual(20);
    expect(run.waveReport.seconds).toBeGreaterThan(0);
    // pawns alive now = start + gained - lost
    expect(run.army.plain).toBe(
      20 + run.waveReport.pawnsGained - run.waveReport.pawnsLost,
    );
    expect(shopView(run).stats.lastWave).toBe(run.waveReport);

    const next = actInShop(run, { type: "start-wave" });
    expect(next.waveReport).toMatchObject({
      piecesTaken: 0,
      pawnsGained: 0,
      pawnsLost: 0,
      seconds: 0,
    });
  });

  it("starts the next wave from the shop with the army at full HP, recruits included", () => {
    let run = playToShop(
      startRun({ seed: 3, plainPawns: 20, waves: [knights(2), knights(4)] }),
    );
    run = actInShop(run, { type: "recruit", offer: 0 });
    if (run.phase !== "shop") throw new Error("expected the shop");
    const army = run.army;
    const recruitedType = run.shop.offers[0]?.type ?? "plain";

    const next = actInShop(run, { type: "start-wave" });
    expect(next).toMatchObject({ phase: "battle", wave: 2 });
    expect(next.battle).toMatchObject({
      stepNumber: 0,
      outcome: "ongoing",
      wave: 2,
    });
    const pawnsOf = (type: string): number =>
      next.battle.pawns.filter((pawn) => pawn.type === type).length;
    expect(pawnsOf("plain")).toBe(army.plain);
    expect(pawnsOf(recruitedType)).toBe(1);
    for (const pawn of next.battle.pawns) expect(pawn.hp).toBe(pawn.maxHp);
    expect(blackPiecesLeft(next.battle)).toBe(4);
  });

  it("keeps recruited types through a wave and carries locked offers to the next shop", () => {
    let run = playToShop(
      startRun({
        seed: 5,
        plainPawns: 40,
        waves: [knights(2), knights(2), knights(2)],
      }),
    );
    if (run.phase !== "shop") throw new Error("expected the shop");
    const lockedType = run.shop.offers[1]?.type;
    run = actInShop(run, { type: "recruit", offer: 1 });
    run = actInShop(run, { type: "lock", offer: 1 });
    run = playToShop(actInShop(run, { type: "start-wave" }));

    if (run.phase !== "shop") throw new Error("expected the second shop");
    expect(run.shop.wave).toBe(3);
    expect(run.shop.recruited).toEqual({});
    expect(run.shop.offers[0]).toEqual({ type: lockedType, locked: true });
    expect(run.army[lockedType ?? "plain"]).toBeGreaterThanOrEqual(1);
  });

  it("describes the shop with the next wave's pieces, and counts the army", () => {
    const run = playToShop(
      startRun({ seed: 3, plainPawns: 20, waves: [knights(2), knights(4)] }),
    );
    if (run.phase !== "shop") throw new Error("expected the shop");
    const view = shopView(run);
    expect(view.wave).toBe(2);
    expect(view.nextWave).toEqual([
      { kind: "knight", name: "Knight", count: 4 },
    ]);
    expect(view.plainPawns).toBe(run.army.plain);
    expect(armySize({ plain: 4, shield: 2, twin: 1 })).toBe(7);
  });

  it("refuses shop actions outside the shop, and passes on the shop's own refusals", () => {
    const battle = startRun({ seed: 1 });
    expect(() => actInShop(battle, { type: "reroll" })).toThrow(RunError);

    // A pawn that took one knight has at most 2 plain pawns; a shield, spear or twin uses 3 in wave 2.
    const poor = playToShop(
      startRun({ seed: 3, plainPawns: 1, waves: [knights(1), knights(1)] }),
    );
    expect(poor.phase).toBe("shop");
    expect(() => actInShop(poor, { type: "recruit", offer: 0 })).toThrow(
      ShopError,
    );
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

  // Plays 8 full runs of every wave: about 5 s on a 4-core machine, which is over vitest's
  // 5 s default, so it gets its own limit.
  it("plays the catalog's waves from one pawn to a win or a loss", () => {
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 8; seed++) {
      outcomes.add(playRun(startRun({ seed })).phase);
    }
    expect(outcomes).not.toContain("battle");
  }, 30_000);

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
