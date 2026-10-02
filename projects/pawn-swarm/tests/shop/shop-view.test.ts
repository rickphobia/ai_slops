import { describe, expect, it } from "vitest";
import { describeShop } from "../../src/shop/shop-view";
import type { ShopState } from "../../src/shop/shop";

const shop: ShopState = {
  wave: 5,
  offers: [
    { type: "shield", locked: true },
    { type: "spear", locked: false },
  ],
  rerolls: 1,
  recruited: { spear: 5 },
  rng: 1,
};

describe("describeShop", () => {
  const view = describeShop(
    shop,
    { plain: 9, twin: 2, spear: 5 },
    {
      blackPieces: [
        { kind: "knight", count: 20 },
        { kind: "rook", count: 2 },
      ],
    },
    {
      piecesTaken: 7,
      pawnsGained: 12,
      pawnsLost: 4,
      biggestSwarm: 30,
      seconds: 41.5,
    },
  );

  it("shows a stats row per owned type, army totals and the last wave", () => {
    expect(view.stats.rows.map((row) => row.type)).toEqual([
      "plain",
      "spear",
      "twin",
    ]);
    expect(view.stats.rows[1]).toEqual({
      type: "spear",
      name: "Spear pawn",
      count: 5,
      hp: 3,
      attack: 2,
      damagePerSecond: 2.5,
    });
    // 9 plain + 5 spear + 2 twin; 3 HP each.
    expect(view.stats.totals.pawns).toBe(16);
    expect(view.stats.totals.hp).toBe(48);
    expect(view.stats.totals.damagePerSecond).toBeCloseTo(
      9 * (1 / 0.7) + 5 * 2.5 + 2 * (1 / 0.7),
    );
    expect(view.stats.lastWave).toMatchObject({ pawnsLost: 4, seconds: 41.5 });
  });

  it("shows each offer's stats, passive, skill, price and recruits this wave", () => {
    expect(view.offers[0]).toEqual({
      type: "shield",
      name: "Shield pawn",
      rarity: "common",
      hp: 10,
      attack: 1,
      passive: "Black pieces nearby attack shields first.",
      skill: {
        name: "Hold the line",
        cooldown: 20,
        text: "Shields take no damage for 4s and pull black pieces from further away.",
      },
      // Price ceil(1.5 × 2) = 3, plus the pawn that turns.
      plainPawnsUsed: 4,
      recruited: 0,
      maxRecruits: 5,
      locked: true,
      blocker: undefined,
    });
    expect(view.offers[1]).toMatchObject({
      type: "spear",
      recruited: 5,
      locked: false,
      blocker: "max-this-wave",
    });
  });

  it("shows the army in catalog order, the reroll price and the next wave's pieces", () => {
    expect(view.wave).toBe(5);
    expect(view.plainPawns).toBe(9);
    expect(view.army).toEqual([
      { type: "plain", name: "Plain pawn", count: 9 },
      { type: "spear", name: "Spear pawn", count: 5 },
      { type: "twin", name: "Twin pawn", count: 2 },
    ]);
    // 1 + 1 reroll + floor(5 / 3).
    expect(view.reroll).toEqual({ price: 3, blocker: undefined });
    expect(view.nextWave).toEqual([
      { kind: "knight", name: "Knight", count: 20 },
      { kind: "rook", name: "Rook", count: 2 },
    ]);
  });
});
