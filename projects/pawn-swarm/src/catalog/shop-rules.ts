import type { Rarity } from "./pieces";

/**
 * Shop numbers, taken from the swarm prototype. No logic lives here.
 * "Wave" always means the wave the shop leads into.
 */
export const SHOP_RULES = {
  /** Offers on show at once, never the same pawn type twice. */
  offerSlots: 3,
  /** Pawns of one type the player can recruit per shop visit, rerolls or not. */
  maxRecruitsPerTypePerWave: 5,
  /** How likely each rarity is to fill an offer slot, relative to the others. */
  rarityWeights: { common: 6, rare: 3, epic: 1.4 } satisfies Record<
    Rarity,
    number
  >,
  /** The first wave each rarity can be offered for. */
  rarityFromWave: { common: 1, rare: 3, epic: 6 } satisfies Record<
    Rarity,
    number
  >,
  /** Price = ceil(base price / 2 × (1 + this × (wave − 1))) plain pawns, on top of the one that turns. */
  priceGrowthPerWave: 0.25,
  /** Reroll price = 1 + rerolls this visit + floor(wave / this). */
  rerollWavesPerExtraPawn: 3,
} as const;
