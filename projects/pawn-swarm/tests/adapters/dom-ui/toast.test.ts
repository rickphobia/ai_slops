import { describe, expect, it } from "vitest";
import { powerUpToastText } from "../../../src/adapters/dom-ui/toast";
import { POWER_UP_IDS } from "../../../src/catalog/power-ups";

describe("powerUpToastText", () => {
  it("names the power-up and its effect", () => {
    expect(powerUpToastText("haste")).toBe("Haste: pawns 50% faster for 6s");
    expect(powerUpToastText("reinforcements")).toBe("Reinforcements: +3 pawns");
  });

  it("covers every power-up", () => {
    for (const powerUp of POWER_UP_IDS) {
      expect(powerUpToastText(powerUp)).toMatch(/^[A-Z][a-z]+: .+/);
    }
  });
});
