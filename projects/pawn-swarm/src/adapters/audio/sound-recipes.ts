import type { SoundName } from "./sound-names";

/** What a recipe draws on: building blocks bound to one audio context and start time. */
export interface Voice {
  /** A pitched blip that glides from `from` to `to` Hz. */
  tone(
    type: OscillatorType,
    from: number,
    to: number,
    seconds: number,
    gain: number,
    delay?: number,
  ): void;
  /** A burst of filtered noise; `from`/`to` sweep the filter's cutoff in Hz. */
  noise(
    from: number,
    to: number,
    seconds: number,
    gain: number,
    delay?: number,
  ): void;
}

type Recipe = (voice: Voice) => void;

/**
 * Every sound, made from oscillators and noise: no files. To use a recording
 * for one of them later, change how `web-audio-output.ts` plays that name.
 */
export const SOUND_RECIPES: Readonly<Record<SoundName, Recipe>> = {
  "pawn-strike": (v) => {
    v.noise(3000, 900, 0.07, 0.35);
    v.tone("square", 260, 110, 0.06, 0.18);
  },
  "black-hit": (v) => {
    v.tone("sawtooth", 140, 50, 0.22, 0.5);
    v.noise(1200, 200, 0.2, 0.45);
  },
  warning: (v) => {
    v.tone("triangle", 520, 520, 0.09, 0.25);
    v.tone("triangle", 390, 390, 0.12, 0.25, 0.1);
  },
  "pawn-death": (v) => {
    v.tone("square", 420, 90, 0.16, 0.2);
    v.noise(2200, 400, 0.12, 0.25);
  },
  "black-death-small": (v) => {
    v.tone("sawtooth", 200, 45, 0.35, 0.45);
    v.noise(1800, 150, 0.3, 0.5);
  },
  "black-death-big": (v) => {
    v.tone("sawtooth", 150, 30, 0.6, 0.6);
    v.tone("square", 90, 28, 0.5, 0.4);
    v.noise(1500, 90, 0.55, 0.6);
  },
  "king-death": (v) => {
    v.tone("sawtooth", 130, 24, 1.6, 0.65);
    v.tone("square", 65, 20, 1.4, 0.5);
    v.noise(1200, 60, 1.4, 0.6);
    v.tone("triangle", 880, 110, 1.2, 0.2, 0.15);
  },
  "drop-pop": (v) => {
    v.tone("sine", 300, 900, 0.09, 0.3);
  },
  landed: (v) => {
    v.tone("sine", 110, 38, 0.3, 0.7);
    v.noise(500, 80, 0.2, 0.4);
  },
  stomp: (v) => {
    v.tone("sine", 90, 30, 0.4, 0.8);
    v.noise(400, 60, 0.3, 0.5);
  },
  "skill-charge": (v) => {
    v.tone("sawtooth", 180, 720, 0.4, 0.3);
    v.noise(800, 4000, 0.4, 0.25);
  },
  "skill-hold": (v) => {
    v.tone("square", 220, 220, 0.12, 0.3);
    v.tone("square", 330, 330, 0.25, 0.3, 0.1);
    v.noise(2500, 2500, 0.08, 0.3);
  },
  "skill-volley": (v) => {
    v.noise(1500, 6000, 0.3, 0.4);
    v.tone("triangle", 900, 300, 0.3, 0.2);
  },
  "skill-fork": (v) => {
    v.tone("square", 500, 250, 0.08, 0.28);
    v.tone("square", 500, 250, 0.08, 0.28, 0.07);
  },
  "wave-start": (v) => {
    v.tone("sawtooth", 110, 110, 0.5, 0.45);
    v.tone("sawtooth", 82, 82, 0.8, 0.45, 0.35);
  },
  push: (v) => {
    v.tone("sawtooth", 70, 55, 0.9, 0.45);
    v.noise(300, 100, 0.7, 0.3);
  },
  win: (v) => {
    v.tone("triangle", 392, 392, 0.2, 0.4);
    v.tone("triangle", 494, 494, 0.2, 0.4, 0.18);
    v.tone("triangle", 587, 587, 0.2, 0.4, 0.36);
    v.tone("triangle", 784, 784, 0.9, 0.45, 0.54);
  },
  loss: (v) => {
    v.tone("sawtooth", 330, 330, 0.3, 0.4);
    v.tone("sawtooth", 262, 262, 0.3, 0.4, 0.3);
    v.tone("sawtooth", 196, 160, 1.2, 0.45, 0.6);
  },
  "shop-buy": (v) => {
    v.tone("square", 700, 700, 0.06, 0.25);
    v.tone("square", 1050, 1050, 0.1, 0.25, 0.06);
  },
  "shop-reroll": (v) => {
    v.noise(2000, 5000, 0.08, 0.3);
    v.noise(2000, 5000, 0.08, 0.3, 0.09);
  },
  "shop-click": (v) => {
    v.tone("square", 480, 360, 0.05, 0.22);
  },
};
