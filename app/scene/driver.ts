/**
 * The scene's frame driver. Same signature as the site's shared ticker in app/motion; at merge this file becomes
 * a one line re-export of that ticker, so the site keeps a single requestAnimationFrame loop.
 */
export type FrameCallback = (time: number, dt: number) => void;

export function onFrame(callback: FrameCallback): () => void {
  let last = performance.now();
  let handle = requestAnimationFrame(function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    callback(now / 1000, dt);
    handle = requestAnimationFrame(step);
  });
  return () => {
    cancelAnimationFrame(handle);
  };
}
