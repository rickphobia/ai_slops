import { requireElement } from "./require-element";

export interface HudStatus {
  readonly wave: number;
  readonly waveCount: number;
  readonly whitePawns: number;
  /** Black pieces on the board plus those still to land. */
  readonly blackLeft: number;
  readonly seed: number;
}

export interface Hud {
  update(status: HudStatus): void;
  /** Makes the pawn counter pop, to show pawns were just added. */
  bump(): void;
}

/** The battle header: pawn count, wave, black pieces left and seed. It only shows what it is given. */
export function createHud(root: Document): Hud {
  const pawns = requireElement(root, "hud-pawns", HTMLElement);
  const wave = requireElement(root, "hud-wave", HTMLElement);
  const blackLeft = requireElement(root, "hud-black-left", HTMLElement);
  const seed = requireElement(root, "hud-seed", HTMLElement);

  return {
    update: (status) => {
      pawns.textContent = String(status.whitePawns);
      wave.textContent = `${String(status.wave)}/${String(status.waveCount)}`;
      blackLeft.textContent = String(status.blackLeft);
      seed.textContent = String(status.seed);
    },
    bump: () => {
      // Restarting a CSS animation needs the class removed and a reflow in between.
      pawns.classList.remove("bump");
      pawns.getBoundingClientRect();
      pawns.classList.add("bump");
    },
  };
}
