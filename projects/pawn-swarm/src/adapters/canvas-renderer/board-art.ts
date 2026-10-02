import type { BoardSize } from "../../board/square";

/** Square colours, a1 dark as on a real board. Near-black so the pale pawns and the rimmed black pieces stand out. */
const DARK_SQUARE = "#15100d";
const LIGHT_SQUARE = "#241b16";
/** How much each square's shade may wander, so the board looks like worn stone, not a flat grid. */
const SHADE_WANDER = 0.045;
const STAIN = "92 10 10";
const VIGNETTE_EDGE = "rgb(0 0 0 / 78%)";

/** Old blood stains, in board units, so they stay put whatever the canvas size. */
const STAINS: readonly { x: number; y: number; radius: number }[] = [
  { x: 3.2, y: 10.6, radius: 1.3 },
  { x: 15.8, y: 3.1, radius: 1.6 },
  { x: 11.4, y: 9.2, radius: 0.9 },
  { x: 6.5, y: 2.4, radius: 1 },
  { x: 17.6, y: 11.8, radius: 1.1 },
];

/** A fixed shade per square from its coordinates: the same board every time, no RNG needed. */
function squareShade(file: number, rank: number): number {
  const hash = Math.sin(file * 12.9898 + rank * 78.233) * 43758.5453;
  return (hash - Math.floor(hash) - 0.5) * 2 * SHADE_WANDER;
}

function paintStain(
  context: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  radius: number,
): void {
  // A few overlapping blots read as a splash rather than a perfect circle.
  const blots = [
    { dx: 0, dy: 0, scale: 1 },
    { dx: 0.55, dy: -0.25, scale: 0.55 },
    { dx: -0.45, dy: 0.35, scale: 0.45 },
    { dx: 0.9, dy: 0.5, scale: 0.18 },
    { dx: -0.95, dy: -0.6, scale: 0.12 },
  ];
  for (const blot of blots) {
    const x = centreX + blot.dx * radius;
    const y = centreY + blot.dy * radius;
    const r = blot.scale * radius;
    const gradient = context.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgb(${STAIN} / 45%)`);
    gradient.addColorStop(0.7, `rgb(${STAIN} / 25%)`);
    gradient.addColorStop(1, `rgb(${STAIN} / 0%)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x, y, r, r * 0.8, blot.dx, 0, Math.PI * 2);
    context.fill();
  }
}

/**
 * Paints the empty board: dark worn squares, old blood stains and a
 * vignette that fades the edges to black. Drawn once per canvas size.
 */
export function paintBoard(
  context: CanvasRenderingContext2D,
  board: BoardSize,
  squarePx: number,
): void {
  for (let rank = 0; rank < board.ranks; rank++) {
    for (let file = 0; file < board.files; file++) {
      context.fillStyle = (file + rank) % 2 === 0 ? DARK_SQUARE : LIGHT_SQUARE;
      const left = Math.floor(file * squarePx);
      const top = Math.floor((board.ranks - 1 - rank) * squarePx);
      const size = Math.ceil(squarePx);
      context.fillRect(left, top, size, size);
      const shade = squareShade(file, rank);
      context.fillStyle =
        shade > 0
          ? `rgb(255 235 210 / ${String(shade)})`
          : `rgb(0 0 0 / ${String(-shade)})`;
      context.fillRect(left, top, size, size);
    }
  }
  for (const stain of STAINS) {
    paintStain(
      context,
      stain.x * squarePx,
      (board.ranks - stain.y) * squarePx,
      stain.radius * squarePx,
    );
  }
  const width = board.files * squarePx;
  const height = board.ranks * squarePx;
  const vignette = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.hypot(width, height) / 2,
  );
  vignette.addColorStop(0, "rgb(0 0 0 / 0%)");
  vignette.addColorStop(1, VIGNETTE_EDGE);
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}
