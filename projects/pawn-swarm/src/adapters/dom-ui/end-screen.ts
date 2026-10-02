import { requireElement } from "./require-element";

export interface RunResult {
  readonly outcome: "won" | "lost";
  readonly wave: number;
  readonly seed: number;
  readonly peakSwarm: number;
  readonly piecesTaken: number;
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
      title.textContent =
        result.outcome === "won" ? "Checkmate. The king is down." : "Game over";
      detail.textContent = [
        `${result.outcome === "won" ? "Cleared" : "Reached"} wave ${String(result.wave)}`,
        `biggest swarm ${String(result.peakSwarm)}`,
        `pieces taken ${String(result.piecesTaken)}`,
        `seed ${String(result.seed)}`,
      ].join(" · ");
      panel.hidden = false;
      newRunButton.focus();
    },
    hide: () => {
      panel.hidden = true;
    },
  };
}
