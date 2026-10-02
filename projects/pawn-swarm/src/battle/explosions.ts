import { PAWN_TYPES } from "../catalog/pieces";
import { killBlackPiece } from "./drops";
import { blackPiecePosition } from "./piece-position";
import { isAlive, type StepContext, type WorkingPawn } from "./step-context";

/**
 * A bomb pawn blows up where it stands. Black pieces whose centre is in the
 * blast take its damage; every other white pawn in it is stunned and loses no
 * HP, so a bomb is never a risk to its own army. Does nothing for other types.
 */
export function explode(context: StepContext, bomb: WorkingPawn): void {
  const blast = PAWN_TYPES[bomb.type].passiveEffect?.explodes;
  if (blast === undefined) return;

  for (const piece of context.blackPieces) {
    if (!isAlive(piece)) continue;
    const at = blackPiecePosition(piece);
    if (Math.hypot(at.x - bomb.x, at.y - bomb.y) > blast.radius) continue;
    piece.hp -= blast.damage;
    if (!isAlive(piece)) killBlackPiece(context, piece, at);
  }

  let stunned = 0;
  for (const pawn of context.pawns) {
    if (pawn === bomb || !isAlive(pawn)) continue;
    if (Math.hypot(pawn.x - bomb.x, pawn.y - bomb.y) > blast.radius) continue;
    pawn.stunLeft = Math.max(pawn.stunLeft, blast.stunSeconds);
    stunned += 1;
  }
  context.events.push({
    type: "blast",
    pawnId: bomb.id,
    radius: blast.radius,
    stunned,
    at: { x: bomb.x, y: bomb.y },
  });
}
