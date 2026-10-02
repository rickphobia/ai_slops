import { StartupError } from "../startup-error";

export interface RunResult {
  readonly outcome: "won" | "lost";
  readonly wave: number;
  readonly seed: number;
}

export interface EndScreen {
  show(result: RunResult): void;
  hide(): void;
}

/** The win / game-over panel. It shows a result and reports the "new run" click; it holds no game state. */
export function createEndScreen(
  root: Document,
  onNewRun: () => void,
): EndScreen {
  const panel = requireElement(root, "end-screen", HTMLElement);
  const title = requireElement(root, "end-title", HTMLElement);
  const detail = requireElement(root, "end-detail", HTMLElement);
  const newRunButton = requireElement(root, "new-run", HTMLButtonElement);

  newRunButton.addEventListener("click", onNewRun);

  return {
    show: (result) => {
      title.textContent = result.outcome === "won" ? "You won!" : "Game over";
      detail.textContent = `${result.outcome === "won" ? "Cleared" : "Reached"} wave ${String(result.wave)} · seed ${String(result.seed)}`;
      panel.hidden = false;
      newRunButton.focus();
    },
    hide: () => {
      panel.hidden = true;
    },
  };
}

function requireElement<T extends HTMLElement>(
  root: Document,
  id: string,
  type: new () => T,
): T {
  const element = root.getElementById(id);
  if (!(element instanceof type)) {
    throw new StartupError(`index.html is missing #${id}.`);
  }
  return element;
}
