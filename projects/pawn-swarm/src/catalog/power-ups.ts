/**
 * Power-ups: coloured orbs dropped by kills, from the swarm prototype. No
 * logic lives here. Times in game seconds, distances in board units.
 */
export type PowerUpId =
  "heal" | "haste" | "fury" | "freeze" | "bounty" | "reinforcements";

export interface PowerUpStats {
  readonly name: string;
  readonly colour: string;
  /** The symbol on the orb. */
  readonly symbol: string;
  /** What the toast says it does. */
  readonly text: string;
  /** How long its effect lasts; left out for one that happens once. */
  readonly seconds?: number;
}

export const POWER_UPS: Readonly<Record<PowerUpId, PowerUpStats>> = {
  heal: {
    name: "Heal",
    colour: "#8fcf6b",
    symbol: "+",
    text: "every pawn back to full HP",
  },
  haste: {
    name: "Haste",
    colour: "#6fb0ff",
    symbol: "»",
    text: "pawns 50% faster for 6s",
    seconds: 6,
  },
  fury: {
    name: "Fury",
    colour: "#ff5a4a",
    symbol: "!",
    text: "+2 attack for 6s",
    seconds: 6,
  },
  freeze: {
    name: "Freeze",
    colour: "#bff3ff",
    symbol: "*",
    text: "black pieces stop for 3s",
    seconds: 3,
  },
  bounty: {
    name: "Bounty",
    colour: "#e8b04a",
    symbol: "$",
    text: "double drops for 8s",
    seconds: 8,
  },
  reinforcements: {
    name: "Reinforcements",
    colour: "#f4efe4",
    symbol: "3",
    text: "+3 pawns",
  },
};

export const POWER_UP_IDS = Object.keys(POWER_UPS) as PowerUpId[];

/** The power-ups with a timer: while it runs they change the rules of the battle. */
export type TimedPowerUpId = "haste" | "fury" | "freeze" | "bounty";

export const POWER_UP_RULES = {
  /** Chance a killed rook or queen drops an orb... */
  rookOrQueenChance: 0.35,
  /** ...a special type of any other piece... */
  specialTypeChance: 0.2,
  /** ...and any other piece. */
  otherChance: 0.03,
  /** An orb vanishes after this long... */
  lifetimeSeconds: 9,
  /** ...blinking for the last this long. */
  blinkSeconds: 2,
  /**
   * A new orb can't be picked up for this long, so the player sees what
   * dropped: the pawns a kill drops land on the very same spot.
   */
  popSeconds: 0.4,
  /** An orb drifts to the nearest pawn within this many squares... */
  attractRadius: 3,
  /** ...at this many squares per second... */
  driftSpeed: 4.7,
  /** ...and is picked up once a pawn is this close. */
  pickupRadius: 0.47,
  /** Haste multiplies walking speed by this. */
  hasteSpeedFactor: 1.5,
  /** Fury adds this to each strike. */
  furyExtraAttack: 2,
  /** Bounty multiplies drops by this, before crowding and rounding. */
  bountyDropFactor: 2,
  /** Reinforcements spawn this many plain pawns. */
  reinforcementPawns: 3,
} as const;
