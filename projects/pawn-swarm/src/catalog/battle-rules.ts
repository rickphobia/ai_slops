/**
 * Battle-wide rule numbers, taken from the swarm prototype. Distances are in
 * board units (1 square = 1), times in game seconds. No logic lives here.
 */
export const BATTLE_RULES = {
  board: { files: 20, ranks: 14 },

  /** Red squares show this long before a black move starts. */
  moveWarningSeconds: 0.4,
  /** Red squares show this long before a wave's pieces land. */
  landingWarningSeconds: 1.2,
  /** A pawn this close (along each axis) to a hit square's centre is on it. Half a square plus a little slack. */
  squareHitReach: 0.5625,

  contactDamage: 1,
  contactEverySeconds: 1.5,

  /** A pawn keeps walking along its axis until the other axis is this many times longer. */
  axisSwitchRatio: 1.3,
  /** ...or until it is this close to lined up on its current axis. */
  axisLinedUp: 0.0625,
  /** With no black piece left, pawns drift back to the centre this much slower... */
  idleSpeedFactor: 0.3,
  /** ...and stop this far from it. */
  idleStopDistance: 0.94,

  /** Pawns closer than this push each other apart. */
  separationRadius: 0.47,
  /** Share of the overlap removed per step. */
  separationStrength: 0.35,
  /** Only this many neighbours push a pawn per step, so a dense crowd stays cheap. */
  separationMaxNeighbours: 7,
  /** Pawns stay this far inside the board edge. */
  edgeMargin: 0.25,

  /** Distance between rings of the starting spiral grows with the square root of the pawn index times this. */
  spiralSpacing: 0.28,
  /** Golden angle in radians: spreads the spiral evenly. */
  spiralAngle: 2.39996,

  landing: {
    /** Chance that a piece lands in the ring around the centre rather than anywhere. */
    ringChance: 0.5,
    ringMinDistance: 4.7,
    ringMaxDistance: 8.4,
    /** No piece lands with its square centre this close to the board centre. */
    keepClearOfCentre: 3.75,
    /** Random picks tried before falling back to any free square far enough out. */
    tries: 40,
  },

  crowding: {
    /** At this many white pawns, kills drop only the floor share. */
    swarmSize: 400,
    /** Kills always drop at least this share of the normal drop. */
    floor: 0.15,
  },

  dropBurst: {
    minSpeed: 1.875,
    extraSpeed: 2.8,
    /** Share of burst speed left after one second. */
    keptPerSecond: 0.02,
    /** Below this speed the burst stops. */
    stopSpeed: 0.125,
  },
} as const;
