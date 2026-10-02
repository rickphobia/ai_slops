import {
  type BoardSize,
  boardCentre,
  centreOf,
  isOnBoard,
  type Point,
  type Square,
  squareAt,
} from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import type { BlackTypeId } from "../catalog/black-types";
import type { BlackKind } from "../catalog/pieces";
import type { Random } from "../rng";
import type { BlackPiece, Landing } from "./battle-state";
import { rollBlackType } from "./black-type-rules";
import { isAmong, squaresHeldByBlack } from "./black-squares";

/** There is no free square left for a black piece to land on. */
export class BoardFullError extends Error {
  override name = "BoardFullError";
}

/** What landing squares are picked around: where the pawns are and which squares black already holds. */
export interface LandingView {
  readonly board: BoardSize;
  /** The wave being fought: it decides which special types can turn up. */
  readonly wave: number;
  readonly pawns: readonly Point[];
  readonly blackPieces: readonly Pick<BlackPiece, "square" | "move" | "hp">[];
  readonly landings: readonly Pick<Landing, "square">[];
}

/**
 * Picks a free square for each piece of a push: half try a ring around the
 * swarm's centre, half anywhere, and none lands near a white pawn. Each piece
 * may turn out to be a special type of its kind. When random
 * picks keep missing (a big swarm fills the board), the piece takes the free
 * square farthest from any pawn.
 */
export function planPushLandings(
  kinds: readonly BlackKind[],
  view: LandingView,
  random: Random,
): Landing[] {
  const rules = BATTLE_RULES.landing;
  const centre = swarmCentre(view);
  const pawnGap = pawnGapBySquare(view);
  const taken = squaresHeldByBlack(view.blackPieces, view.landings);
  const isFree = (square: Square): boolean => !isAmong(taken, square);
  const isClear = (square: Square): boolean =>
    (pawnGap(square) ?? 0) >= rules.keepClearOfPawns;

  return kinds.map((kind) => {
    let square: Square | undefined;
    for (
      let attempt = 0;
      attempt < rules.tries && square === undefined;
      attempt++
    ) {
      const candidate = squareAt(
        randomLandingPoint(centre, view.board, random),
        view.board,
      );
      if (isFree(candidate) && isClear(candidate)) square = candidate;
    }
    square ??= farthestFreeSquare(view.board, isFree, pawnGap, random);
    taken.push(square);
    return landingOn(
      kind,
      rollBlackType(kind, view.wave, random),
      square,
      BATTLE_RULES.landingWarningSeconds,
    );
  });
}

/** Up to `count` free squares near `around` for summoned knights, picked at random. */
export function planSummonLandings(
  around: Square,
  count: number,
  view: Omit<LandingView, "pawns">,
  random: Random,
): Landing[] {
  const reach = BATTLE_RULES.summonReach;
  const taken = squaresHeldByBlack(view.blackPieces, view.landings);
  const free: Square[] = [];
  for (let rankStep = -reach; rankStep <= reach; rankStep++) {
    for (let fileStep = -reach; fileStep <= reach; fileStep++) {
      const square = {
        file: around.file + fileStep,
        rank: around.rank + rankStep,
      };
      if (isOnBoard(square, view.board) && !isAmong(taken, square)) {
        free.push(square);
      }
    }
  }
  const landings: Landing[] = [];
  while (landings.length < count && free.length > 0) {
    const [square] = free.splice(Math.floor(random.next() * free.length), 1);
    if (square === undefined) break;
    landings.push(
      landingOn("knight", undefined, square, BATTLE_RULES.summonWarningSeconds),
    );
  }
  return landings;
}

function landingOn(
  kind: BlackKind,
  type: BlackTypeId | undefined,
  square: Square,
  warningSeconds: number,
): Landing {
  return { kind, type, square, secondsLeft: warningSeconds, warningSeconds };
}

/** The middle of the swarm, or of the board when there are no pawns. */
function swarmCentre(view: LandingView): Point {
  if (view.pawns.length === 0) return boardCentre(view.board);
  let x = 0;
  let y = 0;
  for (const pawn of view.pawns) {
    x += pawn.x;
    y += pawn.y;
  }
  return { x: x / view.pawns.length, y: y / view.pawns.length };
}

/**
 * For each square, how far its centre is from the nearest pawn, as the larger of
 * the two axis distances (undefined with no pawns). Worked out once per push.
 */
function pawnGapBySquare(
  view: LandingView,
): (square: Square) => number | undefined {
  if (view.pawns.length === 0) return () => undefined;
  const { files, ranks } = view.board;
  const gaps = new Array<number>(files * ranks).fill(Infinity);
  for (let rank = 0; rank < ranks; rank++) {
    for (let file = 0; file < files; file++) {
      const centre = centreOf({ file, rank });
      let gap = Infinity;
      for (const pawn of view.pawns) {
        gap = Math.min(
          gap,
          Math.max(Math.abs(pawn.x - centre.x), Math.abs(pawn.y - centre.y)),
        );
      }
      gaps[rank * files + file] = gap;
    }
  }
  return (square) => gaps[square.rank * files + square.file];
}

function randomLandingPoint(
  centre: Point,
  board: BoardSize,
  random: Random,
): Point {
  const rules = BATTLE_RULES.landing;
  if (random.next() < rules.ringChance) {
    const angle = random.next() * Math.PI * 2;
    const distance =
      rules.ringMinDistance +
      random.next() * (rules.ringMaxDistance - rules.ringMinDistance);
    return {
      x: centre.x + Math.cos(angle) * distance,
      y: centre.y + Math.sin(angle) * distance,
    };
  }
  return { x: random.next() * board.files, y: random.next() * board.ranks };
}

/** The fallback: the free square farthest from any pawn, ties picked at random. */
function farthestFreeSquare(
  board: BoardSize,
  isFree: (square: Square) => boolean,
  pawnGap: (square: Square) => number | undefined,
  random: Random,
): Square {
  let best: Square[] = [];
  let bestGap = -Infinity;
  for (let rank = 0; rank < board.ranks; rank++) {
    for (let file = 0; file < board.files; file++) {
      const square = { file, rank };
      if (!isFree(square)) continue;
      const gap = pawnGap(square) ?? Infinity;
      if (gap > bestGap) {
        best = [square];
        bestGap = gap;
      } else if (gap === bestGap) {
        best.push(square);
      }
    }
  }
  const square = best[Math.floor(random.next() * best.length)];
  if (square === undefined) {
    throw new BoardFullError(
      `Every square of the ${String(board.files)}×${String(board.ranks)} board is taken: no room for more black pieces to land.`,
    );
  }
  return square;
}
