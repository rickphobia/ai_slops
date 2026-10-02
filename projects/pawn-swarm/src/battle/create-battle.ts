import {
  type BoardSize,
  boardCentre,
  centreOf,
  isSameSquare,
  type Point,
  type Square,
  squareAt,
} from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import type { BlackKind } from "../catalog/pieces";
import type { Wave } from "../catalog/waves";
import { createRandom, type Random, type RngState } from "../rng";
import type { BattleState, Landing } from "./battle-state";
import { newPawn } from "./new-pawn";

export class BattleSetupError extends Error {
  override name = "BattleSetupError";
}

export interface BattleSetup {
  /** Plain pawns in the army. */
  readonly plainPawns: number;
  readonly wave: Wave;
  readonly seed: RngState;
}

/**
 * Places the army in a spiral around the board centre and schedules the whole
 * wave to land at once, each piece on its own square away from the centre.
 */
export function createBattle(setup: BattleSetup): BattleState {
  const board = BATTLE_RULES.board;
  const random = createRandom(setup.seed);
  const pawns = spiralAround(boardCentre(board), setup.plainPawns, board).map(
    (at, index) => newPawn(index + 1, "plain", at, random),
  );
  const landings = planLandings(waveKinds(setup.wave, random), board, random);
  return {
    stepNumber: 0,
    board,
    pawns,
    blackPieces: [],
    landings,
    nextId: pawns.length + 1,
    rng: random.state(),
    outcome: "ongoing",
    events: [],
  };
}

/** A sunflower spiral: tight around the centre, even all round. */
function spiralAround(centre: Point, count: number, board: BoardSize): Point[] {
  const { spiralSpacing, spiralAngle, edgeMargin } = BATTLE_RULES;
  return Array.from({ length: count }, (_, index) => {
    const radius = spiralSpacing * Math.sqrt(index);
    const angle = index * spiralAngle;
    return {
      x: clamp(
        centre.x + Math.cos(angle) * radius,
        edgeMargin,
        board.files - edgeMargin,
      ),
      y: clamp(
        centre.y + Math.sin(angle) * radius,
        edgeMargin,
        board.ranks - edgeMargin,
      ),
    };
  });
}

/** The wave's pieces in a shuffled order, so no kind always gets the first pick of squares. */
function waveKinds(wave: Wave, random: Random): BlackKind[] {
  const kinds = wave.blackPieces.flatMap((group) =>
    Array.from({ length: group.count }, () => group.kind),
  );
  for (let index = kinds.length - 1; index > 0; index--) {
    const other = Math.floor(random.next() * (index + 1));
    const kind = kinds[index];
    const otherKind = kinds[other];
    if (kind === undefined || otherKind === undefined) continue;
    kinds[index] = otherKind;
    kinds[other] = kind;
  }
  return kinds;
}

/** Half the pieces try a ring around the centre, half anywhere; never a taken square or one near the centre. */
function planLandings(
  kinds: readonly BlackKind[],
  board: BoardSize,
  random: Random,
): Landing[] {
  const rules = BATTLE_RULES.landing;
  const centre = boardCentre(board);
  const taken: Square[] = [];
  const isFree = (square: Square): boolean =>
    !taken.some((other) => isSameSquare(other, square)) &&
    Math.hypot(centreOf(square).x - centre.x, centreOf(square).y - centre.y) >
      rules.keepClearOfCentre;

  return kinds.map((kind) => {
    let square: Square | undefined;
    for (
      let attempt = 0;
      attempt < rules.tries && square === undefined;
      attempt++
    ) {
      const candidate = squareAt(
        randomLandingPoint(centre, board, random),
        board,
      );
      if (isFree(candidate)) square = candidate;
    }
    square ??= pickFreeSquare(board, isFree, random);
    taken.push(square);
    return {
      kind,
      square,
      secondsLeft: BATTLE_RULES.landingWarningSeconds,
      warningSeconds: BATTLE_RULES.landingWarningSeconds,
    };
  });
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

/** The fallback when random tries keep missing: any free square, picked at random. */
function pickFreeSquare(
  board: BoardSize,
  isFree: (square: Square) => boolean,
  random: Random,
): Square {
  const free: Square[] = [];
  for (let rank = 0; rank < board.ranks; rank++) {
    for (let file = 0; file < board.files; file++) {
      if (isFree({ file, rank })) free.push({ file, rank });
    }
  }
  const square = free[Math.floor(random.next() * free.length)];
  if (square === undefined) {
    throw new BattleSetupError(
      `The wave has more black pieces than the ${String(board.files)}×${String(board.ranks)} board has free squares away from the centre.`,
    );
  }
  return square;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
