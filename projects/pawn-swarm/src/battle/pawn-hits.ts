import { centreOf, type Point, type Square } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import type { HurtCause } from "./battle-state";
import type { SpatialGrid } from "./spatial-grid";
import { isAlive, type StepContext, type WorkingPawn } from "./step-context";

/** Every pawn standing on at least one of the squares takes the damage once. */
export function hitSquares(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  squares: readonly Square[],
  damage: number,
): void {
  const reach = BATTLE_RULES.squareHitReach;
  const isOnSquare = (pawn: Point, square: Square): boolean => {
    const centre = centreOf(square);
    return (
      Math.abs(pawn.x - centre.x) <= reach &&
      Math.abs(pawn.y - centre.y) <= reach
    );
  };
  const hit = new Set<WorkingPawn>();
  for (const square of squares) {
    pawns.forEachNear(centreOf(square), reach * Math.SQRT2, (pawn) => {
      if (isOnSquare(pawn, square)) hit.add(pawn);
    });
  }
  for (const pawn of hit) hurtPawn(context, pawn, damage, "hit");
}

export function hurtPawn(
  context: StepContext,
  pawn: WorkingPawn,
  damage: number,
  cause: HurtCause,
): void {
  if (!isAlive(pawn)) return;
  pawn.hp -= damage;
  const at = { x: pawn.x, y: pawn.y };
  context.events.push({
    type: "pawn-hurt",
    pawnId: pawn.id,
    damage,
    cause,
    at,
  });
  if (!isAlive(pawn)) {
    context.events.push({
      type: "death",
      id: pawn.id,
      piece: { side: "white", type: pawn.type },
      at,
    });
  }
}
