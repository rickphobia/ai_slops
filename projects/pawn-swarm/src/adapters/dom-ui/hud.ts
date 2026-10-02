import { requireElement } from "./require-element";

export interface HudStatus {
  readonly wave: number;
  readonly whitePawns: number;
  readonly seed: number;
}

export interface Hud {
  update(status: HudStatus): void;
}

/** The battle header: wave, white pawn count and seed. It only shows what it is given. */
export function createHud(root: Document): Hud {
  const wave = requireElement(root, "hud-wave", HTMLElement);
  const pawns = requireElement(root, "hud-pawns", HTMLElement);
  const seed = requireElement(root, "hud-seed", HTMLElement);

  return {
    update: (status) => {
      wave.textContent = String(status.wave);
      pawns.textContent = String(status.whitePawns);
      seed.textContent = String(status.seed);
    },
  };
}
