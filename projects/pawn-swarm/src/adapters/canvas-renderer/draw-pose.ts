import type { Point } from "../../board/square";
import type { Pose } from "./piece-motion";
import type { Sprite } from "./piece-art";

const FLASH_STRENGTH = 0.85;
/** A pose this close to standing still is drawn the cheap way. */
const NEARLY_ONE = 0.02;

/**
 * Draws a sprite with a pose: shifted, squashed, faded or flashed white.
 * Most posed pieces only shift (a lunge), and those take the cheap path: a
 * plain copy at an offset. Squashing needs a canvas transform; flashing needs
 * a white-tinted copy, made in one scratch canvas that only ever grows, so
 * it isn't resized for every piece.
 */
export function createPoseDrawer(
  context: CanvasRenderingContext2D,
  newScratchCanvas: () => HTMLCanvasElement,
  /** Where the canvas origin currently sits (the screen shake moves it); the transform returns here after a squash. */
  origin: Point,
): (sprite: Sprite, centre: Point, pose: Pose, squarePx: number) => void {
  let scratch: HTMLCanvasElement | undefined;
  let scratchContext: CanvasRenderingContext2D | null = null;

  const flashed = (sprite: Sprite, flash: number): CanvasImageSource => {
    scratch ??= newScratchCanvas();
    scratchContext ??= scratch.getContext("2d");
    if (scratchContext === null) return sprite.sheet;
    if (scratch.width < sprite.size || scratch.height < sprite.size) {
      scratch.width = Math.max(scratch.width, sprite.size);
      scratch.height = Math.max(scratch.height, sprite.size);
    }
    scratchContext.globalCompositeOperation = "source-over";
    scratchContext.clearRect(0, 0, sprite.size, sprite.size);
    scratchContext.drawImage(
      sprite.sheet,
      sprite.sourceX,
      0,
      sprite.size,
      sprite.size,
      0,
      0,
      sprite.size,
      sprite.size,
    );
    // Only paints where the sprite already has pixels.
    scratchContext.globalCompositeOperation = "source-atop";
    scratchContext.fillStyle = `rgb(255 255 255 / ${String(flash * FLASH_STRENGTH)})`;
    scratchContext.fillRect(0, 0, sprite.size, sprite.size);
    return scratch;
  };

  return (sprite, centre, pose, squarePx) => {
    const half = sprite.size / 2;
    const flashing = pose.flash > NEARLY_ONE;
    const source = flashing ? flashed(sprite, pose.flash) : sprite.sheet;
    const sourceX = flashing ? 0 : sprite.sourceX;
    const x = centre.x + pose.offset.x * squarePx;
    const y = centre.y - pose.offset.y * squarePx;
    const fading = pose.alpha < 1 - NEARLY_ONE;
    const squashed =
      Math.abs(pose.scaleX - 1) > NEARLY_ONE ||
      Math.abs(pose.scaleY - 1) > NEARLY_ONE;
    if (fading) context.globalAlpha *= pose.alpha;
    if (!squashed) {
      context.drawImage(
        source,
        sourceX,
        0,
        sprite.size,
        sprite.size,
        Math.round(x - half),
        Math.round(y - half),
        sprite.size,
        sprite.size,
      );
    } else {
      // Squash around the feet, not the middle, so a piece stays planted when it flattens.
      context.setTransform(
        pose.scaleX,
        0,
        0,
        pose.scaleY,
        origin.x + x,
        origin.y + y + half * 0.55,
      );
      context.drawImage(
        source,
        sourceX,
        0,
        sprite.size,
        sprite.size,
        -half,
        -half * 1.55,
        sprite.size,
        sprite.size,
      );
      context.setTransform(1, 0, 0, 1, origin.x, origin.y);
    }
    if (fading) context.globalAlpha /= pose.alpha;
  };
}
