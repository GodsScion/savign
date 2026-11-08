/**
 * The pointer wake: one texel per field cell over the plaza. Stamping puts energy in a cell; energy fades slowly,
 * and each cell's sink follows its energy on a spring, so slabs drop fast and rise back with a small bounce.
 * Red carries the sink (offset so the bounce can overshoot), green the floor glow.
 */
import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType } from "three";
import type { Rect } from "./wordmark";

export type Wake = {
  rect: Rect;
  energy: Float32Array;
  sink: Float32Array;
  velocity: Float32Array;
  bytes: Uint8Array;
  texture: DataTexture;
  awake: boolean;
};

const ENERGY_HALF_LIFE = 1.1;
const SPRING_STIFFNESS = 70;
const SPRING_DAMPING = 9;
const REST = 0.002;
/** Cells this faint when the activity window ends are put back at once (their sink is under a tenth of a slab). */
const SETTLE_SNAP = 0.1;

export function createWake(rect: Rect): Wake {
  const count = rect.w * rect.d;
  const bytes = new Uint8Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    bytes[i * 4] = encodeSink(0);
  }
  const texture = new DataTexture(
    bytes,
    rect.w,
    rect.d,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return {
    rect,
    energy: new Float32Array(count),
    sink: new Float32Array(count),
    velocity: new Float32Array(count),
    bytes,
    texture,
    awake: false,
  };
}

function encodeSink(sink: number): number {
  return Math.round(Math.min(1, Math.max(0, (sink + 0.2) / 1.4)) * 255);
}

export function stampWake(
  wake: Wake,
  x: number,
  z: number,
  radius: number,
  amount: number,
): void {
  const { rect, energy } = wake;
  const left = Math.max(0, Math.floor(x - radius - rect.x));
  const right = Math.min(rect.w - 1, Math.ceil(x + radius - rect.x));
  const top = Math.max(0, Math.floor(z - radius - rect.z));
  const bottom = Math.min(rect.d - 1, Math.ceil(z + radius - rect.z));
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      const dx = rect.x + col + 0.5 - x;
      const dz = rect.z + row + 0.5 - z;
      const t = 1 - Math.sqrt(dx * dx + dz * dz) / radius;
      if (t <= 0) {
        continue;
      }
      const index = row * rect.w + col;
      energy[index] = Math.max(energy[index], amount * Math.min(1, t * 1.8));
      wake.awake = true;
    }
  }
}

/** Stamps every 0.6 units between two points so a fast flick leaves an unbroken trail. */
export function stampSegment(
  wake: Wake,
  from: { x: number; z: number },
  to: { x: number; z: number },
  radius: number,
  amount: number,
): void {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.6),
  );
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    stampWake(
      wake,
      from.x + (to.x - from.x) * t,
      from.z + (to.z - from.z) * t,
      radius,
      amount,
    );
  }
}

/**
 * Ends the wake's tail when the activity window closes: faint cells are put back at once, and the rest lose their
 * energy and spring back up, so the floor is at rest well within a second.
 */
export function settleWake(wake: Wake): void {
  if (!wake.awake) {
    return;
  }
  const { energy, sink, velocity } = wake;
  for (let i = 0; i < energy.length; i += 1) {
    if (energy[i] < SETTLE_SNAP) {
      sink[i] = 0;
      velocity[i] = 0;
    }
    energy[i] = 0;
  }
}

/** Returns whether anything moved, so the caller can skip the texture upload when the floor is at rest. */
export function stepWake(wake: Wake, dt: number): boolean {
  if (!wake.awake) {
    return false;
  }
  const { energy, sink, velocity, bytes } = wake;
  const fade = Math.pow(0.5, dt / ENERGY_HALF_LIFE);
  let moving = false;
  for (let i = 0; i < energy.length; i += 1) {
    if (energy[i] === 0 && sink[i] === 0) {
      continue;
    }
    energy[i] = energy[i] < REST ? 0 : energy[i] * fade;
    const target = Math.min(1, energy[i] * 1.5);
    velocity[i] +=
      ((target - sink[i]) * SPRING_STIFFNESS - velocity[i] * SPRING_DAMPING) *
      dt;
    sink[i] += velocity[i] * dt;
    if (
      energy[i] === 0 &&
      Math.abs(sink[i]) < REST &&
      Math.abs(velocity[i]) < REST
    ) {
      sink[i] = 0;
      velocity[i] = 0;
    } else {
      moving = true;
    }
    bytes[i * 4] = encodeSink(sink[i]);
    bytes[i * 4 + 1] = Math.round(Math.min(1, energy[i]) * 255);
  }
  wake.awake = moving;
  wake.texture.needsUpdate = true;
  return moving;
}
