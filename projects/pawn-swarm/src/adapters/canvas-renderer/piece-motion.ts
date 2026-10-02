import type { BattleEvent, PieceIdentity } from "../../battle/battle-state";
import type { Point } from "../../board/square";

/** How to draw one piece this frame, on top of where the rules put it. */
export interface Pose {
  /** Shift in squares (board units, y up). */
  readonly offset: Point;
  /** 0–1: how white the piece flashes. */
  readonly flash: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly alpha: number;
}

/** A piece that just died, collapsing where it stood. */
export interface Dying {
  readonly id: number;
  readonly piece: PieceIdentity;
  readonly at: Point;
  /** 0 → 1 over the collapse. */
  readonly progress: number;
}

export interface PieceMotion {
  /** Starts animations from one step's events. */
  add(events: readonly BattleEvent[]): void;
  /** Ages every animation by `seconds` of game time. */
  advance(seconds: number): void;
  clear(): void;
  /** The pose for a living piece, or undefined when it just stands there. */
  poseOf(id: number): Pose | undefined;
  /** Pieces mid-collapse, to draw where they died. */
  dying(): readonly Dying[];
}

export const LUNGE_SECONDS = 0.14;
export const LUNGE_SQUARES = 0.3;
export const HIT_SECONDS = 0.2;
export const RECOIL_SQUARES = 0.14;
export const SLAM_FALL_SECONDS = 0.16;
export const SLAM_SQUASH_SECONDS = 0.14;
/** How high a landing piece starts above its square, in squares. */
export const SLAM_HEIGHT = 1.6;
export const COLLAPSE_SECONDS = 0.45;
/** More dying pieces than this at once are not drawn: a mass death is already noisy enough. */
const MAX_DYING = 160;

interface Anim {
  lungeAge: number;
  lungeDir: Point;
  hitAge: number;
  hitDir: Point;
  slamAge: number;
}

const NO_ANIM: Anim = {
  lungeAge: Infinity,
  lungeDir: { x: 0, y: 0 },
  hitAge: Infinity,
  hitDir: { x: 0, y: 0 },
  slamAge: Infinity,
};

function directionBetween(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return length === 0 ? { x: 0, y: 0 } : { x: dx / length, y: dy / length };
}

/**
 * Pose and collapse animations for pieces, started by battle events and aged
 * with game time (so they freeze on pause and slow with the game). The
 * renderer reads them; the rules never do.
 */
export function createPieceMotion(): PieceMotion {
  const anims = new Map<number, Anim>();
  let dying: (Dying & { age: number })[] = [];

  const animOf = (id: number): Anim => {
    let anim = anims.get(id);
    if (anim === undefined) {
      anim = { ...NO_ANIM };
      anims.set(id, anim);
    }
    return anim;
  };

  const addEvent = (event: BattleEvent): void => {
    switch (event.type) {
      case "strike": {
        const direction = directionBetween(event.from, event.at);
        const striker = animOf(event.pawnId);
        striker.lungeAge = 0;
        striker.lungeDir = direction;
        const target = animOf(event.targetId);
        target.hitAge = 0;
        target.hitDir = direction;
        return;
      }
      case "pawn-hurt": {
        const pawn = animOf(event.pawnId);
        pawn.hitAge = 0;
        pawn.hitDir = { x: 0, y: 0 };
        return;
      }
      case "landed":
        animOf(event.id).slamAge = 0;
        return;
      case "death":
        anims.delete(event.id);
        if (dying.length < MAX_DYING) {
          dying.push({
            id: event.id,
            piece: event.piece,
            at: event.at,
            progress: 0,
            age: 0,
          });
        }
        return;
      default:
        return;
    }
  };

  const finished = (anim: Anim): boolean =>
    anim.lungeAge >= LUNGE_SECONDS &&
    anim.hitAge >= HIT_SECONDS &&
    anim.slamAge >= SLAM_FALL_SECONDS + SLAM_SQUASH_SECONDS;

  return {
    add: (events) => {
      for (const event of events) addEvent(event);
    },
    advance: (seconds) => {
      for (const [id, anim] of anims) {
        anim.lungeAge += seconds;
        anim.hitAge += seconds;
        anim.slamAge += seconds;
        if (finished(anim)) anims.delete(id);
      }
      for (const piece of dying) piece.age += seconds;
      dying = dying.filter((piece) => piece.age < COLLAPSE_SECONDS);
    },
    clear: () => {
      anims.clear();
      dying = [];
    },
    poseOf: (id) => {
      const anim = anims.get(id);
      if (anim === undefined) return undefined;
      let x = 0;
      let y = 0;
      let flash = 0;
      let scaleX = 1;
      let scaleY = 1;
      let alpha = 1;
      if (anim.lungeAge < LUNGE_SECONDS) {
        const reach =
          Math.sin((anim.lungeAge / LUNGE_SECONDS) * Math.PI) * LUNGE_SQUARES;
        x += anim.lungeDir.x * reach;
        y += anim.lungeDir.y * reach;
      }
      if (anim.hitAge < HIT_SECONDS) {
        const left = 1 - anim.hitAge / HIT_SECONDS;
        flash = left;
        x += anim.hitDir.x * RECOIL_SQUARES * left;
        y += anim.hitDir.y * RECOIL_SQUARES * left;
        scaleY *= 1 - 0.12 * left;
        scaleX *= 1 + 0.08 * left;
      }
      if (anim.slamAge < SLAM_FALL_SECONDS) {
        const fall = anim.slamAge / SLAM_FALL_SECONDS;
        // Speeds up as it falls, like something heavy.
        y += SLAM_HEIGHT * (1 - fall * fall);
        alpha = Math.min(1, 0.3 + fall);
      } else if (anim.slamAge < SLAM_FALL_SECONDS + SLAM_SQUASH_SECONDS) {
        const left =
          1 - (anim.slamAge - SLAM_FALL_SECONDS) / SLAM_SQUASH_SECONDS;
        scaleX *= 1 + 0.25 * left;
        scaleY *= 1 - 0.25 * left;
      }
      return { offset: { x, y }, flash, scaleX, scaleY, alpha };
    },
    dying: () =>
      dying.map((piece) => ({
        id: piece.id,
        piece: piece.piece,
        at: piece.at,
        progress: piece.age / COLLAPSE_SECONDS,
      })),
  };
}
