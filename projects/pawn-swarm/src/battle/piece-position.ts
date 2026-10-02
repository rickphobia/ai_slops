import { centreOf, type Point } from "../board/square";
import type { BlackPiece } from "./battle-state";

/**
 * Where a black piece is right now: its square's centre, or partway along its
 * move while it is in the air. Pawns chase this point, as in the prototype, so
 * they meet a jumping knight where it lands rather than where it left.
 */
export function blackPiecePosition(
  piece: Pick<BlackPiece, "square" | "move">,
): Point {
  const from = centreOf(piece.square);
  const move = piece.move;
  if (move?.phase !== "moving") return from;
  const progress = 1 - move.secondsLeft / move.phaseSeconds;
  const to = centreOf(move.to);
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}
