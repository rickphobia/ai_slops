import type {
  BattleState,
  BlackPiece,
  WhitePawn,
} from "../../battle/battle-state";
import {
  type BoardSize,
  centreOf,
  type Point,
  type Square,
} from "../../board/square";
import { StartupError } from "../../startup-error";
import { frameIndexAt } from "../art/animation";
import type { ArtId } from "../art/drawings";
import { paintBoard } from "./board-art";
import { drawEffect } from "./draw-effect";
import type { Effect } from "./effects";
import { artIdOf, drawSpriteCentred, type PieceArt } from "./piece-art";

const WARNING_RED = "224 97 79";
const HP_BAR_BACK = "rgb(0 0 0 / 60%)";
const PAWN_HP = "#8fcf6b";
const BLACK_HP = "#e0614f";
const STUN_MARK = "#d6e4ff";
const SHADOW = "rgb(0 0 0 / 40%)";
const TYPE_DISC_ALPHA = 0.45;
/** The board, and so every piece sprite, is drawn at least at 2× the CSS size so the art stays sharp. */
const MIN_PIXEL_RATIO = 2;
/** How high a knight's jump arcs, in squares. */
const JUMP_HEIGHT = 0.56;

export interface BoardRenderer {
  /** `nowSeconds` drives the pieces' idle animations (eyes, hearts, blood); it is real time, so they keep moving while paused. */
  draw(
    battle: BattleState,
    effects: readonly Effect[],
    nowSeconds: number,
  ): void;
}

/**
 * Draws a battle onto a canvas: board, warning squares, pieces, HP bars and
 * effects. It only reads state; how each piece looks is up to `art`.
 * The canvas keeps its CSS size; its pixel size follows it (and the pixel
 * ratio, which changes with browser zoom) so the board stays sharp.
 */
