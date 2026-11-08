// Scroll-linked effects on the shared ticker. Each frame where the scroll position or viewport changed, every
// effect measures first and then applies, so layout is read once per frame and never after a style write.
import { onFrame, wakeTicker } from "./ticker";

export type ScrollEffect<T> = {
  measure: () => T;
  apply: (measured: T) => void;
};

type AnyEffect = ScrollEffect<unknown>;

const effects = new Set<AnyEffect>();
let lastKey = "";
let stopFrames: (() => void) | null = null;

function viewKey() {
  return `${window.scrollY}:${window.innerWidth}:${window.innerHeight}`;
}

function runEffects() {
  const key = viewKey();
  if (key === lastKey) {
    return;
  }
  lastKey = key;
  const ordered = [...effects];
  const measured = ordered.map((effect) => effect.measure());
  ordered.forEach((effect, index) => effect.apply(measured[index]));
}

export function onScrollFrame<T>(effect: ScrollEffect<T>) {
  effects.add(effect as AnyEffect);
  lastKey = "";
  if (stopFrames === null) {
    stopFrames = onFrame(runEffects);
  }
  wakeTicker();
  return () => {
    effects.delete(effect as AnyEffect);
    if (effects.size === 0 && stopFrames !== null) {
      stopFrames();
      stopFrames = null;
    }
  };
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function prefersMotion() {
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}
