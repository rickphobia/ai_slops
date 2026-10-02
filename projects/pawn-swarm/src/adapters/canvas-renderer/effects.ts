import type { BattleEvent, PieceIdentity } from "../../battle/battle-state";
import type { Point } from "../../board/square";

/**
 * Short-lived visuals made from battle events: damage numbers, death bursts,
 * "+n ♟" pop-ups, strike slashes and landing rings. Positions are in board
 * units, like the battle. The rules never see any of this.
 */
export type Effect =
  | {
      readonly kind: "text";
      readonly text: string;
      readonly colour: string;
      readonly at: Point;
      /** Height in squares. */
      readonly size: number;
      readonly life: number;
      readonly age: number;
    }
  | {
      readonly kind: "spark";
      readonly colour: string;
      readonly at: Point;
      /** Squares per second. */
      readonly velocity: Point;
      readonly life: number;
      readonly age: number;
    }
  | {
      readonly kind: "slash";
      readonly colour: string;
      readonly from: Point;
      readonly to: Point;
      readonly life: number;
      readonly age: number;
    }
  | {
      readonly kind: "ring";
      readonly colour: string;
      readonly at: Point;
      /** Radius in squares when the ring fades out. */
      readonly radius: number;
      readonly life: number;
      readonly age: number;
    };

export interface Effects {
  /** Turns one step's events into new effects. */
  add(events: readonly BattleEvent[]): void;
  /** Ages every effect by `seconds` of game time and drops the finished ones. */
  advance(seconds: number): void;
  /** Removes every effect, for a new run. */
  clear(): void;
  list(): readonly Effect[];
}

export const EFFECT_COLOURS = {
  damage: "#efe6d4",
  hurt: "#e0614f",
  drop: "#e8b04a",
  landing: "#141210",
  stomp: "#ffcf7a",
  heal: "#8fcf6b",
  blast: "#ff6b4a",
} as const;

/** Damage numbers stop being added past this many, so a huge swarm can't flood the screen. */
const MAX_TEXTS = 260;
/** Text rises this many squares per second. */
export const TEXT_RISE_SPEED = 0.8;

/**
 * `tintOf` gives each piece's colour (from the piece art); `random` scatters
 * sparks and is only for looks, so it doesn't need to be seeded.
 */
export function createEffects(
  tintOf: (piece: PieceIdentity) => string,
  random: () => number,
): Effects {
  let effects: Effect[] = [];
  let textCount = 0;

  const addText = (
    text: string,
    colour: string,
    at: Point,
    life = 0.6,
    size = 0.4,
  ): void => {
    if (textCount >= MAX_TEXTS) return;
    textCount += 1;
    // A little sideways jitter so numbers on the same spot don't stack exactly.
    const jittered = { x: at.x + (random() - 0.5) * 0.25, y: at.y };
    effects.push({
      kind: "text",
      text,
      colour,
      at: jittered,
      size,
      life,
      age: 0,
    });
  };

  const addSparks = (colour: string, at: Point, count: number): void => {
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const speed = 1.25 + random() * 3.75;
      effects.push({
        kind: "spark",
        colour,
        at,
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 0.35 + random() * 0.3,
        age: 0,
      });
    }
  };

  const addEvent = (event: BattleEvent): void => {
    switch (event.type) {
      case "strike":
        effects.push({
          kind: "slash",
          colour: tintOf({ side: "white", type: event.pawnType }),
          from: event.from,
          to: event.at,
          life: 0.12,
          age: 0,
        });
        addText(String(event.damage), EFFECT_COLOURS.damage, {
          x: event.at.x,
          y: event.at.y + 0.55,
        });
        return;
      case "pawn-hurt":
        addText(`-${String(event.damage)}`, EFFECT_COLOURS.hurt, {
          x: event.at.x,
          y: event.at.y + 0.4,
        });
        return;
      case "death":
        addSparks(
          tintOf(event.piece),
          event.at,
          event.piece.side === "black" ? 14 : 8,
        );
        return;
      case "drop":
        addText(
          `+${String(event.count)} ♟`,
          EFFECT_COLOURS.drop,
          { x: event.at.x, y: event.at.y + 0.9 },
          1.1,
          0.7,
        );
        return;
      case "landed":
        addSparks(EFFECT_COLOURS.landing, event.at, 8);
        return;
      case "heal":
        addText(`+${String(event.amount)}`, EFFECT_COLOURS.heal, {
          x: event.at.x,
          y: event.at.y + 0.4,
        });
        return;
      case "blast":
        effects.push({
          kind: "ring",
          colour: EFFECT_COLOURS.blast,
          at: event.at,
          radius: event.radius,
          life: 0.35,
          age: 0,
        });
        addSparks(EFFECT_COLOURS.blast, event.at, 18);
        return;
      case "stomp":
        effects.push({
          kind: "ring",
          colour: EFFECT_COLOURS.stomp,
          at: event.at,
          radius: 1.4,
          life: 0.2,
          age: 0,
        });
        return;
    }
  };

  return {
    add: (events) => {
      for (const event of events) addEvent(event);
    },
    advance: (seconds) => {
      effects = effects
        .map((effect) => ({ ...effect, age: effect.age + seconds }))
        .filter((effect) => effect.age < effect.life);
      textCount = effects.filter((effect) => effect.kind === "text").length;
    },
    clear: () => {
      effects = [];
      textCount = 0;
    },
    list: () => effects,
  };
}
