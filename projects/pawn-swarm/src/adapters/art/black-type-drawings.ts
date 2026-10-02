import { bishop, knight, queen, rook } from "./black-piece-drawings";
import {
  BANDED_IRON,
  CHAR,
  COLD_BLUE,
  EMBER,
  EYE_WHITE,
  GLOW_RED,
  HOT_CRACK,
  HUNTER_RED,
  ICHOR,
  IRON,
  IRON_LIGHT,
  LIGHTNING,
  MEAT,
  RITUAL_VIOLET,
  SMOKE_GREEN,
  SMOKE_GREY,
} from "./palette";
import { type Drawing, OUTLINE, twitch } from "./parts";

/**
 * Each black type keeps its piece's shape and adds one strong change that
 * shows its power (docs/art/README.md), so it reads at a glance in a wave.
 */

/** Iron-shod and heavier: spiked chains on the neck, an iron slab under it, glowing cracks where it lands. */
export const stomper: Drawing = (a) =>
  knight(a) +
  `<path d="M30 60 L24 64 L30 66 M32 70 L26 76 L33 76 M66 62 L72 64 L66 68" fill="none" stroke="${BANDED_IRON}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M34 58 Q46 66 60 58" fill="none" stroke="${BANDED_IRON}" stroke-width="2.4" stroke-dasharray="3 2"/>
  <path d="M20 92 L80 92 L82 99 L18 99 Z" fill="${IRON_LIGHT}" ${OUTLINE}/>
  <circle cx="26" cy="95.5" r="1.4" fill="${BANDED_IRON}"/><circle cx="50" cy="95.5" r="1.4" fill="${BANDED_IRON}"/><circle cx="74" cy="95.5" r="1.4" fill="${BANDED_IRON}"/>` +
  a.el(
    "path",
    `d="M18 99 L10 94 L4 99 M50 99 L46 92 M82 99 L90 94 L96 99" fill="none" stroke="${HOT_CRACK}" stroke-width="2.2" stroke-linecap="round"`,
    [{ attribute: "opacity", values: [1, 0.35, 1], seconds: 0.6 }],
  );

/** Lean and hound-like with three red eyes, a red trail streaming behind it. */
export const hunter: Drawing = (a) =>
  `<g transform="translate(50 94) scale(.88 1) translate(-50 -94)">${knight(a)}</g>` +
  a.el(
    "g",
    `fill="${GLOW_RED}"`,
    [{ attribute: "opacity", values: [1, 0.5, 1], seconds: 0.6 }],
    `<circle cx="60" cy="27" r="2.2"/><circle cx="66" cy="38" r="2.2"/><circle cx="56" cy="34" r="2"/>`,
  ) +
  a.el(
    "path",
    `d="M6 40 L28 38 M4 50 L26 47 M8 60 L30 56" stroke="${HUNTER_RED}" stroke-width="2.4" stroke-linecap="round"`,
    [{ attribute: "opacity", values: [0.8, 0.3, 0.8], seconds: 0.6 }],
  );

/** Swings a censer of sickly green smoke that knits black pieces back together. */
export const priest: Drawing = (a) =>
  bishop(a) +
  a.el(
    "g",
    "",
    [
      {
        attribute: "transform",
        transform: "rotate",
        values: ["-14 66 58", "14 66 58", "-14 66 58"],
        seconds: 2.4,
      },
    ],
    `<path d="M66 58 L80 72" stroke="${SMOKE_GREY}" stroke-width="1.6"/>
    <circle cx="82" cy="75" r="5.5" fill="${IRON_LIGHT}" ${OUTLINE}/>
    <circle cx="82" cy="75" r="2" fill="${SMOKE_GREEN}"/>`,
  ) +
  a.el("circle", `cx="84" r="5" fill="${SMOKE_GREEN}"`, [
    { attribute: "cy", values: [70, 52], seconds: 1.2 },
    { attribute: "opacity", values: [0.6, 0], seconds: 1.2 },
  ]) +
  a.el("circle", `cx="78" r="4" fill="${SMOKE_GREEN}"`, [
    { attribute: "cy", values: [68, 46], seconds: 2.4 },
    { attribute: "opacity", values: [0.5, 0], seconds: 2.4 },
  ]);

/** Stretched tall, with a long bone needle and one cold blue eye that never blinks. */
export const sniper: Drawing = (a) =>
  `<g transform="translate(50 94) scale(.86 1.08) translate(-50 -94)">${bishop(a)}</g>` +
  `<path d="M70 92 L86 4" stroke="${ICHOR}" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M70 92 L86 4" stroke="${EYE_WHITE}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="50" cy="40" r="4.4" fill="${EYE_WHITE}" ${OUTLINE}/>` +
  a.el("circle", `cx="50" cy="40" fill="${COLD_BLUE}"`, [
    { attribute: "r", values: [2.4, 2.9, 2.4], seconds: 1.2 },
  ]) +
  `<circle cx="50" cy="40" r="1" fill="${ICHOR}"/>`;

