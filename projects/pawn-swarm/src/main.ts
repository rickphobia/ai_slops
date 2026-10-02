import { createCanvasRenderer } from "./adapters/canvas-renderer";
import { createEndScreen } from "./adapters/dom-ui";
import { ConfigError, loadConfig } from "./config";
import { createConsoleLogger, logLevelFromQuery, type Logger } from "./logger";
import { advanceRun, type RunState, startRun } from "./run/run";
import { StartupError } from "./startup-error";

/** After a long pause (hidden tab) don't fast-forward through the whole gap in one frame. */
const MAX_TICKS_PER_FRAME = 5;

const logger = createConsoleLogger(logLevelFromQuery(window.location.search));

function showFatalError(message: string): void {
  const errorBox = document.getElementById("startup-error");
  if (errorBox !== null) {
    errorBox.textContent = message;
    errorBox.hidden = false;
  }
}

/** A fresh seed for "new run". Only the entrypoint may use browser randomness; rules use the seeded RNG. */
function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

function logTick(previous: RunState, next: RunState, log: Logger): void {
  for (const event of next.battle.events) {
    log.debug(`battle ${event.type}`, { tick: next.battle.tick, ...event });
  }
  if (previous.phase === "battle" && next.phase !== "battle") {
    log.info("wave ended", {
      wave: next.wave,
      result: next.phase,
      ticks: next.battle.tick,
    });
    log.info("run ended", { result: next.phase, seed: next.seed });
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

  const beginRun = (seed: number): RunState => {
    const run = startRun({ seed, boardSize: config.boardSize });
    logger.info("run started", { seed });
    logger.info("wave started", { wave: run.wave });
    return run;
  };

  let run = beginRun(config.defaultSeed);
  const endScreen = createEndScreen(document, () => {
    run = beginRun(randomSeed());
    endScreen.hide();
  });

  // Ticks run on game time, not frames: each frame runs however many ticks are due.
  let lastFrameMs = performance.now();
  let pendingMs = 0;
  const runDueTicks = (nowMs: number): void => {
    pendingMs += nowMs - lastFrameMs;
    lastFrameMs = nowMs;
    let ticksThisFrame = 0;
    while (pendingMs >= config.tickMs && run.phase === "battle") {
      if (ticksThisFrame === MAX_TICKS_PER_FRAME) {
        pendingMs = 0;
        break;
      }
      const previous = run;
      run = advanceRun(run);
      logTick(previous, run, logger);
      if (run.phase !== "battle") {
        endScreen.show({ outcome: run.phase, wave: run.wave, seed: run.seed });
      }
      pendingMs -= config.tickMs;
      ticksThisFrame++;
    }
    if (run.phase !== "battle") pendingMs = 0;
  };
  const frame = (nowMs: number): void => {
    try {
      runDueTicks(nowMs);
      renderer.draw(run.battle.pieces);
      requestAnimationFrame(frame);
    } catch (error) {
      // Stop the loop: a broken rule would otherwise throw again every frame.
      const message = error instanceof Error ? error.message : String(error);
      logger.error("game loop stopped", {
        error: message,
        seed: run.seed,
        wave: run.wave,
        tick: run.battle.tick,
      });
      showFatalError(`Pawn Swarm stopped: ${message}`);
    }
  };
  requestAnimationFrame(frame);
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
  showFatalError(`Pawn Swarm could not start: ${message}`);
}
