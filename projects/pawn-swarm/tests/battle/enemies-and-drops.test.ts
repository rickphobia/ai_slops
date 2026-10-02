import { describe, expect, it } from "vitest";
import type { BattleState, Piece } from "../../src/battle/battle-state";
import { createBattle } from "../../src/battle/create-battle";
import { step } from "../../src/battle/step";
import type { Square } from "../../src/board/square";
import { ENEMY_TYPES, PAWN_TYPES } from "../../src/catalog/pieces";
import { WAVES } from "../../src/catalog/waves";
import { battleWith, enemy, knight, plainPawn } from "./pieces";

function pieceById(state: BattleState, id: number): Piece | undefined {
  return state.pieces.find((piece) => piece.id === id);
}

const chebyshev = (a: Square, b: Square): number =>
  Math.max(Math.abs(a.file - b.file), Math.abs(a.rank - b.rank));

/** A white pawn that never acts, as a target. */
const target = (id: number, square: Square): Piece =>
  plainPawn(id, square, { cooldownLeft: 99 });

describe("enemies chase the nearest white pawn with their own moves", () => {
  it("a bishop slides diagonally onto a square that attacks the pawn", () => {
    // From (0,7), sliding to (3,4) puts the pawn at (5,2) on its diagonal.
    const start = battleWith([
      target(1, { file: 5, rank: 2 }),
      enemy("bishop", 2, { file: 0, rank: 7 }),
    ]);
    expect(pieceById(step(start), 2)?.square).toEqual({ file: 3, rank: 4 });
  });

  it("a bishop on the other colour from every pawn still closes in", () => {
    const start = battleWith([
      target(1, { file: 4, rank: 0 }),
      enemy("bishop", 2, { file: 0, rank: 7 }),
    ]);
    const after = pieceById(step(start), 2)?.square;
    expect(after).toBeDefined();
    if (after === undefined) return;
    expect(chebyshev(after, { file: 4, rank: 0 })).toBeLessThan(7);
  });

  it("a rook slides straight and captures along an open line", () => {
    const start = battleWith([
      target(1, { file: 2, rank: 1 }),
      enemy("rook", 2, { file: 2, rank: 5 }),
    ]);
    const after = step(start);
    expect(pieceById(after, 1)?.hp).toBe(
      PAWN_TYPES.plain.hp - ENEMY_TYPES.rook.attack,
    );
    expect(pieceById(after, 2)?.square).toEqual({ file: 2, rank: 5 });
  });

  it("a rook cannot capture through a blocker", () => {
    const start = battleWith([
      target(1, { file: 2, rank: 1 }),
      knight(3, { file: 2, rank: 3 }, { cooldownLeft: 99 }),
      enemy("rook", 2, { file: 2, rank: 5 }),
    ]);
    expect(pieceById(step(start), 1)?.hp).toBe(PAWN_TYPES.plain.hp);
  });

  it("a queen captures diagonally", () => {
    const start = battleWith([
      target(1, { file: 1, rank: 1 }),
      enemy("queen", 2, { file: 4, rank: 4 }),
    ]);
    expect(pieceById(step(start), 1)?.hp).toBe(
      PAWN_TYPES.plain.hp - ENEMY_TYPES.queen.attack,
    );
  });

  it("a king steps one square toward the pawn", () => {
    const start = battleWith([
      target(1, { file: 4, rank: 0 }),
      enemy("king", 2, { file: 4, rank: 6 }),
    ]);
    expect(pieceById(step(start), 2)?.square).toEqual({ file: 4, rank: 5 });
  });
});

