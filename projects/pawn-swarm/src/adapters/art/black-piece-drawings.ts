import { svgNumber as n } from "./animation";
import {
  BLOOD,
  CHAR,
  CHAR_LIGHT,
  EMBER,
  EYE_WHITE,
  FAT,
  ICHOR,
  IRON,
  IRON_LIGHT,
  MEAT,
  MEAT_DARK,
  MEAT_LIGHT,
  OUTLINE_COLOUR,
  ROT,
  TARNISHED_GOLD,
} from "./palette";
import {
  blinkingEye,
  type Drawing,
  drip,
  eyeball,
  maggot,
  OUTLINE,
  pool,
  twitch,
} from "./parts";

/** Pale grey bone for black pieces: darker than the white pawns' bone so the sides don't mix. */
const GREY_BONE = "#9c9184";
const CHAIN = "#6b6b6b";

function plinth(left: number, right: number): string {
  return `<path d="M${String(left)} 94 L${String(right)} 94 L${String(right - 4)} 84 L${String(left + 4)} 84 Z" fill="${IRON}" ${OUTLINE}/>`;
}

/** A charred, half-skinned horse head: raw muscle on the cheek, a lipless grin, eyes blinking open down its neck, ribs breaking out. */
export const knight: Drawing = (a) =>
  pool(a, 50, 24) +
  plinth(24, 76) +
  `<path d="M36 84 L38 60 Q30 50 34 38 Q40 22 56 16 L60 7 L64 16 Q76 22 80 38 L82 54 Q74 60 66 54 L60 58 Q66 68 66 84 Z" fill="${CHAR}" ${OUTLINE}/>
  <path d="M44 24 L37 23 L40 30 L33 31 L37 38 L31 41 L36 46" fill="none" stroke="${CHAR_LIGHT}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M54 22 Q66 20 74 30 Q80 40 76 50 Q68 48 62 40 Q56 32 54 22 Z" fill="${MEAT}" ${OUTLINE}/>
  <path d="M58 26 Q66 30 70 40 M62 24 Q70 28 74 36" fill="none" stroke="${MEAT_LIGHT}" stroke-width="1.4"/>
  <path d="M66 52 L82 52 L82 56 Q74 60 66 56 Z" fill="${FAT}" ${OUTLINE}/>
  <path d="M68 52 L68 56 M71 52 L71 57 M74 52 L74 57 M77 52 L77 57 M80 52 L80 56" stroke="${OUTLINE_COLOUR}" stroke-width="1"/>` +
  eyeball(a, 68, 33, 4.5) +
  blinkingEye(a, 40, 62, 2.4, 0.25, CHAR) +
  blinkingEye(a, 44, 70, 2.2, 0.625, CHAR) +
  blinkingEye(a, 39, 77, 2.2, 0.875, CHAR) +
  `<path d="M50 62 Q56 60 60 64 M50 70 Q57 68 62 72 M50 78 Q57 76 63 80" fill="none" stroke="${GREY_BONE}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M60 58 Q61 66 59 72" fill="none" stroke="${ICHOR}" stroke-width="2.4"/>` +
  drip(a, 59, 72, 12, ICHOR);

/** A plague priest whose mitre splits into a vertical mouth of teeth that opens and shuts; eyes stare from its flanks. */
export const bishop: Drawing = (a) =>
  pool(a, 50, 22) +
  plinth(24, 76) +
  `<path d="M32 84 Q34 60 42 50 L58 50 Q66 60 68 84 Z" fill="${CHAR}" ${OUTLINE}/>
  <path d="M40 58 Q38 70 40 80 M60 58 Q62 70 60 80" fill="none" stroke="${GREY_BONE}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M44 66 Q50 62 56 66 L54 72 L46 72 Z" fill="${MEAT}" ${OUTLINE}/>
  <path d="M38 52 Q34 30 50 8 Q66 30 62 52 Z" fill="${IRON}" ${OUTLINE}/>` +
  a.el(
    "path",
    `fill="${MEAT_DARK}" stroke="${OUTLINE_COLOUR}" stroke-width="1.4"`,
    [
      {
        attribute: "d",
        values: [
          "M50 14 Q47 30 50 46 Q53 30 50 14 Z",
          "M50 14 Q42 30 50 46 Q58 30 50 14 Z",
          "M50 14 Q47 30 50 46 Q53 30 50 14 Z",
        ],
        seconds: 1.2,
      },
    ],
  ) +
  `<path d="M49 18 L47 20 M51 22 L53 24 M49 27 L46 29 M51 32 L54 34 M49 37 L46 39 M51 41 L53 43" stroke="${EYE_WHITE}" stroke-width="1.4" stroke-linecap="round"/>` +
  blinkingEye(a, 42, 34, 2, 0.375, IRON) +
  blinkingEye(a, 58, 34, 2, 0.75, IRON) +
  `<path d="M44 50 L56 50" stroke="${IRON_LIGHT}" stroke-width="3"/>
  <path d="M36 54 Q34 60 36 64 M64 54 Q66 60 64 64" fill="none" stroke="${FAT}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M50 46 Q51 60 49 74" fill="none" stroke="${BLOOD}" stroke-width="2"/>` +
  drip(a, 49, 74, 10);

