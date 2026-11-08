import { onScrollFrame, prefersMotion } from "./scrollFrame";

const SOLID_AFTER = 40;
const HIDE_AFTER = 240;
const DIRECTION_SLACK = 6;

export function bindHeader() {
  const header = document.querySelector<HTMLElement>("[data-header]");
  if (!header) {
    return () => {};
  }
  const mayHide = prefersMotion();
  let lastY = window.scrollY;
  return onScrollFrame(() => {
    const y = window.scrollY;
    header.classList.toggle("is-solid", y > SOLID_AFTER);
    if (Math.abs(y - lastY) < DIRECTION_SLACK) {
      return;
    }
    const goingDown = y > lastY;
    header.classList.toggle(
      "is-hidden",
      mayHide && goingDown && y > HIDE_AFTER,
    );
    lastY = y;
  });
}
