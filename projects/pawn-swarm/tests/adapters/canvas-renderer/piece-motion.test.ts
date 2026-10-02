import { describe, expect, it } from "vitest";
import {
  COLLAPSE_SECONDS,
  createPieceMotion,
  LUNGE_SECONDS,
  SLAM_FALL_SECONDS,
  SLAM_HEIGHT,
} from "../../../src/adapters/canvas-renderer/piece-motion";

const strike = {
  type: "strike",
  pawnId: 1,
  pawnType: "plain",
  targetId: 2,
  damage: 1,
  from: { x: 0, y: 0 },
  at: { x: 1, y: 0 },
} as const;

describe("piece motion", () => {
  it("lunges the pawn toward its target and back, and recoils and flashes the target", () => {
    const motion = createPieceMotion();
    motion.add([strike]);
    motion.advance(LUNGE_SECONDS / 2);
    const pawn = motion.poseOf(1);
    expect(pawn?.offset.x).toBeGreaterThan(0.2);
    const target = motion.poseOf(2);
    expect(target?.offset.x).toBeGreaterThan(0);
    expect(target?.flash).toBeGreaterThan(0);
    motion.advance(1);
    expect(motion.poseOf(1)).toBeUndefined();
    expect(motion.poseOf(2)).toBeUndefined();
  });

  it("flashes a pawn that is hurt", () => {
    const motion = createPieceMotion();
    motion.add([
      {
        type: "pawn-hurt",
        pawnId: 7,
        damage: 1,
        cause: "hit",
        at: { x: 0, y: 0 },
      },
    ]);
    expect(motion.poseOf(7)?.flash).toBe(1);
  });

  it("slams a landing piece down from above, then squashes it", () => {
    const motion = createPieceMotion();
    motion.add([{ type: "landed", id: 5, kind: "rook", at: { x: 3, y: 3 } }]);
    expect(motion.poseOf(5)?.offset.y).toBeCloseTo(SLAM_HEIGHT);
    motion.advance(SLAM_FALL_SECONDS + 0.01);
    const squashed = motion.poseOf(5);
    expect(squashed?.offset.y).toBe(0);
    expect(squashed?.scaleX).toBeGreaterThan(1);
    expect(squashed?.scaleY).toBeLessThan(1);
  });

  it("keeps a dead piece around while it collapses, then lets it go", () => {
    const motion = createPieceMotion();
    motion.add([
      strike,
      {
        type: "death",
        id: 2,
        piece: { side: "black", kind: "knight" },
        at: { x: 1, y: 0 },
      },
    ]);
    expect(motion.poseOf(2)).toBeUndefined();
    expect(motion.dying()).toHaveLength(1);
    motion.advance(COLLAPSE_SECONDS / 2);
    expect(motion.dying()[0]?.progress).toBeCloseTo(0.5);
    motion.advance(COLLAPSE_SECONDS);
    expect(motion.dying()).toEqual([]);
  });

  it("does not animate when paused: no time passes, no change", () => {
    const motion = createPieceMotion();
    motion.add([strike]);
    const before = motion.poseOf(1);
    motion.advance(0);
    expect(motion.poseOf(1)).toEqual(before);
  });
});
