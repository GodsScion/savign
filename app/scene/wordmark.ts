/** The SAVIGN letters as a floor mask in world units. The I sits at x = 0, where the corridor leaves the word. */

export type Rect = { x: number; z: number; w: number; d: number };

export type Wordmark = {
  rect: Rect;
  /** World z of the letters' far (top) and near (baseline) edges. */
  backZ: number;
  frontZ: number;
  /** World x of the word's left and right ends. */
  leftX: number;
  rightX: number;
  sharp: HTMLCanvasElement;
  soft: HTMLCanvasElement;
  isCarved: (x: number, z: number) => boolean;
};

const LETTERS = ["S", "A", "V", "I", "G", "N"];
const FONT_PX = 200;
const FONT = `700 ${FONT_PX}px Georgia, "Times New Roman", serif`;
const TRACKING_EM = 0.1;
const EMBOLDEN_EM = 0.045;
const PAD = 10;
const PX_PER_UNIT = 12;

type Metrics = {
  advances: number[];
  total: number;
  iCenter: number;
  capHeight: number;
};

function measure(ctx: CanvasRenderingContext2D): Metrics {
  ctx.font = FONT;
  const tracking = FONT_PX * TRACKING_EM;
  const advances = LETTERS.map((letter) => ctx.measureText(letter).width);
  const total =
    advances.reduce((sum, width) => sum + width, 0) +
    tracking * (LETTERS.length - 1);
  const beforeI = advances
    .slice(0, 3)
    .reduce((sum, width) => sum + width + tracking, 0);
  return {
    advances,
    total,
    iCenter: beforeI + advances[3] / 2,
    capHeight: ctx.measureText("I").actualBoundingBoxAscent,
  };
}

function drawLetters(ctx: CanvasRenderingContext2D, metrics: Metrics): void {
  const tracking = FONT_PX * TRACKING_EM;
  ctx.font = FONT;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineJoin = "round";
  ctx.lineWidth = FONT_PX * EMBOLDEN_EM;
  let x = 0;
  LETTERS.forEach((letter, index) => {
    ctx.fillText(letter, x, 0);
    ctx.strokeText(letter, x, 0);
    x += metrics.advances[index] + tracking;
  });
}

function softCopy(source: HTMLCanvasElement): HTMLCanvasElement {
  const soft = document.createElement("canvas");
  soft.width = source.width;
  soft.height = source.height;
  const ctx = soft.getContext("2d");
  if (!ctx) {
    return soft;
  }
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = "#fff";
  ctx.shadowOffsetX = soft.width;
  for (const radius of [0.8, 2.2, 5]) {
    ctx.shadowBlur = radius * PX_PER_UNIT;
    ctx.drawImage(source, -soft.width, 0);
  }
  return soft;
}

function alphaSampler(
  canvas: HTMLCanvasElement,
  rect: Rect,
): (x: number, z: number) => boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const data = ctx
    ? ctx.getImageData(0, 0, canvas.width, canvas.height).data
    : new Uint8ClampedArray(4);
  return (x, z) => {
    const px = Math.floor((x - rect.x) * PX_PER_UNIT);
    const py = Math.floor((z - rect.z) * PX_PER_UNIT);
    if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) {
      return false;
    }
    return data[(py * canvas.width + px) * 4 + 3] > 90;
  };
}

/**
 * depthStretch lengthens the letters along z so that, seen from the hero camera's elevation, they keep the
 * proportions of the printed word instead of looking squashed.
 */
export function buildWordmark(
  wordWidth: number,
  depthStretch: number,
): Wordmark {
  const scratch = document.createElement("canvas").getContext("2d");
  if (!scratch) {
    throw new Error("2d canvas unavailable");
  }
  const metrics = measure(scratch);
  const unitsPerPx = wordWidth / metrics.total;
  const depth = metrics.capHeight * unitsPerPx * depthStretch;
  const leftX = -metrics.iCenter * unitsPerPx;
  const rect: Rect = {
    x: Math.floor(leftX - PAD),
    z: Math.floor(-depth / 2 - PAD),
    w: 0,
    d: 0,
  };
  rect.w = Math.ceil(wordWidth + PAD * 2 + (leftX - rect.x - PAD));
  rect.d = Math.ceil(depth + PAD * 2);
  const sharp = document.createElement("canvas");
  sharp.width = rect.w * PX_PER_UNIT;
  sharp.height = rect.d * PX_PER_UNIT;
  const ctx = sharp.getContext("2d");
  if (!ctx) {
    throw new Error("2d canvas unavailable");
  }
  const scale = unitsPerPx * PX_PER_UNIT;
  ctx.translate(
    (leftX - rect.x) * PX_PER_UNIT,
    (depth / 2 - rect.z) * PX_PER_UNIT,
  );
  ctx.scale(scale, scale * depthStretch);
  drawLetters(ctx, metrics);
  return {
    rect,
    backZ: -depth / 2,
    frontZ: depth / 2,
    leftX,
    rightX: leftX + wordWidth,
    sharp,
    soft: softCopy(sharp),
    isCarved: alphaSampler(sharp, rect),
  };
}
