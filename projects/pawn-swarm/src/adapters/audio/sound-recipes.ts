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
  // Plays hundreds of times a wave: short, low and quiet so it reads as texture.
  "pawn-strike": (v) => {
    v.noise(1400, 500, 0.05, 0.12);
    v.tone("triangle", 220, 140, 0.05, 0.08);
  },
  "black-hit": (v) => {
    v.tone("triangle", 130, 60, 0.18, 0.35);
    v.noise(700, 180, 0.14, 0.2);
  },
  warning: (v) => {
    v.tone("sine", 520, 520, 0.1, 0.22);
    v.tone("sine", 390, 390, 0.14, 0.22, 0.1);
  },
  "pawn-death": (v) => {
    v.tone("triangle", 360, 140, 0.12, 0.1);
    v.noise(1000, 300, 0.08, 0.08);
  },
  "black-death-small": (v) => {
    v.tone("triangle", 180, 55, 0.35, 0.4);
    v.noise(900, 120, 0.3, 0.28);
  },
  "black-death-big": (v) => {
    v.tone("triangle", 140, 35, 0.6, 0.5);
    v.tone("sine", 70, 30, 0.6, 0.45);
    v.noise(800, 80, 0.5, 0.35);
  },
  "king-death": (v) => {
    v.tone("triangle", 120, 28, 1.6, 0.55);
    v.tone("sine", 60, 24, 1.5, 0.5);
    v.noise(700, 60, 1.3, 0.35);
    v.tone("sine", 660, 165, 1.2, 0.15, 0.15);
  },
  "drop-pop": (v) => {
    v.tone("sine", 400, 800, 0.08, 0.2);
  },
  landed: (v) => {
    v.tone("sine", 110, 40, 0.3, 0.55);
    v.noise(400, 80, 0.18, 0.2);
  },
  stomp: (v) => {
    v.tone("sine", 90, 32, 0.4, 0.6);
    v.noise(300, 60, 0.28, 0.25);
  },
  "skill-charge": (v) => {
    v.tone("triangle", 200, 600, 0.35, 0.25);
    v.noise(500, 1800, 0.35, 0.12);
  },
  "skill-hold": (v) => {
    v.tone("triangle", 220, 220, 0.14, 0.25);
    v.tone("triangle", 330, 330, 0.25, 0.25, 0.1);
  },
  "skill-volley": (v) => {
    v.noise(900, 2500, 0.25, 0.18);
    v.tone("triangle", 700, 300, 0.25, 0.18);
  },
  "skill-fork": (v) => {
    v.tone("triangle", 480, 260, 0.09, 0.25);
    v.tone("triangle", 480, 260, 0.09, 0.25, 0.08);
  },
  "skill-triage": (v) => {
    v.tone("sine", 440, 880, 0.35, 0.25);
    v.tone("sine", 660, 1320, 0.35, 0.15, 0.08);
  },
  "skill-rally": (v) => {
    v.tone("triangle", 262, 262, 0.16, 0.28);
    v.tone("triangle", 392, 392, 0.3, 0.28, 0.14);
  },
  "skill-detonate": (v) => {
    v.tone("triangle", 300, 140, 0.12, 0.25);
  },
  blast: (v) => {
    v.tone("sine", 110, 32, 0.6, 0.7);
    v.noise(1200, 90, 0.45, 0.35);
  },
  "wave-start": (v) => {
    v.tone("triangle", 110, 110, 0.5, 0.35);
    v.tone("triangle", 82, 82, 0.8, 0.35, 0.35);
  },
  push: (v) => {
    v.tone("triangle", 70, 55, 0.9, 0.4);
    v.noise(250, 90, 0.6, 0.18);
  },
  win: (v) => {
    v.tone("triangle", 392, 392, 0.2, 0.3);
    v.tone("triangle", 494, 494, 0.2, 0.3, 0.18);
    v.tone("triangle", 587, 587, 0.2, 0.3, 0.36);
    v.tone("triangle", 784, 784, 0.9, 0.35, 0.54);
  },
  loss: (v) => {
    v.tone("triangle", 330, 330, 0.3, 0.32);
    v.tone("triangle", 262, 262, 0.3, 0.32, 0.3);
    v.tone("triangle", 196, 160, 1.2, 0.36, 0.6);
  },
  "shop-buy": (v) => {
    v.tone("sine", 700, 700, 0.07, 0.22);
    v.tone("sine", 1050, 1050, 0.11, 0.22, 0.06);
  },
  "shop-reroll": (v) => {
    v.noise(1200, 2600, 0.08, 0.15);
    v.noise(1200, 2600, 0.08, 0.15, 0.09);
  },
  "shop-click": (v) => {
    v.tone("triangle", 480, 360, 0.05, 0.18);
  },
};
