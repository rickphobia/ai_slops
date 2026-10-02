import {
  BLACK_TYPE_IDS,
  BLACK_TYPES,
  type BlackTypeId,
} from "../catalog/black-types";
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

/** A special black type as the shop describes it. */
export interface BlackTypeView {
  readonly type: BlackTypeId;
  readonly name: string;
  /** The piece it is a version of, e.g. "Knight". */
  readonly pieceName: string;
  readonly colour: string;
  readonly power: string;
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
  /** Black types that can turn up for the first time in the next wave. */
  readonly newBlackTypes: readonly BlackTypeView[];
  /**
   * Black types that could already turn up in an earlier wave. Whether one
   * actually did is chance, so this is "could have met", not "did meet".
   */
  readonly metBlackTypes: readonly BlackTypeView[];
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
    newBlackTypes: blackTypesWhere((fromWave) => fromWave === shop.wave),
    metBlackTypes: blackTypesWhere((fromWave) => fromWave < shop.wave),
  };
}

function blackTypesWhere(
  matches: (fromWave: number) => boolean,
): BlackTypeView[] {
  return BLACK_TYPE_IDS.filter((type) =>
    matches(BLACK_TYPES[type].fromWave),
  ).map((type) => {
    const stats = BLACK_TYPES[type];
    return {
      type,
      name: stats.name,
      pieceName: BLACK_PIECES[stats.piece].name,
      colour: stats.colour,
      power: stats.power,
    };
  });
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
