import type { BattleState, Piece } from "../../src/battle/battle-state";
import type { Square } from "../../src/board/square";
import { ENEMY_TYPES, PAWN_TYPES } from "../../src/catalog/pieces";

/** Test setups: exact pieces on exact squares, with catalog stats. */

export function plainPawn(
  id: number,
  square: Square,
  overrides: Partial<Piece> = {},
): Piece {
  const stats = PAWN_TYPES.plain;
  return {
    id,
    side: "white",
    kind: "pawn",
    square,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    cooldownTicks: stats.cooldownTicks,
    cooldownLeft: 1,
    ...overrides,
  };
}

export function knight(
  id: number,
  square: Square,
  overrides: Partial<Piece> = {},
): Piece {
  const stats = ENEMY_TYPES.knight;
  return {
    id,
    side: "black",
    kind: "knight",
    square,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    cooldownTicks: stats.cooldownTicks,
    cooldownLeft: 1,
    ...overrides,
  };
}

export function battleWith(
  pieces: readonly Piece[],
  overrides: Partial<BattleState> = {},
): BattleState {
  return {
    tick: 0,
    boardSize: 8,
    pieces,
    rng: 1,
    outcome: "ongoing",
    events: [],
    ...overrides,
  };
}
