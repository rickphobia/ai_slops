import type { MusicMood } from "./sound-player";

interface MoodSettings {
  /** Beats per minute. */
  readonly bpm: number;
  /** Loudness of the whole loop relative to the music volume. */
  readonly level: number;
  /** Extra layers switched on. */
  readonly pulse: boolean;
  readonly lead: boolean;
}

const MOODS: Readonly<Record<Exclude<MusicMood, "off">, MoodSettings>> = {
  shop: { bpm: 56, level: 0.45, pulse: false, lead: false },
  battle: { bpm: 84, level: 0.8, pulse: true, lead: false },
  king: { bpm: 108, level: 1, pulse: true, lead: true },
};

/** A dark minor loop: the root walks down a bar at a time. Hz. */
const BASS_NOTES = [55, 55, 51.9, 49];
const LEAD_NOTES = [220, 261.6, 207.7, 196, 233.1, 220, 174.6, 196];
const LOOKAHEAD_SECONDS = 0.25;
const TICK_MS = 50;

export interface Music {
  setMood(mood: MusicMood): void;
  setVolume(volume: number): void;
}

/**
 * Procedural music: a bass line, a heartbeat pulse and a lead, scheduled a
 * little ahead of the clock. The shop's loop is slower and quieter; the
 * battle's gets faster and adds the lead once the king lands.
 */
export function createMusic(
  context: AudioContext,
  destination: AudioNode,
): Music {
  const bus = context.createGain();
  bus.gain.value = 0;
  bus.connect(destination);
  let mood: MusicMood = "off";
  let volume = 0;
  let nextBeatTime = 0;
  let beat = 0;
  let timer: ReturnType<typeof setInterval> | undefined;

  const note = (
    type: OscillatorType,
    frequency: number,
    start: number,
    seconds: number,
    gain: number,
  ): void => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain, start + 0.03);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(envelope).connect(bus);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  };

  const scheduleBeat = (settings: MoodSettings, time: number): void => {
    const beatSeconds = 60 / settings.bpm;
    const bar = Math.floor(beat / 4) % BASS_NOTES.length;
    const bass = BASS_NOTES[bar] ?? 55;
    if (beat % 4 === 0) note("sawtooth", bass, time, beatSeconds * 3.6, 0.22);
    if (settings.pulse) {
      note("sine", 52, time, 0.22, 0.5);
      if (beat % 2 === 1) note("sine", 52, time + beatSeconds * 0.5, 0.18, 0.3);
    }
    if (settings.lead) {
      const lead = LEAD_NOTES[beat % LEAD_NOTES.length] ?? 220;
      note("triangle", lead, time, beatSeconds * 0.9, 0.12);
    }
    beat += 1;
  };

  const tick = (): void => {
    if (mood === "off") return;
    const settings = MOODS[mood];
    while (nextBeatTime < context.currentTime + LOOKAHEAD_SECONDS) {
      scheduleBeat(settings, nextBeatTime);
      nextBeatTime += 60 / settings.bpm;
    }
  };

  const applyGain = (): void => {
    const level = mood === "off" ? 0 : MOODS[mood].level;
    bus.gain.setTargetAtTime(volume * level, context.currentTime, 0.3);
  };

  return {
    setMood: (next) => {
      if (next === mood) return;
      mood = next;
      if (mood === "off") {
        if (timer !== undefined) clearInterval(timer);
        timer = undefined;
      } else if (timer === undefined) {
        nextBeatTime = context.currentTime + 0.05;
        beat = 0;
        timer = setInterval(tick, TICK_MS);
      }
      applyGain();
    },
    setVolume: (next) => {
      volume = next;
      applyGain();
    },
  };
}
