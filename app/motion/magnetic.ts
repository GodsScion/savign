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

function pullToward(element: HTMLElement, x: number, y: number) {
  const rect = element.getBoundingClientRect();
  if (!isNear(rect, x, y)) {
    element.style.transform = "";
    return;
  }
  const dx = (x - (rect.left + rect.width / 2)) * PULL;
  const dy = (y - (rect.top + rect.height / 2)) * PULL;
  element.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}

export function bindMagnetic() {
  const elements = [
    ...document.querySelectorAll<HTMLElement>("[data-magnetic]"),
  ];
  if (elements.length === 0 || !isFinePointer()) {
    return () => {};
  }
  const onMove = (event: PointerEvent) => {
    for (const element of elements) {
      pullToward(element, event.clientX, event.clientY);
    }
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
  };
}
