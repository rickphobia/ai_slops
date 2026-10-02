import { BATTLE_RULES } from "../catalog/battle-rules";
import { BLACK_PIECES, type BlackKind } from "../catalog/pieces";
import type { Wave } from "../catalog/waves";
import type { Random } from "../rng";
import { planPushLandings } from "./landing-squares";
import { hasRunOut, isAlive, type StepContext } from "./step-context";

/**
 * Splits a wave into its pushes: the pieces in a shuffled order (so no kind
 * always comes first), cut into `perWave` even chunks, with the king held
 * back for the last one. Empty chunks are dropped, so a tiny wave has fewer pushes.
 */
export function splitIntoPushes(wave: Wave, random: Random): BlackKind[][] {
  const all = wave.blackPieces.flatMap((group) =>
    Array.from({ length: group.count }, () => group.kind),
  );
  const kings = all.filter((kind) => BLACK_PIECES[kind].isKing === true);
  const rest = shuffled(
    all.filter((kind) => BLACK_PIECES[kind].isKing !== true),
    random,
  );

  const perWave = BATTLE_RULES.pushes.perWave;
  const size = Math.ceil(rest.length / perWave);
  const pushes: BlackKind[][] = [];
  for (let index = 0; index < perWave; index++) {
    const chunk = rest.slice(index * size, (index + 1) * size);
    if (chunk.length > 0) pushes.push(chunk);
  }
  const last = pushes.at(-1);
  if (last === undefined) {
    if (kings.length > 0) pushes.push(kings);
  } else {
    last.push(...kings);
  }
  return pushes;
}

/**
 * Starts the next push's landings once the black pieces left (on the board or
 * landing) are down to a share of the last push, or its timer runs out.
 */
export function landNextPushIfDue(context: StepContext): void {
  context.pushSecondsLeft -= context.seconds;
  const next = context.pushes[0];
  if (next === undefined) return;

  const { nextAtShareLeft, nextAfterSeconds } = BATTLE_RULES.pushes;
  const blackLeft =
    context.blackPieces.filter(isAlive).length + context.landings.length;
  if (
    blackLeft > context.pushSize * nextAtShareLeft &&
    !hasRunOut(context.pushSecondsLeft)
  ) {
    return;
  }

  context.pushes = context.pushes.slice(1);
  context.pushSize = next.length;
  context.pushSecondsLeft = nextAfterSeconds;
  context.landings.push(
    ...planPushLandings(
      next,
      {
        board: context.board,
        pawns: context.pawns.filter(isAlive),
        blackPieces: context.blackPieces,
        landings: context.landings,
      },
      context.random,
    ),
  );
  context.events.push({
    type: "push",
    count: next.length,
    pushesLeft: context.pushes.length,
  });
}

function shuffled<Item>(items: readonly Item[], random: Random): Item[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random.next() * (index + 1));
    const item = result[index];
    const otherItem = result[other];
    if (item === undefined || otherItem === undefined) continue;
    result[index] = otherItem;
    result[other] = item;
  }
  return result;
}
