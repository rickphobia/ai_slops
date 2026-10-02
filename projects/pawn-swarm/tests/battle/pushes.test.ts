import { describe, expect, it } from "vitest";
import { planPushLandings } from "../../src/battle/landing-squares";
import { splitIntoPushes } from "../../src/battle/pushes";
import { blackPiecesLeft } from "../../src/battle/step";
import { centreOf, type Square } from "../../src/board/square";
import { BATTLE_RULES } from "../../src/catalog/battle-rules";
import { WAVES } from "../../src/catalog/waves";
import { createRandom } from "../../src/rng";
import {
  after,
  battleWith,
  eventsOfType,
  knightOn,
  pawnAt,
  stepsIn,
} from "./pieces";

const key = (square: Square): string =>
  `${String(square.file)},${String(square.rank)}`;

describe("splitIntoPushes", () => {
  it("cuts wave 10 into 3 even pushes with the king in the last one", () => {
    const wave10 = WAVES[9];
    if (wave10 === undefined) throw new Error("no wave 10");
    const pushes = splitIntoPushes(wave10, createRandom(1));
    expect(pushes.map((push) => push.length)).toEqual([19, 19, 19]);
    expect(pushes[2]?.at(-1)).toBe("king");
    expect(pushes.flat().filter((kind) => kind === "king")).toHaveLength(1);
    const counts = new Map<string, number>();
    for (const kind of pushes.flat()) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({
      knight: 30,
      bishop: 14,
      rook: 8,
      queen: 4,
      king: 1,
    });
  });

  it("mixes the kinds across pushes", () => {
    const wave9 = WAVES[8];
    if (wave9 === undefined) throw new Error("no wave 9");
    const [first] = splitIntoPushes(wave9, createRandom(3));
    expect(new Set(first).size).toBeGreaterThan(1);
  });

  it("makes fewer pushes when the wave is too small for 3", () => {
    expect(
      splitIntoPushes(
        { blackPieces: [{ kind: "knight", count: 2 }] },
        createRandom(1),
      ),
    ).toEqual([["knight"], ["knight"]]);
  });
});

describe("next push", () => {
  const pawns = [pawnAt(1, 8, 5.5, { strikeCooldownLeft: 99 })];
  const fourStanding = [
    knightOn(10, { file: 0, rank: 0 }),
    knightOn(11, { file: 15, rank: 0 }),
    knightOn(12, { file: 0, rank: 10 }),
    knightOn(13, { file: 15, rank: 10 }),
  ];
  const nextPush = [["bishop", "rook"]] as const;

  it("waits while more than 25% of the last push is left", () => {
    const start = battleWith({
      pawns,
      blackPieces: fourStanding.slice(0, 2),
      pushes: nextPush,
      pushSize: 4,
      pushSecondsLeft: 10,
    });
    const next = after(start, 1);
    expect(next.landings).toEqual([]);
    expect(next.pushes).toEqual(nextPush);
    expect(eventsOfType([next], "push")).toEqual([]);
  });

  it("lands once the last push is down to 25%", () => {
    const start = battleWith({
      pawns,
      blackPieces: fourStanding.slice(0, 1),
      pushes: nextPush,
      pushSize: 4,
      pushSecondsLeft: 10,
    });
    const next = after(start, 1);
    expect(next.landings.map((landing) => landing.kind)).toEqual([
      "bishop",
      "rook",
    ]);
    for (const landing of next.landings) {
      expect(landing).toMatchObject({ secondsLeft: 1.2, warningSeconds: 1.2 });
    }
    expect(next).toMatchObject({
      pushes: [],
      pushSize: 2,
      pushSecondsLeft: 25,
    });
    expect(eventsOfType([next], "push")).toEqual([
      { type: "push", count: 2, pushesLeft: 0 },
    ]);
  });

  it("lands after 25 seconds even if the last push is still standing", () => {
    const start = battleWith({
      pawns,
      blackPieces: fourStanding,
      pushes: nextPush,
      pushSize: 4,
      pushSecondsLeft: BATTLE_RULES.pushes.nextAfterSeconds,
    });
    expect(after(start, stepsIn(25) - 1).landings).toEqual([]);
    expect(after(start, stepsIn(25)).landings).toHaveLength(2);
  });

  it("keeps the battle going while pushes are still to come", () => {
    const start = battleWith({ pawns, pushes: [["knight"]], pushSize: 1 });
    expect(blackPiecesLeft(start)).toBe(1);
    const next = after(start, 1);
    expect(next.outcome).toBe("ongoing");
    expect(next.landings).toHaveLength(1);
  });
});

describe("push landing squares", () => {
  const spread = (seed: number) =>
    planPushLandings(
      Array.from({ length: 20 }, () => "knight" as const),
      {
        board: BATTLE_RULES.board,
        pawns: [
          { x: 3, y: 3 },
          { x: 12.4, y: 7.7 },
        ],
        blackPieces: [knightOn(1, { file: 15, rank: 0 })],
        landings: [{ square: { file: 0, rank: 10 } }],
      },
      createRandom(seed),
    );

  it("never lands within 3 squares of a white pawn while there is room", () => {
    for (let seed = 0; seed < 30; seed++) {
      for (const { square } of spread(seed)) {
        const centre = centreOf(square);
        for (const pawn of [
          { x: 3, y: 3 },
          { x: 12.4, y: 7.7 },
        ]) {
          expect(
            Math.max(Math.abs(centre.x - pawn.x), Math.abs(centre.y - pawn.y)),
          ).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it("never lands on a square black already holds, or twice on one square", () => {
    for (let seed = 0; seed < 30; seed++) {
      const squares = spread(seed).map((landing) => key(landing.square));
      expect(new Set(squares).size).toBe(20);
      expect(squares).not.toContain("15,0");
      expect(squares).not.toContain("0,10");
    }
  });

  it("takes the free squares farthest from the pawns when the swarm fills the board", () => {
    // Pawns on every square but the left column.
    const pawns = [];
    for (let file = 1; file < 16; file++) {
      for (let rank = 0; rank < 11; rank++) {
        pawns.push({ x: file + 0.5, y: rank + 0.5 });
      }
    }
    const landings = planPushLandings(
      ["knight", "knight", "knight"],
      { board: BATTLE_RULES.board, pawns, blackPieces: [], landings: [] },
      createRandom(2),
    );
    expect(landings).toHaveLength(3);
    for (const { square } of landings) expect(square.file).toBe(0);
  });
});
