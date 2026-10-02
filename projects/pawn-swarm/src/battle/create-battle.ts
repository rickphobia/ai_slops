import { type BoardSize, boardCentre, type Point } from "../board/square";
import { BATTLE_RULES } from "../catalog/battle-rules";
import { type Army, PAWN_TYPES, type PawnTypeId } from "../catalog/pieces";
import type { Wave } from "../catalog/waves";
import { createRandom, type RngState } from "../rng";
import type { BattleState } from "./battle-state";
import { planPushLandings } from "./landing-squares";
import { newPawn } from "./new-pawn";
import { splitIntoPushes } from "./pushes";

export interface BattleSetup {
  /** How many pawns of each type fight. */
  readonly army: Army;
  readonly wave: Wave;
  /** 1-based wave number: black HP grows with it. */
  readonly waveNumber: number;
  readonly seed: RngState;
}

/**
 * Places the army in a spiral around the board centre, tanky types in the
 * middle, splits the wave into
 * pushes and starts the first one landing, each piece on its own square away from the pawns.
 */
export function createBattle(setup: BattleSetup): BattleState {
  const board = BATTLE_RULES.board;
  const random = createRandom(setup.seed);
  const types = innermostFirst(setup.army);
  const pawns = spiralAround(boardCentre(board), types.length, board).map(
    (at, index) => newPawn(index + 1, types[index] ?? "plain", at, random),
  );
  const [firstPush = [], ...laterPushes] = splitIntoPushes(setup.wave, random);
  const landings = planPushLandings(
    firstPush,
    { board, pawns, blackPieces: [], landings: [] },
    random,
  );
  return {
    stepNumber: 0,
    board,
    wave: setup.waveNumber,
    pawns,
    blackPieces: [],
    landings,
    pushes: laterPushes,
    pushSize: firstPush.length,
    pushSecondsLeft: BATTLE_RULES.pushes.nextAfterSeconds,
    nextId: pawns.length + 1,
    rng: random.state(),
    outcome: "ongoing",
    events: [],
  };
}

/** One entry per pawn, most HP first: the spiral fills from the centre, so the tanky pawns end up in the middle. */
function innermostFirst(army: Army): PawnTypeId[] {
  const types = (Object.keys(PAWN_TYPES) as PawnTypeId[]).sort(
    (a, b) => PAWN_TYPES[b].hp - PAWN_TYPES[a].hp,
  );
  return types.flatMap((type) =>
    Array.from({ length: army[type] ?? 0 }, () => type),
  );
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
