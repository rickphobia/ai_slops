import {
  BLOOD,
  BLOOD_LIGHT,
  BONE,
  BONE_DARK,
  FAT,
  FLUSH,
  GLOW_RED,
  ICHOR,
  IRIS_DARK,
  MEAT,
  MEAT_DARK,
  MEAT_LIGHT,
  OUTLINE_COLOUR,
  ROPE,
  SICK,
  SKIN,
  SKIN_DARK,
  STEEL,
  VEIN,
  WOOD,
} from "./palette";
import {
  beatingHeart,
  blinkingEye,
  type Drawing,
  drip,
  eyeball,
  hoodedPawn,
  maggot,
  OUTLINE,
  pawnRobe,
  pool,
  twitch,
} from "./parts";

/** Flayed: half the face skinned, one eye hanging on its nerve, ribs and a beating heart through the torn robe, maggots. */
export const plainPawn: Drawing = (a) =>
  pool(a, 50, 16) +
  pawnRobe() +
  `<path d="M42 58 Q50 54 58 58 L56 78 Q50 82 44 78 Z" fill="${MEAT_DARK}" ${OUTLINE}/>
  <path d="M43 62 Q50 60 57 62 M43 67 Q50 65 57 67 M44 72 Q50 70 56 72" fill="none" stroke="${FAT}" stroke-width="2"/>` +
  beatingHeart(a, 50, 66, 5) +
  `<circle cx="50" cy="38" r="13.5" fill="${BONE}" ${OUTLINE}/>
  <path d="M50 25 Q63 27 63 40 Q62 50 52 51 L50 51 Z" fill="${MEAT}" ${OUTLINE}/>
  <path d="M53 30 Q58 34 60 42 M52 36 Q56 40 57 48" fill="none" stroke="${MEAT_LIGHT}" stroke-width="1.4"/>
  <path d="M35 42 Q34 20 50 21 Q60 21 63 28 L56 30 Q50 29 46 31 Q42 33 40 41 L38 36 Z" fill="${BONE_DARK}" ${OUTLINE}/>
  <ellipse cx="45" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/><circle cx="45" cy="40" r="1.2" fill="${GLOW_RED}"/>
  <ellipse cx="55" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/>` +
  a.el("path", `fill="none" stroke="${MEAT_LIGHT}" stroke-width="1.6"`, [
    {
      attribute: "d",
      values: [
        "M55 41 Q58 50 56 56",
        "M55 41 Q53 50 54 56",
        "M55 41 Q58 50 56 56",
      ],
      seconds: 2.4,
    },
  ]) +
  a.el(
    "g",
    "",
    [
      {
        attribute: "transform",
        transform: "translate",
        values: ["0 0", "-2 0", "0 0"],
        seconds: 2.4,
      },
    ],
    eyeball(a, 56, 59, 3.6, 1.2),
  ) +
  `<path d="M42 46 L46 49 L50 46 L54 49 L58 46" fill="none" stroke="${FAT}" stroke-width="1.6"/>
  <path d="M44 47 Q46 54 44 58" fill="none" stroke="${BLOOD_LIGHT}" stroke-width="1.6"/>` +
  maggot(a, 36, 80, 1.2) +
  maggot(a, 56, 86, 2.4) +
  maggot(a, 44, 44, 0.6, 1.6);

/** Two faces fused into one swollen head, sharing a third eye where they meet; the pale donor side collapses, veins bulge on the other. */
export const twinPawn: Drawing = (a) =>
  pool(a, 50, 20) +
  `<path d="M24 92 L28 86 L32 90 L36 85 L41 90 L46 85 L50 90 L54 85 L59 90 L64 85 L68 90 L72 86 L76 92 L68 82 Q71 62 64 52 L36 52 Q29 62 32 82 Z" fill="${BONE}" ${OUTLINE}/>
  <path d="M33 70 L67 69" stroke="${ROPE}" stroke-width="2.6"/>
  <path d="M42 56 Q50 52 58 56 L56 74 Q50 78 44 74 Z" fill="${MEAT_DARK}" ${OUTLINE}/>` +
  beatingHeart(a, 50, 63, 5.5) +
  `<path d="M24 38 Q22 14 48 14 Q78 12 80 38 Q80 56 60 56 L40 56 Q24 56 24 38 Z" fill="${FLUSH}" ${OUTLINE}/>
  <path d="M24 38 Q22 18 40 15 Q34 30 38 54 Q24 54 24 38 Z" fill="${SICK}" ${OUTLINE}/>` +
  a.el(
    "path",
    `d="M30 22 Q38 30 34 44 M70 18 Q62 26 68 40 M58 16 Q56 26 62 30" fill="none" stroke="${VEIN}"`,
    [{ attribute: "stroke-width", values: [1.4, 2.4, 1.4], seconds: 0.6 }],
  ) +
  `<ellipse cx="31" cy="34" rx="3" ry="3.8" fill="${ICHOR}"/><circle cx="31" cy="35" r="1" fill="${GLOW_RED}"/>
  <ellipse cx="66" cy="32" rx="4" ry="4.8" fill="${ICHOR}"/><circle cx="66" cy="33" r="1.3" fill="${GLOW_RED}"/>
  <path d="M44 20 L44 52" stroke="${OUTLINE_COLOUR}" stroke-width="1.6"/>
  <path d="M42 24 L46 25 M42 30 L46 31 M42 36 L46 37 M42 42 L46 43 M42 48 L46 49" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"/>` +
  eyeball(a, 46, 32, 5.5) +
  `<path d="M28 46 Q32 44 36 47" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="1.4"/>
  <path d="M56 46 Q64 52 72 46 L70 50 L66 48 L62 51 L58 48 Z" fill="${ICHOR}" ${OUTLINE}/>
  <path d="M30 37 Q31 44 29 50" fill="none" stroke="${BLOOD_LIGHT}" stroke-width="1.4"/>` +
  drip(a, 64, 51, 10);

