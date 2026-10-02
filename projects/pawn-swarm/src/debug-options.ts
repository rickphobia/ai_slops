/** Most pawns `?pawns=` may start a run with; enough to test a big swarm. */
export const MAX_DEBUG_PAWNS = 1000;

/**
 * `?pawns=300` in the page URL starts every run with that many plain pawns,
 * to check how a big swarm plays and performs. Returns undefined when it is
 * absent, and an error message when it is not a whole number in range.
 */
export function startingPawnsFromQuery(
  search: string,
): { pawns: number | undefined } | { error: string } {
  const raw = new URLSearchParams(search).get("pawns");
  if (raw === null) return { pawns: undefined };
  const pawns = Number(raw);
  if (!/^\d+$/.test(raw) || pawns < 1 || pawns > MAX_DEBUG_PAWNS) {
    return {
      error: `?pawns= must be a whole number from 1 to ${String(MAX_DEBUG_PAWNS)}, got "${raw}".`,
    };
  }
  return { pawns };
}
