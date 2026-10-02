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
import { artIdOf, type PieceArt } from "./piece-art";

const WARNING_RED = "224 97 79";
const HP_BAR_BACK = "rgb(0 0 0 / 60%)";
const PAWN_HP = "#8fcf6b";
const BLACK_HP = "#e0614f";
const SHADOW = "rgb(0 0 0 / 40%)";
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

  /** Copies a sprite 1:1 centred on `centre`; whole-pixel positions avoid resampling it every frame. */
  const drawSprite = (
    id: ArtId,
    centre: Point,
    squarePx: number,
    frame: number,
  ): void => {
    const sprite = art.sprite(id, squarePx, frame);
    context.drawImage(
      sprite.sheet,
      sprite.sourceX,
      0,
      sprite.size,
      sprite.size,
      Math.round(centre.x - sprite.size / 2),
      Math.round(centre.y - sprite.size / 2),
      sprite.size,
      sprite.size,
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

  const drawPawn = (
    pawn: WhitePawn,
    board: BoardSize,
    squarePx: number,
    nowSeconds: number,
  ): void => {
    const centre = toCanvas(pawn, board, squarePx);
    drawSprite(
      artIdOf({ side: "white", type: pawn.type }),
      centre,
      squarePx,
      frameIndexAt(nowSeconds, pawn.id),
    );
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
