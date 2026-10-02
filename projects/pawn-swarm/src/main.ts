import { createCanvasRenderer } from "./adapters/canvas-renderer";
import { createBattleControls } from "./adapters/dom-ui/battle-controls";
import { createEndScreen } from "./adapters/dom-ui/end-screen";
import { createHud, type HudStatus } from "./adapters/dom-ui/hud";
import { ConfigError, loadConfig } from "./config";
import { createConsoleLogger, logLevelFromQuery, type Logger } from "./logger";
import { advanceRun, type RunState, startRun } from "./run/run";
import { StartupError } from "./startup-error";
import { createTickClock, type Speed } from "./tick-clock";

/** After a long gap (hidden tab) don't fast-forward through all of it in one frame. */
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

function hudStatus(run: RunState): HudStatus {
  return {
    wave: run.wave,
    whitePawns: run.battle.pieces.filter((piece) => piece.side === "white")
      .length,
    seed: run.seed,
  };
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

  const hud = createHud(document);
  let run = beginRun(config.defaultSeed);
  hud.update(hudStatus(run));
  const endScreen = createEndScreen(document, () => {
    run = beginRun(randomSeed());
    hud.update(hudStatus(run));
    endScreen.hide();
  });

  const clock = createTickClock({
    tickMs: config.tickMs,
    startMs: performance.now(),
    maxTicksPerFrame: MAX_TICKS_PER_FRAME,
  });
  let paused = false;
  let speed: Speed = 1;
  const controls = createBattleControls(document, {
    onTogglePause: () => {
      paused = !paused;
      clock.setPaused(paused);
      controls.show({ paused, speed });
      logger.info(paused ? "battle paused" : "battle resumed", {
        tick: run.battle.tick,
      });
    },
    onSpeed: (next) => {
      speed = next;
      clock.setSpeed(speed);
      controls.show({ paused, speed });
      logger.info("battle speed set", { speed, tick: run.battle.tick });
    },
  });
  controls.show({ paused, speed });

  // Ticks run on game time, not frames: each frame runs however many ticks are due.
  // Only the clock knows the speed, so the same seed plays the same ticks at any speed.
  const runDueTicks = (nowMs: number): void => {
    const dueTicks = clock.takeDueTicks(nowMs);
    for (let tick = 0; tick < dueTicks && run.phase === "battle"; tick++) {
      const previous = run;
      run = advanceRun(run);
      logTick(previous, run, logger);
      hud.update(hudStatus(run));
      if (run.phase !== "battle") {
        endScreen.show({ outcome: run.phase, wave: run.wave, seed: run.seed });
      }
    }
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
