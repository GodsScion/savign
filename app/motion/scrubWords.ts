import { clamp01, onScrollFrame } from "./scrollFrame";

// Unlit words keep 3:1 contrast on the ground (large text), so the scrub never fails WCAG.
const UNLIT = "var(--scrub-unlit)";

type Line = {
  element: HTMLElement;
  words: HTMLElement[];
  lastProgress: number;
};

function splitWords(element: HTMLElement) {
  if (element.dataset.split !== "true") {
    const words = (element.textContent ?? "").trim().split(/\s+/);
    element.replaceChildren(
      ...words.flatMap((word, index) => {
        const span = document.createElement("span");
        span.className = "scrub-word";
        span.textContent = word;
        return index === 0 ? [span] : [document.createTextNode(" "), span];
      }),
    );
    element.dataset.split = "true";
  }
  return [...element.querySelectorAll<HTMLElement>(".scrub-word")];
}

// Progress runs from the line entering at 88% of the viewport to it reaching 45%.
function lineProgress(top: number, height: number) {
  return clamp01((height * 0.88 - top) / (height * 0.43));
}

function brighten(words: HTMLElement[], progress: number) {
  words.forEach((word, index) => {
    const lit = Math.round(clamp01(progress * words.length - index) * 100);
    word.style.color = `color-mix(in oklch, var(--ink) ${lit}%, ${UNLIT})`;
  });
}

export function bindScrubWords() {
  const lines: Line[] = [
    ...document.querySelectorAll<HTMLElement>("[data-scrub-words]"),
  ].map((element) => ({
    element,
    words: splitWords(element),
    lastProgress: -1,
  }));
  if (lines.length === 0) {
    return () => {};
  }
  return onScrollFrame({
    measure: () => {
      const height = window.innerHeight;
      return lines.map((line) =>
        lineProgress(line.element.getBoundingClientRect().top, height),
      );
    },
    apply: (progresses) => {
      lines.forEach((line, index) => {
        const progress = progresses[index];
        if (progress !== line.lastProgress) {
          line.lastProgress = progress;
          brighten(line.words, progress);
        }
      });
    },
  });
}
