import { describe, expect, it } from "vitest";
import type { Army } from "../../src/catalog/pieces";
import {
  type Offer,
  openShop,
  recruit,
  recruitBlocker,
  recruitPrice,
  reroll,
  rerollBlocker,
  rerollPrice,
  type ShopListings,
  ShopError,
  type ShopState,
  toggleLock,
} from "../../src/shop/shop";

/** Shield common, spear rare, twin epic: lets the real ids test every rarity. */
const MIXED: ShopListings = {
  shield: { rarity: "common", basePrice: 3 },
  spear: { rarity: "rare", basePrice: 5 },
  twin: { rarity: "epic", basePrice: 8 },
};

function shopWith(parts: Partial<ShopState>): ShopState {
  return {
    wave: 2,
    offers: [
      { type: "shield", locked: false },
      { type: "spear", locked: false },
      { type: "twin", locked: false },
    ],
    rerolls: 0,
    recruited: {},
    rng: 1,
    ...parts,
  };
}

const typesOf = (offers: readonly Offer[]): string[] =>
  offers.map((offer) => offer.type);

describe("offers", () => {
  it("shows 3 different pawn types when 3 are unlocked", () => {
    for (let seed = 0; seed < 50; seed++) {
      const shop = openShop({ wave: 2, locked: [], rng: seed });
      expect(shop.offers).toHaveLength(3);
      expect(new Set(typesOf(shop.offers)).size).toBe(3);
      expect(shop.offers.every((offer) => !offer.locked)).toBe(true);
    }
  });

  it("never offers a type before its rarity's wave, and shows fewer offers when fewer types are unlocked", () => {
    const at = (wave: number): string[] =>
      typesOf(openShop({ wave, locked: [], rng: 7, listings: MIXED }).offers);
    expect(at(2)).toEqual(["shield"]);
    expect(at(3).sort()).toEqual(["shield", "spear"]);
    expect(at(6).sort()).toEqual(["shield", "spear", "twin"]);
  });

  it("sells the epic pawn types from wave 6 and not before, with the real catalog", () => {
    const EPIC = ["recruiter", "berserker", "promoter", "enPassant"];
    const seen = (wave: number): Set<string> =>
      new Set(
        Array.from({ length: 60 }, (_, seed) =>
          typesOf(openShop({ wave, locked: [], rng: seed + 1 }).offers),
        ).flat(),
      );
    expect(EPIC.filter((type) => seen(5).has(type))).toEqual([]);
    expect(EPIC.filter((type) => seen(6).has(type)).sort()).toEqual(
      [...EPIC].sort(),
    );
  });

  it("picks types by rarity weight: common 6, rare 3, epic 1.4", () => {
    const listings: ShopListings = {
      shield: { rarity: "common", basePrice: 3 },
      spear: { rarity: "rare", basePrice: 3 },
      twin: { rarity: "epic", basePrice: 3 },
    };
    const firsts = { shield: 0, spear: 0, twin: 0 };
    const runs = 6000;
    for (let seed = 0; seed < runs; seed++) {
      const shop = openShop({
        wave: 6,
        locked: [],
        rng: seed * 7919,
        listings,
      });
      const first = shop.offers[0]?.type;
      if (first === "shield" || first === "spear" || first === "twin") {
        firsts[first] += 1;
      }
    }
    // The first slot is a straight weighted pick: 6 / 10.4, 3 / 10.4, 1.4 / 10.4.
    expect(firsts.shield / runs).toBeCloseTo(6 / 10.4, 1);
    expect(firsts.spear / runs).toBeCloseTo(3 / 10.4, 1);
    expect(firsts.twin / runs).toBeCloseTo(1.4 / 10.4, 1);
  });

  it("keeps offers locked last visit, still locked, and fills the rest without repeating them", () => {
    for (let seed = 0; seed < 30; seed++) {
      const shop = openShop({
        wave: 4,
        locked: [{ type: "twin", locked: true }],
        rng: seed,
      });
      expect(shop.offers[0]).toEqual({ type: "twin", locked: true });
      expect(shop.offers).toHaveLength(3);
      expect(new Set(typesOf(shop.offers)).size).toBe(3);
    }
  });

  it("plays the same offers for the same seed", () => {
    const open = (): ShopState => openShop({ wave: 5, locked: [], rng: 99 });
    expect(open()).toEqual(open());
  });
});

