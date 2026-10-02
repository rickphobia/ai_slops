/** A drawing that can't be drawn: an animation that doesn't loop cleanly, or values that don't line up. */
export class ArtError extends Error {
  override name = "ArtError";
}
