import { BATTLE_RULES } from "../catalog/battle-rules";
import { PAWN_TYPES, type PawnTypeId } from "../catalog/pieces";

/** Game seconds left on a timer per pawn type: a skill's cooldown, or how long its effect still lasts. A missing type has run out. */
export type SkillTimers = Readonly<Partial<Record<PawnTypeId, number>>>;

/** Why a skill can't be used right now. */
export type SkillBlocker = "no-pawns" | "on-cooldown";

/** A skill fired on a step: a seed plus every use replays a battle exactly. */
export interface SkillUse {
  /** The battle's step number when the skill fired: `stepNumber` of the state it was stepped from. */
  readonly step: number;
  readonly skill: PawnTypeId;
}

/** Hotkeys go 1 to 9; skill buttons past the ninth have none. */
export const MAX_HOTKEYS = 9;

/**
 * Whether a timer has run out. Subtracting 1/60 over and over drifts a hair
 * above 0, so allow for that.
 */
function hasRunOut(secondsLeft: number): boolean {
  return secondsLeft <= 1e-9;
}

/** Why the skill of `type` can't be used, or `undefined` when it can. */
export function skillBlocker(
  cooldowns: SkillTimers,
  pawns: readonly { readonly type: PawnTypeId }[],
  type: PawnTypeId,
): SkillBlocker | undefined {
  if (!pawns.some((pawn) => pawn.type === type)) return "no-pawns";
  if (!hasRunOut(cooldowns[type] ?? 0)) return "on-cooldown";
  return undefined;
}

/** Sets a timer for `type`, replacing any time it had left. */
export function startTimer(
  timers: SkillTimers,
  type: PawnTypeId,
  seconds: number,
): SkillTimers {
  return { ...timers, [type]: seconds };
}

/** Counts every timer down by `seconds` and drops the ones that ran out. */
export function countDown(timers: SkillTimers, seconds: number): SkillTimers {
  const left: Partial<Record<PawnTypeId, number>> = {};
  for (const [type, secondsLeft] of Object.entries(timers) as [
    PawnTypeId,
    number,
  ][]) {
    const next = secondsLeft - seconds;
    if (!hasRunOut(next)) left[type] = next;
  }
  return left;
}

/** The skills on the board, in button order: one per pawn type that has a pawn, in catalog order. */
export function skillsOnBoard(
  pawns: readonly { readonly type: PawnTypeId }[],
): PawnTypeId[] {
  const present = new Set(pawns.map((pawn) => pawn.type));
  return (Object.keys(PAWN_TYPES) as PawnTypeId[]).filter((type) =>
    present.has(type),
  );
}

/** The skills a recording fired on one step, in the order they were used. */
export function skillsUsedAt(
  uses: readonly SkillUse[],
  step: number,
): PawnTypeId[] {
  return uses.filter((use) => use.step === step).map((use) => use.skill);
}

export interface SkillButtonView {
  readonly type: PawnTypeId;
  readonly skillName: string;
  readonly typeName: string;
  readonly text: string;
  /** 1 to 9, or `undefined` past the ninth button. */
  readonly hotkey: number | undefined;
  /** `queued`: used while waiting for the next step (e.g. while paused). */
  readonly state: "ready" | "cooldown" | "queued";
  /** Real seconds left at 1× speed, as the player feels them. 0 when ready. */
  readonly realSecondsLeft: number;
  /** How much of the cooldown has passed, from 0 (just used) to 1 (ready). */
  readonly recharged: number;
}

/** Everything the skill bar shows, worked out by the rules so the bar only lays it out. */
export function describeSkillBar(
  cooldowns: SkillTimers,
  pawns: readonly { readonly type: PawnTypeId }[],
  queued: readonly PawnTypeId[],
): SkillButtonView[] {
  return skillsOnBoard(pawns).map((type, index) => {
    const { name, skill } = PAWN_TYPES[type];
    const secondsLeft = cooldowns[type] ?? 0;
    const state = queued.includes(type)
      ? "queued"
      : hasRunOut(secondsLeft)
        ? "ready"
        : "cooldown";
    return {
      type,
      skillName: skill.name,
      typeName: name,
      text: skill.text,
      hotkey: index < MAX_HOTKEYS ? index + 1 : undefined,
      state,
      realSecondsLeft:
        state === "cooldown" ? secondsLeft / BATTLE_RULES.pace : 0,
      recharged: state === "cooldown" ? 1 - secondsLeft / skill.cooldown : 1,
    };
  });
}
