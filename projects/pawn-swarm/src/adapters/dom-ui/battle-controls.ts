import { SPEEDS, type Speed, type TickClockState } from "../../tick-clock";
import { requireElement } from "./require-element";

export interface BattleControlsActions {
  onTogglePause(): void;
  onSpeed(speed: Speed): void;
}

export interface BattleControls {
  show(state: TickClockState): void;
}

/** Pause and speed buttons. They report clicks; the clock owns the state and the entrypoint passes it back to `show`. */
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
