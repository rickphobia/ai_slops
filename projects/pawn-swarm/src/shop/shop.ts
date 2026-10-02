import {
  type Army,
  PAWN_TYPES,
  type PawnTypeId,
  type ShopListing,
} from "../catalog/pieces";
import { SHOP_RULES } from "../catalog/shop-rules";
import { createRandom, type Random, type RngState } from "../rng";

/** A shop action the rules don't allow, such as recruiting past the cap. */
export class ShopError extends Error {
  override name = "ShopError";
}

/** One pawn type for sale. A locked offer stays for the next shop visit. */
export interface Offer {
  readonly type: PawnTypeId;
  readonly locked: boolean;
}

/** The shop between two waves. Pure data: every action returns a new one. */
export interface ShopState {
  /** The wave the shop leads into: prices and gates follow it. */
  readonly wave: number;
  readonly offers: readonly Offer[];
  /** Rerolls bought this visit: each one makes the next dearer. */
  readonly rerolls: number;
  /** Pawns recruited this visit, per type, for the per-wave cap. */
  readonly recruited: Army;
  readonly rng: RngState;
}

/** The pawn types for sale. Tests pass their own to try other rarities. */
export type ShopListings = Readonly<Partial<Record<PawnTypeId, ShopListing>>>;

export const SHOP_LISTINGS: ShopListings = Object.fromEntries(
  Object.entries(PAWN_TYPES).flatMap(([type, stats]) =>
    stats.shop === undefined ? [] : [[type, stats.shop]],
  ),
);

/** Why an action can't happen right now; the UI greys the button out. */
export type RecruitBlocker = "max-this-wave" | "too-few-plain-pawns";
export type RerollBlocker = "all-locked" | "too-few-plain-pawns";

export interface ShopSetup {
  readonly wave: number;
  /** Offers locked at the last visit. */
  readonly locked: readonly Offer[];
  readonly rng: RngState;
  readonly listings?: ShopListings;
}

export interface ShopAndArmy {
  readonly shop: ShopState;
  readonly army: Army;
}

/** Opens the shop: last visit's locked offers stay, the other slots get fresh offers. */
export function openShop(setup: ShopSetup): ShopState {
  const random = createRandom(setup.rng);
  const offers = fillOffers(
    setup.locked,
    setup.wave,
    setup.listings ?? SHOP_LISTINGS,
    random,
  );
  return {
    wave: setup.wave,
    offers,
    rerolls: 0,
    recruited: {},
    rng: random.state(),
  };
}

/** Plain pawns sacrificed per recruit, on top of the one that turns into the type. */
export function recruitPrice(
  type: PawnTypeId,
  wave: number,
  listings: ShopListings = SHOP_LISTINGS,
): number {
  const listing = listingOf(type, listings);
  return Math.ceil(
    (listing.basePrice / 2) * (1 + SHOP_RULES.priceGrowthPerWave * (wave - 1)),
  );
}

/** Plain pawns one recruit takes from the army: the one that turns plus the price. */
export function recruitCost(
  type: PawnTypeId,
  wave: number,
  listings: ShopListings = SHOP_LISTINGS,
): number {
  return recruitPrice(type, wave, listings) + 1;
}

export function recruitBlocker(
  shop: ShopState,
  army: Army,
  offerIndex: number,
  listings: ShopListings = SHOP_LISTINGS,
): RecruitBlocker | undefined {
  const offer = offerAt(shop, offerIndex);
  if (
    (shop.recruited[offer.type] ?? 0) >= SHOP_RULES.maxRecruitsPerTypePerWave
  ) {
    return "max-this-wave";
  }
  const used = recruitCost(offer.type, shop.wave, listings);
  if (!keepsAPlainPawn(army, used)) return "too-few-plain-pawns";
  return undefined;
}

/** Turns one plain pawn into the offer's type and sacrifices the price in plain pawns. */
export function recruit(
  shop: ShopState,
  army: Army,
  offerIndex: number,
  listings: ShopListings = SHOP_LISTINGS,
): ShopAndArmy {
  const blocker = recruitBlocker(shop, army, offerIndex, listings);
  const { type } = offerAt(shop, offerIndex);
  if (blocker === "max-this-wave") {
    throw new ShopError(
      `Can recruit at most ${String(SHOP_RULES.maxRecruitsPerTypePerWave)} ${type} pawns per wave.`,
    );
  }
  const used = recruitCost(type, shop.wave, listings);
  if (blocker === "too-few-plain-pawns") {
    throw new ShopError(
      `Recruiting a ${type} pawn uses ${String(used)} plain pawns and must leave one; the army has ${String(army.plain ?? 0)}.`,
    );
  }
  return {
    shop: {
      ...shop,
      recruited: { ...shop.recruited, [type]: (shop.recruited[type] ?? 0) + 1 },
    },
    army: {
      ...army,
      plain: (army.plain ?? 0) - used,
      [type]: (army[type] ?? 0) + 1,
    },
  };
}