/** A ruined tower with flesh growing between its stones and one huge eye in the window; chains, seeping blood, maggots. */
export const rook: Drawing = (a) =>
  pool(a, 50, 28) +
  plinth(22, 78) +
  `<path d="M30 84 L33 36 L67 36 L70 84 Z" fill="${IRON}" ${OUTLINE}/>
  <path d="M27 36 L27 18 L36 18 L36 26 L45 26 L45 14 L55 16 L55 26 L63 26 L63 20 L73 18 L73 36 Z" fill="${IRON}" ${OUTLINE}/>` +
  a.el(
    "path",
    `d="M34 44 Q40 48 38 56 Q36 64 42 70 M66 42 Q60 50 64 58 M58 66 Q62 74 58 82 M44 28 Q50 32 56 28" fill="none" stroke="${MEAT}"`,
    [{ attribute: "stroke-width", values: [2, 3.2, 2], seconds: 0.6 }],
  ) +
  `<path d="M42 46 Q50 38 58 46 L58 62 L42 62 Z" fill="${MEAT_DARK}" ${OUTLINE}/>
  <ellipse cx="50" cy="53" rx="7" ry="6" fill="${EYE_WHITE}"/>` +
  a.el("circle", `cy="53" r="3.5" fill="${EMBER}"`, [
    { attribute: "cx", values: [47, 53, 50, 47], seconds: 2.4 },
  ]) +
  a.el("circle", `cy="53" r="1.4" fill="${ICHOR}"`, [
    { attribute: "cx", values: [47, 53, 50, 47], seconds: 2.4 },
  ]) +
  `<path d="M44 48 L42 45 M50 46 L50 42 M56 48 L58 45" stroke="${MEAT_LIGHT}" stroke-width="1.2"/>
  <path d="M42 72 Q50 78 58 72" fill="${ICHOR}" ${OUTLINE}/>
  <path d="M45 73 L46 76 M50 74 L50 77 M55 73 L54 76" stroke="${FAT}" stroke-width="1.1"/>
  <path d="M70 40 Q78 48 74 60" fill="none" stroke="${CHAIN}" stroke-width="2" stroke-dasharray="3 2"/>
  <path d="M30 44 Q24 54 28 62" fill="none" stroke="${CHAIN}" stroke-width="2" stroke-dasharray="3 2"/>
  <path d="M36 84 Q38 90 34 94 M62 84 Q60 90 64 94" fill="none" stroke="${BLOOD}" stroke-width="2.4"/>` +
  maggot(a, 40, 88, 1.2, 1.8) +
  maggot(a, 56, 90, 2.4, 1.8);

