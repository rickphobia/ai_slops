import { BLACK_PIECE_DRAWINGS } from "./black-piece-drawings";
import { BLACK_TYPE_DRAWINGS } from "./black-type-drawings";
import { COMMON_PAWN_DRAWINGS } from "./common-pawn-drawings";
import { EPIC_PAWN_DRAWINGS } from "./epic-pawn-drawings";
import type { Drawing } from "./parts";
import { RARE_PAWN_DRAWINGS } from "./rare-pawn-drawings";

/**
 * Every drawing in the game, by art id. The ids match the catalog's pawn
 * type ids and black piece kinds, so types the rules don't have yet still
 * have their drawing waiting; the type checker flags a catalog id with no
 * drawing where the renderer maps pieces to art.
 */
export const PAWN_DRAWINGS = {
  ...COMMON_PAWN_DRAWINGS,
  ...RARE_PAWN_DRAWINGS,
  ...EPIC_PAWN_DRAWINGS,
} as const;

export type PawnArtId = keyof typeof PAWN_DRAWINGS;
export type BlackPieceArtId = keyof typeof BLACK_PIECE_DRAWINGS;
export type BlackTypeArtId = keyof typeof BLACK_TYPE_DRAWINGS;
export type ArtId = PawnArtId | BlackPieceArtId | BlackTypeArtId;

export const DRAWINGS: Readonly<Record<ArtId, Drawing>> = {
  ...PAWN_DRAWINGS,
  ...BLACK_PIECE_DRAWINGS,
  ...BLACK_TYPE_DRAWINGS,
};

function idsOf<Id extends string>(record: Readonly<Record<Id, Drawing>>): Id[] {
  return Object.keys(record) as Id[];
}

export const PAWN_ART_IDS: readonly PawnArtId[] = idsOf(PAWN_DRAWINGS);
export const BLACK_PIECE_ART_IDS: readonly BlackPieceArtId[] =
  idsOf(BLACK_PIECE_DRAWINGS);
export const BLACK_TYPE_ART_IDS: readonly BlackTypeArtId[] =
  idsOf(BLACK_TYPE_DRAWINGS);
export const ART_IDS: readonly ArtId[] = idsOf(DRAWINGS);

/** Which side a drawing belongs to: white pawns are pale bone, everything else is black. */
export function sideOfArt(id: ArtId): "white" | "black" {
  return id in PAWN_DRAWINGS ? "white" : "black";
}

/**
 * The drawing box plus a margin: a drawing is laid out in 0–100 but arms,
 * needles and lightning reach a little past it.
 */
export const ART_VIEW_BOX = { min: -10, size: 120 } as const;
