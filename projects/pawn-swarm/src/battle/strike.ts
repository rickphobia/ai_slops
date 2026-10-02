import { blackPiecePosition } from "./piece-position";
import { killBlackPiece } from "./drops";
import {
  isAlive,
  type StepContext,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/** One blow from `pawn` to `target`: its own strike or a skill's hit. A kill drops pawns. */
export function strike(
  context: StepContext,
  pawn: WorkingPawn,
  target: WorkingBlackPiece,
  damage: number,
): void {
  const targetCentre = blackPiecePosition(target);
  target.hp -= damage;
  context.events.push({
    type: "strike",
    pawnId: pawn.id,
    pawnType: pawn.type,
    targetId: target.id,
    damage,
    from: { x: pawn.x, y: pawn.y },
    at: targetCentre,
  });
  if (!isAlive(target)) killBlackPiece(context, target, targetCentre);
}