/** Under the veil her face is a single vertical mouth; four bone arms twitch, and a second face gapes on her belly. */
export const queen: Drawing = (a) => {
  const arms = (lift: number): string =>
    `M38 52 L18 ${n(40 - lift)} L10 ${n(44 - lift)} M38 58 L16 ${n(60 + lift)} L10 ${n(66 + lift)} M62 52 L82 ${n(40 - lift)} L90 ${n(44 - lift)} M62 58 L84 ${n(60 + lift)} L90 ${n(66 + lift)}`;
  const twitching = {
    attribute: "d",
    values: [arms(0), arms(0), arms(4), arms(0)],
    keyTimes: [0, 0.4, 0.5, 1],
    seconds: 1.2,
  };
  return (
    pool(a, 50, 26) +
    plinth(22, 78) +
    `<path d="M28 84 Q30 56 40 46 L60 46 Q70 56 72 84 Z" fill="${IRON}" ${OUTLINE}/>` +
    a.el(
      "path",
      `fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`,
      [twitching],
    ) +
    a.el(
      "path",
      `fill="none" stroke="${GREY_BONE}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`,
      [twitching],
    ) +
    `<ellipse cx="50" cy="34" rx="11" ry="13" fill="${GREY_BONE}" ${OUTLINE}/>` +
    a.el("path", `fill="${ICHOR}" ${OUTLINE}`, [
      {
        attribute: "d",
        values: [
          "M50 23 Q44 34 50 46 Q56 34 50 23 Z",
          "M50 23 Q41 34 50 46 Q59 34 50 23 Z",
          "M50 23 Q44 34 50 46 Q56 34 50 23 Z",
        ],
        seconds: 2.4,
      },
    ]) +
    `<path d="M47 27 L49 28 M53 27 L51 28 M46 32 L49 33 M54 32 L51 33 M46 37 L49 37 M54 37 L51 37 M47 42 L49 41 M53 42 L51 41" stroke="${EYE_WHITE}" stroke-width="1.3"/>
    <path d="M30 80 Q34 50 50 22 Q66 50 70 80 Q60 70 50 74 Q40 70 30 80 Z" fill="${CHAR_LIGHT}" opacity=".5"/>
    <path d="M39 22 L41 12 L44 20 L47 9 L50 19 L53 9 L56 20 L59 12 L61 22 Z" fill="${EYE_WHITE}" ${OUTLINE}/>
    <ellipse cx="44" cy="66" rx="2.4" ry="3" fill="${MEAT}"/><ellipse cx="56" cy="66" rx="2.4" ry="3" fill="${MEAT}"/>
    <path d="M44 74 Q50 79 56 74 Q50 76 44 74 Z" fill="${BLOOD}" ${OUTLINE}/>
    <path d="M45 75 L46 77 M50 76 L50 78 M55 75 L54 77" stroke="${EYE_WHITE}" stroke-width="1"/>` +
    drip(a, 50, 78, 8)
  );
};

/** A rotting king whose crown has grown into his skull, a bone cross on top; eyes open and shut across his robe, his jaw hangs. */
export const king: Drawing = (a) =>
  pool(a, 50, 30) +
  plinth(20, 80) +
  `<path d="M28 84 Q30 58 38 48 L62 48 Q70 58 72 84 Z" fill="${IRON}" ${OUTLINE}/>` +
  [
    [40, 62, 0.125],
    [58, 58, 0.375],
    [48, 72, 0.625],
    [62, 74, 0.875],
    [36, 76, 0.5],
  ]
    .map(([x = 0, y = 0, closeAt = 0]) =>
      blinkingEye(a, x, y, 2.6, closeAt, IRON, MEAT),
    )
    .join("") +
  `<circle cx="50" cy="36" r="12" fill="${ROT}" ${OUTLINE}/>
  <path d="M37 32 L39 22 L44 28 L50 20 L56 28 L61 22 L63 32 Q50 28 37 32 Z" fill="${TARNISHED_GOLD}" ${OUTLINE}/>
  <path d="M38 33 Q44 30 50 31 Q56 30 62 33" fill="none" stroke="${MEAT}" stroke-width="2.4"/>
  <path d="M50 20 L50 6 M45 11 L55 11" stroke="${OUTLINE_COLOUR}" stroke-width="5.4" stroke-linecap="round"/>
  <path d="M50 20 L50 6 M45 11 L55 11" stroke="${GREY_BONE}" stroke-width="3" stroke-linecap="round"/>
  <ellipse cx="45" cy="37" rx="3" ry="3.4" fill="${ICHOR}"/><ellipse cx="55" cy="37" rx="3" ry="3.4" fill="${ICHOR}"/>` +
  a.el("circle", `cx="45" cy="37.5" fill="${EMBER}"`, [
    { attribute: "r", values: [1.4, 0.8, 1.4], seconds: 1.2 },
  ]) +
  a.el("circle", `cx="55" cy="37.5" fill="${EMBER}"`, [
    { attribute: "r", values: [1.4, 0.8, 1.4], seconds: 1.2 },
  ]) +
  twitch(
    a,
    50,
    43,
    8,
    `<path d="M43 43 Q50 54 57 43 Q50 47 43 43 Z" fill="${ICHOR}" ${OUTLINE}/>
    <path d="M45 44 L46 47 M48 45 L48.5 48 M52 45 L51.5 48 M55 44 L54 47" stroke="${FAT}" stroke-width="1.2"/>`,
    2.4,
  ) +
  maggot(a, 38, 30, 1.2, 1.6) +
  maggot(a, 56, 42, 0.6, 1.4) +
  drip(a, 42, 84, 8, ICHOR, 2.4);

export const BLACK_PIECE_DRAWINGS = {
  knight,
  bishop,
  rook,
  queen,
  king,
} as const;
