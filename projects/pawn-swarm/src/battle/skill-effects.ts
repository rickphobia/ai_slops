import {
  type LastingSkillEffect,
  PAWN_TYPES,
  type PawnTypeId,
} from "../catalog/pieces";
import { POWER_UP_RULES } from "../catalog/power-ups";
import { isInArea } from "./area-hits";
import { isRunning } from "./power-ups";
import { skillBlocker, startTimer } from "../skills/skills";
import { explode } from "./explosions";
import { healPawn, growRage } from "./passives";
import { bodyOf } from "./pawn-body";
import { applyPawnSkill } from "./pawn-skills";
import { blackPiecePosition } from "./piece-position";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingPawn,
} from "./step-context";
import { strike } from "./strike";

/**
 * Fires each skill the player used, for every pawn of its type. A use the
 * rules refuse (no pawns, on cooldown, already fired this step) does nothing,
 * so a replay plays the same whatever was pressed.
 */
export function fireSkills(
  context: StepContext,
  uses: readonly PawnTypeId[],
): void {
  for (const type of uses) {
    const living = context.pawns.filter(isAlive);
    if (skillBlocker(context.skillCooldowns, living, type) !== undefined) {
      continue;
    }
    const skill = PAWN_TYPES[type].skill;
    context.skillCooldowns = startTimer(
      context.skillCooldowns,
      type,
      skill.cooldown,
    );
    if (skill.lasting !== undefined) {
      context.lastingSkills = startTimer(
        context.lastingSkills,
        type,
        skill.lasting.seconds,
      );
    }
    const firing = living.filter((pawn) => pawn.type === type);
    context.events.push({
      type: "skill",
      pawnType: type,
      pawns: firing.length,
    });
    if (skill.healsEveryone === true) healEveryone(context, living);
    if (skill.detonates === true) detonateAll(context, firing);
    applyPawnSkill(context, skill, firing);
    const hit = skill.hit;
    if (hit === undefined) continue;
    for (const pawn of firing) {
      for (const piece of context.blackPieces) {
        if (
          isAlive(piece) &&
          isInArea(hit.area, pawn, blackPiecePosition(piece))
        ) {
          strike(context, pawn, piece, hit.damage);
        }
      }
    }
  }
}

function healEveryone(
  context: StepContext,
  pawns: readonly WorkingPawn[],
): void {
  for (const pawn of pawns) healPawn(context, pawn, pawn.maxHp - pawn.hp);
}

/** Every bomb dies and explodes, one after another: a bomb in another's blast is stunned, but already counted out. */
function detonateAll(
  context: StepContext,
  bombs: readonly WorkingPawn[],
): void {
  for (const bomb of bombs) {
    bomb.hp = 0;
    context.events.push({
      type: "death",
      id: bomb.id,
      piece: { side: "white", type: bomb.type },
      at: { x: bomb.x, y: bomb.y },
    });
  }
  for (const bomb of bombs) growRage(context, bomb);
  for (const bomb of bombs) explode(context, bomb);
}

/** The lasting skill running for pawns of `type` this step, if any. */
export function lastingEffect(
  context: Pick<StepContext, "lastingSkills">,
  type: PawnTypeId,
): LastingSkillEffect | undefined {
  const secondsLeft = context.lastingSkills[type];
  if (secondsLeft === undefined || hasRunOut(secondsLeft)) return undefined;
  return PAWN_TYPES[type].skill.lasting;
}

/**
 * The lasting skills changing this pawn right now: its own type's, and any
 * that affect everyone (Rally).
 */
function effectsOn(
  context: Pick<StepContext, "lastingSkills">,
  pawn: WorkingPawn,
): LastingSkillEffect[] {
  const effects: LastingSkillEffect[] = [];
  for (const type of Object.keys(context.lastingSkills) as PawnTypeId[]) {
    const effect = lastingEffect(context, type);
    if (effect === undefined) continue;
    if (type === pawn.type || effect.affects === "everyone") {
      effects.push(effect);
    }
  }
  return effects;
}

/** A pawn's damage per strike, with any lasting skill's bonus and a banner's aura (`auraBonus`). */
export function strikeDamage(
  context: StepContext,
  pawn: WorkingPawn,
  auraBonus: number,
): number {
  return (
    bodyOf(pawn).attack +
    pawn.rage +
    auraBonus +
    effectsOn(context, pawn).reduce(
      (total, effect) => total + (effect.extraAttack ?? 0),
      0,
    ) +
    (isRunning(context, "fury") ? POWER_UP_RULES.furyExtraAttack : 0)
  );
}

/** A pawn's walking speed in squares per second, with any lasting skills' factors. */
export function walkingSpeed(context: StepContext, pawn: WorkingPawn): number {
  const speed = effectsOn(context, pawn).reduce(
    (speed, effect) => speed * (effect.speedFactor ?? 1),
    bodyOf(pawn).speed,
  );
  return isRunning(context, "haste")
    ? speed * POWER_UP_RULES.hasteSpeedFactor
    : speed;
}

/** Seconds a pawn waits after a strike, with any lasting skills' factors. */
export function strikeCooldown(
  context: StepContext,
  pawn: WorkingPawn,
): number {
  return effectsOn(context, pawn).reduce(
    (seconds, effect) => seconds / (effect.strikeSpeedFactor ?? 1),
    bodyOf(pawn).strikeCooldown,
  );
}

/** How far black pieces are drawn to a pawn of `type`, if they are at all. */
export function drawsBlackWithin(
  context: Pick<StepContext, "lastingSkills">,
  type: PawnTypeId,
): number | undefined {
  return (
    lastingEffect(context, type)?.drawsBlackWithin ??
    PAWN_TYPES[type].drawsBlackWithin
  );
}
