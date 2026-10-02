/**
 * The piece drawings are written once and played two ways:
 * - live, as SVG with SMIL animations, for portraits in the DOM;
 * - as a few still frames, which the canvas renderer turns into images at
 *   startup so a battle never parses SVG while it runs.
 * A drawing builds its moving parts through an `Animator`, so both come from
 * the same code.
 */

/** Every animation loops within this many seconds, so the frames loop cleanly. */
export const ANIMATION_LOOP_SECONDS = 2.4;
/** Frames per loop: 0.3 s each, enough for a heartbeat (2 frames) or a blink (1 frame). */
export const ANIMATION_FRAMES = 8;
/** Spreads neighbouring pieces' frames apart; coprime with the frame count so every phase is used. */
const FRAME_OFFSET_PER_ID = 3;
const LOOP_TOLERANCE = 1e-6;
/** Frame times like 7 × 0.3 s land a hair before a key time in floating point; this nudges them onto it. */
const PHASE_NUDGE = 1e-9;

/** One animated attribute of an element. */
export interface Motion {
  readonly attribute: string;
  readonly values: readonly (string | number)[];
  /** Length of one cycle. Must divide `ANIMATION_LOOP_SECONDS`. */
  readonly seconds: number;
  /** Where each value sits in the cycle, 0 to 1, as in SMIL. Evenly spread when left out. */
  readonly keyTimes?: readonly number[];
  /** Jump between values instead of blending them (a blink). */
  readonly discrete?: boolean;
  /** Animates the `transform` attribute with this transform function. */
  readonly transform?: "translate" | "scale" | "rotate";
}

export interface Animator {
  /** An element with fixed `attributes` and the given moving ones. */
  el(
    tag: string,
    attributes: string,
    motions: readonly Motion[],
    children?: string,
  ): string;
}

const NUMBER = /-?\d*\.?\d+(?:e-?\d+)?/g;

/** Rounds to 3 decimals, enough for a 100-unit drawing, so the SVG stays short. */
export function svgNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function blend(from: string, to: string, share: number): string {
  const toNumbers = to.match(NUMBER) ?? [];
  const fromNumbers = from.match(NUMBER) ?? [];
  if (toNumbers.length !== fromNumbers.length) {
    throw new Error(
      `Animated values must have the same numbers: "${from}" and "${to}".`,
    );
  }
  let index = 0;
  return from.replace(NUMBER, (start) => {
    const end = Number(toNumbers[index]);
    index++;
    return svgNumber(Number(start) + (end - Number(start)) * share);
  });
}

function evenKeyTimes(count: number, discrete: boolean): number[] {
  const segments = discrete ? count : count - 1;
  return Array.from({ length: count }, (_, index) =>
    segments === 0 ? 0 : index / segments,
  );
}

/** The value a SMIL animation shows at `atSeconds`. */
export function sampleValue(
  values: readonly (string | number)[],
  seconds: number,
  atSeconds: number,
  keyTimes?: readonly number[],
  discrete = false,
): string {
  const texts = values.map(String);
  const times = keyTimes ?? evenKeyTimes(texts.length, discrete);
  const phase = (((atSeconds / seconds + PHASE_NUDGE) % 1) + 1) % 1;
  let segment = 0;
  while (segment < times.length - 1 && (times[segment + 1] ?? 1) <= phase) {
    segment++;
  }
  const from = texts[segment] ?? "";
  if (discrete || segment >= texts.length - 1) {
    // The numbers must still line up, so a typo fails here and not only in the live version.
    blend(from, texts[texts.length - 1] ?? from, 0);
    return from;
  }
  const start = times[segment] ?? 0;
  const end = times[segment + 1] ?? 1;
  return blend(
    from,
    texts[segment + 1] ?? from,
    (phase - start) / (end - start),
  );
}

function openTag(tag: string, attributes: string, extra: string): string {
  return `<${tag}${attributes === "" ? "" : ` ${attributes}`}${extra}`;
}

function closeElement(tag: string, children: string): string {
  return children === "" ? "/>" : `>${children}</${tag}>`;
}

function attributeText(motion: Motion, value: string): string {
  const shown =
    motion.transform === undefined ? value : `${motion.transform}(${value})`;
  return ` ${motion.attribute}="${shown}"`;
}

/** Draws the still frame at `atSeconds` into the loop. */
export function frameAnimator(atSeconds: number): Animator {
  return {
    el: (tag, attributes, motions, children = "") => {
      const animated = motions
        .map((motion) => {
          const cycles = ANIMATION_LOOP_SECONDS / motion.seconds;
          if (Math.abs(cycles - Math.round(cycles)) > LOOP_TOLERANCE) {
            throw new Error(
              `A ${String(motion.seconds)} s ${motion.attribute} animation doesn't divide the ${String(ANIMATION_LOOP_SECONDS)} s loop.`,
            );
          }
          const value = sampleValue(
            motion.values,
            motion.seconds,
            atSeconds,
            motion.keyTimes,
            motion.discrete,
          );
          return attributeText(motion, value);
        })
        .join("");
      return openTag(tag, attributes, animated) + closeElement(tag, children);
    },
  };
}

function smil(motion: Motion): string {
  const element =
    motion.transform === undefined ? "animate" : "animateTransform";
  const type =
    motion.transform === undefined ? "" : ` type="${motion.transform}"`;
  const keyTimes =
    motion.keyTimes === undefined
      ? ""
      : ` keyTimes="${motion.keyTimes.join(";")}"`;
  const calcMode = motion.discrete === true ? ' calcMode="discrete"' : "";
  return `<${element} attributeName="${motion.attribute}"${type} values="${motion.values.join(";")}" dur="${String(motion.seconds)}s"${keyTimes}${calcMode} repeatCount="indefinite"/>`;
}

/** Draws SVG that animates itself with SMIL. */
export function liveAnimator(): Animator {
  return {
    el: (tag, attributes, motions, children = "") => {
      const start = motions
        .map((motion) => attributeText(motion, String(motion.values[0])))
        .join("");
      const content = motions.map(smil).join("") + children;
      return openTag(tag, attributes, start) + closeElement(tag, content);
    },
  };
}

/** Which frame a piece shows at `seconds`; `pieceId` shifts it so a crowd doesn't move in step. */
export function frameIndexAt(seconds: number, pieceId: number): number {
  const frameSeconds = ANIMATION_LOOP_SECONDS / ANIMATION_FRAMES;
  const frame =
    Math.floor(seconds / frameSeconds) + pieceId * FRAME_OFFSET_PER_ID;
  return ((frame % ANIMATION_FRAMES) + ANIMATION_FRAMES) % ANIMATION_FRAMES;
}
