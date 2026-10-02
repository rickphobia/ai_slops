/**
 * Battle-wide rule numbers, taken from the swarm prototype. Distances are in
 * board units (1 square = 1), times in game seconds. No logic lives here.
 */
export const BATTLE_RULES = {
  board: { files: 16, ranks: 11 },

  /**
   * Game seconds per real second at 1× speed, so battles are readable. Like
   * the speed setting it only changes when steps run, never what they do.
   */
  pace: 0.65,

  /** Black HP grows by this share of its wave-1 value each wave after the first. */
  blackHpGrowthPerWave: 0.35,

  /** Red squares show this long before a black move starts. */
  moveWarningSeconds: 0.4,
  /** Red squares show this long before a wave's pieces land. */
  landingWarningSeconds: 1.2,
  /** Red squares show this long before summoned knights land. */
  summonWarningSeconds: 0.8,
  /** Summoned knights land at most this many squares from the summoner along each axis: right next to it. */
  summonReach: 1,
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

  /** A pawn that doesn't fight (a medic) stops walking this far (along both axes together) from the pawn it follows. */
  followDistance: 1,

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

  pushes: {
    /** Each wave lands in this many pushes; the king always comes in the last one. */
    perWave: 3,
    /** The next push lands once the black pieces left are down to this share of the last push... */
    nextAtShareLeft: 0.25,
    /** ...or this many seconds after it, whichever comes first. */
    nextAfterSeconds: 25,
  },

  landing: {
    /** Chance that a piece lands in the ring around the swarm's centre rather than anywhere. */
    ringChance: 0.5,
    ringMinDistance: 3,
    ringMaxDistance: 7,
    /** While there is room, no piece lands closer than this to a white pawn along both axes. */
    keepClearOfPawns: 3,
    /** Random picks tried before falling back to the free square farthest from any pawn. */
    tries: 40,
  },

  crowding: {
    /** At this many white pawns, kills drop only the floor share. */
    swarmSize: 300,
    /** Kills always drop at least this share of the normal drop. */
    floor: 0.1,
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
