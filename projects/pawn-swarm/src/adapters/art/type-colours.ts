import type { PawnArtId } from "./drawings";
import { BONE } from "./palette";

/**
 * Each pawn type's own colour, from the swarm prototype: the disc it stands
 * on, its strikes, and its name in the shop. The plain pawn stays bone, so the
 * types stand out in a plain crowd.
 */
export const PAWN_TYPE_COLOURS: Readonly<Record<PawnArtId, string>> = {
  plain: BONE,
  shield: "#7fb3ff",
  spear: "#f0d27a",
  twin: "#9be3c9",
  medic: "#ff9fb2",
  banner: "#ffb35c",
  bomb: "#ff6b4a",
  recruiter: "#c58bff",
  berserker: "#ff4f7a",
  promoter: "#ffe066",
  enPassant: "#7ef0ff",
};
