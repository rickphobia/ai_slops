import type { Point } from "../board/square";
import { POWER_UP_IDS, POWER_UP_RULES } from "../catalog/power-ups";
import { BLACK_PIECES } from "../catalog/pieces";
import {
  type StepContext,
  takeId,
  type WorkingBlackPiece,
} from "./step-context";

/** The chance a kill of this piece drops an orb: rooks and queens most, then special types, then the rest. */
export function orbChance(
  piece: Pick<WorkingBlackPiece, "kind" | "type">,
): number {
  const { rookOrQueenChance, specialTypeChance, otherChance } = POWER_UP_RULES;
  if (piece.kind === "rook" || piece.kind === "queen") return rookOrQueenChance;
  return piece.type === undefined ? otherChance : specialTypeChance;
}

/** A killed piece sometimes leaves an orb of a random power-up where it fell. */
export function maybeDropOrb(
  context: StepContext,
  piece: WorkingBlackPiece,
  at: Point,
): void {
  if (BLACK_PIECES[piece.kind].isKing === true) return;
  if (context.random.next() >= orbChance(piece)) return;
  const powerUp =
    POWER_UP_IDS[Math.floor(context.random.next() * POWER_UP_IDS.length)];
  if (powerUp === undefined) return;
  const id = takeId(context);
  context.orbs.push({
    id,
    powerUp,
    x: at.x,
    y: at.y,
    secondsLeft: POWER_UP_RULES.lifetimeSeconds,
  });
  context.events.push({ type: "orb-drop", id, powerUp, at });
}
