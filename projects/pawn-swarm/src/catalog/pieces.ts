import type { MovePattern } from "../board/moves";

/**
 * Balance numbers for every piece. Change these to rebalance; no logic lives here.
 * Distances are in board units (1 square = 1), times in game seconds.
 */
export type Rarity = "common" | "rare" | "epic";

/**
 * What a skill does to the pawns of its own type while it lasts. Fields left
 * out change nothing.
 */
export interface LastingSkillEffect {
  readonly seconds: number;
  /** Walking speed is multiplied by this. */
  readonly speedFactor?: number;
  /** Added to each strike's damage. */
  readonly extraAttack?: number;
  /** Hits and contact do nothing to these pawns. */
  readonly takesNoDamage?: boolean;
  /** Black pieces whose centre is within this many squares go for these pawns first, instead of `drawsBlackWithin`. */
  readonly drawsBlackWithin?: number;
}

/** Where a skill's hit lands around each pawn of the type, in squares from the pawn. */
export type SkillHitArea =
  /** Every black piece whose centre is within `radius`. */
  | { readonly shape: "around"; readonly radius: number }
  /**
   * Every black piece in the pawn's row or column: within `reach` along one
   * axis and `halfWidth` across it.
   */
  | {
      readonly shape: "row-and-column";
      readonly reach: number;
      readonly halfWidth: number;
    };

/** A hit each pawn of the type deals the moment the skill fires. */
export interface SkillHit {
  readonly damage: number;
  readonly area: SkillHitArea;
}

/** A pawn type's hand-fired ability. It fires for every pawn of the type at once. */
export interface SkillStats {
  readonly name: string;
  /** Game seconds before it can be used again. */
  readonly cooldown: number;
  readonly text: string;
  readonly lasting?: LastingSkillEffect;
  readonly hit?: SkillHit;
}

/** What the shop says about a skill. */
export type SkillText = Pick<SkillStats, "name" | "cooldown" | "text">;

/** How the shop sells a pawn type. */
export interface ShopListing {
  readonly rarity: Rarity;
  /** Plain pawns sacrificed per recruit in wave 1, before it grows with the wave. */
  readonly basePrice: number;
}

export interface PawnStats {
  readonly name: string;
  readonly hp: number;
  readonly attack: number;
  /** Squares walked per second. */
  readonly speed: number;
  /** Seconds between strikes. */
  readonly strikeCooldown: number;
  /** How far from a black piece's edge the pawn can strike it. */
  readonly range: number;
  /** Black pieces it strikes at once: the nearest, then the next nearest in reach. */
  readonly strikesAtOnce: number;
  /** Black pieces whose centre is within this many squares go for this pawn first. */
  readonly drawsBlackWithin?: number;
  /** The always-on ability, as the shop describes it. */
  readonly passive: string;
  readonly skill: SkillStats;
  /** How the shop sells it; the plain pawn is money, not for sale. */
  readonly shop?: ShopListing;
}

export type PawnTypeId = "plain" | "shield" | "spear" | "twin";