/** It has run the spear through its own body; three eyeballs are skewered on the shaft, still looking around. */
export const spearPawn: Drawing = (a) =>
  pool(a, 46, 18) +
  hoodedPawn(a, 46) +
  `<path d="M34 98 L70 6" stroke="${WOOD}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M70 6 L72 0 L76 10 Z" fill="${STEEL}" ${OUTLINE}/>
  <path d="M44 72 Q46 66 52 66 Q50 74 44 72 Z" fill="${MEAT_DARK}" ${OUTLINE}/>
  <path d="M47 70 Q44 80 46 90" fill="none" stroke="${BLOOD}" stroke-width="2.4"/>` +
  a.el(
    "path",
    `fill="none" stroke="${MEAT_LIGHT}" stroke-width="2.6" stroke-linecap="round"`,
    [
      {
        attribute: "d",
        values: [
          "M42 68 Q40 74 42 82",
          "M42 68 Q38 76 41 84",
          "M42 68 Q40 74 42 82",
        ],
        seconds: 2.4,
      },
    ],
  ) +
  eyeball(a, 66, 18, 4.5) +
  eyeball(a, 62, 28, 4, 1.2) +
  eyeball(a, 59, 37, 3.5, 2.4) +
  `<path d="M64 22 Q63 30 61 32 M60 41 Q58 50 57 54" fill="none" stroke="${BLOOD_LIGHT}" stroke-width="1.4"/>` +
  drip(a, 57, 54, 14);

/** Its shield is a flayed face, stretched and stitched; the eye still looks around and blinks, the sewn mouth twitches. */
export const shieldPawn: Drawing = (a) =>
  pool(a, 52, 22) +
  hoodedPawn(a, 38) +
  `<path d="M52 52 L84 50 L84 78 Q84 92 68 97 Q52 92 52 78 Z" fill="${SKIN}" ${OUTLINE}/>
  <path d="M84 58 Q79 63 84 68 M52 66 Q57 71 52 76" fill="none" stroke="${MEAT}" stroke-width="2.8"/>
  <path d="M60 52 Q66 70 60 94 M76 51 Q72 66 78 90" fill="none" stroke="${SKIN_DARK}" stroke-width="1.6"/>
  <path d="M58 60 L62 58 M58 68 L62 67 M58 76 L62 76 M58 84 L61 85 M74 58 L78 59 M74 74 L78 73" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"/>` +
  blinkingEye(a, 69, 66, 5, 0.75, SKIN, IRIS_DARK, 2.4) +
  twitch(
    a,
    69,
    83,
    6,
    `<path d="M62 83 Q69 87 76 83" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="1.8"/>
    <path d="M64 81 L64 86 M67 82 L67 87 M70 82 L70 87 M73 81 L73 86" stroke="${OUTLINE_COLOUR}" stroke-width="1.1"/>`,
  ) +
  `<circle cx="56" cy="55" r="1.8" fill="${STEEL}"/><circle cx="80" cy="54" r="1.8" fill="${STEEL}"/>
  <path d="M56 56 Q57 60 55 63 M80 55 Q81 59 79 61" fill="none" stroke="${BLOOD}" stroke-width="1.4"/>` +
  drip(a, 66, 94, 3, BLOOD, 1.2);

/** Where each common pawn type's drawing lives, for the module that collects every drawing. */
export const COMMON_PAWN_DRAWINGS = {
  plain: plainPawn,
  shield: shieldPawn,
  spear: spearPawn,
  twin: twinPawn,
} as const;
