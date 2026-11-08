import { clamp01, onScrollFrame } from "./scrollFrame";

// Unlit words keep 3:1 contrast on the ground (large text), so the scrub never fails WCAG.
const UNLIT = "var(--scrub-unlit)";

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
function lineProgress(element: HTMLElement) {
  const top = element.getBoundingClientRect().top;
  const height = window.innerHeight;
  return clamp01((height * 0.88 - top) / (height * 0.43));
}

function brighten(words: HTMLElement[], progress: number) {
  words.forEach((word, index) => {
    const lit = Math.round(clamp01(progress * words.length - index) * 100);
    word.style.color = `color-mix(in oklch, var(--ink) ${lit}%, ${UNLIT})`;
  });
}

export function bindScrubWords() {
  const lines = [
    ...document.querySelectorAll<HTMLElement>("[data-scrub-words]"),
  ];
  const split = lines.map((line) => ({ line, words: splitWords(line) }));
  return onScrollFrame(() => {
    for (const { line, words } of split) {
      brighten(words, lineProgress(line));
    }
  });
}
