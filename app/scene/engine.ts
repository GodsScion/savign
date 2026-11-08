/**
 * The scene engine: builds the world for the current layout and quality tier, then each frame reads the page
 * (route, active section, scroll, pointer), moves the camera rig toward that pose and renders. Loaded lazily by
 * SceneRoot after first paint; this module is the only one that pulls in three.
 */
import {
  MathUtils,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  applyRig,
  createRig,
  snapRig,
  stepRig,
  type Rig,
  type Shot,
} from "./camera";
import { heroFrame, readHeroCopy, type CopyBox, type Frame } from "./compose";
import { onFrame } from "./driver";
import { createIntro, hurryIntro, stepIntro, type Intro } from "./intro";
import { pickLayout, scaleField, type Layout } from "./breakpoints";
import { damp, easeOut } from "./motion";
import { trackPointer, secondsSinceMove, type PointerInput } from "./pointer";
import {
  poseFor,
  RULES_FOV,
  RULES_HEIGHT,
  type Pose,
  type WorldState,
} from "./poses";
import {
  createFrameProbe,
  detectTier,
  devicePixelRatioFor,
  downgrade,
  type Tier,
} from "./quality";
import { probeSections, type Probe } from "./sections";
import { createWake, stampSegment, stepWake, type Wake } from "./wake";
import { buildWordmark, type Rect, type Wordmark } from "./wordmark";
import { drawBuriedWords } from "./words";
import { buildWorld, CLEAR_COLOR, type World } from "./world";

export type SceneHooks = { onReady: () => void; onLost: () => void };
export type SceneHandle = {
  setPath: (path: string) => void;
  dispose: () => void;
};

type Build = {
  layout: Layout;
  word: Wordmark;
  plaza: Rect;
  wake: Wake;
  world: World;
  scene: Scene;
};
type FloorPoint = { x: number; z: number };
type Parting = {
  from: FloorPoint;
  to: FloorPoint;
  head: FloorPoint;
  t: number;
};

const FLIGHT_SECONDS = 2.2;
const IDLE_SECONDS = 3.5;
const DEFAULT_RULE_PITCH = 112;

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function buildFor(layout: Layout, tier: Tier): Build {
  const stretch = 1.15 / Math.sin(MathUtils.degToRad(layout.elevation));
  const word = buildWordmark(layout.wordWidth, stretch);
  const x = Math.floor(word.leftX) - 20;
  const z = Math.floor(word.backZ) - 22;
  const plaza: Rect = {
    x,
    z,
    w: Math.ceil(word.rightX) + 20 - x,
    d: Math.ceil(word.frontZ) + 30 - z,
  };
  const wake = createWake(plaza);
  const world = buildWorld(
    word,
    plaza,
    scaleField(layout.field, tier.fieldScale),
    wake,
    drawBuriedWords(plaza),
  );
  const scene = new Scene();
  scene.add(...world.meshes);
  return { layout, word, plaza, wake, world, scene };
}

/** Uploads textures and compiles each material in its own task, so no single task blocks input for long. */
async function warmUp(
  renderer: WebGLRenderer,
  build: Build,
  camera: PerspectiveCamera,
): Promise<void> {
  for (const texture of build.world.textures) {
    renderer.initTexture(texture);
    await yieldToMain();
  }
  for (const mesh of build.world.meshes) {
    await renderer.compileAsync(mesh, camera, build.scene);
    await yieldToMain();
  }
}

function disposeBuild(build: Build): void {
  for (const mesh of build.world.meshes) {
    mesh.geometry.dispose();
    const material = mesh.material;
    if (!Array.isArray(material)) {
      material.dispose();
    }
  }
  build.world.textures.forEach((texture) => texture.dispose());
}

function wordScreenAspect(build: Build): number {
  const { word, layout } = build;
  const depth = word.frontZ - word.backZ;
  const elevation = MathUtils.degToRad(layout.elevation);
  return (
    (depth * Math.sin(elevation)) /
    (layout.wordWidth * Math.cos(MathUtils.degToRad(layout.yaw)))
  );
}

function introShot(shot: Shot): Shot {
  const away = shot.position.clone().sub(shot.target).multiplyScalar(0.22);
  return {
    ...shot,
    position: shot.position
      .clone()
      .add(away)
      .add(new Vector3(0, 8, 0)),
  };
}