export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  art: PieceArt,
  getPixelRatio: () => number,
): BoardRenderer {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new StartupError(
      "Canvas 2D context is not available in this browser.",
    );
  }
  let boardImage: HTMLCanvasElement | undefined;

  /** Board units (y up) to canvas pixels (y down). */
  const toCanvas = (
    point: Point,
    board: BoardSize,
    squarePx: number,
  ): Point => ({
    x: point.x * squarePx,
    y: (board.ranks - point.y) * squarePx,
  });

  /** A square's top-left corner in canvas pixels. */
  const cornerOf = (
    square: Square,
    board: BoardSize,
    squarePx: number,
  ): Point => toCanvas({ x: square.file, y: square.rank + 1 }, board, squarePx);

  const resize = (board: BoardSize): number => {
    const ratio = Math.max(MIN_PIXEL_RATIO, getPixelRatio());
    const width = Math.floor(canvas.clientWidth * ratio);
    const height = Math.floor(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      boardImage = undefined;
    }
    return Math.min(width / board.files, height / board.ranks);
  };

  /** The board only changes with the canvas size, so it is painted once and copied. */
  const drawBoard = (board: BoardSize, squarePx: number): void => {
    if (boardImage === undefined) {
      boardImage = document.createElement("canvas");
      boardImage.width = canvas.width;
      boardImage.height = canvas.height;
      const boardContext = boardImage.getContext("2d");
      if (boardContext === null) {
        throw new StartupError(
          "Canvas 2D context is not available for the board.",
        );
      }
      paintBoard(boardContext, board, squarePx);
    }
    context.drawImage(boardImage, 0, 0);
  };

  const drawSprite = (
    id: ArtId,
    centre: Point,
    squarePx: number,
    frame: number,
  ): void => {
    drawSpriteCentred(
      context,
      art.sprite(id, squarePx, frame),
      centre.x,
      centre.y,
    );
  };

  const drawMoveWarnings = (battle: BattleState, squarePx: number): void => {
    for (const piece of battle.blackPieces) {
      const move = piece.move;
      if (move?.phase !== "warning") continue;
      // Gets redder as the move gets closer.
      const progress = 1 - move.secondsLeft / move.phaseSeconds;
      context.fillStyle = `rgb(${WARNING_RED} / ${String(0.18 + 0.3 * progress)})`;
      for (const square of move.hitSquares) {
        const corner = cornerOf(square, battle.board, squarePx);
        context.fillRect(
          corner.x + 1,
          corner.y + 1,
          squarePx - 2,
          squarePx - 2,
        );
      }
    }
  };

  const drawLandingWarnings = (battle: BattleState, squarePx: number): void => {
    context.strokeStyle = `rgb(${WARNING_RED})`;
    context.lineWidth = Math.max(2, squarePx * 0.06);
    for (const landing of battle.landings) {
      context.globalAlpha = 0.4 + 0.4 * Math.sin(landing.secondsLeft * 20);
      const corner = cornerOf(landing.square, battle.board, squarePx);
      const inset = squarePx * 0.06;
      context.strokeRect(
        corner.x + inset,
        corner.y + inset,
        squarePx - inset * 2,
        squarePx - inset * 2,
      );
    }
    context.globalAlpha = 1;
  };

  const drawHpBar = (
    centre: Point,
    width: number,
    offsetY: number,
    share: number,
    colour: string,
    squarePx: number,
  ): void => {
    const height = Math.max(2, squarePx * 0.09);
    const left = centre.x - width / 2;
    const top = centre.y + offsetY;
    context.fillStyle = HP_BAR_BACK;
    context.fillRect(left, top, width, height);
    context.fillStyle = colour;
    context.fillRect(left, top, width * Math.max(0, share), height);
  };

  /** A disc in the type's colour under its feet, so pawn types stand out in a plain crowd. */
  const drawTypeDisc = (
    pawn: WhitePawn,
    centre: Point,
    squarePx: number,
  ): void => {
    const colour = art.tint({ side: "white", type: pawn.type });
    // At the feet, which sit about half a square below the sprite's centre.
    context.beginPath();
    context.ellipse(
      centre.x,
      centre.y + squarePx * 0.5,
      squarePx * 0.42,
      squarePx * 0.17,
      0,
      0,
      Math.PI * 2,
    );
    context.globalAlpha = TYPE_DISC_ALPHA;
    context.fillStyle = colour;
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = colour;
    context.lineWidth = Math.max(1.5, squarePx * 0.04);
    context.stroke();
  };

  /** A bobbing "z" over a stunned pawn. */
  const drawStunMark = (
    centre: Point,
    squarePx: number,
    nowSeconds: number,
    pawnId: number,
  ): void => {
    const bob = Math.sin(nowSeconds * 5 + pawnId) * squarePx * 0.05;
    context.font = `bold ${String(Math.round(squarePx * 0.45))}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = Math.max(2, squarePx * 0.07);
    context.strokeStyle = "rgb(0 0 0 / 70%)";
    context.fillStyle = STUN_MARK;
    const at = {
      x: centre.x + squarePx * 0.3,
      y: centre.y - squarePx * 0.55 + bob,
    };
    context.strokeText("z", at.x, at.y);
    context.fillText("z", at.x, at.y);
  };

  /** A "♛" over a promoted promoter, in its colour, so a white queen stands out in the swarm. */
  const drawCrown = (
    pawn: WhitePawn,
    centre: Point,
    squarePx: number,
  ): void => {
    context.font = `bold ${String(Math.round(squarePx * 0.5))}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = Math.max(2, squarePx * 0.07);
    context.strokeStyle = "rgb(0 0 0 / 70%)";
    context.fillStyle = art.tint({ side: "white", type: pawn.type });
    const at = { x: centre.x, y: centre.y - squarePx * 0.62 };
    context.strokeText("♛", at.x, at.y);
    context.fillText("♛", at.x, at.y);
  };

  const drawPawn = (
    pawn: WhitePawn,
    board: BoardSize,
    squarePx: number,
    nowSeconds: number,
  ): void => {
    const centre = toCanvas(pawn, board, squarePx);
    if (pawn.type !== "plain") drawTypeDisc(pawn, centre, squarePx);
    drawSprite(
      artIdOf({ side: "white", type: pawn.type }),
      centre,
      squarePx,
      frameIndexAt(nowSeconds, pawn.id),
    );
    if (pawn.promoted) drawCrown(pawn, centre, squarePx);
    if (pawn.stunLeft > 0) drawStunMark(centre, squarePx, nowSeconds, pawn.id);
    if (pawn.hp < pawn.maxHp) {
      drawHpBar(
        centre,
        squarePx * 0.62,
        squarePx * 0.47,
        pawn.hp / pawn.maxHp,
        PAWN_HP,
        squarePx,
      );
    }
  };

  const drawBlackPiece = (
    piece: BlackPiece,
    board: BoardSize,
    squarePx: number,
    nowSeconds: number,
  ): void => {
    let at = centreOf(piece.square);
    let lift = 0;
    if (piece.move?.phase === "moving") {
      const progress = 1 - piece.move.secondsLeft / piece.move.phaseSeconds;
      const to = centreOf(piece.move.to);
      at = {
        x: at.x + (to.x - at.x) * progress,
        y: at.y + (to.y - at.y) * progress,
      };
      lift = Math.sin(progress * Math.PI) * JUMP_HEIGHT * squarePx;
    }
    const centre = toCanvas(at, board, squarePx);
    if (lift > 0) {
      context.fillStyle = SHADOW;
      context.beginPath();
      context.ellipse(
        centre.x,
        centre.y + squarePx * 0.37,
        squarePx * 0.31,
        squarePx * 0.12,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    const raised = { x: centre.x, y: centre.y - lift };
    drawSprite(
      artIdOf({ side: "black", kind: piece.kind }),
      raised,
      squarePx,
      frameIndexAt(nowSeconds, piece.id),
    );
    drawHpBar(
      raised,
      squarePx * 0.75,
      squarePx * 0.42,
      piece.hp / piece.maxHp,
      BLACK_HP,
      squarePx,
    );
  };

  return {
    draw: (battle, effects, nowSeconds) => {
      const squarePx = resize(battle.board);
      drawBoard(battle.board, squarePx);
      // Back to front (board y grows upward), so nearer pieces overlap the ones behind them.
      const pawns = [...battle.pawns].sort((a, b) => b.y - a.y);
      for (const pawn of pawns) {
        drawPawn(pawn, battle.board, squarePx, nowSeconds);
      }
      // Over the pawns, so a pawn standing in danger is tinted red.
      drawMoveWarnings(battle, squarePx);
      const blackPieces = [...battle.blackPieces].sort(
        (a, b) => b.square.rank - a.square.rank,
      );
      for (const piece of blackPieces) {
        drawBlackPiece(piece, battle.board, squarePx, nowSeconds);
      }
      drawLandingWarnings(battle, squarePx);
      const toPixels = (point: Point): Point =>
        toCanvas(point, battle.board, squarePx);
      for (const effect of effects) {
        drawEffect(context, effect, toPixels, squarePx);
      }
      context.globalAlpha = 1;
    },
  };
}
