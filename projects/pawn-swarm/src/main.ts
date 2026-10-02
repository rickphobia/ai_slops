import {
  loadAudioSettings,
  saveAudioSettings,
} from "./adapters/audio/audio-settings";
import { createSoundPlayer } from "./adapters/audio/sound-player";
import {
  moodFor,
  soundForEvent,
  soundForRunEnd,
  soundForShopAction,
} from "./adapters/audio/sounds-for";
import { createWebAudioOutput } from "./adapters/audio/web-audio-output";
import { createCanvasRenderer } from "./adapters/canvas-renderer/canvas-renderer";
import { createEffects } from "./adapters/canvas-renderer/effects";
import { createPieceMotion } from "./adapters/canvas-renderer/piece-motion";
import { loadPieceArt } from "./adapters/canvas-renderer/piece-art";
import { createBattleControls } from "./adapters/dom-ui/battle-controls";
import { createEndScreen } from "./adapters/dom-ui/end-screen";
import { createHud, type HudStatus } from "./adapters/dom-ui/hud";
import { createSettingsPanel } from "./adapters/dom-ui/settings-panel";
import { createShopScreen } from "./adapters/dom-ui/shop-screen";
import { createSkillBar } from "./adapters/dom-ui/skill-bar";
import { blackPiecesLeft, REAL_MS_PER_STEP, STEP_SECONDS } from "./battle/step";
import type { PawnTypeId } from "./catalog/pieces";
import { ConfigError, loadConfig } from "./config";
import { startingPawnsFromQuery } from "./debug-options";
import { createConsoleLogger, logLevelFromQuery, type Logger } from "./logger";
import {
  actInShop,
  advanceRun,
  armySize,
  type RunState,
  type ShopAction,
  shopView,
  startRun,
} from "./run/run";
import { ShopError } from "./shop/shop";
import { describeSkillBar, skillBlocker } from "./skills/skills";
import { StartupError } from "./startup-error";
import { createTickClock } from "./tick-clock";

/** At 2× speed a 60 fps frame needs 2 steps; this leaves room for a slow frame without a long catch-up. */
const MAX_STEPS_PER_FRAME = 8;

/** The king's death plays at this fraction of the game's speed, for this long (real time). */
const SLOW_MOTION_SCALE = 0.25;
const SLOW_MOTION_MS = 1600;

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

