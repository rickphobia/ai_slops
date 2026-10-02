import type { Point } from "../../board/square";
import { EFFECT_COLOURS, type Effect, TEXT_RISE_SPEED } from "./effects";
import type { ParticlePool } from "./particles";

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
    case "blood-pool": {
      const centre = toPixels(effect.at);
      // Pools stay dark for most of their life, then dry out.
      context.globalAlpha = Math.min(1, fade * 2.5) * 0.6;
      context.fillStyle = EFFECT_COLOURS.bloodDark;
      context.beginPath();
      context.ellipse(
        centre.x,
        centre.y + squarePx * 0.3,
        effect.radius * squarePx,
        effect.radius * squarePx * 0.45,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
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

/** Draws every live particle: blood as small drops, gibs as chunky pieces, sparks as specks. */
export function drawParticles(
  context: CanvasRenderingContext2D,
  particles: ParticlePool,
  toPixels: (point: Point) => Point,
  squarePx: number,
): void {
  let lastColour = "";
  particles.forEach((kind, colour, x, y, size, fade) => {
    if (colour !== lastColour) {
      context.fillStyle = colour;
      lastColour = colour;
    }
    const centre = toPixels({ x, y });
    // Gibs stay solid until the end; blood and sparks fade out.
    context.globalAlpha = kind === "gib" ? Math.min(1, fade * 3) : fade;
    const width = Math.max(2, size * squarePx);
    const height = kind === "gib" ? width * 0.7 : width;
    context.fillRect(
      centre.x - width / 2,
      centre.y - height / 2,
      width,
      height,
    );
  });
}
