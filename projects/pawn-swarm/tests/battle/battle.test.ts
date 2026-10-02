import { describe, expect, it } from "vitest";
import type { BattleState, Piece } from "../../src/battle/battle-state";
import { BattleSetupError, createBattle } from "../../src/battle/create-battle";
import { step } from "../../src/battle/step";
import type { Square } from "../../src/board/square";
import { ENEMY_TYPES, PAWN_TYPES } from "../../src/catalog/pieces";
import type { Wave } from "../../src/catalog/waves";
import { battleWith, knight, plainPawn } from "./pieces";

const ONE_KNIGHT: Wave = { enemies: [{ kind: "knight", count: 1 }] };

function pieceById(state: BattleState, id: number): Piece | undefined {
  return state.pieces.find((piece) => piece.id === id);
}

function playToEnd(start: BattleState, maxTicks = 2000): BattleState[] {
  const states = [start];
  let state = start;
  while (state.outcome === "ongoing" && state.tick < maxTicks) {
    state = step(state);
    states.push(state);
  }
  return states;
}

describe("createBattle", () => {
  const battle = createBattle({
    boardSize: 16,
    plainPawns: 1,
    wave: ONE_KNIGHT,
    seed: 12345,
  });

  it("puts the plain pawn on white's bottom rank with catalog stats", () => {
    const pawns = battle.pieces.filter((piece) => piece.side === "white");
    expect(pawns).toHaveLength(1);
    expect(pawns[0]).toMatchObject({
      kind: "pawn",
      square: { rank: 0 },
      hp: PAWN_TYPES.plain.hp,
      attack: PAWN_TYPES.plain.attack,
      cooldownTicks: PAWN_TYPES.plain.cooldownTicks,
    });
  });

  it("puts the wave's knight in black's top 3 ranks with catalog stats", () => {
    const enemies = battle.pieces.filter((piece) => piece.side === "black");
    expect(enemies).toHaveLength(1);
    expect(enemies[0]).toMatchObject({
      kind: "knight",
      hp: ENEMY_TYPES.knight.hp,
      attack: ENEMY_TYPES.knight.attack,
    });
    expect(enemies[0]?.square.rank).toBeGreaterThanOrEqual(13);
  });

  it("starts ongoing at tick 0", () => {
    expect(battle).toMatchObject({ tick: 0, outcome: "ongoing", events: [] });
  });

  it("fails clearly when the army does not fit white's 3 ranks", () => {
    expect(() =>
      createBattle({ boardSize: 4, plainPawns: 13, wave: ONE_KNIGHT, seed: 1 }),
    ).toThrow(BattleSetupError);
  });
});

