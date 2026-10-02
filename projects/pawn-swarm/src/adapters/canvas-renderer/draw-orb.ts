import type { PowerUpOrb } from "../../battle/battle-state";
import type { Point } from "../../board/square";
import { POWER_UP_RULES, POWER_UPS } from "../../catalog/power-ups";

const ORB_RADIUS_SQUARES = 0.26;
/** How many times a dying orb blinks per game second. */
const ORB_BLINKS_PER_SECOND = 4;
const ORB_OUTLINE = "#15120e";

/**
 * Draws a power-up orb at `centre` (canvas pixels): a glowing disc with its
 * symbol, pulsing, and blinking when it is about to vanish.
 */
export function drawOrb(
  context: CanvasRenderingContext2D,
  orb: PowerUpOrb,
  centre: Point,
  squarePx: number,
  nowSeconds: number,
): void {
  const blinkedOut =
    orb.secondsLeft < POWER_UP_RULES.blinkSeconds &&
    Math.floor(orb.secondsLeft * ORB_BLINKS_PER_SECOND * 2) % 2 === 0;
  if (blinkedOut) return;
  const stats = POWER_UPS[orb.powerUp];
  const radius =
    squarePx *
    ORB_RADIUS_SQUARES *
    (1 + 0.1 * Math.sin(nowSeconds * 8 + orb.id));
  const glow = context.createRadialGradient(
    centre.x,
    centre.y,
    radius * 0.2,
    centre.x,
    centre.y,
    radius * 1.8,
  );
  glow.addColorStop(0, stats.colour);
  glow.addColorStop(1, "rgb(0 0 0 / 0%)");
  context.globalAlpha = 0.55;
  context.fillStyle = glow;
  context.fillRect(
    centre.x - radius * 1.8,
    centre.y - radius * 1.8,
    radius * 3.6,
    radius * 3.6,
  );
  context.globalAlpha = 1;
  context.beginPath();
  context.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
  context.fillStyle = stats.colour;
  context.fill();
  context.lineWidth = Math.max(2, squarePx * 0.05);
  context.strokeStyle = ORB_OUTLINE;
  context.stroke();
  context.font = `bold ${String(Math.round(radius * 1.3))}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = ORB_OUTLINE;
  context.fillText(stats.symbol, centre.x, centre.y + radius * 0.05);
}
