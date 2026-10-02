import { svgNumber as n } from "./animation";
import {
  BLOOD,
  BLOOD_LIGHT,
  BONE,
  BONE_DARK,
  BONE_SHADE,
  EYE_WHITE,
  FAT,
  GLOW_RED,
  ICHOR,
  MAGGOT,
  MEAT,
  MEAT_DARK,
  MEAT_LIGHT,
  OUTLINE_COLOUR,
  ROPE,
  STEEL,
  VEIN,
} from "./palette";
import {
  type Drawing,
  drip,
  glowingPupil,
  OUTLINE,
  pawnHead,
  pawnRobe,
  pool,
  standAt,
  twitch,
} from "./parts";

/** Swollen with young: its belly is torn open and a small hooded pawn pushes its head out, still on the cord. */
export const recruiterPawn: Drawing = (a) =>
  pool(a, 50, 22) +
  `<path d="M28 92 L32 86 L35 90 L40 85 L45 90 L50 85 L55 90 L60 85 L65 90 L68 86 L72 92 L66 82 Q74 64 60 54 L40 54 Q26 64 34 82 Z" fill="${BONE}" ${OUTLINE}/>
  <ellipse cx="50" cy="71" rx="17" ry="14" fill="${BONE_SHADE}" ${OUTLINE}/>
  <path d="M36 66 Q42 62 46 66 M58 64 Q62 70 66 68" fill="none" stroke="${VEIN}" stroke-width="1.4"/>
  <path d="M41 72 L44 64 L48 67 L51 61 L55 66 L59 63 L60 72 L57 80 L52 77 L48 81 L44 77 Z" fill="${MEAT_DARK}" ${OUTLINE}/>` +
  a.el(
    "g",
    "",
    [
      {
        attribute: "transform",
        transform: "translate",
        values: ["0 2", "0 -1.5", "0 2"],
        seconds: 1.2,
      },
    ],
    `<circle cx="51" cy="70" r="5.5" fill="${BONE}" ${OUTLINE}/>
    <path d="M45.5 71 Q45 63 51 63 Q57 63 56.5 71 L55 68 Q53 66 51 66 Q49 66 47 68 Z" fill="${BONE_DARK}" stroke="${OUTLINE_COLOUR}" stroke-width="1.2"/>
    <circle cx="49" cy="71" r="1.3" fill="${ICHOR}"/><circle cx="53" cy="71" r="1.3" fill="${ICHOR}"/>
    <path d="M45 76 Q43 72 46 70" fill="none" stroke="${BONE}" stroke-width="2.2" stroke-linecap="round"/>`,
  ) +
  `<path d="M51 76 Q54 82 48 86 Q44 90 46 94" fill="none" stroke="${MEAT_LIGHT}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M38 69 L61 68" stroke="${ROPE}" stroke-width="2.4" stroke-dasharray="6 14"/>` +
  drip(a, 44, 80, 10) +
  drip(a, 58, 79, 12, BLOOD, 2.4) +
  pawnHead(a);

/** All muscle: the robe torn away, bone spikes through the shoulders, a cleaver grown out of its forearm, foaming at the mouth. */
export const berserkerPawn: Drawing = (a) =>
  pool(a, 50, 22) +
  standAt(
    50,
    1.06,
    `<path d="M32 92 L36 86 L40 90 L44 85 L50 90 L56 85 L60 90 L64 86 L68 92 L64 76 L36 76 Z" fill="${BONE}" ${OUTLINE}/>
    <path d="M30 40 L38 54 L34 54 Z M70 40 L62 54 L66 54 Z M26 48 L36 58 L32 60 Z M74 48 L64 58 L68 60 Z" fill="${EYE_WHITE}" ${OUTLINE}/>
    <path d="M36 56 Q24 62 26 78" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="9" stroke-linecap="round"/>
    <path d="M36 56 Q24 62 26 78" fill="none" stroke="${MEAT}" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M34 78 Q30 60 40 52 L60 52 Q70 60 66 78 Z" fill="${MEAT}" ${OUTLINE}/>
    <path d="M42 58 Q50 62 58 58 M44 66 L56 66 M44 72 L56 72 M50 60 L50 77" fill="none" stroke="${MEAT_DARK}" stroke-width="1.6"/>
    <path d="M38 60 Q36 66 38 72 M62 60 Q64 66 62 72" fill="none" stroke="${MEAT_LIGHT}" stroke-width="1.4"/>
    <path d="M35 76 L65 76" stroke="${ROPE}" stroke-width="3"/>` +
      twitch(
        a,
        62,
        56,
        -10,
        `<path d="M62 56 Q76 58 78 70" fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="9" stroke-linecap="round"/>
        <path d="M62 56 Q76 58 78 70" fill="none" stroke="${MEAT}" stroke-width="5.6" stroke-linecap="round"/>
        <path d="M76 70 L92 48 L95 54 L82 76 Z" fill="${STEEL}" ${OUTLINE}/>
        <path d="M78 70 L90 53" stroke="${BLOOD_LIGHT}" stroke-width="1.4"/>`,
        0.6,
      ) +
      `<circle cx="50" cy="38" r="13" fill="${BONE}" ${OUTLINE}/>
      <path d="M37 40 Q36 22 50 23 Q58 23 61 28 L55 27 L52 31 L47 27 L42 33 Z" fill="${BONE_DARK}" ${OUTLINE}/>
      <path d="M40 28 Q44 32 42 38 M60 30 Q57 34 60 40" fill="none" stroke="${VEIN}" stroke-width="1.6"/>
      <circle cx="45" cy="37" r="3.6" fill="${EYE_WHITE}" ${OUTLINE}/><circle cx="55" cy="37" r="3.6" fill="${EYE_WHITE}" ${OUTLINE}/>
      <circle cx="45" cy="37" r="1.6" fill="${GLOW_RED}"/><circle cx="55" cy="37" r="1.6" fill="${GLOW_RED}"/>
      <path d="M42 33 L48 35 M58 33 L52 35" stroke="${OUTLINE_COLOUR}" stroke-width="1.8"/>
      <path d="M43 44 Q50 52 57 44 Z" fill="${ICHOR}" ${OUTLINE}/>
      <path d="M45 45 L46 48 M48 46 L48.5 49 M52 46 L51.5 49 M55 45 L54 48" stroke="${FAT}" stroke-width="1.2"/>`,
  ) +
  drip(a, 46, 50, 10, MAGGOT, 0.6) +
  drip(a, 54, 50, 12, MAGGOT, 1.2);

