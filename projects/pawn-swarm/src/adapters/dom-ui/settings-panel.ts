import type { AudioSettings } from "../audio/audio-settings";
import { requireElement } from "./require-element";

/**
 * The settings button and its panel. It reports every change as a whole new
 * settings object; the entrypoint applies and saves it.
 */
export function createSettingsPanel(
  root: Document,
  initial: AudioSettings,
  onChange: (settings: AudioSettings) => void,
): void {
  const toggle = requireElement(root, "settings-toggle", HTMLButtonElement);
  const panel = requireElement(root, "settings-panel", HTMLElement);
  const master = requireElement(root, "setting-master", HTMLInputElement);
  const music = requireElement(root, "setting-music", HTMLInputElement);
  const effects = requireElement(root, "setting-effects", HTMLInputElement);
  const muted = requireElement(root, "setting-muted", HTMLInputElement);
  const shake = requireElement(root, "setting-shake", HTMLInputElement);

  master.value = String(Math.round(initial.master * 100));
  music.value = String(Math.round(initial.music * 100));
  effects.value = String(Math.round(initial.effects * 100));
  muted.checked = initial.muted;
  shake.checked = initial.screenShake;

  const read = (): AudioSettings => ({
    master: Number(master.value) / 100,
    music: Number(music.value) / 100,
    effects: Number(effects.value) / 100,
    muted: muted.checked,
    screenShake: shake.checked,
  });
  for (const input of [master, music, effects, muted, shake]) {
    input.addEventListener("input", () => {
      onChange(read());
    });
  }

  toggle.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
  });
}
