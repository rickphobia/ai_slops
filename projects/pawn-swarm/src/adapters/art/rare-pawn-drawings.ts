import {
  BLOOD,
  BLOOD_LIGHT,
  BONE,
  EMBER,
  ICHOR,
  IRON_LIGHT,
  LEECH_FLUID,
  MEAT,
  MEAT_DARK,
  MEAT_LIGHT,
  OUTLINE_COLOUR,
  SKIN,
  SKIN_DARK,
  SPARK,
  STEEL,
  VEIN,
  WOOD,
} from "./palette";
import {
  beatingHeart,
  type Drawing,
  drip,
  maggot,
  OUTLINE,
  pawnHead,
  pawnRobe,
  pool,
  standAt,
} from "./parts";

const JAR_GLINT = "#e8f0c8";
const TANNED = "#5a3a30";

/** A surgeon pawn: a suture needle through its own cheek, carrying a jar where a pickled heart still beats. */
export const medicPawn: Drawing = (a) =>
  pool(a, 52, 18) +
  standAt(
    40,
    1,
    pawnRobe() +
      `<path d="M45 74 L55 74 M50 69 L50 79" stroke="${BLOOD_LIGHT}" stroke-width="3" stroke-linecap="round"/>` +
      pawnHead(a, BONE, 1) +
      `<path d="M33 46 Q31 36 38 32" fill="none" stroke="${STEEL}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M33 46 Q40 52 46 58 Q52 64 60 62" fill="none" stroke="${MEAT_LIGHT}" stroke-width="1" stroke-dasharray="2 1.5"/>`,
  ) +
  `<rect x="57" y="55" width="26" height="6" rx="1.5" fill="${IRON_LIGHT}" ${OUTLINE}/>
  <path d="M59 61 L81 61 L84 67 L84 90 Q84 95 79 95 L61 95 Q56 95 56 90 L56 67 Z" fill="${LEECH_FLUID}" ${OUTLINE}/>
  <path d="M60 68 L60 88" stroke="${JAR_GLINT}" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>` +
  beatingHeart(a, 70, 79, 8, 0.6, MEAT) +
  `<path d="M70 85 Q72 89 69 92" fill="none" stroke="${MEAT_DARK}" stroke-width="1.6"/>` +
  a.el("circle", `cx="76" r="1.2" fill="${JAR_GLINT}"`, [
    { attribute: "cy", values: [90, 66], seconds: 1.2 },
    { attribute: "opacity", values: [0.8, 0], seconds: 1.2 },
  ]) +
  a.el("circle", `cx="64" r="1" fill="${JAR_GLINT}"`, [
    { attribute: "cy", values: [88, 68], seconds: 2.4 },
    { attribute: "opacity", values: [0.8, 0], seconds: 2.4 },
  ]) +
  `<circle cx="52" cy="66" r="3.4" fill="${BONE}" ${OUTLINE}/>`;