describe("step", () => {
  it("does not change the state it is given", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }),
    ]);
    const snapshot = structuredClone(start);
    step(start);
    expect(start).toEqual(snapshot);
  });

  it("moves a pawn one square forward only when its cooldown runs out", () => {
    const start = battleWith([
      plainPawn(1, { file: 0, rank: 0 }, { cooldownLeft: 2 }),
      knight(2, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    const afterOne = step(start);
    expect(pieceById(afterOne, 1)?.square).toEqual({ file: 0, rank: 0 });
    const afterTwo = step(afterOne);
    expect(pieceById(afterTwo, 1)?.square).toEqual({ file: 0, rank: 1 });
    expect(pieceById(afterTwo, 1)?.cooldownLeft).toBe(
      PAWN_TYPES.plain.cooldownTicks,
    );
  });

  it("lets a blocked pawn wait and move on the first tick the square is free", () => {
    const start = battleWith([
      plainPawn(1, { file: 0, rank: 0 }),
      plainPawn(2, { file: 0, rank: 1 }, { cooldownLeft: 2 }),
      knight(3, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    const afterOne = step(start);
    expect(pieceById(afterOne, 1)?.square).toEqual({ file: 0, rank: 0 });
    expect(pieceById(afterOne, 1)?.cooldownLeft).toBe(0);
    const afterTwo = step(afterOne);
    expect(pieceById(afterTwo, 2)?.square).toEqual({ file: 0, rank: 2 });
    const afterThree = step(afterTwo);
    expect(pieceById(afterThree, 1)?.square).toEqual({ file: 0, rank: 1 });
  });

  it("deals the attacker's attack as damage on a capture; the attacker stays put", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }, { attack: 1 }),
      knight(2, { file: 4, rank: 4 }, { cooldownLeft: 99 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 2)?.hp).toBe(ENEMY_TYPES.knight.hp - 1);
    expect(pieceById(after, 1)?.square).toEqual({ file: 3, rank: 3 });
    expect(after.events).toContainEqual({
      type: "hit",
      attackerId: 1,
      targetId: 2,
      damage: 1,
    });
  });

  it("removes a piece when its HP hits 0", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }, { hp: 1, cooldownLeft: 99 }),
      knight(3, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 2)).toBeUndefined();
    expect(after.events).toContainEqual({
      type: "death",
      pieceId: 2,
      square: { file: 4, rank: 4 },
    });
    expect(after.outcome).toBe("ongoing");
  });

  it("does not let a piece killed earlier in the tick act", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }, { hp: 1 }),
      plainPawn(3, { file: 5, rank: 2 }, { cooldownLeft: 99 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 3)?.hp).toBe(PAWN_TYPES.plain.hp);
  });

  it("makes a knight capture a pawn it can reach", () => {
    const start = battleWith([
      plainPawn(1, { file: 2, rank: 1 }, { cooldownLeft: 99 }),
      knight(2, { file: 3, rank: 3 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 1)?.hp).toBe(PAWN_TYPES.plain.hp - 1);
    expect(pieceById(after, 2)?.square).toEqual({ file: 3, rank: 3 });
  });

  it("moves a knight to the square fewest jumps from the nearest white pawn", () => {
    // From (5,4), only (6,2) is one jump from a pawn: it attacks the pawn at (7,0).
    // The pawn at (0,7) is further away in jumps.
    const start = battleWith([
      plainPawn(1, { file: 7, rank: 0 }, { cooldownLeft: 99 }),
      plainPawn(2, { file: 0, rank: 7 }, { cooldownLeft: 99 }),
      knight(3, { file: 5, rank: 4 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 3)?.square).toEqual({ file: 6, rank: 2 });
  });

  it("breaks ties between equally good knight moves with the seeded RNG", () => {
    // Knight at (4,4), pawn at (4,0): (3,2) and (5,2) both capture next jump.
    const start = (seed: number): BattleState =>
      battleWith(
        [
          plainPawn(1, { file: 4, rank: 0 }, { cooldownLeft: 99 }),
          knight(2, { file: 4, rank: 4 }),
        ],
        { rng: seed },
      );
    const pickFor = (seed: number): Square | undefined =>
      pieceById(step(start(seed)), 2)?.square;

    const picks = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const square = pickFor(seed);
      expect([
        { file: 3, rank: 2 },
        { file: 5, rank: 2 },
      ]).toContainEqual(square);
      picks.add(JSON.stringify(square));
      expect(pickFor(seed)).toEqual(square);
    }
    expect(picks.size).toBe(2);
  });

  it("wins the wave when the last black piece dies", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }, { hp: 1 }),
    ]);
    const after = step(start);
    expect(after.outcome).toBe("won");
  });

  it("loses when the last white pawn dies", () => {
    const start = battleWith([
      plainPawn(1, { file: 2, rank: 1 }, { hp: 1, cooldownLeft: 99 }),
      knight(2, { file: 3, rank: 3 }),
    ]);
    const after = step(start);
    expect(after.outcome).toBe("lost");
  });

  it("returns a finished battle unchanged", () => {
    const finished = battleWith([plainPawn(1, { file: 0, rank: 0 })], {
      outcome: "won",
    });
    expect(step(finished)).toBe(finished);
  });

  it("counts ticks", () => {
    const start = battleWith([
      plainPawn(1, { file: 0, rank: 0 }),
      knight(2, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    expect(step(step(start)).tick).toBe(2);
  });
});

describe("a whole battle", () => {
  const setup = { boardSize: 16, plainPawns: 1, wave: ONE_KNIGHT };

  it("ends in a win or a loss", () => {
    const states = playToEnd(createBattle({ ...setup, seed: 12345 }));
    expect(states.at(-1)?.outcome).not.toBe("ongoing");
  });

  it("plays out the same way every time for the same seed", () => {
    const first = playToEnd(createBattle({ ...setup, seed: 777 }));
    const second = playToEnd(createBattle({ ...setup, seed: 777 }));
    expect(second).toEqual(first);
  });

  it("can play out differently for a different seed", () => {
    const histories = new Set<string>();
    for (let seed = 0; seed < 10; seed++) {
      histories.add(
        JSON.stringify(playToEnd(createBattle({ ...setup, seed }))),
      );
    }
    expect(histories.size).toBeGreaterThan(1);
  });
});
