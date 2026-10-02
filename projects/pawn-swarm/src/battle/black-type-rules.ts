import type { MovePattern } from "../board/moves";
import {
  BLACK_TYPE_IDS,
  BLACK_TYPE_RULES,
  BLACK_TYPES,
  type BlackTypeId,
  type BlackTypeStats,
} from "../catalog/black-types";
import { BLACK_PIECES, type BlackKind } from "../catalog/pieces";
import type { Random } from "../rng";

/** The chance of each unlocked type for a piece of its kind in `wave`: 18% the wave it unlocks, +7% per wave after, at most 45%. */
export function blackTypeChance(type: BlackTypeId, wave: number): number {
  const { firstChance, chancePerWave, maxChance } = BLACK_TYPE_RULES;
  const wavesSinceUnlock = wave - BLACK_TYPES[type].fromWave;
  return Math.min(maxChance, firstChance + chancePerWave * wavesSinceUnlock);
}

/**
 * Whether a piece of `kind` landing in `wave` is a special type, and which.
 * Each unlocked type of the kind rolls in catalog order and the first to hit
 * wins. Draws nothing from `random` when no type is unlocked for the kind.
 */
export function rollBlackType(
  kind: BlackKind,
  wave: number,
  random: Random,
): BlackTypeId | undefined {
  for (const type of BLACK_TYPE_IDS) {
    const stats = BLACK_TYPES[type];
    if (stats.piece !== kind || stats.fromWave > wave) continue;
    if (random.next() < blackTypeChance(type, wave)) return type;
  }
  return undefined;
}

/** What a special type changes; undefined for a plain piece. */
export function typeStatsOf(piece: {
  readonly type: BlackTypeId | undefined;
}): BlackTypeStats | undefined {
  return piece.type === undefined ? undefined : BLACK_TYPES[piece.type];
}

/** A piece's HP in a wave, with a tower's tripling. */
export function hpFactorOf(type: BlackTypeId | undefined): number {
  return type === undefined ? 1 : (BLACK_TYPES[type].hpFactor ?? 1);
}

/** Seconds a piece waits between moves. */
export function actEveryOf(piece: {
  readonly kind: BlackKind;
  readonly type: BlackTypeId | undefined;
}): number {
  return (
    BLACK_PIECES[piece.kind].actEvery *
    (typeStatsOf(piece)?.actEveryFactor ?? 1)
  );
}

/** A piece's move, with a sniper's longer reach and a stomper's wider landing. */
export function movePatternOf(piece: {
  readonly kind: BlackKind;
  readonly type: BlackTypeId | undefined;
}): MovePattern {
  const move = BLACK_PIECES[piece.kind].move;
  const type = typeStatsOf(piece);
  return {
    ...move,
    reach: type?.moveReach ?? move.reach,
    hits: type?.hitsCross === true ? "landing-block-and-cross" : move.hits,
  };
}

/** Damage a piece's moves do to every pawn on a hit square. */
export function attackOf(piece: {
  readonly kind: BlackKind;
  readonly type: BlackTypeId | undefined;
}): number {
  return (
    BLACK_PIECES[piece.kind].attack + (typeStatsOf(piece)?.extraAttack ?? 0)
  );
}

/** Plain pawns a kill of this piece drops, before crowding: a special type drops one more. */
export function baseDropOf(piece: {
  readonly kind: BlackKind;
  readonly type: BlackTypeId | undefined;
}): number {
  return (
    BLACK_PIECES[piece.kind].drop +
    (piece.type === undefined ? 0 : BLACK_TYPE_RULES.extraDrop)
  );
}

/** The knights a piece calls on a timer: the king's, or a summoner's. */
export function summonsOf(piece: {
  readonly kind: BlackKind;
  readonly type: BlackTypeId | undefined;
}): { readonly knights: number; readonly everySeconds: number } | undefined {
  return BLACK_PIECES[piece.kind].summons ?? typeStatsOf(piece)?.summons;
}
