import { clamp01, onScrollFrame } from "./scrollFrame";

export function bindProgress() {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (!bar) {
    return () => {};
  }
  return onScrollFrame({
    measure: () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      return scrollable > 0 ? clamp01(window.scrollY / scrollable) : 0;
    },
    apply: (progress) => {
      bar.style.transform = `scaleX(${progress})`;
    },
  });
}