describe("recruit", () => {
  it("prices a recruit at ceil(base / 2 × (1 + 0.25 × (wave − 1)))", () => {
    expect(recruitPrice("shield", 1)).toBe(2);
    expect(recruitPrice("shield", 2)).toBe(2);
    expect(recruitPrice("shield", 5)).toBe(3);
    expect(recruitPrice("shield", 10)).toBe(5);
    expect(recruitPrice("twin", 6, MIXED)).toBe(9);
  });

  it("turns one plain pawn into the type and sacrifices the price", () => {
    const shop = shopWith({ wave: 2 });
    const result = recruit(shop, { plain: 10, spear: 1 }, 0);
    // Price 2 in wave 2: 3 plain pawns leave, one of them as the shield.
    expect(result.army).toEqual({ plain: 7, spear: 1, shield: 1 });
    expect(result.shop.recruited).toEqual({ shield: 1 });
    expect(result.shop.offers).toEqual(shop.offers);
  });

  it("never takes the last plain pawn", () => {
    const shop = shopWith({ wave: 2 });
    expect(recruitBlocker(shop, { plain: 3 }, 0)).toBe("too-few-plain-pawns");
    expect(() => recruit(shop, { plain: 3 }, 0)).toThrow(ShopError);
    expect(recruitBlocker(shop, { plain: 4 }, 0)).toBeUndefined();
    expect(recruit(shop, { plain: 4 }, 0).army.plain).toBe(1);
  });

  it("allows at most 5 of a type per wave", () => {
    let shop = shopWith({ wave: 2 });
    let army: Army = { plain: 100 };
    for (let count = 0; count < 5; count++) {
      ({ shop, army } = recruit(shop, army, 1));
    }
    expect(army.spear).toBe(5);
    expect(shop.recruited.spear).toBe(5);
    expect(recruitBlocker(shop, army, 1)).toBe("max-this-wave");
    expect(() => recruit(shop, army, 1)).toThrow(/at most 5/);
    // Other types are still open.
    expect(recruitBlocker(shop, army, 0)).toBeUndefined();
  });

  it("keeps the cap after a reroll brings the type back, and resets it in the next shop", () => {
    let shop = shopWith({ wave: 2 });
    let army: Army = { plain: 200 };
    for (let count = 0; count < 5; count++) {
      ({ shop, army } = recruit(shop, army, 0));
    }
    // Only 3 common types exist, so a reroll always brings the shield back.
    ({ shop, army } = reroll(shop, army));
    const shieldSlot = shop.offers.findIndex(
      (offer) => offer.type === "shield",
    );
    expect(recruitBlocker(shop, army, shieldSlot)).toBe("max-this-wave");

    const next = openShop({ wave: 3, locked: [], rng: shop.rng });
    expect(next.recruited).toEqual({});
    const nextSlot = next.offers.findIndex((offer) => offer.type === "shield");
    expect(recruitBlocker(next, army, nextSlot)).toBeUndefined();
  });

  it("refuses an offer slot that doesn't exist", () => {
    expect(() => recruit(shopWith({}), { plain: 50 }, 3)).toThrow(ShopError);
  });
});

describe("reroll", () => {
  it("costs 1 + rerolls this visit + floor(wave / 3)", () => {
    expect(rerollPrice(shopWith({ wave: 2, rerolls: 0 }))).toBe(1);
    expect(rerollPrice(shopWith({ wave: 3, rerolls: 0 }))).toBe(2);
    expect(rerollPrice(shopWith({ wave: 7, rerolls: 2 }))).toBe(5);
  });

  it("charges the price, counts the reroll and replaces only unlocked offers", () => {
    const listings: ShopListings = {
      shield: { rarity: "common", basePrice: 3 },
      spear: { rarity: "common", basePrice: 3 },
      twin: { rarity: "common", basePrice: 3 },
    };
    const start = shopWith({
      wave: 3,
      offers: [
        { type: "shield", locked: false },
        { type: "spear", locked: true },
      ],
    });
    const { shop, army } = reroll(start, { plain: 5 }, listings);
    expect(army.plain).toBe(3);
    expect(shop.rerolls).toBe(1);
    expect(shop.rng).not.toBe(start.rng);
    expect(shop.offers[1]).toEqual({ type: "spear", locked: true });
    expect(shop.offers).toHaveLength(3);
    expect(new Set(typesOf(shop.offers)).size).toBe(3);
    expect(rerollPrice(shop)).toBe(3);
  });

  it("never takes the last plain pawn", () => {
    const shop = shopWith({ wave: 3 });
    expect(rerollBlocker(shop, { plain: 2 })).toBe("too-few-plain-pawns");
    expect(() => reroll(shop, { plain: 2 })).toThrow(ShopError);
    expect(rerollBlocker(shop, { plain: 3 })).toBeUndefined();
  });

  it("has nothing to do when every offer is locked", () => {
    const shop = shopWith({
      offers: [
        { type: "shield", locked: true },
        { type: "spear", locked: true },
        { type: "twin", locked: true },
      ],
    });
    expect(rerollBlocker(shop, { plain: 50 })).toBe("all-locked");
  });
});

describe("lock", () => {
  it("toggles one offer's lock", () => {
    const locked = toggleLock(shopWith({}), 1);
    expect(locked.offers.map((offer) => offer.locked)).toEqual([
      false,
      true,
      false,
    ]);
    expect(toggleLock(locked, 1).offers[1]?.locked).toBe(false);
  });
});
