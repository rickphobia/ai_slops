import { describe, expect, it } from "vitest";
import { ENEMY_TYPES, type EnemyKind } from "../../src/catalog/pieces";
import { WAVES } from "../../src/catalog/waves";

function firstWaveOf(kind: EnemyKind): number {
  return (
    WAVES.findIndex((wave) =>
      wave.enemies.some((group) => group.kind === kind && group.count > 0),
    ) + 1
  );
}

describe("catalog", () => {
  it("has the spec's enemy stats and drops", () => {
    expect(ENEMY_TYPES).toMatchObject({
      knight: { hp: 2, attack: 1, cooldownTicks: 3, pawnDrop: 1 },
      bishop: { hp: 3, attack: 1, cooldownTicks: 4, pawnDrop: 2 },
      rook: { hp: 6, attack: 2, cooldownTicks: 5, pawnDrop: 3 },
      queen: { hp: 10, attack: 3, cooldownTicks: 4, pawnDrop: 6 },
      king: { hp: 30, attack: 4, cooldownTicks: 3, pawnDrop: 0 },
    });
  });

  it("has 10 waves, starting with a single knight", () => {
    expect(WAVES).toHaveLength(10);
    expect(WAVES[0]).toEqual({ enemies: [{ kind: "knight", count: 1 }] });
  });

  it("brings in each enemy in the spec's first wave", () => {
    expect(firstWaveOf("knight")).toBe(1);
    expect(firstWaveOf("bishop")).toBe(3);
    expect(firstWaveOf("rook")).toBe(5);
    expect(firstWaveOf("queen")).toBe(7);
    expect(firstWaveOf("king")).toBe(10);
  });

  it("has exactly one king, in the last wave", () => {
    const kings = WAVES.flatMap((wave) => wave.enemies).filter(
      (group) => group.kind === "king",
    );
    expect(kings).toEqual([{ kind: "king", count: 1 }]);
  });
});
