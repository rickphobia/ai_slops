import type { BlackKind, SkillHitArea } from "./pieces";

/**
 * The special versions of black pieces, from the swarm prototype. Each keeps
 * its piece's moves and adds one power. Fields left out change nothing. No
 * logic lives here. Distances are in board units (1 square = 1), times in game seconds.
 */
export type BlackTypeId =
  | "stomper"
  | "priest"
  | "hunter"
  | "tower"
  | "sniper"
  | "cannon"
  | "storm"
  | "summoner";

/** Hurts every pawn in an area on a timer. */
export interface TimedHit {
  readonly everySeconds: number;
  readonly damage: number;
  /** Measured from the piece's square; for a cannon a row and column. */
  readonly area: SkillHitArea;
}

export interface BlackTypeStats {
  readonly name: string;
  /** Which kind of piece it is a version of. */
  readonly piece: BlackKind;
  /** The first wave it can appear in. */
  readonly fromWave: number;
  /** Its ring on the board and its name in the shop. */
  readonly colour: string;
  /** What the shop says it does. */
  readonly power: string;
  /** Its HP is multiplied by this. */
  readonly hpFactor?: number;
  /** Seconds between its moves are multiplied by this: under 1 acts more often. */
  readonly actEveryFactor?: number;
  /** Added to the damage its moves do. */
  readonly extraAttack?: number;
  /** Replaces the piece's move reach. */
  readonly moveReach?: number;
  /** Its landing hits the squares two away in each straight line as well as the 3×3 block. */
  readonly hitsCross?: boolean;
  /** Goes for the nearest pawn that is not plain before any other. */
  readonly huntsSpecialPawns?: boolean;
  /** Heals the other black pieces within `radius` by `amount` every `everySeconds`. */
  readonly heals?: {
    readonly amount: number;
    readonly everySeconds: number;
    readonly radius: number;
  };
  /** Hits pawns around it on a timer. */
  readonly hitsOnTimer?: TimedHit;
  /** Calls knights next to itself on a timer. */
  readonly summons?: {
    readonly knights: number;
    readonly everySeconds: number;
  };
}

export const BLACK_TYPES: Readonly<Record<BlackTypeId, BlackTypeStats>> = {
  stomper: {
    name: "Stomper",
    piece: "knight",
    fromWave: 3,
    colour: "#ff9a3c",
    power: "Lands harder: bigger stomp (3×3 plus a cross), +1 damage.",
    hitsCross: true,
    extraAttack: 1,
  },
  priest: {
    name: "Priest",
    piece: "bishop",
    fromWave: 4,
    colour: "#8fcf6b",
    power: "Heals black pieces within 3 squares by 2 every 2s.",
    heals: { amount: 2, everySeconds: 2, radius: 3 },
  },
  hunter: {
    name: "Hunter",
    piece: "knight",
    fromWave: 5,
    colour: "#ff4f7a",
    power: "Hops twice as often and hunts your special pawns.",
    actEveryFactor: 0.5,
    huntsSpecialPawns: true,
  },
  tower: {
    name: "Tower",
    piece: "rook",
    fromWave: 5,
    colour: "#9fb4c8",
    power: "3× HP, moves 50% slower.",
    hpFactor: 3,
    actEveryFactor: 1.5,
  },
  sniper: {
    name: "Sniper",
    piece: "bishop",
    fromWave: 6,
    colour: "#6fb0ff",
    power: "Dashes up to 8 squares in one move.",
    moveReach: 8,
  },
  cannon: {
    name: "Cannon",
    piece: "rook",
    fromWave: 7,
    colour: "#e0614f",
    power: "Every 3s hits pawns in its row and column within 7 squares for 2.",
    hitsOnTimer: {
      everySeconds: 3,
      damage: 2,
      area: { shape: "row-and-column", reach: 7, halfWidth: 0.4 },
    },
  },
  storm: {
    name: "Storm",
    piece: "queen",
    fromWave: 7,
    colour: "#bff3ff",
    power: "Every 4s hits every pawn within 2 squares for 2.",
    hitsOnTimer: {
      everySeconds: 4,
      damage: 2,
      area: { shape: "around", radius: 2.3 },
    },
  },
  summoner: {
    name: "Summoner",
    piece: "queen",
    fromWave: 8,
    colour: "#c58bff",
    power: "Every 6s calls 2 knights next to her.",
    summons: { knights: 2, everySeconds: 6 },
  },
};

export const BLACK_TYPE_IDS = Object.keys(BLACK_TYPES) as BlackTypeId[];

/** How often special types turn up and what they are worth. */
export const BLACK_TYPE_RULES = {
  /** Chance of each unlocked type for a piece of its kind, the wave it unlocks... */
  firstChance: 0.18,
  /** ...plus this much for every wave after. */
  chancePerWave: 0.07,
  /** ...never more than this. */
  maxChance: 0.45,
  /** A special type drops this many more pawns than a plain piece of its kind. */
  extraDrop: 1,
  /** Its first power fires between these many seconds after it lands (a random spread, so a push doesn't fire in lockstep). */
  firstPowerMinSeconds: 1,
  firstPowerSpreadSeconds: 2,
} as const;
