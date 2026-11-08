import type Lenis from "lenis";

let lenis: Lenis | null = null;

function wantsSmoothScroll() {
  return window.matchMedia(
    "(pointer: fine) and (prefers-reduced-motion: no-preference)",
  ).matches;
}

export async function startSmoothScroll() {
  if (lenis || !wantsSmoothScroll()) {
    return;
  }
  const { default: LenisClass } = await import("lenis");
  lenis = new LenisClass({
    lerp: 0.1,
    anchors: { offset: -88 },
    autoRaf: true,
  });
}

export function stopSmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

export function pauseSmoothScroll() {
  lenis?.stop();
}

export function resumeSmoothScroll() {
  lenis?.start();
}
