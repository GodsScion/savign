/** Five words from the principles, written into the floor of the plaza. Only cleared floor shows them. */
import type { Rect } from "./wordmark";

const WORDS = ["measure", "the cause", "local", "readable", "every run"];
const PX_PER_UNIT = 10;
const WORD_HEIGHT = 3.2;

/** Spots around the wordmark, as fractions of the plaza, chosen so no word lands on the letters. */
const SPOTS: Array<[number, number]> = [
  [0.2, 0.78],
  [0.74, 0.84],
  [0.14, 0.2],
  [0.86, 0.22],
  [0.47, 0.93],
];

export function drawBuriedWords(plaza: Rect): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = plaza.w * PX_PER_UNIT;
  canvas.height = plaza.d * PX_PER_UNIT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 400 ${WORD_HEIGHT * PX_PER_UNIT * 1.35}px Georgia, "Times New Roman", serif`;
  WORDS.forEach((word, index) => {
    const [u, v] = SPOTS[index];
    ctx.fillText(word, u * canvas.width, v * canvas.height);
  });
  return canvas;
}
