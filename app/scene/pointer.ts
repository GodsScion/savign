/**
 * Pointer and touch input, read from window. The scene turns it into a point on the floor each frame.
 * A press (mouse or pen) asks for a parting toward the h1; a touch drag leaves the same wake as a mouse.
 */
export type PointerInput = {
  x: number;
  y: number;
  lastMove: number;
  lastTouchEnd: number;
  pressRequest: { x: number; y: number } | null;
  dispose: () => void;
};

function now(): number {
  return performance.now() / 1000;
}

export function trackPointer(onInput: () => void): PointerInput {
  const input: PointerInput = {
    x: 0,
    y: 0,
    lastMove: -100,
    lastTouchEnd: -100,
    pressRequest: null,
    dispose: () => undefined,
  };
  const move = (x: number, y: number) => {
    input.x = x;
    input.y = y;
    input.lastMove = now();
    onInput();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      move(event.clientX, event.clientY);
    }
  };
  const onPointerDown = (event: PointerEvent) => {
    onInput();
    if (event.pointerType !== "touch" && event.button === 0) {
      input.pressRequest = { x: event.clientX, y: event.clientY };
      move(event.clientX, event.clientY);
    }
  };
  const onTouch = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) {
      move(touch.clientX, touch.clientY);
      return;
    }
    input.lastTouchEnd = now();
    onInput();
  };
  const onLeave = () => {
    input.lastMove = -100;
  };
  const passive = { passive: true };
  window.addEventListener("pointermove", onPointerMove, passive);
  window.addEventListener("pointerdown", onPointerDown, passive);
  window.addEventListener("touchstart", onTouch, passive);
  window.addEventListener("touchmove", onTouch, passive);
  window.addEventListener("touchend", onTouch, passive);
  document.documentElement.addEventListener("mouseleave", onLeave);
  input.dispose = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("touchstart", onTouch);
    window.removeEventListener("touchmove", onTouch);
    window.removeEventListener("touchend", onTouch);
    document.documentElement.removeEventListener("mouseleave", onLeave);
  };
  return input;
}

export function secondsSinceMove(input: PointerInput, time: number): number {
  return time - input.lastMove;
}

export const WANDER_SECONDS = 8;

/** The idle wanderer runs on touch screens only, for 8 s after the scene starts and after each touch ends. */
export function wandererOn(
  time: number,
  startedAt: number,
  lastTouchEnd: number,
  coarse: boolean,
): boolean {
  if (!coarse) {
    return false;
  }
  return (
    time - startedAt < WANDER_SECONDS || time - lastTouchEnd < WANDER_SECONDS
  );
}
