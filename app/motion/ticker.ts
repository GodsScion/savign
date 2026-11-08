// The one requestAnimationFrame loop for the whole site. Lenis, every motion module and (at merge) the scene
// run from it. A callback returns true while it is still moving; the loop sleeps after a frame where every
// callback returned false and no input arrived for INPUT_GRACE_MS; input events (wheel, touch, keys, scroll,
// pointer, click, resize) wake it again. The grace window covers work that starts a frame after its input,
// such as a Lenis anchor scroll, which otherwise stalls part way when the loop sleeps between the two.
export type FrameCallback = (time: number) => boolean | void;

const callbacks = new Set<FrameCallback>();
const WAKE_EVENTS = [
  "wheel",
  "touchstart",
  "touchmove",
  "keydown",
  "scroll",
  "pointermove",
  "pointerdown",
  "click",
  "resize",
] as const;
const INPUT_GRACE_MS = 600;
let frame = 0;
let awakeUntil = 0;

function runFrame(time: number) {
  frame = 0;
  let moving = false;
  for (const callback of [...callbacks]) {
    if (callback(time) === true) {
      moving = true;
    }
  }
  if (moving || time < awakeUntil) {
    wakeTicker();
  }
}

function onInput() {
  awakeUntil = performance.now() + INPUT_GRACE_MS;
  wakeTicker();
}

export function wakeTicker() {
  if (frame === 0 && callbacks.size > 0) {
    frame = requestAnimationFrame(runFrame);
  }
}

function listen() {
  for (const type of WAKE_EVENTS) {
    window.addEventListener(type, onInput, { passive: true });
  }
}

function unlisten() {
  for (const type of WAKE_EVENTS) {
    window.removeEventListener(type, onInput);
  }
  cancelAnimationFrame(frame);
  frame = 0;
}

export function onFrame(callback: FrameCallback) {
  callbacks.add(callback);
  if (callbacks.size === 1) {
    listen();
  }
  wakeTicker();
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0) {
      unlisten();
    }
  };
}
