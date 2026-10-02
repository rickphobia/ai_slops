import { describe, expect, it } from "vitest";
import {
  moodFor,
  soundForEvent,
  soundForShopAction,
} from "../../../src/adapters/audio/sounds-for";
import type { BattleEvent } from "../../../src/battle/battle-state";
import { startRun } from "../../../src/run/run";

const at = { x: 1, y: 1 };

describe("soundForEvent", () => {
  it("makes a bigger sound for the heavier black pieces dying", () => {
    const death = (kind: "knight" | "rook" | "king"): BattleEvent => ({
      type: "death",
      id: 1,
      piece: { side: "black", kind },
      at,
    });
    expect(soundForEvent(death("knight"))).toBe("black-death-small");
    expect(soundForEvent(death("rook"))).toBe("black-death-big");
    expect(soundForEvent(death("king"))).toBe("king-death");
    expect(
      soundForEvent({
        type: "death",
        id: 2,
        piece: { side: "white", type: "plain" },
        at,
      }),
    ).toBe("pawn-death");
  });

  it("gives each skill its own sound", () => {
    const sounds = (["plain", "shield", "spear", "twin"] as const).map(
      (pawnType) => soundForEvent({ type: "skill", pawnType, pawns: 3 }),
    );
    expect(new Set(sounds).size).toBe(4);
  });

  it("only lets a black move landing on pawns hit, not touching", () => {
    const hurt = (cause: "hit" | "contact"): BattleEvent => ({
      type: "pawn-hurt",
      pawnId: 1,
      damage: 1,
      cause,
      at,
    });
    expect(soundForEvent(hurt("hit"))).toBe("black-hit");
    expect(soundForEvent(hurt("contact"))).toBeUndefined();
  });
});

describe("shop and music", () => {
  it("clicks differ for buying and rerolling", () => {
    expect(soundForShopAction({ type: "recruit", offer: 0 })).toBe("shop-buy");
    expect(soundForShopAction({ type: "reroll" })).toBe("shop-reroll");
  });

  it("picks the music mood: shop, battle, or king once he is on the board", () => {
    const run = startRun({ seed: 1 });
    expect(moodFor(run)).toBe("battle");
    if (run.phase !== "battle") throw new Error("expected a battle");
    const king = {
      id: 99,
      kind: "king" as const,
      square: { file: 8, rank: 8 },
      hp: 10,
      maxHp: 10,
      actLeft: 1,
      contactLeft: 1,
      summonLeft: 1,
      move: undefined,
    };
    const withKing = {
      ...run,
      battle: {
        ...run.battle,
        blackPieces: [king],
      },
    };
    expect(moodFor(withKing)).toBe("king");
    expect(moodFor({ ...run, phase: "lost" })).toBe("off");
  });
});
