import {
  type BattleEvent,
  type BattleState,
  type BlackPiece,
  type Landing,
  NO_INPUTS,
  type WhitePawn,
} from "../../src/battle/battle-state";
import { step } from "../../src/battle/step";
import type { Square } from "../../src/board/square";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
import {
  BLACK_PIECES,
  type BlackKind,
  PAWN_TYPES,
} from "../../src/catalog/pieces";
import type { SkillTimers } from "../../src/skills/skills";

/** Test setups: exact pieces at exact places, with catalog stats. */

/** A pawn (plain unless `overrides.type` says otherwise) that is ready to strike and has no drop burst. */
export function pawnAt(
  id: number,
  x: number,
  y: number,
  overrides: Partial<WhitePawn> = {},
): WhitePawn {
  const type = overrides.type ?? "plain";
  const stats = PAWN_TYPES[type];
  return {
    id,
    type,
    x,
    y,
    hp: stats.hp,
    maxHp: stats.hp,
    strikeCooldownLeft: 0,
    axis: "y",
    burstX: 0,
    burstY: 0,
    stunLeft: 0,
    healLeft: 0,
    ...overrides,
  };
}

/** A black piece that stands still and touches nothing unless a test sets its timers. */
export function blackOn(
  kind: BlackKind,
  id: number,
  square: Square,
  overrides: Partial<BlackPiece> = {},
): BlackPiece {
  const stats = BLACK_PIECES[kind];
  return {
    id,
    kind,
    square,
    hp: stats.hp,
    maxHp: stats.hp,
    actLeft: 99,
    contactLeft: 99,
    summonLeft: 99,
    move: undefined,
    ...overrides,
  };
}

export function knightOn(
  id: number,
  square: Square,
  overrides: Partial<BlackPiece> = {},
): BlackPiece {
  return blackOn("knight", id, square, overrides);
}

export function landingOn(
  square: Square,
  secondsLeft = 99,
  kind: BlackKind = "knight",
): Landing {
  return { kind, square, secondsLeft, warningSeconds: 1.2 };
}

/** A battle with no pushes still to come, unless a test gives some. */
export function battleWith(parts: {
  pawns: readonly WhitePawn[];
  blackPieces?: readonly BlackPiece[];
  landings?: readonly Landing[];
  pushes?: readonly (readonly BlackKind[])[];
  pushSize?: number;
  pushSecondsLeft?: number;
  wave?: number;
  rng?: number;
  skillCooldowns?: SkillTimers;
  lastingSkills?: SkillTimers;
}): BattleState {
  const pieces = [...parts.pawns, ...(parts.blackPieces ?? [])];
  return {
    stepNumber: 0,
    board: BATTLE_RULES.board,
    wave: parts.wave ?? 1,
    pawns: parts.pawns,
    blackPieces: parts.blackPieces ?? [],
    landings: parts.landings ?? [],
    pushes: parts.pushes ?? [],
    pushSize: parts.pushSize ?? 0,
    pushSecondsLeft: parts.pushSecondsLeft ?? 99,
    nextId: Math.max(0, ...pieces.map((piece) => piece.id)) + 1,
    rng: parts.rng ?? 1,
    skillCooldowns: parts.skillCooldowns ?? {},
    lastingSkills: parts.lastingSkills ?? {},
    outcome: "ongoing",
    events: [],
  };
}

/** Plays `count` steps and returns every state after the start, in order. */
export function playSteps(start: BattleState, count: number): BattleState[] {
  const states: BattleState[] = [];
  let state = start;
  for (let index = 0; index < count; index++) {
    state = step(state, NO_INPUTS);
    states.push(state);
  }
  return states;
}

export function after(start: BattleState, count: number): BattleState {
  return playSteps(start, count).at(-1) ?? start;
}

export function playToEnd(start: BattleState, maxSteps = 20_000): BattleState {
  let state = start;
  while (state.outcome === "ongoing" && state.stepNumber < maxSteps) {
    state = step(state, NO_INPUTS);
  }
  return state;
}

export function pawnById(
  state: BattleState,
  id: number,
): WhitePawn | undefined {
  return state.pawns.find((pawn) => pawn.id === id);
}

export function blackPieceById(
  state: BattleState,
  id: number,
): BlackPiece | undefined {
  return state.blackPieces.find((piece) => piece.id === id);
}

export function eventsOfType<Type extends BattleEvent["type"]>(
  states: readonly BattleState[],
  type: Type,
): Extract<BattleEvent, { type: Type }>[] {
  return states.flatMap((state) =>
    state.events.filter(
      (event): event is Extract<BattleEvent, { type: Type }> =>
        event.type === type,
    ),
  );
}

/** Steps in `seconds` of game time. */
export function stepsIn(seconds: number): number {
  return Math.round(seconds * 60);
}
