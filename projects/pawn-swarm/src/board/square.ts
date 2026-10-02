export type Side = "white" | "black";

/** A board square. File 0 is the left edge; rank 0 is white's side. */
export interface Square {
  readonly file: number;
  readonly rank: number;
}

export function isOnBoard(square: Square, size: number): boolean {
  return (
    square.file >= 0 &&
    square.file < size &&
    square.rank >= 0 &&
    square.rank < size
  );
}

export function isSameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}
