import type { Point } from "../../board/square";
import { type Effect, TEXT_RISE_SPEED } from "./effects";

/** Draws one effect, faded by its age. `toPixels` turns board units into canvas pixels. */
export function drawEffect(
  context: CanvasRenderingContext2D,
  effect: Effect,
  toPixels: (point: Point) => Point,
  squarePx: number,
): void {
  const fade = 1 - effect.age / effect.life;
  context.globalAlpha = Math.max(0, fade);
  switch (effect.kind) {
    case "slash": {
      const from = toPixels(effect.from);
      const to = toPixels(effect.to);
      context.strokeStyle = effect.colour;
      context.lineWidth = Math.max(2, squarePx * 0.06);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      return;
    }
    case "ring": {
      const centre = toPixels(effect.at);
      context.strokeStyle = effect.colour;
      context.lineWidth = Math.max(3, squarePx * 0.09);
      context.beginPath();
      context.arc(
        centre.x,
        centre.y,
        effect.radius * squarePx * (1 - fade),
        0,
        Math.PI * 2,
      );
      context.stroke();
      return;
    }
    case "spark": {
      const centre = toPixels({
        x: effect.at.x + effect.velocity.x * effect.age,
        y: effect.at.y + effect.velocity.y * effect.age,
      });
      const size = Math.max(3, squarePx * 0.09);
      context.fillStyle = effect.colour;
      context.fillRect(centre.x - size / 2, centre.y - size / 2, size, size);
      return;
    }
    case "text": {
      const centre = toPixels({
        x: effect.at.x,
        y: effect.at.y + effect.age * TEXT_RISE_SPEED,
      });
      context.font = `700 ${String(Math.round(effect.size * squarePx))}px system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.lineWidth = Math.max(2, squarePx * 0.08);
      context.strokeStyle = "#15120e";
      context.strokeText(effect.text, centre.x, centre.y);
      context.fillStyle = effect.colour;
      context.fillText(effect.text, centre.x, centre.y);
      return;
    }
  }
}
