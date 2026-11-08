import type { Breakpoint } from "./breakpoints";

export type Tier = {
  name: "high" | "mid" | "low";
  dprCap: number;
  antialias: boolean;
  fieldScale: number;
};

export type DeviceHints = {
  cores: number;
  memory: number;
  coarse: boolean;
  breakpoint: Breakpoint;
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

/** The tier decision on its own, so it can be tested without a browser. */
export function tierFor(hints: DeviceHints): Tier {
  if (hints.cores <= 4 || hints.memory <= 4) {
    return LOW;
  }
  if (hints.breakpoint === "phone" || hints.coarse) {
    return MID;
  }
  return HIGH;
}

export function detectTier(breakpoint: Breakpoint): Tier {
  const nav = navigator as NavigatorWithMemory;
  return tierFor({
    cores: nav.hardwareConcurrency ?? 4,
    memory: nav.deviceMemory ?? 8,
    coarse: window.matchMedia("(pointer: coarse)").matches,
    breakpoint,
  });
}

export function devicePixelRatioFor(tier: Tier): number {
  return Math.min(window.devicePixelRatio || 1, tier.dprCap);
}

const WARMUP_FRAMES = 12;
const PROBE_FRAMES = 30;
/** CPU time one frame may take (pointer, wake, uniforms, draw submission) before the tier is too heavy. */
export const SLOW_WORK_SECONDS = 0.011;

export type FrameProbe = (workSeconds: number) => "slow" | "ok" | null;

/**
 * Times the work of 30 busy frames after a short warmup and answers once. It measures how long the scene's own
 * frame takes, never the gap between frames, so a display or power mode that delivers 30 frames a second is not
 * mistaken for a slow device. A probe answers once only, so one probe can cause at most one downgrade.
 */
export function createFrameProbe(): FrameProbe {
  const samples: number[] = [];
  let seen = 0;
  return (workSeconds) => {
    seen += 1;
    if (seen <= WARMUP_FRAMES || samples.length >= PROBE_FRAMES) {
      return null;
    }
    samples.push(workSeconds);
    if (samples.length < PROBE_FRAMES) {
      return null;
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return median > SLOW_WORK_SECONDS ? "slow" : "ok";
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