/** A war banner of stretched, flayed face skin on a pole topped with a skull; it flaps and drips. */
export const bannerPawn: Drawing = (a) =>
  pool(a, 48, 18) +
  `<path d="M72 96 L72 10" stroke="${WOOD}" stroke-width="4" stroke-linecap="round"/>
  <path d="M58 16 L88 16" stroke="${WOOD}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="72" cy="8" r="5" fill="${BONE}" ${OUTLINE}/>
  <circle cx="70" cy="8" r="1.3" fill="${ICHOR}"/><circle cx="74" cy="8" r="1.3" fill="${ICHOR}"/>` +
  a.el("path", `fill="${SKIN}" ${OUTLINE}`, [
    {
      attribute: "d",
      values: [
        "M58 16 L88 16 L88 42 L84 38 L80 46 L76 40 L72 48 L68 40 L64 44 L60 38 Z",
        "M58 16 L88 16 L91 42 L86 39 L83 47 L78 41 L75 49 L70 41 L66 45 L61 39 Z",
        "M58 16 L88 16 L88 42 L84 38 L80 46 L76 40 L72 48 L68 40 L64 44 L60 38 Z",
      ],
      seconds: 1.2,
    },
  ]) +
  `<path d="M64 18 Q66 30 62 38 M82 18 Q80 30 84 38" fill="none" stroke="${SKIN_DARK}" stroke-width="1.4"/>
  <ellipse cx="68" cy="26" rx="2.6" ry="3.4" fill="${ICHOR}"/><ellipse cx="78" cy="26" rx="2.6" ry="3.4" fill="${ICHOR}"/>
  <path d="M67 35 Q73 39 79 35" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="1.6"/>
  <path d="M69 33 L69 37 M72 34 L72 38 M75 34 L75 38 M78 33 L78 36" stroke="${OUTLINE_COLOUR}" stroke-width="1"/>
  <path d="M70 29 Q73 31 76 29" fill="none" stroke="${MEAT}" stroke-width="2"/>` +
  drip(a, 72, 48, 12) +
  drip(a, 64, 44, 10, BLOOD, 2.4) +
  standAt(
    44,
    1,
    pawnRobe() +
      `<path d="M41 56 L46 60 L51 56 L56 60 L59 56" fill="none" stroke="${MEAT}" stroke-width="2.4"/>` +
      pawnHead(a),
  ) +
  `<circle cx="70" cy="62" r="4" fill="${BONE}" ${OUTLINE}/>`;

/** It cradles a bomb sewn from a tanned skin sack, a shrunken face stitched on and a fuse of raw sinew already burning. */
export const bombPawn: Drawing = (a) =>
  pool(a, 54, 20) +
  standAt(44, 1, pawnRobe() + pawnHead(a)) +
  `<circle cx="66" cy="72" r="15" fill="${TANNED}" ${OUTLINE}/>
  <path d="M55 62 Q60 70 56 82 M76 62 Q72 70 78 80" fill="none" stroke="${VEIN}" stroke-width="1.6"/>
  <path d="M53 66 Q66 62 79 67" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="1.6"/>
  <path d="M58 63 L59 68 M63 62 L64 67 M69 62 L68 67 M74 63 L73 68" stroke="${OUTLINE_COLOUR}" stroke-width="1.1"/>
  <ellipse cx="66" cy="75" rx="7" ry="6.5" fill="${SKIN}" ${OUTLINE}/>
  <ellipse cx="63.5" cy="73.5" rx="1.6" ry="2" fill="${ICHOR}"/><ellipse cx="68.5" cy="73.5" rx="1.6" ry="2" fill="${ICHOR}"/>
  <path d="M63 78.5 L69 78.5 M64 77 L64 80 M66 77 L66 80 M68 77 L68 80" stroke="${OUTLINE_COLOUR}" stroke-width="1"/>
  <path d="M74 60 Q82 52 78 44" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M74 60 Q82 52 78 44" fill="none" stroke="${MEAT_LIGHT}" stroke-width="2.6" stroke-linecap="round"/>` +
  a.el("circle", `cx="78" cy="42" fill="${EMBER}"`, [
    { attribute: "r", values: [3, 5.5, 3], seconds: 0.6 },
  ]) +
  `<circle cx="78" cy="42" r="1.8" fill="${SPARK}"/>` +
  a.el("circle", `r="1" fill="${SPARK}"`, [
    { attribute: "cx", values: [78, 86], seconds: 1.2 },
    { attribute: "cy", values: [42, 34], seconds: 1.2 },
    { attribute: "opacity", values: [1, 0], seconds: 1.2 },
  ]) +
  `<path d="M42 73 Q50 78 56 74" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="2.4" stroke-linecap="round"/>` +
  maggot(a, 58, 86, 1.2, 1.8) +
  `<circle cx="80" cy="76" r="3.4" fill="${BONE}" ${OUTLINE}/>`;

export const RARE_PAWN_DRAWINGS = {
  medic: medicPawn,
  banner: bannerPawn,
  bomb: bombPawn,
} as const;
