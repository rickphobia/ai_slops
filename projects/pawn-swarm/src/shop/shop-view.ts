import {
  type Army,
  BLACK_PIECES,
  type BlackKind,
  PAWN_TYPES,
  type PawnTypeId,
  type Rarity,
  type SkillText,
} from "../catalog/pieces";
import { SHOP_RULES } from "../catalog/shop-rules";
import type { Wave } from "../catalog/waves";
import {
  type RecruitBlocker,
  recruitBlocker,
  recruitPrice,
  type RerollBlocker,
  rerollBlocker,
  rerollPrice,
  SHOP_LISTINGS,
  ShopError,
  type ShopState,
} from "./shop";

export interface OfferView {
  readonly type: PawnTypeId;
  readonly name: string;
  readonly rarity: Rarity;
  readonly hp: number;
  readonly attack: number;
  readonly passive: string;
  readonly skill: SkillText;
  /** Plain pawns one recruit takes from the army: the one that turns plus the price. */
  readonly plainPawnsUsed: number;
  readonly recruited: number;
  readonly maxRecruits: number;
  readonly locked: boolean;
  /** Why "Recruit 1" is off, if it is. */
  readonly blocker: RecruitBlocker | undefined;
}

export interface ShopView {
  /** The wave the shop leads into. */
  readonly wave: number;
  readonly plainPawns: number;
  /** Every pawn type the army has, in catalog order. */
  readonly army: readonly {
    readonly type: PawnTypeId;
    readonly name: string;
    readonly count: number;
  }[];
  readonly offers: readonly OfferView[];
  readonly reroll: {
    readonly price: number;
    readonly blocker: RerollBlocker | undefined;
  };
  readonly nextWave: readonly {
    readonly kind: BlackKind;
    readonly name: string;
    readonly count: number;
  }[];
}

/** Everything the shop screen shows, worked out by the rules so the screen only lays it out. */
export function describeShop(
  shop: ShopState,
  army: Army,
  nextWave: Wave,
): ShopView {
  return {
    wave: shop.wave,
    plainPawns: army.plain ?? 0,
    army: (Object.keys(PAWN_TYPES) as PawnTypeId[]).flatMap((type) => {
      const count = army[type] ?? 0;
      return count > 0 ? [{ type, name: PAWN_TYPES[type].name, count }] : [];
    }),
    offers: shop.offers.map((offer, index) => {
      const stats = PAWN_TYPES[offer.type];
      const listing = SHOP_LISTINGS[offer.type];
      if (listing === undefined) {
        throw new ShopError(
          `The ${offer.type} pawn is on offer but not for sale.`,
        );
      }
      return {
        type: offer.type,
        name: stats.name,
        rarity: listing.rarity,
        hp: stats.hp,
        attack: stats.attack,
        passive: stats.passive,
        skill: stats.skill,
        plainPawnsUsed: recruitPrice(offer.type, shop.wave) + 1,
        recruited: shop.recruited[offer.type] ?? 0,
        maxRecruits: SHOP_RULES.maxRecruitsPerTypePerWave,
        locked: offer.locked,
        blocker: recruitBlocker(shop, army, index),
      };
    }),
    reroll: { price: rerollPrice(shop), blocker: rerollBlocker(shop, army) },
    nextWave: nextWave.blackPieces.map(({ kind, count }) => ({
      kind,
      name: BLACK_PIECES[kind].name,
      count,
    })),
  };
}
