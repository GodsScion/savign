/**
 * Starts and stops the scene: creates the renderer and world, warms them up, subscribes to the site's frame loop
 * and listens for context loss, tab visibility, resize and (under reduced motion) scroll. The per-frame work lives
 * in frame.ts. Loaded lazily by SceneRoot after first paint; this is the entry that pulls in three.
 */
import {
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { pickLayout } from "./breakpoints";
import { buildFor, disposeBuild, warmUp, yieldToMain } from "./build";
import { onFrame, wakeFrames } from "./driver";
import { probeQuality, refreshCopy, renderPose, syncSize } from "./frame";
import { hurryIntro } from "./intro";
import { trackPointer } from "./pointer";
import { detectTier, devicePixelRatioFor } from "./quality";
import {
  createState,
  markActive,
  now,
  type Runtime,
  type SceneHooks,
} from "./runtime";
import { probeSections } from "./sections";
import { CLEAR_COLOR } from "./world";

export type { SceneHooks } from "./runtime";
export type SceneHandle = {
  setPath: (path: string) => void;
  dispose: () => void;
};

function createRenderer(
  canvas: HTMLCanvasElement,
  antialias: boolean,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    antialias,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.setClearColor(CLEAR_COLOR);
  return renderer;
}

async function createRuntime(
  canvas: HTMLCanvasElement,
  path: string,
  hooks: SceneHooks,
): Promise<Runtime> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layout = pickLayout(window.innerWidth, window.innerHeight);
  const tier = detectTier(layout.breakpoint);
  const renderer = createRenderer(canvas, tier.antialias);
  renderer.setPixelRatio(devicePixelRatioFor(tier));
  await yieldToMain();
  const build = buildFor(layout, tier);
  await yieldToMain();
  const state = createState(path, reduced, now());
  const rt: Runtime = {
    canvas,
    renderer,
    camera: new PerspectiveCamera(layout.fov, 1, 0.1, 2000),
    build,
    tier,
    reduced,
    coarse: window.matchMedia("(pointer: coarse)").matches,
    input: trackPointer(() => {
      markActive(state, now());
      if (!state.intro.done) {
        hurryIntro(state.intro);
      }
    }),
    hooks,
    state,
    raycaster: new Raycaster(),
    floorPlane: new Plane(new Vector3(0, 1, 0), -0.8),
    ndc: new Vector2(),
    hit: new Vector3(),
    scratch: new Vector3(),
  };
  return rt;
}

function tick(rt: Runtime, time: number, dt: number): boolean {
  const started = performance.now();
  const busy = renderPose(rt, dt, time, false);
  if (busy) {
    probeQuality(rt, (performance.now() - started) / 1000);
  }
  return busy || !rt.state.ready;
}

/** Listens for everything outside the frame loop; returns the matching teardown. */
function listen(
  rt: Runtime,
  loop: { sync: () => void; still: () => void },
): () => void {
  const { canvas, state, reduced } = rt;
  const onLost = (event: Event) => {
    event.preventDefault();
    state.lost = true;
    state.ready = false;
    loop.sync();
    rt.hooks.onLost();
  };
  const onRestored = () => {
    state.lost = false;
    loop.sync();
    loop.still();
  };
  const onStillScroll = () => {
    if (probeSections(state.path).pose !== state.poseName) {
      loop.still();
    }
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", loop.sync);
  window.addEventListener("resize", loop.still);
  if (reduced) {
    window.addEventListener("scroll", onStillScroll, { passive: true });
  }
  void document.fonts?.ready.then(() => {
    refreshCopy(rt);
    loop.still();
  });
  return () => {
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    document.removeEventListener("visibilitychange", loop.sync);
    window.removeEventListener("resize", loop.still);
    window.removeEventListener("scroll", onStillScroll);
  };
}

/** The frame loop subscription and the reduced motion still, in one place. */
function createLoop(rt: Runtime) {
  let unsubscribe: (() => void) | null = null;
  let stillQueued = false;
  return {
    sync() {
      const run = !rt.reduced && !document.hidden && !rt.state.lost;
      if (run && !unsubscribe) {
        unsubscribe = onFrame((time, dt) => tick(rt, time, dt));
      }
      if (!run && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
    still() {
      if (!rt.reduced || stillQueued || rt.state.lost) {
        return;
      }
      stillQueued = true;
      requestAnimationFrame(() => {
        stillQueued = false;
        renderPose(rt, 0, now(), true);
      });
    },
    stop() {
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}

function teardown(
  rt: Runtime,
  stopListening: () => void,
  stopLoop: () => void,
): void {
  stopLoop();
  stopListening();
  rt.input.dispose();
  disposeBuild(rt.build);
  rt.renderer.dispose();
}

export async function startScene(
  canvas: HTMLCanvasElement,
  initialPath: string,
  hooks: SceneHooks,
): Promise<SceneHandle> {
  const rt = await createRuntime(canvas, initialPath, hooks);
  const loop = createLoop(rt);
  const stopListening = listen(rt, loop);
  try {
    syncSize(rt);
    await warmUp(rt.renderer, rt.build, rt.camera);
  } catch (error) {
    teardown(rt, stopListening, loop.stop);
    throw error;
  }
  if (rt.reduced) {
    loop.still();
  } else {
    loop.sync();
  }
  return {
    setPath(path: string) {
      rt.state.path = path;
      markActive(rt.state, now());
      wakeFrames();
      requestAnimationFrame(() => {
        refreshCopy(rt);
        loop.still();
      });
    },
    dispose() {
      teardown(rt, stopListening, loop.stop);
    },
  };
}
