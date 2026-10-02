import type { AudioSettings } from "./audio-settings";
import type { SoundName } from "./sound-names";

/** Whatever actually makes noise. The Web Audio synth is the real one; tests use a fake. */
export interface AudioOutput {
  /** Plays one sound. `pitch` multiplies its frequency (1 = unchanged); `volume` is 0–1. */
  play(name: SoundName, pitch: number, volume: number): void;
  /** Applies the music volume (0–1, already includes master and mute). */
  setMusicVolume(volume: number): void;
  /** 0 = quiet shop loop, 1 = battle loop, 2 = battle once the king has landed. */
  setMusicMood(mood: MusicMood): void;
}

export type MusicMood = "off" | "shop" | "battle" | "king";

export interface SoundPlayer {
  play(name: SoundName): void;
  setMood(mood: MusicMood): void;
  applySettings(settings: AudioSettings): void;
}

/** Same sound at most this many times per window, so a 300-pawn fight stays listenable. */
export const MAX_COPIES_PER_WINDOW = 3;
export const WINDOW_MS = 100;
/** Each play is shifted by up to this fraction up or down, so repeats don't drone. */
export const PITCH_SPREAD = 0.08;

/**
 * Decides which sounds actually play: caps repeats, varies pitch and applies
 * the volumes. `nowMs` and `random` are passed in so tests control them.
 */
export function createSoundPlayer(
  output: AudioOutput,
  settings: AudioSettings,
  nowMs: () => number,
  random: () => number,
): SoundPlayer {
  let current = settings;
  const recent = new Map<SoundName, number[]>();

  const musicVolume = (): number =>
    current.muted ? 0 : current.master * current.music;

  const applySettings = (next: AudioSettings): void => {
    current = next;
    output.setMusicVolume(musicVolume());
  };
  applySettings(settings);

  return {
    applySettings,
    setMood: (mood) => {
      output.setMusicMood(mood);
    },
    play: (name) => {
      if (current.muted) return;
      const now = nowMs();
      const times = (recent.get(name) ?? []).filter(
        (time) => now - time < WINDOW_MS,
      );
      if (times.length >= MAX_COPIES_PER_WINDOW) {
        recent.set(name, times);
        return;
      }
      times.push(now);
      recent.set(name, times);
      const pitch = 1 + (random() * 2 - 1) * PITCH_SPREAD;
      output.play(name, pitch, current.master * current.effects);
    },
  };
}
