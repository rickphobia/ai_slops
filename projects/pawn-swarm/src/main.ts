import { createCanvasRenderer } from "./adapters/canvas-renderer/canvas-renderer";
import { createEffects } from "./adapters/canvas-renderer/effects";
import { loadPieceArt } from "./adapters/canvas-renderer/piece-art";
import { createBattleControls } from "./adapters/dom-ui/battle-controls";
import { createEndScreen } from "./adapters/dom-ui/end-screen";
import { createHud, type HudStatus } from "./adapters/dom-ui/hud";
import { NO_INPUTS } from "./battle/battle-state";
import { blackPiecesLeft, REAL_MS_PER_STEP, STEP_SECONDS } from "./battle/step";
import { ConfigError, loadConfig } from "./config";
import { startingPawnsFromQuery } from "./debug-options";
import { createConsoleLogger, logLevelFromQuery, type Logger } from "./logger";
import { advanceRun, type RunState, startRun } from "./run/run";
import { StartupError } from "./startup-error";
import { createTickClock } from "./tick-clock";

/** At 2× speed a 60 fps frame needs 2 steps; this leaves room for a slow frame without a long catch-up. */
const MAX_STEPS_PER_FRAME = 8;

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
    waveCount: run.waves.length,
    whitePawns: run.battle.pawns.length,
    blackLeft: blackPiecesLeft(run.battle),
    seed: run.seed,
  };
}

function logStep(previous: RunState, next: RunState, log: Logger): void {
  const stepNumber = next.battle.stepNumber;
  for (const event of next.battle.events) {
    log.debug(`battle ${event.type}`, { step: stepNumber, ...event });
    if (event.type === "push") {
      log.info("more black pieces incoming", {
        wave: next.wave,
        step: stepNumber,
        count: event.count,
        pushesLeft: event.pushesLeft,
      });
    }
  }
  if (next.wave !== previous.wave) {
    log.info("wave started", {
      wave: next.wave,
      pawns: next.battle.pawns.length,
    });
  } else if (
    previous.battle.outcome === "ongoing" &&
    next.battle.outcome !== "ongoing"
  ) {
    log.info("wave ended", {
      wave: next.wave,
      result: next.battle.outcome,
      steps: stepNumber,
      pawns: next.battle.pawns.length,
    });
  }
  if (previous.phase === "battle" && next.phase !== "battle") {
    log.info("run ended", {
      result: next.phase,
      seed: next.seed,
      wave: next.wave,
      peakSwarm: next.peakSwarm,
      piecesTaken: next.piecesTaken,
    });
  }
}

async function start(): Promise<void> {
  const config = loadConfig(import.meta.env);
  logger.info("config loaded", { ...config });
  const startingPawns = startingPawnsFromQuery(window.location.search);
  if ("error" in startingPawns) throw new StartupError(startingPawns.error);

  const canvas = document.getElementById("board");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new StartupError('index.html is missing <canvas id="board">.');
  }
  const art = await loadPieceArt();
  const renderer = createCanvasRenderer(
    canvas,
    art,
    () => window.devicePixelRatio,
  );
  const effects = createEffects((piece) => art.tint(piece), Math.random);

  const beginRun = (seed: number): RunState => {
    const run = startRun({
      seed,
      ...(startingPawns.pawns !== undefined && {
        plainPawns: startingPawns.pawns,
      }),
    });
    effects.clear();
    logger.info("run started", { seed, pawns: run.battle.pawns.length });
    logger.info("wave started", { wave: run.wave });
    return run;
  };

  const hud = createHud(document);
  let run = beginRun(config.defaultSeed);
  const clock = createTickClock({
    tickMs: REAL_MS_PER_STEP,
    startMs: performance.now(),
    maxTicksPerFrame: MAX_STEPS_PER_FRAME,
  });
  const setPaused = (paused: boolean): void => {
    clock.setPaused(paused);
    controls.show(clock.state());
    logger.info(paused ? "battle paused" : "battle resumed", {
      step: run.battle.stepNumber,
    });
  };
  const controls = createBattleControls(document, {
    onTogglePause: () => {
      setPaused(!clock.state().paused);
    },
    onSpeed: (speed) => {
      clock.setSpeed(speed);
      controls.show(clock.state());
      logger.info("battle speed set", { speed, step: run.battle.stepNumber });
    },
  });
  controls.show(clock.state());
  const endScreen = createEndScreen(document, () => {
    run = beginRun(randomSeed());
    // The speed carries over to the next run; a pause doesn't.
    if (clock.state().paused) setPaused(false);
    endScreen.hide();
  });

  // Steps run on game time, not frames: each frame runs however many steps are due.
  // Only the clock knows the speed, so the same seed plays the same steps at any speed.
  // Effects age with the steps, so they freeze on pause and speed up with the game.
  const runDueSteps = (nowMs: number): void => {
    const dueSteps = clock.takeDueTicks(nowMs);
    for (let index = 0; index < dueSteps && run.phase === "battle"; index++) {
      const previous = run;
      run = advanceRun(run, NO_INPUTS);
      logStep(previous, run, logger);
      effects.advance(STEP_SECONDS);
      effects.add(run.battle.events);
      if (run.battle.events.some((event) => event.type === "drop")) hud.bump();
      if (run.phase !== "battle") {
        endScreen.show({
          outcome: run.phase,
          wave: run.wave,
          seed: run.seed,
          peakSwarm: run.peakSwarm,
          piecesTaken: run.piecesTaken,
        });
      }
    }
  };
  const frame = (nowMs: number): void => {
    try {
      runDueSteps(nowMs);
      hud.update(hudStatus(run));
      renderer.draw(run.battle, effects.list(), nowMs / 1000);
      requestAnimationFrame(frame);
    } catch (error) {
      // Stop the loop: a broken rule would otherwise throw again every frame.
      const message = error instanceof Error ? error.message : String(error);
      logger.error("game loop stopped", {
        error: message,
        seed: run.seed,
        wave: run.wave,
        step: run.battle.stepNumber,
      });
      showFatalError(`Pawn Swarm stopped: ${message}`);
    }
  };
  requestAnimationFrame(frame);
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("startup failed", {
    error: message,
    kind:
      error instanceof ConfigError || error instanceof StartupError
        ? error.name
        : "unexpected",
  });
  showFatalError(`Pawn Swarm could not start: ${message}`);
});
