/** Fixed places in the world that route poses fly to. World units are field cells; the word's I is at x = 0. */
export const PLOTS: Array<[number, number, number, number]> = [
  [-13, -80, 8, 5.5],
  [13, -80, 8, 5.5],
  [-13, -96, 8, 5.5],
  [13, -96, 8, 5.5],
];

export const PLOTS_CENTER = { x: 0, z: -88 };

export const FOUNDER_SLAB = { x: -21.5, z: -40.5 };

export const CLEARING = { x: 14, z: 37, radius: 9 };

export const CORRIDOR_END = -175;