export function rerollPrice(shop: ShopState): number {
  return (
    1 +
    shop.rerolls +
    Math.floor(shop.wave / SHOP_RULES.rerollWavesPerExtraPawn)
  );
}

export function rerollBlocker(
  shop: ShopState,
  army: Army,
): RerollBlocker | undefined {
  if (shop.offers.length > 0 && shop.offers.every((offer) => offer.locked)) {
    return "all-locked";
  }
  if (!keepsAPlainPawn(army, rerollPrice(shop))) return "too-few-plain-pawns";
  return undefined;
}

/** Pays the reroll price and replaces every unlocked offer; locked ones keep their slot. */
export function reroll(
  shop: ShopState,
  army: Army,
  listings: ShopListings = SHOP_LISTINGS,
): ShopAndArmy {
  const blocker = rerollBlocker(shop, army);
  const price = rerollPrice(shop);
  if (blocker === "all-locked") {
    throw new ShopError(
      "Every offer is locked: a reroll would change nothing.",
    );
  }
  if (blocker === "too-few-plain-pawns") {
    throw new ShopError(
      `A reroll costs ${String(price)} plain pawns and must leave one; the army has ${String(army.plain ?? 0)}.`,
    );
  }
  const random = createRandom(shop.rng);
  const offers = fillOffers(shop.offers, shop.wave, listings, random);
  return {
    shop: {
      ...shop,
      offers,
      rerolls: shop.rerolls + 1,
      rng: random.state(),
    },
    army: { ...army, plain: (army.plain ?? 0) - price },
  };
}

export function toggleLock(shop: ShopState, offerIndex: number): ShopState {
  const target = offerAt(shop, offerIndex);
  return {
    ...shop,
    offers: shop.offers.map((offer) =>
      offer === target ? { ...offer, locked: !offer.locked } : offer,
    ),
  };
}

/** The offers to carry into the next visit. */
export function lockedOffers(shop: ShopState): readonly Offer[] {
  return shop.offers.filter((offer) => offer.locked);
}

/**
 * Keeps every locked offer in its slot and fills the other slots with types
 * unlocked by `wave`, picked by rarity weight, never one already on show.
 * With fewer types than slots it shows fewer offers.
 */
function fillOffers(
  current: readonly Offer[],
  wave: number,
  listings: ShopListings,
  random: Random,
): Offer[] {
  const unlocked = unlockedTypes(wave, listings);
  const keptTypes = new Set(
    current.filter((offer) => offer.locked).map((offer) => offer.type),
  );
  const offers: Offer[] = [];
  for (let slot = 0; slot < SHOP_RULES.offerSlots; slot++) {
    const existing = current[slot];
    if (existing?.locked === true) {
      offers.push(existing);
      continue;
    }
    const choices = unlocked.filter(
      (type) =>
        !keptTypes.has(type) && !offers.some((offer) => offer.type === type),
    );
    const type = pickWeighted(choices, listings, random);
    if (type !== undefined) offers.push({ type, locked: false });
  }
  return offers;
}

function unlockedTypes(wave: number, listings: ShopListings): PawnTypeId[] {
  return (Object.keys(listings) as PawnTypeId[]).filter(
    (type) =>
      SHOP_RULES.rarityFromWave[listingOf(type, listings).rarity] <= wave,
  );
}

function pickWeighted(
  types: readonly PawnTypeId[],
  listings: ShopListings,
  random: Random,
): PawnTypeId | undefined {
  const weightOf = (type: PawnTypeId): number =>
    SHOP_RULES.rarityWeights[listingOf(type, listings).rarity];
  const total = types.reduce((sum, type) => sum + weightOf(type), 0);
  let roll = random.next() * total;
  for (const type of types) {
    roll -= weightOf(type);
    if (roll < 0) return type;
  }
  // Rounding can leave a hair of the roll over: it belongs to the last type.
  return types.at(-1);
}

export function listingOf(
  type: PawnTypeId,
  listings: ShopListings = SHOP_LISTINGS,
): ShopListing {
  const listing = listings[type];
  if (listing === undefined) {
    throw new ShopError(`The ${type} pawn is not for sale.`);
  }
  return listing;
}

function offerAt(shop: ShopState, offerIndex: number): Offer {
  const offer = shop.offers[offerIndex];
  if (offer === undefined) {
    throw new ShopError(
      `There is no offer ${String(offerIndex)}; the shop has ${String(shop.offers.length)}.`,
    );
  }
  return offer;
}

/** Whether paying `price` plain pawns still leaves at least one. */
function keepsAPlainPawn(army: Army, price: number): boolean {
  return (army.plain ?? 0) - price >= 1;
}
