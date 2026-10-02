import { PAWN_TYPES } from "../catalog/pieces";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingPawn,
} from "./step-context";

/** Gives a pawn back up to `amount` HP (never past full) and says so; does nothing at full HP. */
export function healPawn(
  context: StepContext,
  pawn: WorkingPawn,
  amount: number,
): void {
  const healed = Math.min(amount, pawn.maxHp - pawn.hp);
  if (healed <= 0) return;
  pawn.hp += healed;
  context.events.push({
    type: "heal",
    pawnId: pawn.id,
    amount: healed,
    at: { x: pawn.x, y: pawn.y },
  });
}

/** Each awake medic whose timer has run out heals the other pawns near it. */
export function pulseMedics(context: StepContext): void {
  for (const medic of context.pawns) {
    const heals = PAWN_TYPES[medic.type].passiveEffect?.heals;
    if (heals === undefined || !isAlive(medic)) continue;
    medic.healLeft -= context.seconds;
    if (!hasRunOut(medic.healLeft) || !hasRunOut(medic.stunLeft)) continue;
    medic.healLeft = heals.everySeconds;
    for (const pawn of context.pawns) {
      if (pawn === medic || !isAlive(pawn)) continue;
      if (Math.hypot(pawn.x - medic.x, pawn.y - medic.y) <= heals.radius) {
        healPawn(context, pawn, heals.amount);
      }
    }
  }
}

/** The pawns whose passive adds attack to the pawns around them, with what they add and how far. */
export function bannersOf(context: StepContext): WorkingPawn[] {
  return context.pawns.filter(
    (pawn) =>
      isAlive(pawn) &&
      PAWN_TYPES[pawn.type].passiveEffect?.extraAttackNearby !== undefined,
  );
}

/** The attack a pawn gains from banners near it (not from itself). */
export function bannerBonus(
  banners: readonly WorkingPawn[],
  pawn: WorkingPawn,
): number {
  let bonus = 0;
  for (const banner of banners) {
    const aura = PAWN_TYPES[banner.type].passiveEffect?.extraAttackNearby;
    if (banner === pawn || aura === undefined) continue;
    if (Math.hypot(pawn.x - banner.x, pawn.y - banner.y) <= aura.radius) {
      bonus += aura.amount;
    }
  }
  return bonus;
}
