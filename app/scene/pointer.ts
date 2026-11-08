/**
 * Pointer and touch input, read from window. The scene turns it into a point on the floor each frame.
 * A press (mouse or pen) asks for a parting toward the h1; a touch drag leaves the same wake as a mouse.
 */
export type PointerInput = {
  x: number;
  y: number;
  lastMove: number;
  pressed: boolean;
  pressRequest: { x: number; y: number } | null;
  touching: boolean;
  everMoved: boolean;
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
    pressed: false,
    pressRequest: null,
    touching: false,
    everMoved: false,
    dispose: () => undefined,
  };
  const move = (x: number, y: number) => {
    input.x = x;
    input.y = y;
    input.lastMove = now();
    input.everMoved = true;
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
      input.pressed = true;
      input.pressRequest = { x: event.clientX, y: event.clientY };
      move(event.clientX, event.clientY);
    }
  };
  const onPointerUp = () => {
    input.pressed = false;
  };
  const onTouch = (event: TouchEvent) => {
    const touch = event.touches[0];
    input.touching = Boolean(touch);
    if (touch) {
      move(touch.clientX, touch.clientY);
    }
  };
  const onLeave = () => {
    input.lastMove = -100;
  };
  const passive = { passive: true };
  window.addEventListener("pointermove", onPointerMove, passive);
  window.addEventListener("pointerdown", onPointerDown, passive);
  window.addEventListener("pointerup", onPointerUp, passive);
  window.addEventListener("touchstart", onTouch, passive);
  window.addEventListener("touchmove", onTouch, passive);
  window.addEventListener("touchend", onTouch, passive);
  document.documentElement.addEventListener("mouseleave", onLeave);
  input.dispose = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("touchstart", onTouch);
    window.removeEventListener("touchmove", onTouch);
    window.removeEventListener("touchend", onTouch);
    document.documentElement.removeEventListener("mouseleave", onLeave);
  };
  return input;
}

export function secondsSinceMove(input: PointerInput): number {
  return now() - input.lastMove;
}
