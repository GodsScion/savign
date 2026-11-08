import { clamp01, onScrollFrame } from "./scrollFrame";

// The footer wordmark is uncovered from its baseline upward as it scrolls into view.
export function bindFooterMark() {
  const mark = document.querySelector<HTMLElement>("[data-footer-mark]");
  if (!mark) {
    return () => {};
  }
  return onScrollFrame(() => {
    const rect = mark.getBoundingClientRect();
    const shown = clamp01((window.innerHeight - rect.top) / rect.height);
    mark.style.clipPath = `inset(${((1 - shown) * 100).toFixed(2)}% 0 0 0)`;
  });
}
