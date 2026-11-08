import { clamp01, onScrollFrame } from "./scrollFrame";

export function bindProgress() {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (!bar) {
    return () => {};
  }
  return onScrollFrame(() => {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp01(window.scrollY / scrollable) : 0;
    bar.style.transform = `scaleX(${progress})`;
  });
}
