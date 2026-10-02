import { POWER_UP_RULES, POWER_UPS } from "../catalog/power-ups";
import { spawnPlainPawns } from "./drops";
import { healPawn } from "./passives";
import { startPowerUp } from "./power-ups";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingOrb,
  type WorkingPawn,
} from "./step-context";

/**
 * Orbs age, drift toward the nearest pawn within reach, and trigger when a
 * pawn touches one. A trigger works for the whole swarm and uses the orb up.
 */
export function moveOrbs(context: StepContext): void {
  const { attractRadius, driftSpeed, pickupRadius, popSeconds } =
    POWER_UP_RULES;
  for (const orb of context.orbs) {
    orb.secondsLeft -= context.seconds;
    if (hasRunOut(orb.secondsLeft)) continue;
    if (POWER_UP_RULES.lifetimeSeconds - orb.secondsLeft < popSeconds) continue;
    const near = nearestPawn(context.pawns, orb);
    if (near === undefined || near.distance > attractRadius) continue;
    if (near.distance <= pickupRadius) {
      collect(context, orb);
      orb.secondsLeft = 0;
      continue;
    }
    const step = Math.min(driftSpeed * context.seconds, near.distance);
    orb.x += ((near.pawn.x - orb.x) / near.distance) * step;
    orb.y += ((near.pawn.y - orb.y) / near.distance) * step;
  }
  context.orbs = context.orbs.filter((orb) => !hasRunOut(orb.secondsLeft));
}

function nearestPawn(
  pawns: readonly WorkingPawn[],
  from: WorkingOrb,
): { readonly pawn: WorkingPawn; readonly distance: number } | undefined {
  let nearest: { pawn: WorkingPawn; distance: number } | undefined;
  for (const pawn of pawns) {
    if (!isAlive(pawn)) continue;
    const distance = Math.hypot(pawn.x - from.x, pawn.y - from.y);
    if (nearest === undefined || distance < nearest.distance) {
      nearest = { pawn, distance };
    }
  }
  return nearest;
}

function collect(context: StepContext, orb: WorkingOrb): void {
  const at = { x: orb.x, y: orb.y };
  context.events.push({
    type: "power-up",
    id: orb.id,
    powerUp: orb.powerUp,
    at,
  });
  switch (orb.powerUp) {
    case "heal":
      for (const pawn of context.pawns) {
        if (isAlive(pawn)) healPawn(context, pawn, pawn.maxHp - pawn.hp);
      }
      return;
    case "reinforcements":
      spawnPlainPawns(context, at, POWER_UP_RULES.reinforcementPawns);
      return;
    case "haste":
    case "fury":
    case "freeze":
    case "bounty":
      context.powerUps = startPowerUp(
        context.powerUps,
        orb.powerUp,
        POWER_UPS[orb.powerUp].seconds ?? 0,
      );
      return;
  }
}
