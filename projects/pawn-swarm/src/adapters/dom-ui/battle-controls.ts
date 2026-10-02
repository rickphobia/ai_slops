import { SPEEDS, type Speed } from "../../tick-clock";
import { requireElement } from "./require-element";

export interface BattleControlsState {
  readonly paused: boolean;
  readonly speed: Speed;
}

export interface BattleControlsActions {
  onTogglePause(): void;
  onSpeed(speed: Speed): void;
}

export interface BattleControls {
  show(state: BattleControlsState): void;
}

/** Pause and speed buttons. They report clicks; the entrypoint owns the state and passes it back to `show`. */
export function createBattleControls(
  root: Document,
  actions: BattleControlsActions,
): BattleControls {
  const pauseButton = requireElement(root, "pause", HTMLButtonElement);
  const speedGroup = requireElement(root, "speed-buttons", HTMLElement);

  pauseButton.addEventListener("click", () => {
    actions.onTogglePause();
  });

  // Built from SPEEDS so the buttons can't drift from the speeds the clock accepts.
  const speedButtons = SPEEDS.map((speed) => {
    const button = root.createElement("button");
    button.type = "button";
    button.textContent = `${String(speed)}×`;
    button.addEventListener("click", () => {
      actions.onSpeed(speed);
    });
    speedGroup.append(button);
    return { speed, button };
  });

  return {
    show: (state) => {
      pauseButton.textContent = state.paused ? "Resume" : "Pause";
      pauseButton.setAttribute("aria-pressed", String(state.paused));
      for (const { speed, button } of speedButtons) {
        button.setAttribute("aria-pressed", String(speed === state.speed));
      }
    },
  };
}