function worldSettled(current: WorldState, goal: WorldState): boolean {
  return (Object.keys(goal) as Array<keyof WorldState>).every((key) => {
    return Math.abs(current[key] - goal[key]) < 0.002;
  });
}

function dampWorld(current: WorldState, goal: WorldState, dt: number): void {
  for (const key of Object.keys(goal) as Array<keyof WorldState>) {
    const rate =
      key === "front" ||
      key === "channelLight" ||
      key === "wordLight" ||
      key === "carve"
        ? 6
        : 3.2;
    current[key] = damp(current[key], goal[key], rate, dt);
  }
}

export async function startScene(
  canvas: HTMLCanvasElement,
  initialPath: string,
  hooks: SceneHooks,
): Promise<SceneHandle> {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let tier = detectTier(
    pickLayout(window.innerWidth, window.innerHeight).breakpoint,
  );
  const renderer = new WebGLRenderer({
    canvas,
    antialias: tier.antialias,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
  renderer.setClearColor(CLEAR_COLOR);
  renderer.setPixelRatio(devicePixelRatioFor(tier));
  await yieldToMain();
  let build = buildFor(pickLayout(window.innerWidth, window.innerHeight), tier);
  await yieldToMain();
  const camera = new PerspectiveCamera(build.layout.fov, 1, 0.1, 2000);
  const raycaster = new Raycaster();
  const floorPlane = new Plane(new Vector3(0, 1, 0), -0.8);
  const ndc = new Vector2();
  const hit = new Vector3();

  const state = {
    path: initialPath,
    intro: createIntro(reduced) as Intro,
    rig: null as Rig | null,
    world: null as WorldState | null,
    poseName: "",
    poseChangedAt: -10,
    copy: null as CopyBox | null,
    frame: null as Frame | null,
    width: 0,
    height: 0,
    frameCount: 0,
    copyReadAt: -10,
    pageLock: 0,
    ready: false,
    running: false,
    lost: false,
    pointer: null as FloorPoint | null,
    pointerStrength: 0,
    parting: null as Parting | null,
    probeQuality: createFrameProbe(),
    downgrades: 0,
  };

  const input: PointerInput = trackPointer(() => {
    if (!state.intro.done) {
      hurryIntro(state.intro);
    }
  });

  function syncSize(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === state.width && height === state.height) {
      return;
    }
    state.width = width;
    state.height = height;
    renderer.setSize(width, height, false);
    const layout = pickLayout(window.innerWidth, window.innerHeight);
    if (layout !== build.layout) {
      disposeBuild(build);
      build = buildFor(layout, tier);
    }
    refreshCopy();
  }

  function refreshCopy(): void {
    state.copy = readHeroCopy();
    state.frame = heroFrame(
      state.copy,
      window.innerWidth,
      window.innerHeight,
      wordScreenAspect(build),
    );
  }

  function currentPose(probe: Probe): Pose {
    const unitsPerPx =
      (2 * RULES_HEIGHT * Math.tan(MathUtils.degToRad(RULES_FOV / 2))) /
      window.innerHeight;
    const frame =
      state.frame ??
      heroFrame(
        null,
        window.innerWidth,
        window.innerHeight,
        wordScreenAspect(build),
      );
    const aspect = state.width / Math.max(1, state.height);
    return poseFor(
      { layout: build.layout, word: build.word, aspect, frame, probe },
      unitsPerPx,
    );
  }

  function floorPointAt(clientX: number, clientY: number): FloorPoint | null {
    ndc.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const point = raycaster.ray.intersectPlane(floorPlane, hit);
    return point ? { x: point.x, z: point.z } : null;
  }

  function wanderer(time: number): FloorPoint {
    const { word } = build;
    const center = (word.leftX + word.rightX) / 2;
    const span = (word.rightX - word.leftX) * 0.46;
    return {
      x: center + Math.sin(time * 0.21) * span,
      z: word.frontZ + 7 + Math.sin(time * 0.33 + 1.2) * 7,
    };
  }

  function startParting(): void {
    const press = input.pressRequest;
    input.pressRequest = null;
    const heading = document.querySelector("h1");
    if (!press || !heading) {
      return;
    }
    const box = heading.getBoundingClientRect();
    const from = floorPointAt(press.x, press.y);
    const to = floorPointAt(box.left + box.width / 2, box.top + box.height / 2);
    if (from && to) {
      state.parting = { from, to, head: { ...from }, t: 0 };
    }
  }

  function stepParting(dt: number): void {
    const parting = state.parting;
    if (!parting) {
      return;
    }
    parting.t = Math.min(1, parting.t + dt / 0.8);
    const k = easeOut(parting.t);
    const head = {
      x: parting.from.x + (parting.to.x - parting.from.x) * k,
      z: parting.from.z + (parting.to.z - parting.from.z) * k,
    };
    stampSegment(
      build.wake,
      parting.head,
      head,
      build.layout.wakeRadius * 0.8,
      1,
    );
    parting.head = head;
    if (parting.t >= 1) {
      state.parting = null;
    }
  }

  function updatePointer(dt: number, time: number, world: WorldState): void {
    const uniform = build.world.uniforms.uPointer.value;
    const enabled = world.wake > 0.05;
    if (!enabled) {
      input.pressRequest = null;
      state.pointerStrength = damp(state.pointerStrength, 0, 4, dt);
      uniform.z = state.pointerStrength;
      return;
    }
    if (input.pressRequest) {
      startParting();
    }
    stepParting(dt);
    const idle = secondsSinceMove(input) > IDLE_SECONDS;
    const live = !idle ? floorPointAt(input.x, input.y) : null;
    const aim =
      live ?? (idle && (coarse || state.intro.done) ? wanderer(time) : null);
    const strength = (live ? 1 : 0.7) * world.wake;
    state.pointerStrength = damp(
      state.pointerStrength,
      aim ? strength : 0,
      3,
      dt,
    );
    if (aim) {
      const previous = state.pointer ?? aim;
      const far = Math.hypot(aim.x - previous.x, aim.z - previous.z) > 30;
      const ease = far ? 1 : Math.min(1, dt * 12);
      const next = {
        x: previous.x + (aim.x - previous.x) * ease,
        z: previous.z + (aim.z - previous.z) * ease,
      };
      if (!far) {
        stampSegment(
          build.wake,
          previous,
          next,
          build.layout.wakeRadius * (live ? 1 : 0.85),
          strength,
        );
      }
      state.pointer = next;
      uniform.x = next.x;
      uniform.y = next.z;
    }
    uniform.z = state.pointerStrength;
    uniform.w = build.layout.wakeRadius * 1.6;
  }

  function updateRules(probe: Probe, world: WorldState): void {
    const rules = build.world.uniforms.uRules.value;
    rules.x = world.rules;
    if (world.rules < 0.002) {
      return;
    }
    const height = Math.max(1, camera.position.y);
    const unitsPerPx =
      (2 * height * Math.tan(MathUtils.degToRad(camera.fov / 2))) /
      window.innerHeight;
    const pitch = probe.rows?.pitch ?? DEFAULT_RULE_PITCH;
    const firstY = probe.rows?.first ?? -window.scrollY;
    rules.y = pitch * unitsPerPx;
    rules.z =
      camera.position.z - (window.innerHeight / 2 - firstY) * unitsPerPx;
  }

  function applyWorld(world: WorldState, time: number): void {
    const u = build.world.uniforms;
    u.uTime.value = time;
    u.uRise.value = state.intro.rise;
    u.uCarve.value = state.intro.carve * world.carve;
    u.uWakeLight.value = world.wake;
    u.uWordLight.value = world.wordLight;
    u.uFront.value = world.front;
    u.uChannelLight.value = world.channelLight;
    u.uPlotLight.value = world.plotLight;
    u.uClear.value.w = world.clear;
    u.uSpot.value.z = world.spot;
    u.uFlat.value = world.flat;
    u.uExposure.value = world.exposure * flightDip(time);
    u.uFog.value =
      world.fogScale /
      Math.max(20, camera.position.distanceTo(new Vector3(...rigTarget())));
  }

  /** Dims the world mid flight, so letters the camera passes over never flare behind the new page's text. */
  function flightDip(time: number): number {
    const t = (time - state.poseChangedAt) / FLIGHT_SECONDS;
    return t >= 1 ? 1 : 1 - 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.4));
  }

  function rigTarget(): [number, number, number] {
    const axes = state.rig?.axes;
    return axes ? [axes[3].value, axes[4].value, axes[5].value] : [0, 0, 0];
  }

  function markReady(): void {
    if (!state.ready) {
      state.ready = true;
      hooks.onReady();
    }
  }

  function probeQuality(dt: number): void {
    if (state.downgrades >= 2 || reduced) {
      return;
    }
    if (state.probeQuality(dt) !== "slow") {
      return;
    }
    tier = downgrade(tier);
    state.downgrades += 1;
    renderer.setPixelRatio(devicePixelRatioFor(tier));
    const geometry = build.world.slabs.geometry;
    geometry.instanceCount = Math.floor(geometry.instanceCount * 0.72);
    state.probeQuality = createFrameProbe();
  }

  function renderPose(dt: number, time: number, snap: boolean): boolean {
    syncSize();
    if (time - state.copyReadAt > 0.5) {
      state.copyReadAt = time;
      refreshCopy();
    }
    state.frameCount += 1;
    stepIntro(state.intro, dt);
    const probe = probeSections(state.path);
    const pose = currentPose(probe);
    if (pose.name !== state.poseName) {
      state.poseChangedAt = state.poseName ? time : -10;
      state.poseName = pose.name;
    }
    if (!state.rig || !state.world) {
      state.rig = createRig(snap ? pose.shot : introShot(pose.shot));
      state.world = { ...pose.world };
    }
    const flying = time - state.poseChangedAt < FLIGHT_SECONDS;
    if (snap) {
      snapRig(state.rig, pose.shot);
      Object.assign(state.world, pose.world);
    } else {
      stepRig(
        state.rig,
        pose.shot,
        !state.intro.done ? 2.2 : flying ? 2.4 : 9,
        dt,
      );
      dampWorld(state.world, pose.world, dt);
    }
    state.pageLock =
      pose.pageLock ?? (snap ? 0 : damp(state.pageLock, 0, 4, dt));
    applyRig(
      state.rig,
      pose.shot,
      camera,
      state.width / Math.max(1, state.height),
      state.pageLock,
    );
    applyWorld(state.world, time);
    updateRules(probe, state.world);
    if (!snap) {
      updatePointer(dt, time, state.world);
    }
    const wakeMoving = stepWake(build.wake, dt);
    const idle =
      snap ||
      (state.intro.done &&
        state.rig.settled &&
        !wakeMoving &&
        state.world.wake < 0.01 &&
        worldSettled(state.world, pose.world));
    if (!idle || !state.ready || snap) {
      renderer.render(build.scene, camera);
    }
    markReady();
    return !idle;
  }

  function tick(time: number, dt: number): void {
    const busy = renderPose(dt, time, false);
    if (busy) {
      probeQuality(dt);
    }
  }

  function renderStill(): void {
    if (!state.lost) {
      renderPose(0, performance.now() / 1000, true);
    }
  }

  let stopTicking = () => {};

  function sync(): void {
    const run = !reduced && !document.hidden && !state.lost;
    if (run === state.running) {
      return;
    }
    state.running = run;
    stopTicking();
    stopTicking = run ? onFrame(tick) : () => undefined;
  }

  let stillQueued = false;
  function queueStill(): void {
    if (!reduced || stillQueued) {
      return;
    }
    stillQueued = true;
    requestAnimationFrame(() => {
      stillQueued = false;
      renderStill();
    });
  }

  function onStillScroll(): void {
    const probe = probeSections(state.path);
    if (probe.pose !== state.poseName) {
      queueStill();
    }
  }

  const onLost = (event: Event) => {
    event.preventDefault();
    state.lost = true;
    state.ready = false;
    sync();
    hooks.onLost();
  };
  const onRestored = () => {
    state.lost = false;
    sync();
    queueStill();
  };

  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", queueStill);
  if (reduced) {
    window.addEventListener("scroll", onStillScroll, { passive: true });
  }
  void document.fonts?.ready.then(() => {
    refreshCopy();
    queueStill();
  });

  syncSize();
  await warmUp(renderer, build, camera);
  if (reduced) {
    renderStill();
  } else {
    sync();
  }

  return {
    setPath(path: string) {
      state.path = path;
      requestAnimationFrame(() => {
        refreshCopy();
        queueStill();
      });
    },
    dispose() {
      stopTicking();
      input.dispose();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", queueStill);
      window.removeEventListener("scroll", onStillScroll);
      disposeBuild(build);
      renderer.dispose();
    },
  };
}
