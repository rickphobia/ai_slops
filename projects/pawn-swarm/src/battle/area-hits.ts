import type { Point } from "../board/square";
import type { SkillHitArea } from "../catalog/pieces";
import { hurtPawn } from "./pawn-hits";
import type { SpatialGrid } from "./spatial-grid";
import type { StepContext, WorkingPawn } from "./step-context";

/** Whether `to` is in `area` around `from`: within a radius, or in the row or column of `from`. */
export function isInArea(area: SkillHitArea, from: Point, to: Point): boolean {
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

/** The farthest any point of `area` is from its centre. */
function reachOf(area: SkillHitArea): number {
  return area.shape === "around"
    ? area.radius
    : Math.hypot(area.reach, area.halfWidth);
}

/** Every pawn in `area` around `from` takes `damage`, as a hit. */
export function hitPawnsInArea(
  context: StepContext,
  pawns: SpatialGrid<WorkingPawn>,
  from: Point,
  area: SkillHitArea,
  damage: number,
): void {
  pawns.forEachNear(from, reachOf(area), (pawn) => {
    if (isInArea(area, from, pawn)) hurtPawn(context, pawn, damage, "hit");
  });
}
