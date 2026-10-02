import { describe, expect, it } from "vitest";
import {
  createEffects,
  EFFECT_COLOURS,
  type Effect,
} from "../../../src/adapters/canvas-renderer/effects";
import type { BattleEvent } from "../../../src/battle/battle-state";

const at = { x: 4.5, y: 6.5 };
const tintOf = (piece: { side: "white" | "black" }): string =>
  piece.side === "white" ? "white-tint" : "black-tint";

function effectsFor(events: readonly BattleEvent[]): readonly Effect[] {
  const effects = createEffects(tintOf, () => 0.5);
  effects.add(events);
  return effects.list();
}

const kinds = (effects: readonly Effect[]): string[] =>
  effects.map((effect) => effect.kind);

describe("effects from battle events", () => {
  it("shows a slash and a damage number for a strike", () => {
    const effects = effectsFor([
      {
        type: "strike",
        pawnId: 1,
        pawnType: "plain",
        targetId: 2,
        damage: 3,
        from: { x: 4.5, y: 5.5 },
        at,
      },
    ]);
    expect(kinds(effects)).toEqual(["slash", "text"]);
    expect(effects[0]).toMatchObject({ colour: "white-tint", to: at });
    expect(effects[1]).toMatchObject({
      text: "3",
      colour: EFFECT_COLOURS.damage,
    });
  });

  it("shows a red number when a pawn is hurt", () => {
    const [effect] = effectsFor([
      { type: "pawn-hurt", pawnId: 1, damage: 1, cause: "stomp", at },
    ]);
    expect(effect).toMatchObject({
      kind: "text",
      text: "-1",
      colour: EFFECT_COLOURS.hurt,
    });
  });

  it("bursts sparks in the dead piece's colour, more for a black piece", () => {
    const black = effectsFor([
      { type: "death", id: 2, piece: { side: "black", kind: "knight" }, at },
    ]);
    const white = effectsFor([
      { type: "death", id: 1, piece: { side: "white", type: "plain" }, at },
    ]);
    expect(kinds(black)).toEqual(Array<string>(14).fill("spark"));
    expect(black[0]).toMatchObject({ colour: "black-tint", at });
    expect(white).toHaveLength(8);
    expect(white[0]).toMatchObject({ colour: "white-tint" });
  });

  it("pops up '+n ♟' where a drop lands", () => {
    const [effect] = effectsFor([{ type: "drop", count: 2, at }]);
    expect(effect).toMatchObject({
      kind: "text",
      text: "+2 ♟",
      colour: EFFECT_COLOURS.drop,
    });
  });

  it("marks landings with a burst and knight stomps with a ring", () => {
    expect(
      kinds(effectsFor([{ type: "landed", id: 3, kind: "knight", at }])),
    ).toEqual(Array<string>(8).fill("spark"));
    expect(effectsFor([{ type: "stomp", id: 3, at }])).toEqual([
      expect.objectContaining({ kind: "ring", at }),
    ]);
  });
});

describe("effect lifetimes", () => {
  it("age with game time and disappear when their life is over", () => {
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([{ type: "drop", count: 1, at }]); // lives 1.1s
    effects.advance(1);
    expect(effects.list()).toEqual([expect.objectContaining({ age: 1 })]);
    effects.advance(0.2);
    expect(effects.list()).toEqual([]);
  });

  it("caps the number of texts on screen", () => {
    const effects = createEffects(tintOf, () => 0.5);
    const hurts = Array.from({ length: 300 }, (_, index): BattleEvent => ({
      type: "pawn-hurt",
      pawnId: index,
      damage: 1,
      cause: "contact",
      at,
    }));
    effects.add(hurts);
    expect(effects.list()).toHaveLength(260);
  });

  it("can be cleared for a new run", () => {
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([{ type: "stomp", id: 3, at }]);
    effects.clear();
    expect(effects.list()).toEqual([]);
  });
});
