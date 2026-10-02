import { describe, expect, it } from "vitest";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
import { PAWN_TYPES, type PawnTypeId } from "../../src/catalog/pieces";
import {
  countDown,
  describeSkillBar,
  skillBlocker,
  skillsOnBoard,
  skillsUsedAt,
  startTimer,
} from "../../src/skills/skills";

const pawns = (...types: PawnTypeId[]) => types.map((type) => ({ type }));

describe("skillBlocker", () => {
  it("allows a skill whose type is on the board and off cooldown", () => {
    expect(skillBlocker({}, pawns("plain", "spear"), "spear")).toBeUndefined();
  });

  it("refuses a skill with no pawn of its type on the board", () => {
    expect(skillBlocker({}, pawns("plain"), "spear")).toBe("no-pawns");
  });

  it("refuses a skill still on cooldown, and allows it once the cooldown runs out", () => {
    let cooldowns = startTimer({}, "plain", PAWN_TYPES.plain.skill.cooldown);
    expect(skillBlocker(cooldowns, pawns("plain"), "plain")).toBe(
      "on-cooldown",
    );
    // 12 s is 720 steps; one step short is still on cooldown.
    for (let index = 0; index < 719; index++) {
      cooldowns = countDown(cooldowns, 1 / 60);
    }
    expect(skillBlocker(cooldowns, pawns("plain"), "plain")).toBe(
      "on-cooldown",
    );
    cooldowns = countDown(cooldowns, 1 / 60);
    expect(skillBlocker(cooldowns, pawns("plain"), "plain")).toBeUndefined();
  });
});

describe("countDown", () => {
  it("counts every timer down and drops the ones that ran out", () => {
    expect(countDown({ plain: 1, twin: 0.5 }, 0.5)).toEqual({ plain: 0.5 });
  });

  it("leaves the timers it was given alone", () => {
    const timers = { plain: 1 };
    countDown(timers, 0.5);
    expect(timers).toEqual({ plain: 1 });
  });
});

describe("skillsOnBoard", () => {
  it("lists each type on the board once, in catalog order", () => {
    expect(skillsOnBoard(pawns("twin", "plain", "twin", "shield"))).toEqual([
      "plain",
      "shield",
      "twin",
    ]);
  });
});

describe("skillsUsedAt", () => {
  it("picks the skills a recording fired on one step", () => {
    const uses = [
      { step: 3, skill: "plain" as const },
      { step: 5, skill: "twin" as const },
      { step: 5, skill: "spear" as const },
    ];
    expect(skillsUsedAt(uses, 5)).toEqual(["twin", "spear"]);
    expect(skillsUsedAt(uses, 4)).toEqual([]);
  });
});

describe("describeSkillBar", () => {
  it("gives each button its hotkey in button order and its state", () => {
    const bar = describeSkillBar(
      { spear: 7.5 },
      pawns("spear", "plain", "twin"),
      ["twin"],
    );
    expect(bar.map((button) => [button.type, button.hotkey])).toEqual([
      ["plain", 1],
      ["spear", 2],
      ["twin", 3],
    ]);
    expect(bar[0]).toMatchObject({
      skillName: "Charge",
      typeName: "Plain pawn",
      state: "ready",
      realSecondsLeft: 0,
      recharged: 1,
    });
    expect(bar[1]).toMatchObject({ skillName: "Volley", state: "cooldown" });
    // Volley's cooldown is 15 game seconds: half of it has passed.
    expect(bar[1]?.recharged).toBeCloseTo(0.5);
    // Game seconds shown as real seconds at 1×.
    expect(bar[1]?.realSecondsLeft).toBeCloseTo(7.5 / BATTLE_RULES.pace);
    expect(bar[2]).toMatchObject({ skillName: "Fork", state: "queued" });
  });
});
