import { liveAnimator } from "./animation";
import { ART_VIEW_BOX, type ArtId, DRAWINGS } from "./drawings";

/**
 * A piece's portrait for the DOM, e.g. a pawn type on a shop offer or in the
 * army list: the same drawing as on the board, as live SVG so its animation
 * plays. Size it with CSS. `label` is read out by screen readers, e.g. the
 * type's name. Pass a catalog pawn type id or black piece kind as `id`.
 */
export function portraitSvg(id: ArtId, label: string): string {
  const { min, size } = ART_VIEW_BOX;
  const safeLabel = label
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${String(min)} ${String(min)} ${String(size)} ${String(size)}" role="img" aria-label="${safeLabel}">${DRAWINGS[id](liveAnimator())}</svg>`;
}