/** Already becoming a queen: a crown of teeth splits its skull from inside, and spider legs of bone carry it fast. */
export const promoterPawn: Drawing = (a) => {
  const legs = (spread: number): string =>
    `M40 84 L${n(30 - spread)} 90 L${n(26 - spread)} 98 M44 86 L${n(38 - spread)} 96 M56 86 L${n(62 + spread)} 96 M60 84 L${n(70 + spread)} 90 L${n(74 + spread)} 98`;
  const scuttle = {
    attribute: "d",
    values: [legs(0), legs(3), legs(0)],
    seconds: 0.6,
  };
  return (
    pool(a, 50, 16) +
    a.el(
      "path",
      `fill="none" stroke="${OUTLINE_COLOUR}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"`,
      [scuttle],
    ) +
    a.el(
      "path",
      `fill="none" stroke="${BONE_SHADE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`,
      [scuttle],
    ) +
    pawnRobe() +
    `<circle cx="50" cy="38" r="13.5" fill="${BONE}" ${OUTLINE}/>
    <path d="M35 42 Q34 26 40 23 L44 30 L47 22 L50 29 L53 22 L56 30 L60 23 Q66 26 65 42 L62 36 L60 41 Q57 31 50 31 Q43 31 40 41 L38 36 Z" fill="${BONE_DARK}" ${OUTLINE}/>
    <path d="M41 25 L44 30 L47 24 L50 29 L53 24 L56 30 L59 25" fill="none" stroke="${MEAT}" stroke-width="2.4"/>` +
    a.el(
      "g",
      "",
      [
        {
          attribute: "transform",
          transform: "translate",
          values: ["0 1.5", "0 -1.5", "0 1.5"],
          seconds: 2.4,
        },
      ],
      `<path d="M40 26 L42 12 L45 22 L47.5 6 L50 20 L52.5 6 L55 22 L58 12 L60 26 Z" fill="${EYE_WHITE}" ${OUTLINE}/>
      <circle cx="50" cy="12" r="2" fill="${GLOW_RED}"/>`,
    ) +
    `<ellipse cx="45" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/><ellipse cx="55" cy="39" rx="3.4" ry="4.2" fill="${ICHOR}"/>` +
    glowingPupil(a, 45, 40) +
    glowingPupil(a, 55, 40) +
    `<path d="M44 47 L56 47" stroke="${OUTLINE_COLOUR}" stroke-width="1.6"/>
    <path d="M45.5 45 L46.5 49 M48.5 45 L49.5 49 M51.5 45 L52.5 49 M54.5 45 L55.5 49" stroke="${OUTLINE_COLOUR}" stroke-width="1.1"/>
    <path d="M47 30 Q46 36 43 38 M53 30 Q55 36 57 40" fill="none" stroke="${BLOOD_LIGHT}" stroke-width="1.4"/>` +
    drip(a, 57, 40, 10)
  );
};

/** Torn down the middle for its sidestep: the two halves slide apart on strands of meat, a ghost of it left behind. */
export const enPassantPawn: Drawing = (a) => {
  const body = pawnRobe() + pawnHead(a);
  const half = (side: "left" | "right", shift: number): string =>
    a.el(
      "g",
      "",
      [
        {
          attribute: "transform",
          transform: "translate",
          values: [
            `${String(shift)} 0`,
            `${String(shift * 2)} 0`,
            `${String(shift)} 0`,
          ],
          seconds: 1.2,
        },
      ],
      `<g clip-path="url(#pawn-swarm-en-passant-${side})">${body}</g>`,
    );
  return (
    `<defs>
      <clipPath id="pawn-swarm-en-passant-left"><path d="M0 0 L51 0 L48 30 L52 50 L48 70 L51 100 L0 100 Z"/></clipPath>
      <clipPath id="pawn-swarm-en-passant-right"><path d="M51 0 L100 0 L100 100 L51 100 L48 70 L52 50 L48 30 Z"/></clipPath>
    </defs>` +
    pool(a, 50, 20) +
    standAt(36, 0.9, `<g opacity=".25">${pawnRobe(BONE_SHADE)}</g>`) +
    `<path d="M46 24 L54 24 L54 92 L46 92 Z" fill="${MEAT_DARK}"/>
    <path d="M46 40 L54 42 M46 52 L54 50 M46 64 L54 66 M46 78 L54 76" stroke="${MEAT_LIGHT}" stroke-width="1.4"/>` +
    half("left", -1.5) +
    half("right", 1.5) +
    drip(a, 50, 80, 12) +
    drip(a, 50, 50, 14, BLOOD, 2.4)
  );
};

export const EPIC_PAWN_DRAWINGS = {
  recruiter: recruiterPawn,
  berserker: berserkerPawn,
  promoter: promoterPawn,
  enPassant: enPassantPawn,
} as const;
