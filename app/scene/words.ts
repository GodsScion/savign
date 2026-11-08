/**
 * The five words from the principles, written into the floor twice: buried in the plaza around the wordmark (only
 * floor the pointer wake clears shows them), and as lit markers on pads beside the corridor, passed on the walk.
 */
import type { Rect } from "./wordmark";

export const PRINCIPLE_WORDS = [
  "measure",
  "the cause",
  "local",
  "readable",
  "every run",
];

const PLAZA_PX_PER_UNIT = 10;
const PLAZA_WORD_HEIGHT = 3.2;
const SERIF = `Georgia, "Times New Roman", serif`;

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
  canvas.width = plaza.w * PLAZA_PX_PER_UNIT;
  canvas.height = plaza.d * PLAZA_PX_PER_UNIT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `italic 400 ${PLAZA_WORD_HEIGHT * PLAZA_PX_PER_UNIT * 1.35}px ${SERIF}`;
  PRINCIPLE_WORDS.forEach((word, index) => {
    const [u, v] = SPOTS[index];
    ctx.fillText(word, u * canvas.width, v * canvas.height);
  });
  return canvas;
}

export type MarkerPad = {
  word: string;
  x: number;
  z: number;
  halfW: number;
  halfD: number;
};

const PAD_HALF_W = 6.5;
const PAD_HALF_D = 3.5;
const PAD_GAP_X = 2.6;
const FIRST_PAD = 10;
const PAD_SPACING = 10;

/**
 * Pads beside the corridor, alternating left and right, from just behind the letters down the walk. The inner
 * edge of each pad keeps clear of the corridor itself (half width 1.9).
 */
export function markerPads(backZ: number): MarkerPad[] {
  return PRINCIPLE_WORDS.map((word, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    return {
      word,
      x: side * (PAD_GAP_X + PAD_HALF_W),
      z: backZ - FIRST_PAD - index * PAD_SPACING,
      halfW: PAD_HALF_W,
      halfD: PAD_HALF_D,
    };
  });
}

export function markerRect(pads: MarkerPad[]): Rect {
  const zs = pads.map((pad) => pad.z);
  const minZ = Math.floor(Math.min(...zs) - PAD_HALF_D - 1);
  const maxZ = Math.ceil(Math.max(...zs) + PAD_HALF_D + 1);
  const halfX = Math.ceil(PAD_GAP_X + PAD_HALF_W * 2 + 1);
  return { x: -halfX, z: minZ, w: halfX * 2, d: maxZ - minZ };
}

const MARKER_PX_PER_UNIT = 12;

/**
 * Each word is drawn upright for a camera looking down the corridor (toward negative z), stretched along z so it
 * still reads at the walk's low angle.
 */
export function drawCorridorMarkers(
  pads: MarkerPad[],
  rect: Rect,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = rect.w * MARKER_PX_PER_UNIT;
  canvas.height = rect.d * MARKER_PX_PER_UNIT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const pad of pads) {
    const fontPx = MARKER_PX_PER_UNIT * 2.2;
    ctx.font = `italic 400 ${fontPx}px ${SERIF}`;
    const width = ctx.measureText(pad.word).width;
    const fit = Math.min(
      1,
      ((pad.halfW * 2 - 1.4) * MARKER_PX_PER_UNIT) / width,
    );
    ctx.save();
    ctx.translate(
      (pad.x - rect.x) * MARKER_PX_PER_UNIT,
      (pad.z - rect.z) * MARKER_PX_PER_UNIT,
    );
    ctx.scale(fit, 2.6);
    ctx.fillText(pad.word, 0, 0);
    ctx.restore();
  }
  return canvas;
}
