import type { Square } from "../board/square";
import { ENEMY_TYPES, PAWN_TYPES, type PieceStats } from "../catalog/pieces";
import type { Wave } from "../catalog/waves";
import { pickOne, type RngState } from "../rng";
import type { BattleState, Piece } from "./battle-state";

/** Ranks at each end of the board where a side starts. */
const DEPLOY_RANKS = 3;

export class BattleSetupError extends Error {
  override name = "BattleSetupError";
}

export interface BattleSetup {
  readonly boardSize: number;
  readonly plainPawns: number;
  readonly wave: Wave;
  readonly seed: RngState;
}

/** White fills its bottom ranks from the centre outwards; black enters on random squares in the top 3 ranks. */
export function createBattle(setup: BattleSetup): BattleState {
  const { boardSize } = setup;
  const whiteSquares = squaresCentreOut(boardSize).slice(0, setup.plainPawns);
  if (whiteSquares.length < setup.plainPawns) {
    throw new BattleSetupError(
      `${String(setup.plainPawns)} pawns do not fit in white's ${String(DEPLOY_RANKS)} ranks on a ${String(boardSize)}×${String(boardSize)} board.`,
    );
  }

  const pieces: Piece[] = whiteSquares.map((square, index) =>
    newPiece(index + 1, "white", "pawn", square, PAWN_TYPES.plain),
  );

  let rng = setup.seed;
  let freeSquares = blackEntrySquares(boardSize);
  for (const group of setup.wave.enemies) {
    for (let count = 0; count < group.count; count++) {
      if (freeSquares.length === 0) {
        throw new BattleSetupError(
          `The wave has more enemies than black's ${String(DEPLOY_RANKS)} ranks have squares.`,
        );
      }
      const pick = pickOne(rng, freeSquares);
      rng = pick.state;
      freeSquares = freeSquares.filter((square) => square !== pick.value);
      pieces.push(
        newPiece(
          pieces.length + 1,
          "black",
          group.kind,
          pick.value,
          ENEMY_TYPES[group.kind],
        ),
      );
    }
  }

  return { tick: 0, boardSize, pieces, rng, outcome: "ongoing", events: [] };
}

function newPiece(
  id: number,
  side: Piece["side"],
  kind: Piece["kind"],
  square: Square,
  stats: PieceStats,
): Piece {
  return {
    id,
    side,
    kind,
    square,
    hp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    cooldownTicks: stats.cooldownTicks,
    // Everyone waits one full cooldown before the first move, so the board can be read at the start.
    cooldownLeft: stats.cooldownTicks,
  };
}

/** White's squares in placement order: rank by rank from the bottom, each from the centre file outwards. */
function squaresCentreOut(boardSize: number): Square[] {
  const centre = Math.floor(boardSize / 2);
  const files = Array.from({ length: boardSize }, (_, index) => index).sort(
    (a, b) => Math.abs(a - centre) - Math.abs(b - centre) || b - a,
  );
  const squares: Square[] = [];
  for (let rank = 0; rank < Math.min(DEPLOY_RANKS, boardSize); rank++) {
    for (const file of files) squares.push({ file, rank });
  }
  return squares;
}

function blackEntrySquares(boardSize: number): Square[] {
  const squares: Square[] = [];
  for (
    let rank = boardSize - 1;
    rank >= Math.max(0, boardSize - DEPLOY_RANKS);
    rank--
  ) {
    for (let file = 0; file < boardSize; file++) squares.push({ file, rank });
  }
  return squares;
}
