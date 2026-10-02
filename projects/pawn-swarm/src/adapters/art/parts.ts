import { type Animator, svgNumber as n } from "./animation";
import {
  BLOOD,
  BLOOD_LIGHT,
  BONE,
  BONE_DARK,
  EYE_WHITE,
  GLOW_RED,
  ICHOR,
  IRIS,
  MAGGOT,
  MEAT_LIGHT,
  OUTLINE_COLOUR,
  ROPE,
} from "./palette";

/**
 * Body parts the drawings share. Every drawing lives in a 100×100 box with
 * the piece standing on y ≈ 95, as in docs/art/grotesque-sample.html.
 */

/** A drawing: SVG for the 100×100 box, with its moving parts built by `a`. */
export type Drawing = (a: Animator) => string;

/** The dark outline every shape gets; the silhouette carries the piece at game size. */
export const OUTLINE = `stroke="${OUTLINE_COLOUR}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;

/** Moves and scales a drawing about its feet, so scaled pieces still stand on the same line. */
export function standAt(centreX: number, scale: number, svg: string): string {
  return `<g transform="translate(${n(centreX)} 100) scale(${n(scale)}) translate(-50 -100)">${svg}</g>`;
}

/** A red pupil glowing in a hollow eye socket. */
export function glowingPupil(a: Animator, x: number, y: number): string {
  return a.el(
    "circle",
    `cx="${n(x)}" cy="${n(y)}" r="1.2" fill="${GLOW_RED}"`,
    [{ attribute: "opacity", values: [1, 0.3, 1], seconds: 2.4 }],
  );
}

/** A loose eyeball whose pupil looks from side to side. */
export function eyeball(
  a: Animator,
  x: number,
  y: number,
  radius: number,
  seconds = 2.4,
): string {
  const look = radius * 0.3;
  return (
    `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${EYE_WHITE}" ${OUTLINE}/>` +
    a.el("circle", `cy="${n(y)}" r="${n(radius * 0.45)}" fill="${IRIS}"`, [
      {
        attribute: "cx",
        values: [x - look, x + look, x - look],
        seconds,
      },
    ])
  );
}

/**
 * An eye set in skin that blinks once a loop: the pupil vanishes and the lid
 * shows for one frame starting at `closeAt` (0–1 through the loop).
 */
export function blinkingEye(
  a: Animator,
  x: number,
  y: number,
  radius: number,
  closeAt: number,
  lidColour: string,
  irisColour = IRIS,
  lookSeconds?: number,
): string {
  const openAgain = Math.min(1, closeAt + 0.125);
  const timing = { keyTimes: [0, closeAt, openAgain], discrete: true };
  const look = radius * 0.35;
  const looking =
    lookSeconds === undefined
      ? []
      : [
          {
            attribute: "cx",
            values: [x - look, x + look, x - look],
            seconds: lookSeconds,
          },
        ];
  return (
    `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(radius + 1)}" ry="${n(radius)}" fill="${EYE_WHITE}" ${OUTLINE}/>` +
    a.el(
      "circle",
      `${lookSeconds === undefined ? `cx="${n(x)}" ` : ""}cy="${n(y)}" fill="${irisColour}"`,
      [
        ...looking,
        {
          attribute: "r",
          values: [radius * 0.55, 0, radius * 0.55],
          seconds: 2.4,
          ...timing,
        },
      ],
    ) +
    a.el(
      "ellipse",
      `cx="${n(x)}" cy="${n(y)}" rx="${n(radius + 1)}" ry="${n(radius)}" fill="${lidColour}" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"`,
      [{ attribute: "opacity", values: [0, 1, 0], seconds: 2.4, ...timing }],
    )
  );
}

/** A maggot that wriggles and inches along. */
export function maggot(
  a: Animator,
  x: number,
  y: number,
  seconds = 1.2,
  width = 2.2,
): string {
  const curl = (bend: number): string =>
    `M${n(x)} ${n(y)} q2 ${n(-bend)} 4 0 q2 ${n(bend)} 4 0`;
  return a.el(
    "path",
    `fill="none" stroke="${MAGGOT}" stroke-width="${n(width)}" stroke-linecap="round"`,
    [
      { attribute: "d", values: [curl(2), curl(-2), curl(2)], seconds },
      {
        attribute: "transform",
        transform: "translate",
        values: ["0 0", "2 -1", "0 0"],
        seconds,
      },
    ],
  );
}

