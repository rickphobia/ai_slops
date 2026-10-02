import { PAWN_TYPES, type PawnStats } from "../catalog/pieces";
import type { WorkingPawn } from "./step-context";

/** The numbers a pawn fights with. */
export type PawnBody = Pick<
  PawnStats,
  "attack" | "speed" | "strikeCooldown" | "range"
>;

/** What a pawn fights with right now: its type's numbers, or a white queen's once a promoter has promoted. */
export function bodyOf(pawn: Pick<WorkingPawn, "type" | "promoted">): PawnBody {
  const stats = PAWN_TYPES[pawn.type];
  const queen = stats.passiveEffect?.promotesAtEdge;
  return pawn.promoted && queen !== undefined ? queen : stats;
}
