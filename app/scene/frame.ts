/**
 * One frame of the scene: read the page, move the camera and world toward the pose, steer the wake, draw if
 * anything moved. Every step takes the Runtime; renderPose returns whether the scene is still busy, which is what
 * keeps the site's shared frame loop awake.
 */
import { MathUtils } from "three";
import { buildFor, disposeBuild, wordScreenAspect } from "./build";
import { pickLayout } from "./breakpoints";
import { applyRig, createRig, snapRig, stepRig, type Shot } from "./camera";
import { heroFrame, readHeroCopy } from "./compose";
import { stepIntro } from "./intro";
import { damp } from "./motion";
import {
  poseFor,
  RULES_FOV,
  RULES_HEIGHT,
  type Pose,
  type WorldState,
} from "./poses";
import { createFrameProbe, devicePixelRatioFor, downgrade } from "./quality";
import { markActive, type Runtime } from "./runtime";
import { probeSections, type Probe } from "./sections";
import { updatePointer } from "./steer";
import { stepWake } from "./wake";

const FLIGHT_SECONDS = 2.2;
const DEFAULT_RULE_PITCH = 112;
const COPY_REFRESH_SECONDS = 0.5;
const FAST_KEYS: Array<keyof WorldState> = [
  "front",
  "channelLight",
  "wordLight",
  "carve",
];

export type BusyFlags = {
  introDone: boolean;
  rigSettled: boolean;
  worldSettled: boolean;
  wakeMoving: boolean;
  parting: boolean;
  pointerLit: boolean;
  active: boolean;
  lively: boolean;
};

/**
 * Whether the scene needs another frame. A pose with the pointer wake (hero, about, contact) keeps drawing only
 * while recent input, scroll or a route change keeps it active; after that, with nothing moving, it stops.
 */
export function sceneBusy(flags: BusyFlags): boolean {
  return (
    !flags.introDone ||
    !flags.rigSettled ||
    !flags.worldSettled ||
    flags.wakeMoving ||
    flags.parting ||
    flags.pointerLit ||
    (flags.active && flags.lively)
  );
}

export function worldSettled(current: WorldState, goal: WorldState): boolean {
  return (Object.keys(goal) as Array<keyof WorldState>).every((key) => {
    return Math.abs(current[key] - goal[key]) < 0.002;
  });
}

function dampWorld(current: WorldState, goal: WorldState, dt: number): void {
  for (const key of Object.keys(goal) as Array<keyof WorldState>) {
    const rate = FAST_KEYS.includes(key) ? 6 : 3.2;
    current[key] = damp(current[key], goal[key], rate, dt);
  }
}

function introShot(shot: Shot): Shot {
  const away = shot.position.clone().sub(shot.target).multiplyScalar(0.22);
  away.y += 8;
  return { ...shot, position: shot.position.clone().add(away) };
}

export function refreshCopy(rt: Runtime): void {
  rt.state.copy = readHeroCopy();
  rt.state.frame = heroFrame(
    rt.state.copy,
    window.innerWidth,
    window.innerHeight,
    wordScreenAspect(rt.build),
  );
}

/** Resizes the drawing buffer and rebuilds the world when the breakpoint changes. Returns whether anything changed. */
export function syncSize(rt: Runtime): boolean {
  const { canvas, state } = rt;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === state.width && height === state.height) {
    return false;
  }
  state.width = width;
  state.height = height;
  rt.renderer.setSize(width, height, false);
  const layout = pickLayout(window.innerWidth, window.innerHeight);
  if (layout !== rt.build.layout) {
    disposeBuild(rt.build);
    rt.build = buildFor(layout, rt.tier);
  }
  refreshCopy(rt);
  return true;
}

function currentPose(rt: Runtime, probe: Probe): Pose {
  const unitsPerPx =
    (2 * RULES_HEIGHT * Math.tan(MathUtils.degToRad(RULES_FOV / 2))) /
    window.innerHeight;
  const aspect = rt.build.layout
    ? rt.state.width / Math.max(1, rt.state.height)
    : 1;
  const frame =
    rt.state.frame ??
    heroFrame(
      null,
      window.innerWidth,
      window.innerHeight,
      wordScreenAspect(rt.build),
    );
  return poseFor(
    {
      layout: rt.build.layout,
      word: rt.build.word,
      aspect,
      frame,
      probe,
      still: rt.reduced,
    },
    unitsPerPx,
  );
}

/** Dims the world mid flight, so letters the camera passes over never flare behind the new page's text. */
function flightDip(rt: Runtime, time: number): number {
  const t = (time - rt.state.poseChangedAt) / FLIGHT_SECONDS;
  return t >= 1 ? 1 : 1 - 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.4));
}

