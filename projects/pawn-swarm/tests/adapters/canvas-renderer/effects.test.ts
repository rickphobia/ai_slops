import { describe, expect, it } from "vitest";
import {
  createEffects,
  EFFECT_COLOURS,
  MAX_PARTICLES,
  type Effect,
} from "../../../src/adapters/canvas-renderer/effects";
import type {
  BattleEvent,
  PieceIdentity,
} from "../../../src/battle/battle-state";

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
      { type: "pawn-hurt", pawnId: 1, damage: 1, cause: "hit", at },
    ]);
    expect(effect).toMatchObject({
      kind: "text",
      text: "-1",
      colour: EFFECT_COLOURS.hurt,
    });
  });

  it("sprays blood, gibs in the piece's colour and a pool when a piece dies, more for a black piece", () => {
    const death = (piece: PieceIdentity): ReturnType<typeof createEffects> => {
      const effects = createEffects(tintOf, () => 0.5);
      effects.add([{ type: "death", id: 2, piece, at }]);
      return effects;
    };
    const black = death({ side: "black", kind: "knight" });
    const white = death({ side: "white", type: "plain" });
    expect(kinds(black.list())).toEqual(["blood-pool"]);
    expect(black.particles.count).toBeGreaterThan(white.particles.count);
    const colours = new Set<string>();
    black.particles.forEach((kind, colour) => {
      if (kind === "gib") colours.add(colour);
    });
    expect([...colours]).toEqual(["black-tint"]);
  });

  it("sprays blood from a strike", () => {
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([
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
    expect(effects.particles.count).toBe(5);
  });

  it("shakes the screen for big pieces, more for the king, and settles", () => {
    const shakeAfter = (kind: "knight" | "king"): number => {
      const effects = createEffects(tintOf, () => 0.5);
      effects.add([
        { type: "death", id: 2, piece: { side: "black", kind }, at },
      ]);
      return effects.shake();
    };
    expect(shakeAfter("king")).toBeGreaterThan(shakeAfter("knight"));
    expect(shakeAfter("knight")).toBeGreaterThan(0);
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([
      { type: "death", id: 2, piece: { side: "black", kind: "king" }, at },
    ]);
    effects.advance(2);
    expect(effects.shake()).toBe(0);
  });

  it("does not shake for a dying pawn", () => {
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([
      { type: "death", id: 1, piece: { side: "white", type: "plain" }, at },
    ]);
    expect(effects.shake()).toBe(0);
  });

  it("pops up '+n ♟' where a drop lands", () => {
    const [effect] = effectsFor([{ type: "drop", count: 2, at }]);
    expect(effect).toMatchObject({
      kind: "text",
      text: "+2 ♟",
      colour: EFFECT_COLOURS.drop,
    });
  });

  it("marks landings with a burst, a ring and a shake, and knight stomps with a ring", () => {
    const landing = createEffects(tintOf, () => 0.5);
    landing.add([{ type: "landed", id: 3, kind: "knight", at }]);
    expect(kinds(landing.list())).toEqual(["ring"]);
    expect(landing.particles.count).toBe(8);
    expect(landing.shake()).toBeGreaterThan(0);
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

  it("shows a plus-pawn number for recruits, in the recruiter's colour", () => {
    const effects = effectsFor([{ type: "recruit", pawnId: 1, count: 2, at }]);
    expect(effects).toMatchObject([
      { kind: "text", text: "+2 ♟", colour: EFFECT_COLOURS.recruit },
    ]);
  });

  it("shows 'dodge' when a hit is dodged", () => {
    const effects = effectsFor([{ type: "dodge", pawnId: 1, at }]);
    expect(effects).toMatchObject([{ kind: "text", text: "dodge" }]);
  });

  it("shows a ring and a crown when a promoter promotes", () => {
    const effects = effectsFor([{ type: "promote", pawnId: 1, at }]);
    expect(kinds(effects)).toEqual(["ring", "text"]);
  });

  it("shows a slash along a leap, in the pawn type's colour", () => {
    const from = { x: 1.5, y: 2.5 };
    const effects = effectsFor([
      { type: "leap", pawnId: 1, pawnType: "promoter", from, at },
    ]);
    expect(effects).toMatchObject([
      { kind: "slash", colour: "white-tint", from, to: at },
    ]);
  });

  it("keeps particles within the pool size however big the fight", () => {
    const effects = createEffects(tintOf, () => 0.5);
    const deaths = Array.from({ length: 400 }, (_, index): BattleEvent => ({
      type: "death",
      id: index,
      piece: { side: "black", kind: "queen" },
      at,
    }));
    effects.add(deaths);
    expect(effects.particles.count).toBe(MAX_PARTICLES);
    expect(effects.list().length).toBeLessThanOrEqual(150);
  });

  it("can be cleared for a new run", () => {
    const effects = createEffects(tintOf, () => 0.5);
    effects.add([
      { type: "stomp", id: 3, at },
      { type: "death", id: 1, piece: { side: "white", type: "plain" }, at },
    ]);
    effects.clear();
    expect(effects.list()).toEqual([]);
    expect(effects.particles.count).toBe(0);
  });

  it("shows a ring in the type's colour for a priest and a storm, sized by their reach", () => {
    const ring = (blackType: "priest" | "storm") =>
      effectsFor([{ type: "black-power", id: 1, blackType, at }])[0];
    expect(ring("priest")).toMatchObject({
      kind: "ring",
      colour: "#8fcf6b",
      radius: 3,
    });
    expect(ring("storm")).toMatchObject({
      kind: "ring",
      colour: "#bff3ff",
      radius: 2.3,
    });
  });

  it("shows four 7-square lines for a cannon", () => {
    const effects = effectsFor([
      { type: "black-power", id: 1, blackType: "cannon", at },
    ]);
    expect(kinds(effects)).toEqual(["slash", "slash", "slash", "slash"]);
    expect(effects[0]).toMatchObject({ to: { x: at.x + 7, y: at.y } });
  });

  it("rings a new orb, and rings and bursts sparks when a power-up is picked up, in its colour", () => {
    expect(
      effectsFor([{ type: "orb-drop", id: 3, powerUp: "freeze", at }]),
    ).toMatchObject([{ kind: "ring", colour: "#bff3ff" }]);
    const picked = effectsFor([
      { type: "power-up", id: 3, powerUp: "bounty", at },
    ]);
    // The toast names it; on the board there is only a ring and sparks.
    expect(picked).toMatchObject([{ kind: "ring", colour: "#e8b04a" }]);
  });
});
