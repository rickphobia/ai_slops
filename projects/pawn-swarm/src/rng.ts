/**
 * Seeded random numbers for rule code (battle now, shop later). The state is a
 * plain number so it can live inside game state, which keeps `step` pure and
 * replays exact. Rule code must use this, never `Math.random`.
 */
export type RngState = number;

export interface Roll<T> {
  value: T;
  state: RngState;
}

/** mulberry32: small, fast, and good enough for a game. */
function nextFloat(state: RngState): Roll<number> {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: nextState };
}

/** A whole number from 0 up to, but not including, `maxExclusive`. */
export function nextInt(state: RngState, maxExclusive: number): Roll<number> {
  const roll = nextFloat(state);
  return {
    value: Math.floor(roll.value * maxExclusive),
    state: roll.state,
  };
}

export function pickOne<T>(state: RngState, items: readonly T[]): Roll<T> {
  const roll = nextInt(state, items.length);
  const value = items[roll.value];
  if (value === undefined) {
    throw new RangeError("Cannot pick from an empty list.");
  }
  return { value, state: roll.state };
}
