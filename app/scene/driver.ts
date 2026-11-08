/**
 * Adapter from the site's one frame loop (app/motion/ticker.ts) to the scene. The ticker passes milliseconds and
 * sleeps once no callback returns true; the scene wants seconds, a frame delta, and to say whether it is busy.
 */
import { onFrame as onSiteFrame, wakeTicker } from "../motion/ticker";

export type FrameCallback = (time: number, dt: number) => boolean;

const MAX_DT = 0.05;

/** Seconds since the previous call, clamped so a wake after a long sleep counts as one ordinary frame. */
export function frameDelta(previous: number | null, now: number): number {
  if (previous === null) {
    return 1 / 60;
  }
  return Math.min(MAX_DT, Math.max(0, now - previous));
}

export function onFrame(callback: FrameCallback): () => void {
  let previous: number | null = null;
  return onSiteFrame((timeMs) => {
    const time = timeMs / 1000;
    const dt = frameDelta(previous, time);
    previous = time;
    return callback(time, dt);
  });
}

/** Asks the shared loop for a frame, for changes that arrive without an input event (a route change). */
export function wakeFrames(): void {
  wakeTicker();
}
