import type { Point } from "../../board/square";
import type { Pose } from "./piece-motion";
import type { Sprite } from "./piece-art";

const FLASH_STRENGTH = 0.85;

/**
 * Draws a sprite with a pose: shifted, squashed, faded or flashed white. The
 * flash needs a tinted copy, made in one small scratch canvas that is reused.
 */
export function createPoseDrawer(
  context: CanvasRenderingContext2D,
  newScratchCanvas: () => HTMLCanvasElement,
): (sprite: Sprite, centre: Point, pose: Pose, squarePx: number) => void {
  let scratch: HTMLCanvasElement | undefined;
  let scratchContext: CanvasRenderingContext2D | null = null;

  const flashed = (sprite: Sprite, flash: number): CanvasImageSource => {
    scratch ??= newScratchCanvas();
    scratchContext ??= scratch.getContext("2d");
    if (scratchContext === null) return sprite.sheet;
    if (scratch.width !== sprite.size || scratch.height !== sprite.size) {
      scratch.width = sprite.size;
      scratch.height = sprite.size;
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
    const useFlash = pose.flash > 0.02;
    const source = useFlash ? flashed(sprite, pose.flash) : sprite.sheet;
    const sourceX = useFlash ? 0 : sprite.sourceX;
    context.save();
    context.globalAlpha *= pose.alpha;
    // Squash around the feet, not the middle, so a piece stays planted when it flattens.
    const feetY = centre.y - pose.offset.y * squarePx + half * 0.55;
    context.translate(centre.x + pose.offset.x * squarePx, feetY);
    context.scale(pose.scaleX, pose.scaleY);
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
    context.restore();
  };
}
