import type Lenis from "lenis";
import { onFrame } from "./ticker";

// Lenis eases by the time since its last frame. After the shared loop sleeps, that gap is seconds long and
// the first step would jump straight to the end, so a long gap counts as a single frame.
const MAX_FRAME_GAP_MS = 100;
const ONE_FRAME_MS = 1000 / 60;

let lenis: Lenis | null = null;
let stopFrames: (() => void) | null = null;
// Bumped by every start and stop, so a start whose import resolves after a stop does nothing.
let generation = 0;

function wantsSmoothScroll() {
  return window.matchMedia(
    "(pointer: fine) and (prefers-reduced-motion: no-preference)",
  ).matches;
}

function samePageTarget(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.("a[href*='#']");
  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }
  const url = new URL(link.href);
  if (url.pathname !== window.location.pathname || url.hash.length < 2) {
    return null;
  }
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  return target ? { target, hash: url.hash } : null;
}

// Same page links glide with Lenis instead of jumping, then keep what a native jump gives: the hash in the
// address bar and the focus start point at the target, so the skip link still works for keyboard users.
function isPlainClick(event: MouseEvent) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

function glideToAnchor(event: MouseEvent) {
  if (!isPlainClick(event)) {
    return;
  }
  const found = lenis ? samePageTarget(event) : null;
  if (!lenis || !found) {
    return;
  }
  event.preventDefault();
  window.history.pushState(null, "", found.hash);
  if (!found.target.hasAttribute("tabindex")) {
    found.target.setAttribute("tabindex", "-1");
  }
  found.target.focus({ preventScroll: true });
  // Measure from the real scroll position: after the shared loop has slept, Lenis's own record of it can lag.
  const padding =
    parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
    0;
  const top =
    found.target.getBoundingClientRect().top + window.scrollY - padding;
  lenis.scrollTo(window.scrollY, { immediate: true });
  lenis.scrollTo(top);
}

export async function startSmoothScroll() {
  if (lenis || !wantsSmoothScroll()) {
    return;
  }
  const mine = ++generation;
  const { default: LenisClass } = await import("lenis");
  if (mine !== generation || lenis) {
    return;
  }
  const instance = new LenisClass({
    lerp: 0.1,
    autoRaf: false,
    stopInertiaOnNavigate: true,
  });
  lenis = instance;
  document.addEventListener("click", glideToAnchor);
  window.addEventListener("popstate", settleSmoothScroll);
  stopFrames = onFrame((time) => {
    if (time - instance.time > MAX_FRAME_GAP_MS) {
      instance.time = time - ONE_FRAME_MS;
    }
    instance.raf(time);
    return Boolean(instance.isScrolling);
  });
}

export function stopSmoothScroll() {
  generation++;
  document.removeEventListener("click", glideToAnchor);
  window.removeEventListener("popstate", settleSmoothScroll);
  stopFrames?.();
  stopFrames = null;
  lenis?.destroy();
  lenis = null;
}

// Drops any glide or wheel inertia so a route change or Back lands where the browser puts it, not where the
// old page's momentum was heading. A stopped Lenis (menu open) is left stopped.
export function settleSmoothScroll() {
  if (!lenis || lenis.isStopped) {
    return;
  }
  lenis.stop();
  lenis.start();
}

export function pauseSmoothScroll() {
  lenis?.stop();
}

export function resumeSmoothScroll() {
  lenis?.start();
}
