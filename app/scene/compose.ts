/**
 * Where the hero wordmark goes on screen: in the largest free area the copy leaves, so the letters never sit
 * under the h1. Reads the hero copy block from the DOM once per layout, in page coordinates.
 */
export type Frame = { cx: number; cy: number; width: number };

export type CopyBox = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const HEADER = 72;

export function readHeroCopy(): CopyBox | null {
  const hero = document.querySelector('[data-scene="hero"]');
  const heading =
    hero?.querySelector("h1") ?? document.querySelector("main h1");
  if (!heading) {
    return null;
  }
  const box = heading.getBoundingClientRect();
  const copy = {
    top: box.top,
    bottom: box.bottom,
    left: box.left,
    right: box.right,
  };
  let sibling = heading.nextElementSibling;
  while (sibling) {
    const rect = sibling.getBoundingClientRect();
    if (rect.height > 0 && rect.top - copy.bottom < 160) {
      copy.bottom = Math.max(copy.bottom, rect.bottom);
      copy.right = Math.max(copy.right, rect.right);
    }
    sibling = sibling.nextElementSibling;
  }
  return {
    top: copy.top + window.scrollY,
    bottom: copy.bottom + window.scrollY,
    left: copy.left,
    right: copy.right,
  };
}

function toFrame(
  centerX: number,
  centerY: number,
  widthPx: number,
  vw: number,
  vh: number,
): Frame {
  return {
    cx: (centerX / vw) * 2 - 1,
    cy: 1 - (centerY / vh) * 2,
    width: (widthPx / vw) * 2,
  };
}

/**
 * aspect is the word's on-screen height over width. Picks the bigger of: above the copy, right of the copy,
 * below the copy. Above the copy, the word sits low, close to the h1, so no dead band opens between them.
 */
export function heroFrame(
  copy: CopyBox | null,
  vw: number,
  vh: number,
  aspect: number,
): Frame {
  const margin = vw < 600 ? 16 : 48;
  if (!copy) {
    return toFrame(vw / 2, vh * 0.32, vw * 0.8, vw, vh);
  }
  const aboveHeight = copy.top - HEADER - 28;
  const aboveWidth = Math.min(vw - margin * 2, (aboveHeight * 0.8) / aspect);
  const rightWidth = Math.min(
    vw - copy.right - margin * 2,
    ((vh - HEADER - margin) * 0.7) / aspect,
  );
  const belowHeight = vh - copy.bottom - margin;
  const belowWidth = Math.min(vw - margin * 2, (belowHeight * 0.8) / aspect);
  const best = Math.max(aboveWidth, rightWidth, belowWidth);
  const landscape = vw > vh * 1.15;
  if (best === aboveWidth) {
    const width = Math.min(aboveWidth, vw * (landscape ? 0.54 : 0.92));
    const wordHeight = width * aspect;
    const nearCopy = copy.top - 48 - wordHeight * 1.1;
    const centerY = Math.max(
      HEADER + wordHeight,
      HEADER +
        aboveHeight * 0.45 +
        (nearCopy - HEADER - aboveHeight * 0.45) * 0.75,
    );
    const centerX = landscape ? vw - margin * 2 - width * 0.56 : vw / 2;
    return toFrame(centerX, centerY, width, vw, vh);
  }
  if (best === rightWidth) {
    return toFrame(
      copy.right + margin + rightWidth / 2,
      HEADER + (vh - HEADER) * 0.4,
      rightWidth,
      vw,
      vh,
    );
  }
  return toFrame(
    vw / 2,
    copy.bottom + margin + belowHeight / 2,
    belowWidth,
    vw,
    vh,
  );
}