function applyWorld(rt: Runtime, world: WorldState, time: number): void {
  const u = rt.build.world.uniforms;
  const { state } = rt;
  u.uTime.value = state.flickerTime;
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
  u.uExposure.value = world.exposure * flightDip(rt, time);
  const axes = state.rig?.axes;
  if (axes) {
    rt.scratch.set(axes[3].value, axes[4].value, axes[5].value);
  }
  u.uFog.value =
    world.fogScale / Math.max(20, rt.camera.position.distanceTo(rt.scratch));
}

/** Places the floor hairlines on the principles section's own ruled rows, seen from the camera as it is now. */
function updateRules(rt: Runtime, probe: Probe, world: WorldState): void {
  const rules = rt.build.world.uniforms.uRules.value;
  rules.x = world.rules;
  if (world.rules < 0.002) {
    return;
  }
  const { camera } = rt;
  const height = Math.max(1, camera.position.y);
  const unitsPerPx =
    (2 * height * Math.tan(MathUtils.degToRad(camera.fov / 2))) /
    window.innerHeight;
  const pitch = probe.rows?.pitch ?? DEFAULT_RULE_PITCH;
  const firstY = probe.rows?.first ?? -window.scrollY;
  rules.y = pitch * unitsPerPx;
  rules.z = camera.position.z - (window.innerHeight / 2 - firstY) * unitsPerPx;
}

/** Feeds one busy frame's work time to the probe; a slow answer drops one tier (at most twice, one per probe). */
export function probeQuality(rt: Runtime, workSeconds: number): void {
  const { state } = rt;
  if (
    state.downgrades >= 2 ||
    rt.reduced ||
    state.probe(workSeconds) !== "slow"
  ) {
    return;
  }
  rt.tier = downgrade(rt.tier);
  state.downgrades += 1;
  rt.renderer.setPixelRatio(devicePixelRatioFor(rt.tier));
  const geometry = rt.build.world.slabs.geometry;
  geometry.instanceCount = Math.floor(geometry.instanceCount * 0.72);
  state.probe = createFrameProbe();
}

function trackPage(rt: Runtime, time: number, pose: Pose): void {
  const { state } = rt;
  if (pose.name !== state.poseName) {
    state.poseChangedAt = state.poseName ? time : -10;
    state.poseName = pose.name;
    markActive(state, time);
  }
  if (window.scrollY !== state.lastScrollY) {
    state.lastScrollY = window.scrollY;
    markActive(state, time);
  }
  if (time - state.copyReadAt > COPY_REFRESH_SECONDS) {
    state.copyReadAt = time;
    refreshCopy(rt);
  }
}

function moveRig(
  rt: Runtime,
  pose: Pose,
  dt: number,
  time: number,
  snap: boolean,
): void {
  const { state } = rt;
  if (!state.rig || !state.world) {
    state.rig = createRig(snap ? pose.shot : introShot(pose.shot));
    state.world = { ...pose.world };
  }
  if (snap) {
    snapRig(state.rig, pose.shot);
    Object.assign(state.world, pose.world);
  } else {
    const flying = time - state.poseChangedAt < FLIGHT_SECONDS;
    stepRig(
      state.rig,
      pose.shot,
      !state.intro.done ? 2.2 : flying ? 2.4 : 9,
      dt,
    );
    dampWorld(state.world, pose.world, dt);
  }
  state.pageLock = pose.pageLock ?? (snap ? 0 : damp(state.pageLock, 0, 4, dt));
  applyRig(
    state.rig,
    pose.shot,
    rt.camera,
    state.width / Math.max(1, state.height),
    state.pageLock,
  );
}

/** Draws one frame (or skips the draw when nothing moved). Returns whether the scene wants another frame. */
export function renderPose(
  rt: Runtime,
  dt: number,
  time: number,
  snap: boolean,
): boolean {
  const { state } = rt;
  if (syncSize(rt)) {
    markActive(state, time);
  }
  stepIntro(state.intro, dt);
  const probe = probeSections(state.path);
  const pose = currentPose(rt, probe);
  trackPage(rt, time, pose);
  moveRig(rt, pose, dt, time, snap);
  const world = state.world ?? pose.world;
  const active = time < state.activeUntil;
  if (active) {
    state.flickerTime += dt;
  }
  applyWorld(rt, world, time);
  updateRules(rt, probe, world);
  if (!snap) {
    updatePointer(rt, dt, time, world);
  }
  const busy = sceneBusy({
    introDone: state.intro.done,
    rigSettled: state.rig?.settled ?? true,
    worldSettled: worldSettled(world, pose.world),
    wakeMoving: stepWake(rt.build.wake, dt),
    parting: state.parting !== null,
    pointerLit: state.pointerStrength > 0.01,
    active,
    lively: world.wake > 0.05,
  });
  if (busy || snap || !state.ready) {
    rt.renderer.render(rt.build.scene, rt.camera);
  }
  if (!state.ready) {
    state.ready = true;
    rt.hooks.onReady();
  }
  return busy && !snap;
}
