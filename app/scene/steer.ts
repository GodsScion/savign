/**
 * Steering the wake: the live pointer, the press parting toward the h1, and the idle wanderer on touch screens,
 * each turned into a point on the floor and stamped into the wake grid.
 */
import type { Build } from "./build";
import { damp, easeOut } from "./motion";
import { secondsSinceMove, wandererOn } from "./pointer";
import type { WorldState } from "./poses";
import type { FloorPoint, Runtime } from "./runtime";
import { stampSegment } from "./wake";

const IDLE_SECONDS = 3.5;
const PARTING_SECONDS = 0.8;

export function floorPointAt(
  rt: Runtime,
  clientX: number,
  clientY: number,
): FloorPoint | null {
  rt.ndc.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  rt.raycaster.setFromCamera(rt.ndc, rt.camera);
  const point = rt.raycaster.ray.intersectPlane(rt.floorPlane, rt.hit);
  return point ? { x: point.x, z: point.z } : null;
}

/** A slow figure of eight in front of the letters. */
export function wanderPoint(build: Build, time: number): FloorPoint {
  const { word } = build;
  const center = (word.leftX + word.rightX) / 2;
  const span = (word.rightX - word.leftX) * 0.46;
  return {
    x: center + Math.sin(time * 0.21) * span,
    z: word.frontZ + 7 + Math.sin(time * 0.33 + 1.2) * 7,
  };
}

function startParting(rt: Runtime): void {
  const press = rt.input.pressRequest;
  rt.input.pressRequest = null;
  const heading = document.querySelector("h1");
  if (!press || !heading) {
    return;
  }
  const box = heading.getBoundingClientRect();
  const from = floorPointAt(rt, press.x, press.y);
  const to = floorPointAt(
    rt,
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  if (from && to) {
    rt.state.parting = { from, to, head: { ...from }, t: 0 };
  }
}

function stepParting(rt: Runtime, dt: number): void {
  const parting = rt.state.parting;
  if (!parting) {
    return;
  }
  parting.t = Math.min(1, parting.t + dt / PARTING_SECONDS);
  const k = easeOut(parting.t);
  const head = {
    x: parting.from.x + (parting.to.x - parting.from.x) * k,
    z: parting.from.z + (parting.to.z - parting.from.z) * k,
  };
  stampSegment(
    rt.build.wake,
    parting.head,
    head,
    rt.build.layout.wakeRadius * 0.8,
    1,
  );
  parting.head = head;
  if (parting.t >= 1) {
    rt.state.parting = null;
  }
}

function aimFor(
  rt: Runtime,
  time: number,
): { aim: FloorPoint | null; live: boolean } {
  const { input, state } = rt;
  if (secondsSinceMove(input, time) <= IDLE_SECONDS) {
    const live = floorPointAt(rt, input.x, input.y);
    if (live) {
      return { aim: live, live: true };
    }
  }
  if (wandererOn(time, state.startedAt, input.lastTouchEnd, rt.coarse)) {
    return { aim: wanderPoint(rt.build, time), live: false };
  }
  return { aim: null, live: false };
}

function followAim(
  rt: Runtime,
  aim: FloorPoint,
  strength: number,
  live: boolean,
  dt: number,
): void {
  const { state, build } = rt;
  const previous = state.pointer ?? aim;
  const far = Math.hypot(aim.x - previous.x, aim.z - previous.z) > 30;
  const ease = far ? 1 : Math.min(1, dt * 12);
  const next = previous;
  const fromX = previous.x;
  const fromZ = previous.z;
  next.x += (aim.x - next.x) * ease;
  next.z += (aim.z - next.z) * ease;
  if (!far) {
    const radius = build.layout.wakeRadius * (live ? 1 : 0.85);
    stampSegment(build.wake, { x: fromX, z: fromZ }, next, radius, strength);
  }
  state.pointer = next;
}

export function updatePointer(
  rt: Runtime,
  dt: number,
  time: number,
  world: WorldState,
): void {
  const { state, input, build } = rt;
  const uniform = build.world.uniforms.uPointer.value;
  if (world.wake <= 0.05) {
    input.pressRequest = null;
    state.pointerStrength = damp(state.pointerStrength, 0, 4, dt);
    uniform.z = state.pointerStrength;
    return;
  }
  if (input.pressRequest) {
    startParting(rt);
  }
  stepParting(rt, dt);
  const { aim, live } = aimFor(rt, time);
  const strength = (live ? 1 : 0.7) * world.wake;
  state.pointerStrength = damp(
    state.pointerStrength,
    aim ? strength : 0,
    3,
    dt,
  );
  if (aim) {
    followAim(rt, aim, strength, live, dt);
    uniform.x = state.pointer?.x ?? aim.x;
    uniform.y = state.pointer?.z ?? aim.z;
  }
  uniform.z = state.pointerStrength;
  uniform.w = build.layout.wakeRadius * 1.6;
}
