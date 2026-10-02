import { PAWN_TYPES } from "../catalog/pieces";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { spawnPlainPawns } from "./drops";
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

/** Each awake recruiter whose timer has run out spawns its plain pawns. */
export function pulseRecruiters(context: StepContext): void {
  // Pawns spawned in the loop must not be looked at, so the count is fixed first.
  const acting = context.pawns.length;
  for (let index = 0; index < acting; index++) {
    const recruiter = context.pawns[index];
    const recruits =
      recruiter === undefined
        ? undefined
        : PAWN_TYPES[recruiter.type].passiveEffect?.recruits;
    if (recruiter === undefined || recruits === undefined) continue;
    if (!isAlive(recruiter)) continue;
    recruiter.recruitLeft -= context.seconds;
    if (!hasRunOut(recruiter.recruitLeft) || !hasRunOut(recruiter.stunLeft)) {
      continue;
    }
    recruiter.recruitLeft = recruits.everySeconds;
    recruit(context, recruiter, recruits.count);
  }
}

/** A recruiter spawns `count` plain pawns beside itself. */
export function recruit(
  context: StepContext,
  recruiter: WorkingPawn,
  count: number,
): void {
  const at = { x: recruiter.x, y: recruiter.y };
  spawnPlainPawns(context, at, count);
  context.events.push({ type: "recruit", pawnId: recruiter.id, count, at });
}

/** A white pawn died: each berserker near it gathers attack, until the wave ends. */
export function growRage(context: StepContext, dead: WorkingPawn): void {
  for (const pawn of context.pawns) {
    const growth = PAWN_TYPES[pawn.type].passiveEffect?.growsOnNearbyDeath;
    if (growth === undefined || pawn === dead || !isAlive(pawn)) continue;
    if (Math.hypot(pawn.x - dead.x, pawn.y - dead.y) <= growth.radius) {
      pawn.rage += growth.amount;
    }
  }
}

/** A promoter standing at a board edge becomes a white queen at full HP. */
export function promoteAtEdges(context: StepContext): void {
  const { edgeMargin } = BATTLE_RULES;
  const slack = edgeMargin + 1e-6;
  for (const pawn of context.pawns) {
    const queen = PAWN_TYPES[pawn.type].passiveEffect?.promotesAtEdge;
    if (queen === undefined || pawn.promoted || !isAlive(pawn)) continue;
    const atEdge =
      pawn.x <= slack ||
      pawn.y <= slack ||
      pawn.x >= context.board.files - slack ||
      pawn.y >= context.board.ranks - slack;
    if (!atEdge) continue;
    pawn.promoted = true;
    pawn.maxHp = queen.hp;
    pawn.hp = queen.hp;
    context.events.push({
      type: "promote",
      pawnId: pawn.id,
      at: { x: pawn.x, y: pawn.y },
    });
  }
}
