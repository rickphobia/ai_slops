import { describe, expect, it } from "vitest";
import {
  createParticlePool,
  type ParticleSpec,
} from "../../../src/adapters/canvas-renderer/particles";

const spec = (overrides: Partial<ParticleSpec> = {}): ParticleSpec => ({
  kind: "blood",
  colour: "red",
  x: 1,
  y: 1,
  vx: 2,
  vy: 0,
  size: 0.1,
  life: 0.5,
  ...overrides,
});

function positions(pool: ReturnType<typeof createParticlePool>): number[] {
  const xs: number[] = [];
  pool.forEach((_kind, _colour, x) => xs.push(x));
  return xs;
}

describe("particle pool", () => {
  it("moves particles and slows them with drag", () => {
    const pool = createParticlePool(10);
    pool.spawn(spec());
    pool.advance(0.1);
    const [first] = positions(pool);
    expect(first).toBeCloseTo(1.2);
    pool.advance(0.1);
    const [second] = positions(pool);
    // The second step covers less ground than the first.
    expect((second ?? 0) - (first ?? 0)).toBeLessThan(0.2);
  });

  it("removes particles when their life is over and keeps the rest", () => {
    const pool = createParticlePool(10);
    pool.spawn(spec({ life: 0.1, x: 5 }));
    pool.spawn(spec({ life: 1, x: 7, vx: 0 }));
    pool.advance(0.2);
    expect(pool.count).toBe(1);
    expect(positions(pool)).toEqual([7]);
  });

  it("never grows past its capacity: new particles replace the oldest", () => {
    const pool = createParticlePool(3);
    for (let index = 0; index < 10; index++) {
      pool.spawn(spec({ x: index, vx: 0 }));
    }
    expect(pool.count).toBe(3);
    expect(Math.max(...positions(pool))).toBe(9);
  });

  it("fades from 1 to 0 over its life and can be cleared", () => {
    const pool = createParticlePool(3);
    pool.spawn(spec({ life: 1 }));
    pool.advance(0.25);
    let fade = -1;
    pool.forEach((_k, _c, _x, _y, _s, f) => {
      fade = f;
    });
    expect(fade).toBeCloseTo(0.75);
    pool.clear();
    expect(pool.count).toBe(0);
  });
});
