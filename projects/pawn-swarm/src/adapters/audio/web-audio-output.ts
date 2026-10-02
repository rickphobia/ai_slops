import type { Logger } from "../../logger";
import { createMusic, type Music } from "./music";
import type { SoundName } from "./sound-names";
import { SOUND_RECIPES, type Voice } from "./sound-recipes";
import type { AudioOutput, MusicMood } from "./sound-player";

export interface UnlockableAudio extends AudioOutput {
  /**
   * Starts the audio context. Browsers only allow it after a click or key
   * press, so the entrypoint calls this from the first one. Safe to call again.
   */
  unlock(): void;
}

const NOISE_SECONDS = 2;
/** Everything goes through a low-pass filter: it takes the fizz off the raw oscillators. */
const MASTER_CUTOFF_HZ = 3200;
/** Headroom, so a big fight stacks up without the compressor squashing it. */
const MASTER_LEVEL = 0.55;
/** A few ms fade-in on every sound; starting at full volume clicks. */
const ATTACK_SECONDS = 0.005;

/**
 * The real sound maker, on the Web Audio API. Until `unlock()` runs it keeps
 * the latest music mood and volume and plays nothing, so nothing errors
 * before the first click.
 */
export function createWebAudioOutput(log: Logger): UnlockableAudio {
  let context: AudioContext | undefined;
  let master: GainNode | undefined;
  let noiseBuffer: AudioBuffer | undefined;
  let music: Music | undefined;
  let musicVolume = 0;
  let mood: MusicMood = "off";

  const unlock = (): void => {
    if (context !== undefined) {
      if (context.state === "suspended") void context.resume();
      return;
    }
    try {
      const created = new AudioContext();
      const compressor = created.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      compressor.connect(created.destination);
      const tone = created.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = MASTER_CUTOFF_HZ;
      tone.connect(compressor);
      master = created.createGain();
      master.gain.value = MASTER_LEVEL;
      master.connect(tone);
      noiseBuffer = created.createBuffer(
        1,
        created.sampleRate * NOISE_SECONDS,
        created.sampleRate,
      );
      const samples = noiseBuffer.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
      music = createMusic(created, master);
      music.setVolume(musicVolume);
      music.setMood(mood);
      context = created;
      void created.resume();
      log.info("audio started", { sampleRate: created.sampleRate });
    } catch (error) {
      log.warn("audio unavailable", { error: String(error) });
    }
  };

  const voiceAt = (
    audio: AudioContext,
    start: number,
    pitch: number,
    volume: number,
    buffer: AudioBuffer,
    destination: AudioNode,
  ): Voice => ({
    tone: (type, from, to, seconds, gain, delay = 0) => {
      const at = start + delay;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(from * pitch, at);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, to * pitch),
        at + seconds,
      );
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(gain * volume, at + ATTACK_SECONDS);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
      oscillator.connect(envelope).connect(destination);
      oscillator.start(at);
      oscillator.stop(at + seconds + 0.02);
    },
    noise: (from, to, seconds, gain, delay = 0) => {
      const at = start + delay;
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const envelope = audio.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(from * pitch, at);
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, to * pitch),
        at + seconds,
      );
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(gain * volume, at + ATTACK_SECONDS);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
      source.connect(filter).connect(envelope).connect(destination);
      source.start(at);
      source.stop(at + seconds + 0.02);
    },
  });

  return {
    unlock,
    play: (name: SoundName, pitch, volume) => {
      if (context === undefined || master === undefined) return;
      if (noiseBuffer === undefined || context.state !== "running") return;
      SOUND_RECIPES[name](
        voiceAt(
          context,
          context.currentTime,
          pitch,
          volume,
          noiseBuffer,
          master,
        ),
      );
    },
    setMusicVolume: (volume) => {
      musicVolume = volume;
      music?.setVolume(volume);
    },
    setMusicMood: (next) => {
      mood = next;
      music?.setMood(next);
    },
  };
}
