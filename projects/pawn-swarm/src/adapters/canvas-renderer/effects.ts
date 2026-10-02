import type { BattleEvent, PieceIdentity } from "../../battle/battle-state";
import type { BlackKind } from "../../catalog/pieces";
import type { Point } from "../../board/square";
import { createParticlePool, type ParticlePool } from "./particles";

/**
 * Short-lived visuals made from battle events: damage numbers, blood and gibs
 * (in the particle pool), blood pools, "+n ♟" pop-ups, strike slashes and rings,
 * plus the screen shake. Positions are in board units, like the battle. The
 * rules never see any of this.
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
      readonly kind: "blood-pool";
      readonly at: Point;
      /** Radius in squares. */
      readonly radius: number;
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
  /** Blood, gibs and sparks. */
  readonly particles: ParticlePool;
  /** How hard the screen shakes right now, 0–1 (the renderer scales it to pixels). */
  shake(): number;
}

export const EFFECT_COLOURS = {
  damage: "#efe6d4",
  hurt: "#e0614f",
  drop: "#e8b04a",
  landing: "#141210",
  stomp: "#ffcf7a",
  blood: "#7d0f12",
  bloodDark: "#4a0709",
} as const;

/** Most particles alive at once; the pool replaces the oldest past this. */
export const MAX_PARTICLES = 1800;
/** Slashes, rings and pools stop being added past these, like the texts. */
const MAX_SLASHES = 200;
const MAX_POOLS = 150;
const MAX_RINGS = 60;
/** The shake dies away at this much per game second. */
const SHAKE_DECAY_PER_SECOND = 2.2;

/** How hard a black piece's death or landing shakes the screen, by kind (0–1). */
const DEATH_SHAKE: Readonly<Record<BlackKind, number>> = {
  knight: 0.2,
  bishop: 0.2,
  rook: 0.45,
  queen: 0.55,
  king: 1,
};
const LANDING_SHAKE: Readonly<Record<BlackKind, number>> = {
  knight: 0.12,
  bishop: 0.12,
  rook: 0.3,
  queen: 0.4,
  king: 0.6,
};
/** Gib count by black kind: the big ones burst into more pieces. */
const BLACK_GIBS: Readonly<Record<BlackKind, number>> = {
  knight: 5,
  bishop: 5,
  rook: 8,
  queen: 10,
  king: 22,
};

/** Damage numbers stop being added past this many, so a huge swarm can't flood the screen. */
const MAX_TEXTS = 260;
/** Text rises this many squares per second. */
export const TEXT_RISE_SPEED = 0.8;

type Mutable<T> = T extends unknown
  ? { -readonly [K in keyof T]: T[K] }
  : never;

/**
 * `tintOf` gives each piece's colour (from the piece art); `random` scatters
 * particles and is only for looks, so it doesn't need to be seeded.
 */
