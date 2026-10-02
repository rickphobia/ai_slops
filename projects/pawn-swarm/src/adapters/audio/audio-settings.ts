/** What the player can tune in the settings panel. Volumes are 0–1. */
export interface AudioSettings {
  readonly master: number;
  readonly music: number;
  readonly effects: number;
  readonly muted: boolean;
  readonly screenShake: boolean;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  master: 0.8,
  music: 0.5,
  effects: 0.8,
  muted: false,
  screenShake: true,
};

export const SETTINGS_STORAGE_KEY = "pawn-swarm.settings";

/** The slice of `Storage` we use, so tests can pass a fake (or a broken one). */
export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function volume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Fixes whatever was stored: a missing or wrong-typed field falls back to its default. */
export function parseAudioSettings(raw: unknown): AudioSettings {
  const stored =
    typeof raw === "object" && raw !== null
      ? (raw as Partial<Record<keyof AudioSettings, unknown>>)
      : {};
  const defaults = DEFAULT_AUDIO_SETTINGS;
  return {
    master: volume(stored.master, defaults.master),
    music: volume(stored.music, defaults.music),
    effects: volume(stored.effects, defaults.effects),
    muted: flag(stored.muted, defaults.muted),
    screenShake: flag(stored.screenShake, defaults.screenShake),
  };
}

/**
 * Browser storage can be missing, full or blocked (private windows, cleared
 * site data); settings then simply don't persist. `onProblem` lets the caller log it.
 */
export function loadAudioSettings(
  storage: SettingsStorage | undefined,
  onProblem: (message: string) => void,
): AudioSettings {
  if (storage === undefined) return DEFAULT_AUDIO_SETTINGS;
  try {
    const text = storage.getItem(SETTINGS_STORAGE_KEY);
    return text === null
      ? DEFAULT_AUDIO_SETTINGS
      : parseAudioSettings(JSON.parse(text));
  } catch (error) {
    onProblem(`could not read saved settings: ${String(error)}`);
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(
  storage: SettingsStorage | undefined,
  settings: AudioSettings,
  onProblem: (message: string) => void,
): void {
  if (storage === undefined) return;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    onProblem(`could not save settings: ${String(error)}`);
  }
}
