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
/** Time one frame may cost (the scene's CPU work, or its GPU time where measurable) before the tier is too heavy. */
export const SLOW_WORK_SECONDS = 0.011;
/** Without a GPU timer: frames that stretch this much past the warmup cadence mean the GPU cannot keep up. */
export const SLOW_INTERVAL_RATIO = 1.5;

/** One busy frame: CPU work in seconds, GPU time when a timer answered (else null), and the gap since the last frame. */
export type FrameSample = {
  work: number;
  gpu: number | null;
  interval: number;
};

export type FrameProbe = (sample: FrameSample) => "slow" | "ok" | null;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * q)];
}

/**
 * Times 30 busy frames after a 12 frame warmup and answers once, so one probe causes at most one downgrade.
 * The cost of a frame is its CPU work or, where the browser has a GPU timer, its GPU time, whichever is larger.
 * With no GPU timer, frames that stretch past 1.5 times the warmup's own cadence stand in for GPU load; a display
 * that runs at a steady 30 Hz keeps its cadence and is not called slow.
 */
export function createFrameProbe(): FrameProbe {
  const warmup: number[] = [];
  const costs: number[] = [];
  const intervals: number[] = [];
  let sawGpu = false;
  let answered = false;
  return (sample) => {
    if (answered) {
      return null;
    }
    if (warmup.length < WARMUP_FRAMES) {
      warmup.push(sample.interval);
      return null;
    }
    sawGpu ||= sample.gpu !== null;
    costs.push(Math.max(sample.work, sample.gpu ?? 0));
    intervals.push(sample.interval);
    if (costs.length < PROBE_FRAMES) {
      return null;
    }
    answered = true;
    const heavy = median(costs) > SLOW_WORK_SECONDS;
    const stretched =
      !sawGpu &&
      median(intervals) > quantile(warmup, 0.25) * SLOW_INTERVAL_RATIO;
    return heavy || stretched ? "slow" : "ok";
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
