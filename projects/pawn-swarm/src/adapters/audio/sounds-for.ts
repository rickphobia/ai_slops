import type { BattleEvent } from "../../battle/battle-state";
import type { BlackKind, PawnTypeId } from "../../catalog/pieces";
import type { RunState, ShopAction } from "../../run/run";
import type { MusicMood } from "./sound-player";
import type { SoundName } from "./sound-names";

const SKILL_SOUNDS: Readonly<Record<PawnTypeId, SoundName>> = {
  plain: "skill-charge",
  shield: "skill-hold",
  spear: "skill-volley",
  twin: "skill-fork",
};

const BLACK_DEATH_SOUNDS: Readonly<Record<BlackKind, SoundName>> = {
  knight: "black-death-small",
  bishop: "black-death-small",
  rook: "black-death-big",
  queen: "black-death-big",
  king: "king-death",
};

/** The sound a battle event makes, if any. The battle only emits events; this is the one place that turns them into sound names. */
export function soundForEvent(event: BattleEvent): SoundName | undefined {
  switch (event.type) {
    case "strike":
      return "pawn-strike";
    case "pawn-hurt":
      return event.cause === "hit" ? "black-hit" : undefined;
    case "death":
      return event.piece.side === "white"
        ? "pawn-death"
        : BLACK_DEATH_SOUNDS[event.piece.kind];
    case "drop":
      return "drop-pop";
    case "landed":
      return "landed";
    case "stomp":
      return "stomp";
    case "push":
      return "push";
    case "summon":
      return "warning";
    case "skill":
      return SKILL_SOUNDS[event.pawnType];
  }
}

export function soundForShopAction(action: ShopAction): SoundName | undefined {
  switch (action.type) {
    case "recruit":
      return "shop-buy";
    case "reroll":
      return "shop-reroll";
    case "lock":
      return "shop-click";
    case "start-wave":
      return "wave-start";
  }
}

/** The stinger when a run ends, if this step ended it. */
export function soundForRunEnd(
  previous: RunState,
  next: RunState,
): SoundName | undefined {
  if (previous.phase !== "battle") return undefined;
  if (next.phase === "won") return "win";
  if (next.phase === "lost") return "loss";
  return undefined;
}

/** Quiet in the shop, a dark loop in battle, and faster and louder once the king is on the board. */
export function moodFor(run: RunState): MusicMood {
  switch (run.phase) {
    case "shop":
      return "shop";
    case "battle":
      return run.battle.blackPieces.some((piece) => piece.kind === "king")
        ? "king"
        : "battle";
    case "won":
    case "lost":
      return "off";
  }
}