/** A pool of blood (or ichor) under a piece that slowly spreads and shrinks. */
export function pool(
  a: Animator,
  centreX: number,
  width: number,
  colour = BLOOD,
): string {
  return a.el("ellipse", `cx="${n(centreX)}" cy="95" ry="4" fill="${colour}"`, [
    { attribute: "rx", values: [width, width + 3, width], seconds: 2.4 },
  ]);
}

/** A drop that runs down from (`x`, `y`) and fades. */
export function drip(
  a: Animator,
  x: number,
  y: number,
  length: number,
  colour = BLOOD,
  seconds = 1.2,
): string {
  return a.el("circle", `cx="${n(x)}" r="1.6" fill="${colour}"`, [
    { attribute: "cy", values: [y, y + length], seconds },
    {
      attribute: "opacity",
      values: [1, 1, 0],
      keyTimes: [0, 0.7, 1],
      seconds,
    },
  ]);
}

/** A heart that beats, scaled about its own centre. */
export function beatingHeart(
  a: Animator,
  x: number,
  y: number,
  size: number,
  seconds = 0.6,
  colour = MEAT_LIGHT,
): string {
  const heart = `<path d="M0 4 C-7 -1 -5 -7 0 -3 C5 -7 7 -1 0 4 Z" transform="scale(${n(size / 7)})" fill="${colour}" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"/>`;
  return `<g transform="translate(${n(x)} ${n(y)})">${a.el(
    "g",
    "",
    [
      {
        attribute: "transform",
        transform: "scale",
        values: [1, 1.3, 1],
        seconds,
      },
    ],
    heart,
  )}</g>`;
}

/** Twitches `svg` about a pivot: still, a sudden jerk, then back. */
export function twitch(
  a: Animator,
  pivotX: number,
  pivotY: number,
  angle: number,
  svg: string,
  seconds = 1.2,
): string {
  const turn = (degrees: number): string =>
    `${n(degrees)} ${n(pivotX)} ${n(pivotY)}`;
  return a.el(
    "g",
    "",
    [
      {
        attribute: "transform",
        transform: "rotate",
        values: [turn(0), turn(0), turn(angle), turn(-angle / 2), turn(0)],
        keyTimes: [0, 0.45, 0.5, 0.75, 1],
        seconds,
      },
    ],
    svg,
  );
}

/** The torn robe with its rope belt, the body every white pawn shares. */
export function pawnRobe(tint = BONE): string {
  return `
  <path d="M30 92 L34 86 L37 90 L41 85 L45 90 L50 85 L55 90 L59 85 L63 90 L66 86 L70 92 L62 82 Q64 64 58 54 L42 54 Q36 64 38 82 Z" fill="${tint}" ${OUTLINE}/>
  <path d="M41 66 Q44 74 42 82 M58 64 Q55 72 57 80" fill="none" stroke="${BONE_DARK}" stroke-width="1.6"/>
  <path d="M39 70 L61 69" stroke="${ROPE}" stroke-width="2.6"/>
  <path d="M44 69 L46 76 M47 69 L46 75" stroke="${ROPE}" stroke-width="1.4"/>`;
}

/** The hooded skull with hollow eyes, a stitched mouth and a blood tear. */
export function pawnHead(
  a: Animator,
  tint = BONE,
  tearSide: -1 | 1 = -1,
): string {
  return `
  <circle cx="50" cy="38" r="13.5" fill="${tint}" ${OUTLINE}/>
  <path d="M35 42 Q34 20 50 21 Q66 20 65 42 L62 36 L60 41 Q57 29 50 29 Q43 29 40 41 L38 36 Z" fill="${BONE_DARK}" ${OUTLINE}/>
  <ellipse cx="45" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/><ellipse cx="55" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/>
  ${glowingPupil(a, 45, 40)}${glowingPupil(a, 55, 40)}
  <path d="M44 47 L56 47" stroke="${OUTLINE_COLOUR}" stroke-width="1.6"/>
  <path d="M45.5 45 L46.5 49 M48.5 45 L49.5 49 M51.5 45 L52.5 49 M54.5 45 L55.5 49" stroke="${OUTLINE_COLOUR}" stroke-width="1.1"/>
  <path d="M${n(50 + tearSide * 5)} 43 Q${n(50 + tearSide * 5.6)} 47 ${n(50 + tearSide * 4.8)} 51" fill="none" stroke="${BLOOD_LIGHT}" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M56 28 L54 32 L57 34" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"/>`;
}

/** A whole hooded bone pawn, standing at `centreX`; each pawn type adds its own horror to it. */
export function hoodedPawn(
  a: Animator,
  centreX = 50,
  scale = 1,
  tint = BONE,
): string {
  return standAt(centreX, scale, pawnRobe(tint) + pawnHead(a, tint));
}
