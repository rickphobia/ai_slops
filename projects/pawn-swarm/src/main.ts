import { createCanvasRenderer } from "./adapters/canvas-renderer";
import { ConfigError, loadConfig } from "./config";
import { createConsoleLogger, logLevelFromQuery } from "./logger";
import { StartupError } from "./startup-error";

const logger = createConsoleLogger(logLevelFromQuery(window.location.search));

function showStartupError(message: string): void {
  const errorBox = document.getElementById("startup-error");
  if (errorBox !== null) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }
}

function start(): void {
  const config = loadConfig(import.meta.env);
  logger.info("config loaded", { ...config });

  const canvas = document.getElementById("board");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new StartupError('index.html is missing <canvas id="board">.');
  }
  const renderer = createCanvasRenderer(
    canvas,
    config.boardSize,
    () => window.devicePixelRatio,
  );
  renderer.drawEmptyBoard();
  window.addEventListener("resize", () => {
    renderer.drawEmptyBoard();
  });
  logger.debug("board drawn", { boardSize: config.boardSize });
}

try {
  start();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("startup failed", {
    error: message,
    kind:
      error instanceof ConfigError || error instanceof StartupError
        ? error.name
        : "unexpected",
  });
  showStartupError(`Pawn Swarm could not start: ${message}`);
}
