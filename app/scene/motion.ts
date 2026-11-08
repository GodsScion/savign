export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Frame rate independent exponential approach: rate is "how many e-foldings per second". */
export function damp(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

export type SpringAxis = { value: number; velocity: number };

/** Critically damped spring (Game Programming Gems 4, 1.10); stable for any dt. */
export function stepSpring(
  axis: SpringAxis,
  target: number,
  omega: number,
  dt: number,
): void {
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = axis.value - target;
  const temp = (axis.velocity + omega * change) * dt;
  axis.velocity = (axis.velocity - omega * temp) * decay;
  axis.value = target + (change + temp) * decay;
}

export function hash(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const ux = smoothstep(0, 1, x - ix);
  const uz = smoothstep(0, 1, z - iz);
  const top = lerp(hash(ix, iz), hash(ix + 1, iz), ux);
  const bottom = lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), ux);
  return lerp(top, bottom, uz);
}
