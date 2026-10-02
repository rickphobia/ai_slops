import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES, type SkillStats } from "../catalog/pieces";
import { recruit } from "./passives";
import { hurtPawn } from "./pawn-hits";
import { bodyOf } from "./pawn-body";
import { blackPiecePosition, nearestBlackPiece } from "./piece-position";
import { isAlive, type StepContext, type WorkingPawn } from "./step-context";

/**
 * The parts of a skill that act on the pawns of its own type one by one:
 * Call to arms, Frenzy's HP cost, Rush and Sidestep's leap, Sidestep's dodge.
 */
export function applyPawnSkill(
  context: StepContext,
  skill: SkillStats,
  firing: readonly WorkingPawn[],
): void {
  for (const pawn of firing) {
    if (!isAlive(pawn)) continue;
    if (skill.recruits !== undefined) recruit(context, pawn, skill.recruits);
    if (skill.costsHp !== undefined) {
      hurtPawn(context, pawn, skill.costsHp, "skill");
    }
    if (skill.refreshesDodge === true) pawn.dodgeReady = true;
    if (skill.leaps !== undefined) leap(context, pawn, skill.leaps.squares);
  }
}

/**
 * Jumps `pawn` in a straight line toward the nearest black piece, at most
 * `squares`, stopping where it can strike. A stunned pawn can't jump.
 */
function leap(context: StepContext, pawn: WorkingPawn, squares: number): void {
  if (!isAlive(pawn) || pawn.stunLeft > 0) return;
  const target = nearestBlackPiece(context.blackPieces, pawn);
  if (target === undefined) return;
  const at = blackPiecePosition(target);
  const gap = Math.hypot(at.x - pawn.x, at.y - pawn.y);
  // Stop a little inside strike range so it hits on landing rather than just outside it.
  const strikeGap =
    (bodyOf(pawn).range + BLACK_PIECES[target.kind].bodyRadius) * 0.9;
  const travel = Math.min(squares, gap - strikeGap);
  if (travel <= 0) return;

  const from = { x: pawn.x, y: pawn.y };
  const { edgeMargin, board } = { ...BATTLE_RULES, board: context.board };
  pawn.x = clamp(
    pawn.x + ((at.x - pawn.x) / gap) * travel,
    edgeMargin,
    board.files - edgeMargin,
  );
  pawn.y = clamp(
    pawn.y + ((at.y - pawn.y) / gap) * travel,
    edgeMargin,
    board.ranks - edgeMargin,
  );
  context.events.push({
    type: "leap",
    pawnId: pawn.id,
    pawnType: pawn.type,
    from,
    at: { x: pawn.x, y: pawn.y },
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
