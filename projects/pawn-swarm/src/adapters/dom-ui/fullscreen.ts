import type { Logger } from "../../logger";
import { requireElement } from "./require-element";

/**
 * The fullscreen toggle: a button, the F key, and the shop's start-wave
 * button, which enters fullscreen so a battle fills the screen. Browsers only
 * allow fullscreen from a click or key press, which is why it hangs off those.
 */
export function createFullscreenToggle(root: Document, log: Logger): void {
  const button = requireElement(root, "fullscreen", HTMLButtonElement);
  const page = root.documentElement;

  const enter = (): void => {
    if (root.fullscreenElement !== null || !root.fullscreenEnabled) return;
    page.requestFullscreen().catch((error: unknown) => {
      log.warn("fullscreen refused", { error: String(error) });
    });
  };
  const toggle = (): void => {
    if (root.fullscreenElement === null) {
      enter();
      return;
    }
    root.exitFullscreen().catch((error: unknown) => {
      log.warn("leaving fullscreen failed", { error: String(error) });
    });
  };

  button.hidden = !root.fullscreenEnabled;
  button.addEventListener("click", toggle);
  root.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "f" || event.key === "F") toggle();
  });
  root.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-action="start-wave"]') !== null
    ) {
      enter();
    }
  });
  root.addEventListener("fullscreenchange", () => {
    const on = root.fullscreenElement !== null;
    button.setAttribute("aria-pressed", String(on));
    button.textContent = on ? "Exit full" : "Fullscreen";
  });
}
