/** The page can't start because the browser or index.html lacks something the game needs. */
export class StartupError extends Error {
  override name = "StartupError";
}