export const PAWN_TYPES: Readonly<Record<PawnTypeId, PawnStats>> = {
  plain: {
    name: "Plain pawn",
    hp: 3,
    attack: 1,
    speed: 1.44,
    strikeCooldown: 0.7,
    range: 0.875,
    strikesAtOnce: 1,
    passive: "Also your money.",
    skill: {
      name: "Charge",
      cooldown: 12,
      text: "Plain pawns move twice as fast and get +1 attack for 3s.",
      lasting: { seconds: 3, speedFactor: 2, extraAttack: 1 },
    },
  },
  shield: {
    name: "Shield pawn",
    hp: 10,
    attack: 1,
    speed: 1.06,
    strikeCooldown: 0.9,
    range: 0.875,
    strikesAtOnce: 1,
    drawsBlackWithin: 3.4,
    passive: "Black pieces nearby attack shields first.",
    skill: {
      name: "Hold the line",
      cooldown: 20,
      text: "Shields take no damage for 4s and pull black pieces from further away.",
      lasting: { seconds: 4, takesNoDamage: true, drawsBlackWithin: 6.875 },
    },
    shop: { rarity: "common", basePrice: 3 },
  },
  spear: {
    name: "Spear pawn",
    hp: 3,
    attack: 2,
    speed: 1.375,
    strikeCooldown: 0.8,
    // Twice the plain pawn's reach.
    range: 1.75,
    strikesAtOnce: 1,
    passive: "Strikes from twice as far, for 2 damage.",
    skill: {
      name: "Volley",
      cooldown: 15,
      text: "Each spear hits every black piece within 4 squares in its row and column for 3.",
      // Half a square plus a little slack across, so a spear between two squares still lines up.
      hit: {
        damage: 3,
        area: { shape: "row-and-column", reach: 4, halfWidth: 0.625 },
      },
    },
    shop: { rarity: "common", basePrice: 3 },
  },
  twin: {
    name: "Twin pawn",
    hp: 3,
    attack: 1,
    speed: 1.44,
    strikeCooldown: 0.7,
    range: 0.94,
    strikesAtOnce: 2,
    passive: "Strikes two black pieces at once.",
    skill: {
      name: "Fork",
      cooldown: 12,
      text: "Each twin hits every black piece around it for 2.",
      // The prototype's reach: the squares beside it, and a diagonal one only when the twin stands toward it (its centre is 1.41 away from a twin on a square centre).
      hit: { damage: 2, area: { shape: "around", radius: 1.375 } },
    },
    shop: { rarity: "common", basePrice: 3 },
  },
};

/** How many pawns of each type the player owns. A missing type means none. */
export type Army = Readonly<Partial<Record<PawnTypeId, number>>>;

export interface BlackPieceStats {
  readonly name: string;
  /** HP in wave 1; it grows each wave by `BATTLE_RULES.blackHpGrowthPerWave`. */
  readonly hp: number;
  readonly attack: number;
  /** Seconds between moves, not counting the warning and the move itself. */
  readonly actEvery: number;
  /** Plain pawns dropped on death, before crowding. */
  readonly drop: number;
  readonly move: MovePattern;
  /** Half the piece's width: pawns strike from `range` beyond this. */
  readonly bodyRadius: number;
  /** Pawns closer than this to the piece's centre are touching it. */
  readonly contactRadius: number;
  /** Seconds a move takes from leaving its square to landing. */
  readonly moveSeconds: number;
  /** Calls knights next to itself on a timer. */
  readonly summons?: {
    readonly knights: number;
    readonly everySeconds: number;
  };
  /** Its death wins the battle at once, whatever else is left. */
  readonly isKing?: boolean;
}

export type BlackKind = "knight" | "bishop" | "rook" | "queen" | "king";

export const BLACK_PIECES: Readonly<Record<BlackKind, BlackPieceStats>> = {
  knight: {
    name: "Knight",
    hp: 2,
    attack: 1,
    actEvery: 1.1,
    drop: 1,
    move: { lines: "L", reach: 1, hits: "landing-block" },
    bodyRadius: 0.325,
    contactRadius: 0.72,
    moveSeconds: 0.28,
  },
  bishop: {
    name: "Bishop",
    hp: 5,
    attack: 1,
    actEvery: 1.6,
    drop: 2,
    move: { lines: "diagonal", reach: 4, hits: "path" },
    bodyRadius: 0.35,
    contactRadius: 0.75,
    moveSeconds: 0.3,
  },
  rook: {
    name: "Rook",
    hp: 12,
    attack: 2,
    actEvery: 2,
    drop: 3,
    move: { lines: "straight", reach: 6, hits: "path" },
    bodyRadius: 0.375,
    contactRadius: 0.78,
    moveSeconds: 0.3,
  },
  queen: {
    name: "Queen",
    hp: 26,
    attack: 3,
    actEvery: 1.3,
    drop: 5,
    move: { lines: "any", reach: 5, hits: "path" },
    bodyRadius: 0.425,
    contactRadius: 0.84,
    moveSeconds: 0.3,
  },
  king: {
    name: "King",
    hp: 220,
    attack: 4,
    actEvery: 0.8,
    drop: 0,
    move: { lines: "any", reach: 1, hits: "landing-block" },
    bodyRadius: 0.575,
    contactRadius: 1.03,
    moveSeconds: 0.35,
    summons: { knights: 3, everySeconds: 6 },
    isKing: true,
  },
};
