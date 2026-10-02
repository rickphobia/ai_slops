import { isSameSquare, type Square } from "../board/square";
import type { BlackPiece, Landing } from "./battle-state";

/**
 * The squares black holds: the ones its pieces stand on or are moving to, and
 * the ones pieces are about to land on. No black piece may land on or pass
 * through these, so pieces never share a square. `except` leaves out a piece's
 * own squares, for that piece choosing its next move.
 */
export function squaresHeldByBlack(
  blackPieces: readonly Pick<BlackPiece, "square" | "move" | "hp">[],
  landings: readonly Pick<Landing, "square">[],
  except?: Pick<BlackPiece, "square" | "move" | "hp">,
): Square[] {
  return [
    ...blackPieces
      .filter((piece) => piece !== except && piece.hp > 0)
      .flatMap((piece) =>
        piece.move === undefined
          ? [piece.square]
          : [piece.square, piece.move.to],
      ),
    ...landings.map((landing) => landing.square),
  ];
}

export function isAmong(squares: readonly Square[], square: Square): boolean {
  return squares.some((other) => isSameSquare(other, square));
}
