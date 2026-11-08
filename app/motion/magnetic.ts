import { onFrame } from "./ticker";

const REACH = 12;
const PULL = 0.2;

function isFinePointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function isNear(rect: DOMRect, x: number, y: number) {
  return (
    x > rect.left - REACH &&
    x < rect.right + REACH &&
    y > rect.top - REACH &&
    y < rect.bottom + REACH
  );
}

function pullFor(rect: DOMRect, x: number, y: number) {
  if (!isNear(rect, x, y)) {
    return "";
  }
  const dx = (x - (rect.left + rect.width / 2)) * PULL;
  const dy = (y - (rect.top + rect.height / 2)) * PULL;
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}

// The contact email leans toward a pointer within 12px; the pointer is sampled once per ticker frame.
export function bindMagnetic() {
  const elements = [
    ...document.querySelectorAll<HTMLElement>("[data-magnetic]"),
  ];
  if (elements.length === 0 || !isFinePointer()) {
    return () => {};
  }
  let pointer: { x: number; y: number } | null = null;
  const onMove = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY };
  };
  const stopFrames = onFrame(() => {
    if (pointer === null) {
      return;
    }
    const { x, y } = pointer;
    pointer = null;
    const rects = elements.map((element) => element.getBoundingClientRect());
    elements.forEach((element, index) => {
      element.style.transform = pullFor(rects[index], x, y);
    });
  });
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    stopFrames();
  };
}
