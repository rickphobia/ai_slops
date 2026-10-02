import {
  ANIMATION_FRAMES,
  ANIMATION_LOOP_SECONDS,
  frameAnimator,
} from "./animation";
import { ART_VIEW_BOX, type ArtId, DRAWINGS, sideOfArt } from "./drawings";

/**
 * A faint grey-bone rim around black pieces, so a dark piece doesn't sink
 * into the dark board. Grey, not red or pale bone, so it reads neither as
 * blood nor as a white pawn.
 */
const BLACK_RIM = `<filter id="pawn-swarm-rim" x="-10%" y="-10%" width="120%" height="120%">
  <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="grown"/>
  <feFlood flood-color="#8c8072" flood-opacity=".75"/>
  <feComposite in2="grown" operator="in" result="rim"/>
  <feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

/**
 * One SVG image holding every animation frame of a drawing side by side,
 * each `cellPx` square. The canvas renderer decodes it once at startup and
 * cuts its sprites from it, so a battle never parses SVG.
 */
export function frameStripSvg(id: ArtId, cellPx: number): string {
  const { min, size } = ART_VIEW_BOX;
  const frameSeconds = ANIMATION_LOOP_SECONDS / ANIMATION_FRAMES;
  const black = sideOfArt(id) === "black";
  const frames = Array.from({ length: ANIMATION_FRAMES }, (_, index) => {
    const offsetX = index * size - min;
    const drawing = DRAWINGS[id](frameAnimator(index * frameSeconds));
    const rim = black ? ' filter="url(#pawn-swarm-rim)"' : "";
    return `<g transform="translate(${String(offsetX)} ${String(-min)})" clip-path="url(#pawn-swarm-cell)"><g${rim}>${drawing}</g></g>`;
  }).join("");
  const width = ANIMATION_FRAMES * size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${String(ANIMATION_FRAMES * cellPx)}" height="${String(cellPx)}" viewBox="0 0 ${String(width)} ${String(size)}"><defs>${black ? BLACK_RIM : ""}<clipPath id="pawn-swarm-cell"><rect x="${String(min)}" y="${String(min)}" width="${String(size)}" height="${String(size)}"/></clipPath></defs>${frames}</svg>`;
}
