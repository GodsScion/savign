// One rAF-batched scroll and resize loop that every scroll-linked effect shares.
type Listener = () => void;

const listeners = new Set<Listener>();
let frame = 0;

function runListeners() {
  frame = 0;
  for (const listener of listeners) {
    listener();
  }
}

function schedule() {
  if (frame === 0) {
    frame = requestAnimationFrame(runListeners);
  }
}

function attach() {
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function detach() {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  cancelAnimationFrame(frame);
  frame = 0;
}

export function onScrollFrame(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    attach();
  }
  schedule();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      detach();
    }
  };
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function prefersMotion() {
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
}
