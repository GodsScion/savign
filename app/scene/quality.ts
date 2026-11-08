import type { Breakpoint } from "./breakpoints";

export type Tier = {
  name: "high" | "mid" | "low";
  dprCap: number;
  antialias: boolean;
  fieldScale: number;
};

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

const HIGH: Tier = { name: "high", dprCap: 2, antialias: true, fieldScale: 1 };
const MID: Tier = { name: "mid", dprCap: 1.5, antialias: false, fieldScale: 1 };
const LOW: Tier = {
  name: "low",
  dprCap: 1,
  antialias: false,
  fieldScale: 0.72,
};

export function detectTier(breakpoint: Breakpoint): Tier {
  const nav = navigator as NavigatorWithMemory;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  if (cores <= 4 || memory <= 4) {
    return LOW;
  }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (breakpoint === "phone" || coarse) {
    return MID;
  }
  return HIGH;
}

export function devicePixelRatioFor(tier: Tier): number {
  return Math.min(window.devicePixelRatio || 1, tier.dprCap);
}

const WARMUP_FRAMES = 12;
const PROBE_FRAMES = 30;
const SLOW_FRAME_SECONDS = 1 / 42;

/** Times 30 frames after a short warmup; a slow median means the device cannot carry this tier. */
export function createFrameProbe(): (dt: number) => "slow" | "ok" | null {
  const samples: number[] = [];
  let seen = 0;
  return (dt) => {
    seen += 1;
    if (seen <= WARMUP_FRAMES || samples.length >= PROBE_FRAMES) {
      return null;
    }
    samples.push(dt);
    if (samples.length < PROBE_FRAMES) {
      return null;
    }
    const sorted = [...samples].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] > SLOW_FRAME_SECONDS
      ? "slow"
      : "ok";
  };
}

export function downgrade(tier: Tier): Tier {
  return {
    name: "low",
    dprCap: Math.max(1, tier.dprCap * 0.7),
    antialias: tier.antialias,
    fieldScale: tier.fieldScale * 0.75,
  };
}