describe("drops", () => {
  it("puts the enemy's drop on its death square in the same tick", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }, { hp: 1 }),
      knight(3, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    const after = step(start);
    const dropped = pieceById(after, 4);
    expect(dropped).toMatchObject({
      side: "white",
      kind: "pawn",
      square: { file: 4, rank: 4 },
      forward: 1,
      hp: PAWN_TYPES.plain.hp,
      attack: PAWN_TYPES.plain.attack,
    });
    expect(after.events).toContainEqual({
      type: "spawn",
      pieceId: 4,
      square: { file: 4, rank: 4 },
    });
    expect(after.nextPieceId).toBe(5);
  });

  it("drops as many pawns as the catalog says, on the nearest free squares", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      enemy("queen", 2, { file: 4, rank: 4 }, { hp: 1, cooldownLeft: 99 }),
    ]);
    const after = step(start);
    const drops = after.pieces.filter((piece) => piece.id > 2);
    expect(drops).toHaveLength(ENEMY_TYPES.queen.pawnDrop);
    expect(drops.map((piece) => piece.square)).toContainEqual({
      file: 4,
      rank: 4,
    });
    for (const drop of drops) {
      expect(chebyshev(drop.square, { file: 4, rank: 4 })).toBeLessThanOrEqual(
        1,
      );
    }
    const squares = new Set(after.pieces.map((p) => JSON.stringify(p.square)));
    expect(squares.size).toBe(after.pieces.length);
  });

  it("goes further out when the squares around the death square are full", () => {
    // A rook drops 3; its death square is free, every square next to it is taken.
    const ring: Piece[] = [];
    let id = 10;
    for (let file = 3; file <= 5; file++) {
      for (let rank = 3; rank <= 5; rank++) {
        if (file === 4 && rank === 4) continue;
        ring.push(target(id++, { file, rank }));
      }
    }
    const start = battleWith([
      ...ring,
      knight(30, { file: 0, rank: 7 }, { cooldownLeft: 99 }),
      enemy("rook", 2, { file: 4, rank: 4 }, { hp: 1, cooldownLeft: 99 }),
      plainPawn(1, { file: 3, rank: 3 }),
    ]);
    // The pawn at (3,3) captures the rook at (4,4).
    const after = step(battleWith(start.pieces.filter((p) => p.id !== 13)));
    const drops = after.pieces.filter((piece) => piece.id >= 31);
    expect(drops.map((p) => chebyshev(p.square, { file: 4, rank: 4 }))).toEqual(
      expect.arrayContaining([0, 2, 2]),
    );
    expect(drops).toHaveLength(3);
  });

  it("lets a dropped pawn act from the next tick, not the tick it appears", () => {
    // The drop lands at (4,4) facing a knight at (5,5) that it can capture.
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }),
      knight(2, { file: 4, rank: 4 }, { hp: 1 }),
      knight(3, { file: 5, rank: 5 }, { cooldownLeft: 99 }),
    ]);
    const tickOne = step(start);
    expect(pieceById(tickOne, 3)?.hp).toBe(ENEMY_TYPES.knight.hp);
    const tickTwo = step(tickOne);
    expect(pieceById(tickTwo, 3)?.hp).toBe(ENEMY_TYPES.knight.hp - 1);
  });

  it("drops nothing for the king, whose death wins the wave", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 3 }, { attack: 30 }),
      enemy("king", 2, { file: 4, rank: 4 }, { cooldownLeft: 99 }),
      knight(3, { file: 7, rank: 7 }, { cooldownLeft: 99 }),
    ]);
    const after = step(start);
    expect(after.outcome).toBe("won");
    expect(after.pieces.filter((piece) => piece.side === "white")).toHaveLength(
      1,
    );
  });
});

describe("plain pawns on the back rank", () => {
  it("turn around on reaching it and keep moving the other way", () => {
    const start = battleWith([
      plainPawn(1, { file: 0, rank: 6 }),
      knight(2, { file: 7, rank: 0 }, { cooldownLeft: 99 }),
    ]);
    const onBackRank = step(start);
    expect(pieceById(onBackRank, 1)).toMatchObject({
      square: { file: 0, rank: 7 },
      forward: -1,
    });
    const back = step(step(onBackRank));
    expect(pieceById(back, 1)?.square).toEqual({ file: 0, rank: 6 });
  });

  it("capture backwards once turned around", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 7 }, { forward: -1 }),
      knight(2, { file: 4, rank: 6 }, { cooldownLeft: 99 }),
    ]);
    expect(pieceById(step(start), 2)?.hp).toBe(ENEMY_TYPES.knight.hp - 1);
  });

  it("face down when dropped on the back rank", () => {
    const start = battleWith([
      plainPawn(1, { file: 3, rank: 6 }),
      knight(2, { file: 4, rank: 7 }, { hp: 1 }),
      knight(3, { file: 0, rank: 0 }, { cooldownLeft: 99 }),
    ]);
    expect(pieceById(step(start), 4)).toMatchObject({
      square: { file: 4, rank: 7 },
      forward: -1,
    });
  });
});

describe("createBattle with the full roster", () => {
  it("puts every enemy of wave 10 in black's top 3 ranks with catalog stats", () => {
    const wave = WAVES[9];
    if (wave === undefined) throw new Error("expected 10 waves");
    const battle = createBattle({
      boardSize: 16,
      plainPawns: 5,
      wave,
      seed: 3,
    });
    const enemies = battle.pieces.filter((piece) => piece.side === "black");
    const expected = wave.enemies.reduce((sum, group) => sum + group.count, 0);
    expect(enemies).toHaveLength(expected);
    for (const piece of enemies) {
      expect(piece.square.rank).toBeGreaterThanOrEqual(13);
      if (piece.kind === "pawn") throw new Error("black has no pawns");
      expect(piece.hp).toBe(ENEMY_TYPES[piece.kind].hp);
    }
    expect(battle.nextPieceId).toBe(battle.pieces.length + 1);
  });

  it("fills further ranks up when the army outgrows white's 3 ranks", () => {
    const battle = createBattle({
      boardSize: 16,
      plainPawns: 60,
      wave: { enemies: [{ kind: "knight", count: 1 }] },
      seed: 3,
    });
    const ranks = battle.pieces
      .filter((piece) => piece.side === "white")
      .map((piece) => piece.square.rank);
    expect(ranks).toHaveLength(60);
    expect(Math.max(...ranks)).toBe(3);
  });
});
