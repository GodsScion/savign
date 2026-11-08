/** Everything one running scene holds, in one object the per-frame functions take. */
import {
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Build } from "./build";
import type { GpuTimer } from "./gpu-timer";
import type { Rig } from "./camera";
import type { CopyBox, Frame } from "./compose";
import { createIntro, type Intro } from "./intro";
import { WANDER_SECONDS, type PointerInput } from "./pointer";
import type { WorldState } from "./poses";
import { createFrameProbe, type FrameProbe, type Tier } from "./quality";

export type SceneHooks = { onReady: () => void; onLost: () => void };

export type FloorPoint = { x: number; z: number };

export type Parting = {
  from: FloorPoint;
  to: FloorPoint;
  head: FloorPoint;
  t: number;
};

export type SceneState = {
  path: string;
  intro: Intro;
  rig: Rig | null;
  world: WorldState | null;
  poseName: string;
  poseChangedAt: number;
  copy: CopyBox | null;
  frame: Frame | null;
  width: number;
  height: number;
  copyReadAt: number;
  pageLock: number;
  ready: boolean;
  lost: boolean;
  pointer: FloorPoint | null;
  pointerStrength: number;
  parting: Parting | null;
  probe: FrameProbe;
  downgrades: number;
  startedAt: number;
  /** Until this time (seconds) the hero keeps drawing for its flicker and wanderer; input and scroll extend it. */
  activeUntil: number;
  lastScrollY: number;
  flickerTime: number;
};

export type Runtime = {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  build: Build;
  tier: Tier;
  reduced: boolean;
  coarse: boolean;
  input: PointerInput;
  hooks: SceneHooks;
  state: SceneState;
  raycaster: Raycaster;
  floorPlane: Plane;
  ndc: Vector2;
  hit: Vector3;
  scratch: Vector3;
  gpuTimer: GpuTimer;
};

/** Seconds the scene keeps drawing after the last input, scroll or route change. */
export const ACTIVE_SECONDS = 4;

/** The first activity window covers the intro plus 4 s; on touch screens it also covers the 8 s wanderer. */
export function firstActiveSeconds(coarse: boolean): number {
  const base = 1.8 + ACTIVE_SECONDS;
  return coarse ? Math.max(base, WANDER_SECONDS) : base;
}

export function createState(
  path: string,
  reduced: boolean,
  now: number,
  coarse: boolean,
): SceneState {
  const intro = createIntro(reduced);
  return {
    path,
    intro,
    rig: null,
    world: null,
    poseName: "",
    poseChangedAt: -10,
    copy: null,
    frame: null,
    width: 0,
    height: 0,
    copyReadAt: -10,
    pageLock: 0,
    ready: false,
    lost: false,
    pointer: null,
    pointerStrength: 0,
    parting: null,
    probe: createFrameProbe(),
    downgrades: 0,
    startedAt: now,
    activeUntil: now + firstActiveSeconds(coarse),
    lastScrollY: 0,
    flickerTime: 0,
  };
}

export function markActive(state: SceneState, time: number): void {
  state.activeUntil = Math.max(state.activeUntil, time + ACTIVE_SECONDS);
}

export function now(): number {
  return performance.now() / 1000;
}
