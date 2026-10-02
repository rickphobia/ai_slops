import { describe, expect, it } from "vitest";
import {
  ANIMATION_FRAMES,
  ANIMATION_LOOP_SECONDS,
  frameAnimator,
  frameIndexAt,
  liveAnimator,
  sampleValue,
} from "../../../src/adapters/art/animation";

describe("sampleValue", () => {
  it("interpolates every number inside the value, keeping the text around them", () => {
    const values = ["M10 20 Q30 40 50 60", "M20 20 Q30 60 50 80"];
    expect(sampleValue(values, 1.2, 0.6)).toBe("M15 20 Q30 50 50 70");
  });

  it("follows keyTimes and loops with the duration", () => {
    const motion = { values: ["0", "10", "0"], keyTimes: [0, 0.8, 1] };
    expect(sampleValue(motion.values, 1, 0.4, motion.keyTimes)).toBe("5");
    expect(sampleValue(motion.values, 1, 0.9, motion.keyTimes)).toBe("5");
    expect(sampleValue(motion.values, 1, 1.4, motion.keyTimes)).toBe("5");
  });

  it("holds each value until the next key time when discrete", () => {
    const values = ["open", "shut"];
    expect(sampleValue(values, 2.4, 2, [0, 0.875], true)).toBe("open");
    expect(sampleValue(values, 2.4, 2.05, [0, 0.875], true)).toBe("open");
    expect(sampleValue(values, 2.4, 2.2, [0, 0.875], true)).toBe("shut");
  });

  it("rejects values whose numbers don't line up", () => {
    expect(() => sampleValue(["M1 2", "M1 2 3"], 1, 0.5)).toThrow(
      /same numbers/,
    );
  });
});

describe("frameAnimator", () => {
  it("writes the sampled value as a plain attribute, with no SMIL", () => {
    const animator = frameAnimator(ANIMATION_LOOP_SECONDS / 4);
    const svg = animator.el("circle", 'r="2"', [
      { attribute: "cx", values: [0, 8], seconds: ANIMATION_LOOP_SECONDS },
    ]);
    expect(svg).toBe('<circle r="2" cx="2"/>');
  });

  it("turns transform motions into a transform attribute", () => {
    const animator = frameAnimator(0);
    const svg = animator.el(
      "g",
      "",
      [
        {
          attribute: "transform",
          transform: "rotate",
          values: ["10 5 5", "-10 5 5"],
          seconds: 1.2,
        },
      ],
      "<path/>",
    );
    expect(svg).toBe('<g transform="rotate(10 5 5)"><path/></g>');
  });

  it("refuses a duration that doesn't divide the loop, which would jump once per loop", () => {
    expect(() =>
      frameAnimator(0).el("circle", "", [
        { attribute: "r", values: [1, 2], seconds: 0.7 },
      ]),
    ).toThrow(/divide/);
  });
});

describe("liveAnimator", () => {
  it("starts on the first value and adds an endless SMIL animation", () => {
    const svg = liveAnimator().el("circle", 'r="2"', [
      { attribute: "cx", values: [0, 8], seconds: 1.2, keyTimes: [0, 1] },
    ]);
    expect(svg).toBe(
      '<circle r="2" cx="0"><animate attributeName="cx" values="0;8" dur="1.2s" keyTimes="0;1" repeatCount="indefinite"/></circle>',
    );
  });

  it("uses animateTransform for transforms and calcMode for discrete motions", () => {
    const svg = liveAnimator().el("g", "", [
      {
        attribute: "transform",
        transform: "translate",
        values: ["0 0", "2 1"],
        seconds: 0.6,
        discrete: true,
      },
    ]);
    expect(svg).toBe(
      '<g transform="translate(0 0)"><animateTransform attributeName="transform" type="translate" values="0 0;2 1" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></g>',
    );
  });
});

describe("frameIndexAt", () => {
  it("walks through the frames in order and loops", () => {
    const frameSeconds = ANIMATION_LOOP_SECONDS / ANIMATION_FRAMES;
    expect(frameIndexAt(0, 0)).toBe(0);
    expect(frameIndexAt(frameSeconds * 1.5, 0)).toBe(1);
    expect(frameIndexAt(ANIMATION_LOOP_SECONDS + frameSeconds * 0.5, 0)).toBe(
      0,
    );
  });

  it("offsets pieces by their id so a crowd doesn't blink in step", () => {
    expect(frameIndexAt(0, 1)).not.toBe(frameIndexAt(0, 2));
    expect(frameIndexAt(0, 7)).toBeGreaterThanOrEqual(0);
    expect(frameIndexAt(0, 7)).toBeLessThan(ANIMATION_FRAMES);
  });
});
