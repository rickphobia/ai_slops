import { POWER_UPS, type PowerUpId } from "../../catalog/power-ups";
import { requireElement } from "./require-element";

export interface Toast {
  /** Shows a short message over the board, replacing the one on show. It fades by itself. */
  show(text: string, colour: string): void;
  /** Takes the message down now, e.g. when a screen opens over the board. */
  hide(): void;
}

/** How long a toast stays up, in real milliseconds. */
const TOAST_MS = 2600;

/** What the toast says when a pawn picks up a power-up: its name and its effect. */
export function powerUpToastText(powerUp: PowerUpId): string {
  const { name, text } = POWER_UPS[powerUp];
  return `${name}: ${text}`;
}

export function createToast(root: Document): Toast {
  const element = requireElement(root, "toast", HTMLElement);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  return {
    hide: () => {
      clearTimeout(hideTimer);
      element.hidden = true;
    },
    show: (text, colour) => {
      element.textContent = text;
      element.style.setProperty("--toast-colour", colour);
      element.hidden = false;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        element.hidden = true;
      }, TOAST_MS);
    },
  };
}
