/**
 * Load choreography, about 1.8 s: the field rises flat to tall in a wave from the left (0 to 1.2 s), then the
 * letters carve down and light (0.9 to 1.8 s). Any input speeds the rest up four times; nothing waits on it.
 */
import { clamp01, easeInOut } from "./motion";

export type Intro = {
  time: number;
  speed: number;
  rise: number;
  carve: number;
  done: boolean;
};

const RISE_END = 1.2;
const CARVE_START = 0.9;
const CARVE_END = 1.8;

export function createIntro(skip: boolean): Intro {
  return {
    time: skip ? CARVE_END : 0,
    speed: 1,
    rise: skip ? 1 : 0,
    carve: skip ? 1 : 0,
    done: skip,
  };
}

export function hurryIntro(intro: Intro): void {
  intro.speed = 4;
}

export function stepIntro(intro: Intro, dt: number): void {
  if (intro.done) {
    return;
  }
  intro.time += dt * intro.speed;
  intro.rise = easeInOut(clamp01(intro.time / RISE_END));
  intro.carve = easeInOut(
    clamp01((intro.time - CARVE_START) / (CARVE_END - CARVE_START)),
  );
  intro.done = intro.time >= CARVE_END;
}
