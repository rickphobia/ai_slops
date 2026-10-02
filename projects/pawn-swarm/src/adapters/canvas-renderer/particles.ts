/**
 * A fixed-size pool of short-lived specks (blood, gibs, sparks). Particles are
 * stored in flat arrays and reused, so a big fight makes no garbage per frame.
 * When the pool is full the newest particles replace the oldest slots: the
 * screen stays busy but the cost never grows.
 */
export type ParticleKind = "blood" | "gib" | "spark";

export interface ParticleSpec {
  readonly kind: ParticleKind;
  readonly colour: string;
  readonly x: number;
  readonly y: number;
  /** Squares per second. */
  readonly vx: number;
  readonly vy: number;
  /** Width in squares. */
  readonly size: number;
  readonly life: number;
}

export interface ParticlePool {
  spawn(spec: ParticleSpec): void;
  /** Moves every particle and removes the ones whose life is over. */
  advance(seconds: number): void;
  clear(): void;
  readonly count: number;
  /** Calls `visit` for each live particle; `fade` goes from 1 (new) to 0 (gone). */
  forEach(
    visit: (
      kind: ParticleKind,
      colour: string,
      x: number,
      y: number,
      size: number,
      fade: number,
    ) => void,
  ): void;
}

/** Strong drag: specks fly out fast and settle, like something wet hitting the floor. */
const DRAG_PER_SECOND = 4;

export function createParticlePool(capacity: number): ParticlePool {
  const x = new Float32Array(capacity);
  const y = new Float32Array(capacity);
  const vx = new Float32Array(capacity);
  const vy = new Float32Array(capacity);
  const size = new Float32Array(capacity);
  const age = new Float32Array(capacity);
  const life = new Float32Array(capacity);
  const kinds = new Array<ParticleKind>(capacity).fill("spark");
  const colours = new Array<string>(capacity).fill("");
  let count = 0;
  let overwrite = 0;

  const move = (from: number, to: number): void => {
    x[to] = x[from] ?? 0;
    y[to] = y[from] ?? 0;
    vx[to] = vx[from] ?? 0;
    vy[to] = vy[from] ?? 0;
    size[to] = size[from] ?? 0;
    age[to] = age[from] ?? 0;
    life[to] = life[from] ?? 0;
    kinds[to] = kinds[from] ?? "spark";
    colours[to] = colours[from] ?? "";
  };

  return {
    get count() {
      return count;
    },
    spawn: (spec) => {
      let slot: number;
      if (count < capacity) {
        slot = count;
        count += 1;
      } else {
        slot = overwrite;
        overwrite = (overwrite + 1) % capacity;
      }
      x[slot] = spec.x;
      y[slot] = spec.y;
      vx[slot] = spec.vx;
      vy[slot] = spec.vy;
      size[slot] = spec.size;
      age[slot] = 0;
      life[slot] = spec.life;
      kinds[slot] = spec.kind;
      colours[slot] = spec.colour;
    },
    advance: (seconds) => {
      const drag = Math.max(0, 1 - DRAG_PER_SECOND * seconds);
      let index = 0;
      while (index < count) {
        age[index] = (age[index] ?? 0) + seconds;
        if ((age[index] ?? 0) >= (life[index] ?? 0)) {
          count -= 1;
          if (index !== count) move(count, index);
          continue;
        }
        x[index] = (x[index] ?? 0) + (vx[index] ?? 0) * seconds;
        y[index] = (y[index] ?? 0) + (vy[index] ?? 0) * seconds;
        vx[index] = (vx[index] ?? 0) * drag;
        vy[index] = (vy[index] ?? 0) * drag;
        index += 1;
      }
    },
    clear: () => {
      count = 0;
      overwrite = 0;
    },
    forEach: (visit) => {
      for (let index = 0; index < count; index++) {
        visit(
          kinds[index] ?? "spark",
          colours[index] ?? "",
          x[index] ?? 0,
          y[index] ?? 0,
          size[index] ?? 0,
          1 - (age[index] ?? 0) / (life[index] ?? 1),
        );
      }
    },
  };
}
