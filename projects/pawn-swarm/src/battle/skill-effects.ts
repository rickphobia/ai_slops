import type { Point } from "../board/square";
import {
  type LastingSkillEffect,
  PAWN_TYPES,
  type PawnTypeId,
  type SkillHitArea,
} from "../catalog/pieces";
import { skillBlocker, startTimer } from "../skills/skills";
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

/** The lasting skill running for pawns of `type` this step, if any. */
export function lastingEffect(
  context: Pick<StepContext, "lastingSkills">,
  type: PawnTypeId,
): LastingSkillEffect | undefined {
  const secondsLeft = context.lastingSkills[type];
  if (secondsLeft === undefined || hasRunOut(secondsLeft)) return undefined;
  return PAWN_TYPES[type].skill.lasting;
}

/** A pawn's damage per strike, with any lasting skill's bonus. */
export function strikeDamage(context: StepContext, pawn: WorkingPawn): number {
  return (
    PAWN_TYPES[pawn.type].attack +
    (lastingEffect(context, pawn.type)?.extraAttack ?? 0)
  );
}

/** A pawn's walking speed in squares per second, with any lasting skill's factor. */
export function walkingSpeed(context: StepContext, pawn: WorkingPawn): number {
  return (
    PAWN_TYPES[pawn.type].speed *
    (lastingEffect(context, pawn.type)?.speedFactor ?? 1)
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

function isInArea(area: SkillHitArea, from: Point, to: Point): boolean {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  switch (area.shape) {
    case "around":
      return Math.hypot(dx, dy) <= area.radius;
    case "row-and-column":
      return (
        (dx <= area.halfWidth && dy <= area.reach) ||
        (dy <= area.halfWidth && dx <= area.reach)
      );
  }
}
