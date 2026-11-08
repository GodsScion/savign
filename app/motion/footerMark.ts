import { clamp01, onScrollFrame } from "./scrollFrame";

// The footer wordmark is uncovered from its baseline upward as it scrolls into view.
export function bindFooterMark() {
  const mark = document.querySelector<HTMLElement>("[data-footer-mark]");
  if (!mark) {
    return () => {};
  }
  let lastShown = -1;
  return onScrollFrame({
    measure: () => {
      const rect = mark.getBoundingClientRect();
      return clamp01((window.innerHeight - rect.top) / rect.height);
    },
    apply: (shown) => {
      if (shown === lastShown) {
        return;
      }
      lastShown = shown;
      mark.style.clipPath = `inset(${((1 - shown) * 100).toFixed(2)}% 0 0 0)`;
    },
  });
}
