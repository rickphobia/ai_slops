import { centreOf } from "../board/square";
import { typeStatsOf } from "./black-type-rules";
import { hitPawnsInArea } from "./area-hits";
import type { SpatialGrid } from "./spatial-grid";
import {
  hasRunOut,
  isAlive,
  type StepContext,
  type WorkingBlackPiece,
  type WorkingPawn,
} from "./step-context";

/**
 * Counts down a special type's power timer and fires it when it runs out: a
 * priest heals black pieces near it, a cannon and a storm hurt pawns. Does
 * nothing for pieces whose type has no timed power (a summoner's knights are
 * called by its own timer, like the king's).
 */
export function useBlackPower(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  piece: WorkingBlackPiece,
): void {
  const type = typeStatsOf(piece);
  const everySeconds =
    type?.heals?.everySeconds ?? type?.hitsOnTimer?.everySeconds;
  if (
    type === undefined ||
    piece.type === undefined ||
    everySeconds === undefined
  ) {
    return;
  }
  piece.powerLeft -= context.seconds;
  if (!hasRunOut(piece.powerLeft)) return;
  piece.powerLeft = everySeconds;

  const at = centreOf(piece.square);
  if (type.heals !== undefined) healBlackPiecesNear(context, piece, type.heals);
  if (type.hitsOnTimer !== undefined) {
    hitPawnsInArea(
      context,
      pawns,
      at,
      type.hitsOnTimer.area,
      type.hitsOnTimer.damage,
    );
  }
  context.events.push({
    type: "black-power",
    id: piece.id,
    blackType: piece.type,
    at,
  });
}

function healBlackPiecesNear(
  context: StepContext,
  healer: WorkingBlackPiece,
  heals: { readonly amount: number; readonly radius: number },
): void {
  const from = centreOf(healer.square);
  for (const other of context.blackPieces) {
    if (other === healer || !isAlive(other) || other.hp >= other.maxHp)
      continue;
    const at = centreOf(other.square);
    if (Math.hypot(at.x - from.x, at.y - from.y) > heals.radius) continue;
    other.hp = Math.min(other.maxHp, other.hp + heals.amount);
  }
}