/** Banded in iron plates and extra battlements, its eye shuttered behind bars. */
export const tower: Drawing = (a) =>
  rook(a) +
  `<path d="M31 50 L69 50 M31 66 L69 66 M30 78 L70 78" stroke="${BANDED_IRON}" stroke-width="3.4"/>
  <path d="M44 45 L44 62 M50 43 L50 62 M56 45 L56 62" stroke="${BANDED_IRON}" stroke-width="2.6"/>
  <circle cx="34" cy="50" r="1.3" fill="${IRON}"/><circle cx="66" cy="50" r="1.3" fill="${IRON}"/><circle cx="34" cy="66" r="1.3" fill="${IRON}"/><circle cx="66" cy="66" r="1.3" fill="${IRON}"/>
  <path d="M25 18 L25 9 L34 9 L34 18 M66 18 L66 9 L75 9 L75 18 M45 14 L45 6 L55 6 L55 16" fill="${IRON}" ${OUTLINE}/>`;

/** A cannon barrel pushes out of the window where the eye should be, smoking. */
export const cannon: Drawing = (a) =>
  rook(a) +
  `<path d="M40 46 L40 62 L60 60 L60 48 Z" fill="${CHAR}" ${OUTLINE}/>
  <rect x="56" y="46" width="22" height="14" rx="2" fill="${IRON_LIGHT}" ${OUTLINE}/>
  <path d="M62 46 L62 60 M70 46 L70 60" stroke="${BANDED_IRON}" stroke-width="2"/>
  <ellipse cx="78" cy="53" rx="3" ry="6" fill="${ICHOR}" ${OUTLINE}/>` +
  a.el("circle", `cx="78" cy="53" r="2" fill="${EMBER}"`, [
    { attribute: "opacity", values: [1, 0.2, 1], seconds: 0.6 },
  ]) +
  a.el("circle", `r="5" fill="${SMOKE_GREY}"`, [
    { attribute: "cx", values: [80, 94], seconds: 1.2 },
    { attribute: "cy", values: [50, 40], seconds: 1.2 },
    { attribute: "opacity", values: [0.7, 0], seconds: 1.2 },
  ]) +
  a.el("circle", `r="4" fill="${SMOKE_GREY}"`, [
    { attribute: "cx", values: [80, 92], seconds: 2.4 },
    { attribute: "cy", values: [46, 30], seconds: 2.4 },
    { attribute: "opacity", values: [0.6, 0], seconds: 2.4 },
  ]);

/** Pale lightning arcs from her hair in a wind that isn't there. */
export const storm: Drawing = (a) =>
  queen(a) +
  `<circle cx="50" cy="60" r="36" fill="none" stroke="${LIGHTNING}" stroke-width="1.2" stroke-dasharray="2 6" opacity=".55"/>` +
  a.el(
    "path",
    `d="M40 18 L32 12 L37 11 L26 0 M60 18 L68 10 L63 9 L74 -2 M44 14 L42 4" fill="none" stroke="${LIGHTNING}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`,
    [
      {
        attribute: "opacity",
        values: [1, 0.15, 1, 0.15],
        seconds: 1.2,
        discrete: true,
      },
    ],
  ) +
  twitch(
    a,
    50,
    24,
    6,
    `<path d="M30 80 Q24 50 40 30 Q30 60 34 80 Z M70 80 Q76 50 60 30 Q70 60 66 80 Z" fill="${LIGHTNING}" opacity=".18"/>`,
    0.6,
  );

/** Stands in a violet ritual circle, ghost knights rising at its edge. */
export const summoner: Drawing = (a) => {
  const ghost = (x: number, flip: number): string =>
    `<path d="M${String(x - 4 * flip)} 92 Q${String(x - 6 * flip)} 80 ${String(x)} 74 Q${String(x + 6 * flip)} 72 ${String(x + 6 * flip)} 78 L${String(x + 2 * flip)} 80 Q${String(x + 4 * flip)} 86 ${String(x + 4 * flip)} 92 Z" fill="${RITUAL_VIOLET}"/>`;
  return (
    `<ellipse cx="50" cy="95" rx="44" ry="6" fill="none" stroke="${RITUAL_VIOLET}" stroke-width="2.2"/>
    <path d="M14 95 L86 95 M28 90 L72 100 M28 100 L72 90" stroke="${RITUAL_VIOLET}" stroke-width="1" opacity=".6"/>
    <circle cx="10" cy="95" r="2" fill="${MEAT}"/><circle cx="90" cy="95" r="2" fill="${MEAT}"/>` +
    queen(a) +
    a.el(
      "g",
      "",
      [
        { attribute: "opacity", values: [0.15, 0.6, 0.15], seconds: 2.4 },
        {
          attribute: "transform",
          transform: "translate",
          values: ["0 4", "0 -2", "0 4"],
          seconds: 2.4,
        },
      ],
      ghost(12, 1),
    ) +
    a.el(
      "g",
      "",
      [
        { attribute: "opacity", values: [0.6, 0.15, 0.6], seconds: 2.4 },
        {
          attribute: "transform",
          transform: "translate",
          values: ["0 -2", "0 4", "0 -2"],
          seconds: 2.4,
        },
      ],
      ghost(88, -1),
    )
  );
};

export const BLACK_TYPE_DRAWINGS = {
  stomper,
  priest,
  hunter,
  tower,
  sniper,
  cannon,
  storm,
  summoner,
} as const;