export function createEffects(
  tintOf: (piece: PieceIdentity) => string,
  random: () => number,
): Effects {
  // Aged in place: a big fight would otherwise make hundreds of new objects every step.
  let effects: Mutable<Effect>[] = [];
  const counts = { text: 0, slash: 0, "blood-pool": 0, ring: 0 };
  const particles = createParticlePool(MAX_PARTICLES);
  let shake = 0;

  const push = (effect: Mutable<Effect>, cap: number): void => {
    if (counts[effect.kind] >= cap) return;
    counts[effect.kind] += 1;
    effects.push(effect);
  };

  const addText = (
    text: string,
    colour: string,
    at: Point,
    life = 0.6,
    size = 0.4,
  ): void => {
    // A little sideways jitter so numbers on the same spot don't stack exactly.
    const jittered = { x: at.x + (random() - 0.5) * 0.25, y: at.y };
    push(
      { kind: "text", text, colour, at: jittered, size, life, age: 0 },
      MAX_TEXTS,
    );
  };

  const addRing = (colour: string, at: Point, radius: number, life: number) => {
    push({ kind: "ring", colour, at, radius, life, age: 0 }, MAX_RINGS);
  };

  /** Specks flying out from `at`: all around, or in a cone around `direction` (an angle in radians). */
  const burst = (
    kind: "blood" | "gib" | "spark",
    colour: string,
    at: Point,
    count: number,
    speed: [min: number, max: number],
    size: [min: number, max: number],
    life: [min: number, max: number],
    direction?: { angle: number; spread: number },
  ): void => {
    for (let index = 0; index < count; index++) {
      const angle =
        direction === undefined
          ? random() * Math.PI * 2
          : direction.angle + (random() - 0.5) * direction.spread;
      const fly = speed[0] + random() * (speed[1] - speed[0]);
      particles.spawn({
        kind,
        colour,
        x: at.x,
        y: at.y,
        vx: Math.cos(angle) * fly,
        vy: Math.sin(angle) * fly,
        size: size[0] + random() * (size[1] - size[0]),
        life: life[0] + random() * (life[1] - life[0]),
      });
    }
  };

  const addShake = (level: number): void => {
    // The biggest recent shake wins, so 100 deaths in a step shake no harder than the biggest one.
    shake = Math.max(shake, level);
  };

  const addEvent = (event: BattleEvent): void => {
    switch (event.type) {
      case "strike": {
        push(
          {
            kind: "slash",
            colour: tintOf({ side: "white", type: event.pawnType }),
            from: event.from,
            to: event.at,
            life: 0.12,
            age: 0,
          },
          MAX_SLASHES,
        );
        addText(String(event.damage), EFFECT_COLOURS.damage, {
          x: event.at.x,
          y: event.at.y + 0.55,
        });
        // Blood sprays on, and a little past, the target: away from the pawn that hit it.
        const angle = Math.atan2(
          event.at.y - event.from.y,
          event.at.x - event.from.x,
        );
        burst(
          "blood",
          EFFECT_COLOURS.blood,
          event.at,
          2 + Math.min(4, event.damage),
          [2, 5.5],
          [0.05, 0.11],
          [0.25, 0.45],
          { angle, spread: 1.3 },
        );
        return;
      }
      case "pawn-hurt":
        addText(`-${String(event.damage)}`, EFFECT_COLOURS.hurt, {
          x: event.at.x,
          y: event.at.y + 0.4,
        });
        burst(
          "blood",
          EFFECT_COLOURS.blood,
          event.at,
          3,
          [1.5, 4],
          [0.05, 0.1],
          [0.25, 0.4],
        );
        return;
      case "death": {
        const black = event.piece.side === "black";
        const gibs =
          event.piece.side === "black" ? BLACK_GIBS[event.piece.kind] : 3;
        burst(
          "blood",
          EFFECT_COLOURS.blood,
          event.at,
          black ? 22 : 8,
          [1.5, 6],
          [0.06, 0.14],
          [0.35, 0.7],
        );
        burst(
          "blood",
          EFFECT_COLOURS.bloodDark,
          event.at,
          black ? 10 : 4,
          [1, 4],
          [0.08, 0.16],
          [0.4, 0.8],
        );
        burst(
          "gib",
          tintOf(event.piece),
          event.at,
          gibs,
          [2, 6.5],
          [0.12, 0.26],
          [0.5, 0.9],
        );
        push(
          {
            kind: "blood-pool",
            at: event.at,
            radius: event.piece.side === "black" ? 0.55 + gibs * 0.03 : 0.3,
            life: black ? 6 : 3.5,
            age: 0,
          },
          MAX_POOLS,
        );
        if (event.piece.side === "black")
          addShake(DEATH_SHAKE[event.piece.kind]);
        return;
      }
      case "drop":
        addText(
          `+${String(event.count)} ♟`,
          EFFECT_COLOURS.drop,
          { x: event.at.x, y: event.at.y + 0.9 },
          1.1,
          0.7,
        );
        burst(
          "spark",
          EFFECT_COLOURS.drop,
          event.at,
          6,
          [1.5, 4],
          [0.06, 0.1],
          [0.3, 0.5],
        );
        return;
      case "landed":
        burst(
          "spark",
          EFFECT_COLOURS.landing,
          event.at,
          8,
          [1.25, 5],
          [0.06, 0.12],
          [0.35, 0.65],
        );
        addRing(EFFECT_COLOURS.landing, event.at, 1.1, 0.3);
        addShake(LANDING_SHAKE[event.kind]);
        return;
      case "stomp":
        addRing(EFFECT_COLOURS.stomp, event.at, 1.4, 0.2);
        addShake(0.2);
        return;
      default:
        return;
    }
  };

  return {
    particles,
    shake: () => shake * shake,
    add: (events) => {
      for (const event of events) addEvent(event);
    },
    advance: (seconds) => {
      let kept = 0;
      counts.text = counts.slash = counts["blood-pool"] = counts.ring = 0;
      for (const effect of effects) {
        effect.age += seconds;
        if (effect.age >= effect.life) continue;
        counts[effect.kind] += 1;
        effects[kept] = effect;
        kept += 1;
      }
      effects.length = kept;
      particles.advance(seconds);
      shake = Math.max(0, shake - SHAKE_DECAY_PER_SECOND * seconds);
    },
    clear: () => {
      effects = [];
      counts.text = counts.slash = counts["blood-pool"] = counts.ring = 0;
      particles.clear();
      shake = 0;
    },
    list: () => effects,
  };
}
