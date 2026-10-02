import { describe, expect, it } from "vitest";
import {
  ANIMATION_FRAMES,
  ANIMATION_LOOP_SECONDS,
  frameAnimator,
  liveAnimator,
} from "../../../src/adapters/art/animation";
import {
  ART_IDS,
  BLACK_PIECE_ART_IDS,
  BLACK_TYPE_ART_IDS,
  DRAWINGS,
  PAWN_ART_IDS,
  sideOfArt,
} from "../../../src/adapters/art/drawings";
import { frameStripSvg } from "../../../src/adapters/art/frame-strip";
import { portraitSvg } from "../../../src/adapters/art/portrait";
import { expectWellFormed } from "./well-formed";

const frames = (id: (typeof ART_IDS)[number]): string[] =>
  Array.from({ length: ANIMATION_FRAMES }, (_, index) =>
    DRAWINGS[id](
      frameAnimator((index * ANIMATION_LOOP_SECONDS) / ANIMATION_FRAMES),
    ),
  );

describe("the drawing set", () => {
  it("has every pawn type, black piece and black type from the spec", () => {
    expect([...PAWN_ART_IDS].sort()).toEqual(
      [
        "banner",
        "berserker",
        "bomb",
        "enPassant",
        "medic",
        "plain",
        "promoter",
        "recruiter",
        "shield",
        "spear",
        "twin",
      ].sort(),
    );
    expect([...BLACK_PIECE_ART_IDS].sort()).toEqual(
      ["bishop", "king", "knight", "queen", "rook"].sort(),
    );
    expect([...BLACK_TYPE_ART_IDS].sort()).toEqual(
      [
        "cannon",
        "hunter",
        "priest",
        "sniper",
        "stomper",
        "storm",
        "summoner",
        "tower",
      ].sort(),
    );
  });

  it("puts pawns on the white side and the rest on the black side", () => {
    expect(sideOfArt("plain")).toBe("white");
    expect(sideOfArt("enPassant")).toBe("white");
    expect(sideOfArt("knight")).toBe("black");
    expect(sideOfArt("summoner")).toBe("black");
  });
});

describe.each(ART_IDS)("the %s drawing", (id) => {
  it("draws well-formed still frames with no SMIL and no missing numbers", () => {
    for (const frame of frames(id)) {
      expectWellFormed(frame);
      expect(frame).not.toMatch(/<animate/);
      expect(frame).not.toMatch(/undefined|NaN/);
    }
  });

  it("moves: its frames are not all the same", () => {
    expect(new Set(frames(id)).size).toBeGreaterThan(1);
  });

  it("animates itself when drawn live", () => {
    const live = DRAWINGS[id](liveAnimator());
    expectWellFormed(live);
    expect(live).toMatch(/<animate/);
  });

  it("is told apart from other drawings", () => {
    const own = frames(id)[0];
    for (const other of ART_IDS) {
      if (other !== id) expect(frames(other)[0]).not.toBe(own);
    }
  });
});

describe("portraitSvg", () => {
  it("is a standalone, labelled SVG that animates", () => {
    const svg = portraitSvg("shield", 'Shield "wall" <pawn>');
    expectWellFormed(svg);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(svg).toContain('aria-label="Shield &quot;wall&quot; &lt;pawn>"');
    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/<animate/);
  });
});

describe("frameStripSvg", () => {
  it("lays every frame side by side at the asked size", () => {
    const svg = frameStripSvg("plain", 64);
    expectWellFormed(svg);
    expect(svg).toContain(`width="${String(ANIMATION_FRAMES * 64)}"`);
    expect(svg).toContain('height="64"');
    expect(svg.match(/clip-path="url\(#pawn-swarm-cell\)"/g)).toHaveLength(
      ANIMATION_FRAMES,
    );
    expect(svg).not.toMatch(/<animate/);
  });

  it("gives black pieces a rim so they show on the dark board, and pawns none", () => {
    expect(frameStripSvg("knight", 64)).toContain(
      'filter="url(#pawn-swarm-rim)"',
    );
    expect(frameStripSvg("plain", 64)).not.toContain("pawn-swarm-rim");
  });
});
