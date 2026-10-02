import {
  type Army,
  BLACK_PIECES,
  type BlackKind,
  PAWN_TYPES,
  type PawnTypeId,
  type Rarity,
  type SkillText,
} from "../catalog/pieces";
import type { WaveReport } from "../run/wave-report";
import { SHOP_RULES } from "../catalog/shop-rules";
import type { Wave } from "../catalog/waves";
import {
  type RecruitBlocker,
  listingOf,
  recruitBlocker,
  recruitCost,
  type RerollBlocker,
  rerollBlocker,
  rerollPrice,
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

/** One pawn type's row in the stats panel. */
export interface StatsRow {
  readonly type: PawnTypeId;
  readonly name: string;
  readonly count: number;
  readonly hp: number;
  readonly attack: number;
  /** Damage per game second: attack ÷ seconds between strikes. */
  readonly damagePerSecond: number;
}

export interface ArmyStats {
  readonly rows: readonly StatsRow[];
  readonly totals: {
    readonly pawns: number;
    readonly hp: number;
    readonly damagePerSecond: number;
  };
  readonly lastWave: WaveReport;
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
  readonly stats: ArmyStats;
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
  lastWave: WaveReport,
): ShopView {
  return {
    wave: shop.wave,
    plainPawns: army.plain ?? 0,
    army: (Object.keys(PAWN_TYPES) as PawnTypeId[]).flatMap((type) => {
      const count = army[type] ?? 0;
      return count > 0 ? [{ type, name: PAWN_TYPES[type].name, count }] : [];
    }),
    stats: describeArmy(army, lastWave),
    offers: shop.offers.map((offer, index) => {
      const stats = PAWN_TYPES[offer.type];
      return {
        type: offer.type,
        name: stats.name,
        rarity: listingOf(offer.type).rarity,
        hp: stats.hp,
        attack: stats.attack,
        passive: stats.passive,
        skill: {
          name: stats.skill.name,
          cooldown: stats.skill.cooldown,
          text: stats.skill.text,
        },
        plainPawnsUsed: recruitCost(offer.type, shop.wave),
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

function describeArmy(army: Army, lastWave: WaveReport): ArmyStats {
  const rows = (Object.keys(PAWN_TYPES) as PawnTypeId[]).flatMap((type) => {
    const count = army[type] ?? 0;
    if (count === 0) return [];
    const stats = PAWN_TYPES[type];
    return [
      {
        type,
        name: stats.name,
        count,
        hp: stats.hp,
        attack: stats.attack,
        damagePerSecond: stats.attack / stats.strikeCooldown,
      },
    ];
  });
  const sum = (value: (row: StatsRow) => number): number =>
    rows.reduce((total, row) => total + row.count * value(row), 0);
  return {
    rows,
    totals: {
      pawns: sum(() => 1),
      hp: sum((row) => row.hp),
      damagePerSecond: sum((row) => row.damagePerSecond),
    },
    lastWave,
  };
}
