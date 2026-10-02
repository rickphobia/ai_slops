import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  parseAudioSettings,
  saveAudioSettings,
  SETTINGS_STORAGE_KEY,
} from "../../../src/adapters/audio/audio-settings";
import {
  type AudioOutput,
  createSoundPlayer,
  MAX_COPIES_PER_WINDOW,
  PITCH_SPREAD,
  WINDOW_MS,
} from "../../../src/adapters/audio/sound-player";
import type { SoundName } from "../../../src/adapters/audio/sound-names";

interface Played {
  name: SoundName;
  pitch: number;
  volume: number;
}

function fakeOutput(): AudioOutput & { played: Played[]; music: number[] } {
  const played: Played[] = [];
  const music: number[] = [];
  return {
    played,
    music,
    play: (name, pitch, volume) => played.push({ name, pitch, volume }),
    setMusicVolume: (volume) => music.push(volume),
    setMusicMood: () => undefined,
  };
}

describe("sound player", () => {
  it("plays at most a few copies of one sound per 100 ms, then again after", () => {
    const output = fakeOutput();
    let now = 0;
    const player = createSoundPlayer(
      output,
      DEFAULT_AUDIO_SETTINGS,
      () => now,
      () => 0.5,
    );
    for (let index = 0; index < 50; index++) player.play("pawn-strike");
    expect(output.played).toHaveLength(MAX_COPIES_PER_WINDOW);
    player.play("pawn-death");
    expect(output.played).toHaveLength(MAX_COPIES_PER_WINDOW + 1);
    now = WINDOW_MS;
    player.play("pawn-strike");
    expect(output.played).toHaveLength(MAX_COPIES_PER_WINDOW + 2);
  });

  it("varies the pitch within the spread so repeats don't drone", () => {
    const output = fakeOutput();
    const randoms = [0, 1, 0.5];
    const player = createSoundPlayer(
      output,
      DEFAULT_AUDIO_SETTINGS,
      () => 0,
      () => randoms.shift() ?? 0.5,
    );
    player.play("drop-pop");
    player.play("drop-pop");
    player.play("drop-pop");
    const pitches = output.played.map((played) => played.pitch);
    expect(pitches[0]).toBeCloseTo(1 - PITCH_SPREAD);
    expect(pitches[1]).toBeCloseTo(1 + PITCH_SPREAD);
    expect(pitches[2]).toBeCloseTo(1);
  });

  it("scales effects by master and effects volume, and music by master and music", () => {
    const output = fakeOutput();
    const player = createSoundPlayer(
      output,
      { ...DEFAULT_AUDIO_SETTINGS, master: 0.5, effects: 0.5, music: 0.4 },
      () => 0,
      () => 0.5,
    );
    player.play("landed");
    expect(output.played[0]?.volume).toBeCloseTo(0.25);
    expect(output.music.at(-1)).toBeCloseTo(0.2);
  });

  it("is silent when muted and picks up setting changes", () => {
    const output = fakeOutput();
    const player = createSoundPlayer(
      output,
      { ...DEFAULT_AUDIO_SETTINGS, muted: true },
      () => 0,
      () => 0.5,
    );
    player.play("landed");
    expect(output.played).toEqual([]);
    expect(output.music.at(-1)).toBe(0);
    player.applySettings(DEFAULT_AUDIO_SETTINGS);
    player.play("landed");
    expect(output.played).toHaveLength(1);
  });
});

describe("saved settings", () => {
  it("round-trips through storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const settings = { ...DEFAULT_AUDIO_SETTINGS, master: 0.2, muted: true };
    saveAudioSettings(storage, settings, () => undefined);
    expect(values.has(SETTINGS_STORAGE_KEY)).toBe(true);
    expect(loadAudioSettings(storage, () => undefined)).toEqual(settings);
  });

  it("falls back to defaults, and says so, when storage is blocked", () => {
    const problems: string[] = [];
    const blocked = {
      getItem: (): string | null => {
        throw new Error("blocked");
      },
      setItem: (): void => {
        throw new Error("blocked");
      },
    };
    expect(loadAudioSettings(blocked, (m) => problems.push(m))).toEqual(
      DEFAULT_AUDIO_SETTINGS,
    );
    saveAudioSettings(blocked, DEFAULT_AUDIO_SETTINGS, (m) => problems.push(m));
    expect(problems).toHaveLength(2);
    expect(loadAudioSettings(undefined, () => undefined)).toEqual(
      DEFAULT_AUDIO_SETTINGS,
    );
  });

  it("repairs bad stored values field by field", () => {
    expect(
      parseAudioSettings({ master: 7, music: "loud", muted: true }),
    ).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      master: 1,
      muted: true,
    });
    expect(parseAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS);
  });
});