/** Browser storage throws when blocked (some private windows), so asking for it is guarded. */
function storageOrUndefined(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function hudStatus(run: RunState): HudStatus {
  return {
    wave: run.wave,
    waveCount: run.waves.length,
    whitePawns:
      run.phase === "shop" ? armySize(run.army) : run.battle.pawns.length,
    blackLeft: blackPiecesLeft(run.battle),
    seed: run.seed,
  };
}

function logShopAction(
  previous: RunState,
  next: RunState,
  action: ShopAction,
  log: Logger,
): void {
  if (previous.phase !== "shop") return;
  const plainPawns = (run: RunState): number | undefined =>
    run.phase === "shop" ? run.army.plain : undefined;
  switch (action.type) {
    case "recruit":
      log.info("pawn recruited", {
        wave: previous.shop.wave,
        type: previous.shop.offers[action.offer]?.type,
        plainPawnsBefore: plainPawns(previous),
        plainPawnsAfter: plainPawns(next),
      });
      break;
    case "reroll":
      log.info("shop rerolled", {
        wave: previous.shop.wave,
        rerolls: previous.shop.rerolls + 1,
        plainPawnsBefore: plainPawns(previous),
        plainPawnsAfter: plainPawns(next),
      });
      break;
    case "lock":
      log.info("offer lock toggled", {
        wave: previous.shop.wave,
        type: previous.shop.offers[action.offer]?.type,
      });
      break;
    case "start-wave":
      log.info("wave started", {
        wave: next.wave,
        pawns: next.battle.pawns.length,
        army: previous.army,
      });
      break;
  }
}

function logStep(previous: RunState, next: RunState, log: Logger): void {
  const stepNumber = next.battle.stepNumber;
  for (const event of next.battle.events) {
    log.debug(`battle ${event.type}`, { step: stepNumber, ...event });
    if (event.type === "skill") {
      // `step` is the one a replay feeds the skill into: the step it fired on.
      log.info("skill used", {
        wave: next.wave,
        step: previous.battle.stepNumber,
        skill: event.pawnType,
        pawns: event.pawns,
      });
    }
    if (event.type === "push") {
      log.info("more black pieces incoming", {
        wave: next.wave,
        step: stepNumber,
        count: event.count,
        pushesLeft: event.pushesLeft,
      });
    }
  }
  if (previous.phase === "battle" && next.phase === "shop") {
    log.info("shop opened", {
      wave: next.shop.wave,
      offers: next.shop.offers.map((offer) => offer.type),
      army: next.army,
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
  if (
    previous.phase === "battle" &&
    (next.phase === "won" || next.phase === "lost")
  ) {
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
  const motion = createPieceMotion();

  // Sound: the synth stays silent until the first click or key press, which is when browsers allow it.
  const audio = createWebAudioOutput(logger);
  let settings = loadAudioSettings(storageOrUndefined(), (message) => {
    logger.warn(message);
  });
  const player = createSoundPlayer(
    audio,
    settings,
    () => performance.now(),
    Math.random,
  );
  createSettingsPanel(document, settings, (next) => {
    settings = next;
    player.applySettings(next);
    saveAudioSettings(storageOrUndefined(), next, (message) => {
      logger.warn(message);
    });
  });
  const unlockAudio = (): void => {
    audio.unlock();
    for (const type of ["pointerdown", "keydown"]) {
      window.removeEventListener(type, unlockAudio);
    }
  };
  for (const type of ["pointerdown", "keydown"]) {
    window.addEventListener(type, unlockAudio);
  }
  /** Real time until which the game runs in slow motion (after the king dies). */
  let slowMotionUntilMs = 0;

  const beginRun = (seed: number): RunState => {
    const run = startRun({
      seed,
      ...(startingPawns.pawns !== undefined && {
        plainPawns: startingPawns.pawns,
      }),
    });
    effects.clear();
    motion.clear();
    slowMotionUntilMs = 0;
    logger.info("run started", { seed, pawns: run.battle.pawns.length });
    logger.info("wave started", { wave: run.wave });
    player.play("wave-start");
    return run;
  };

  const hud = createHud(document);
  let run = beginRun(config.defaultSeed);
  /** Skills the player asked for since the last step: they fire on the next one, even if that waits on a pause. */
  let queuedSkills: PawnTypeId[] = [];
  const skillBar = createSkillBar(document, (type) => {
    if (run.phase !== "battle" || run.battle.outcome !== "ongoing") return;
    if (queuedSkills.includes(type)) return;
    const blocker = skillBlocker(
      run.battle.skillCooldowns,
      run.battle.pawns,
      type,
    );
    if (blocker !== undefined) {
      logger.debug("skill not ready", {
        skill: type,
        blocker,
        step: run.battle.stepNumber,
      });
      return;
    }
    queuedSkills.push(type);
  });
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
    isBattleShown: () => run.phase === "battle",
    onSpeed: (speed) => {
      clock.setSpeed(speed);
      controls.show(clock.state());
      logger.info("battle speed set", { speed, step: run.battle.stepNumber });
    },
  });
  controls.show(clock.state());
  const shopScreen = createShopScreen(document, (action) => {
    const previous = run;
    try {
      run = actInShop(run, action);
    } catch (error) {
      // The screen greys out what the shop refuses, so a refusal here means the two disagree.
      if (!(error instanceof ShopError)) throw error;
      logger.error("shop action refused", {
        action,
        error: error.message,
        wave: run.wave,
        seed: run.seed,
      });
      return;
    }
    logShopAction(previous, run, action, logger);
    const sound = soundForShopAction(action);
    if (sound !== undefined) player.play(sound);
    if (run.phase === "shop") shopScreen.show(shopView(run));
    else shopScreen.hide();
  });
  const endScreen = createEndScreen(document, () => {
    run = beginRun(randomSeed());
    queuedSkills = [];
    shopScreen.hide();
    // The speed carries over to the next run; a pause doesn't.
    if (clock.state().paused) setPaused(false);
    endScreen.hide();
  });

  // Steps run on game time, not frames: each frame runs however many steps are due.
  // Only the clock knows the speed, so the same seed plays the same steps at any speed.
  // Effects age with the steps, so they freeze on pause and speed up with the game.
  const runDueSteps = (nowMs: number): void => {
    // Checked each frame so slow motion ends on time even while nothing is dying.
    clock.setTimeScale(nowMs < slowMotionUntilMs ? SLOW_MOTION_SCALE : 1);
    const dueSteps = clock.takeDueTicks(nowMs);
    for (let index = 0; index < dueSteps && run.phase === "battle"; index++) {
      const previous = run;
      run = advanceRun(run, { skillUses: queuedSkills });
      queuedSkills = [];
      logStep(previous, run, logger);
      effects.advance(STEP_SECONDS);
      motion.advance(STEP_SECONDS);
      effects.add(run.battle.events);
      motion.add(run.battle.events);
      for (const event of run.battle.events) {
        const sound = soundForEvent(event);
        if (sound !== undefined) player.play(sound);
        if (
          event.type === "death" &&
          event.piece.side === "black" &&
          event.piece.kind === "king"
        ) {
          slowMotionUntilMs = nowMs + SLOW_MOTION_MS;
        }
      }
      const endSound = soundForRunEnd(previous, run);
      if (endSound !== undefined) player.play(endSound);
      if (run.battle.events.some((event) => event.type === "drop")) hud.bump();
      if (run.phase === "shop") shopScreen.show(shopView(run));
      if (run.phase === "won" || run.phase === "lost") {
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
      if (run.phase === "battle" && run.battle.outcome === "ongoing") {
        skillBar.show(
          describeSkillBar(
            run.battle.skillCooldowns,
            run.battle.pawns,
            queuedSkills,
          ),
        );
      } else {
        skillBar.hide();
      }
      player.setMood(moodFor(run));
      renderer.draw(
        run.battle,
        {
          effects: effects.list(),
          particles: effects.particles,
          motion,
          shake: settings.screenShake ? effects.shake() : 0,
        },
        nowMs / 1000,
      );
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
