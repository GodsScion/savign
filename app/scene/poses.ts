/**
 * One pose per route or home section: where the camera is (a Shot) and what the world shows (WorldState).
 * The hero pose also carries the scroll walk: the word rides up with the page, the camera drops into the lit
 * corridor that leaves the I, and the principles pose then looks straight down on a floor of hairline rules.
 */
import { Vector3 } from "three";
import { framingDistance, orbit, type Shot } from "./camera";
import type { Frame } from "./compose";
import {
  CLEARING,
  CORRIDOR_END,
  FOUNDER_SLAB,
  PLOTS,
  PLOTS_CENTER,
} from "./landmarks";
import type { Layout } from "./breakpoints";
import { easeInOut, lerp, smoothstep } from "./motion";
import type { PoseName, Probe } from "./sections";
import type { Wordmark } from "./wordmark";

export type WorldState = {
  wordLight: number;
  front: number;
  channelLight: number;
  plotLight: number;
  clear: number;
  spot: number;
  flat: number;
  rules: number;
  exposure: number;
  fogScale: number;
  wake: number;
  carve: number;
  /** The corridor markers: lit only during the hero walk. */
  markers: number;
  /** The plaza words the wake uncovers: hero only. */
  words: number;
};

/**
 * pageLock is a vertical lens shift applied without a spring, so the hero word moves with the page exactly and
 * never trails under the h1 during a fast scroll.
 */
export type Pose = {
  name: PoseName;
  shot: Shot;
  world: WorldState;
  pageLock?: number;
};

export type PoseContext = {
  layout: Layout;
  word: Wordmark;
  aspect: number;
  frame: Frame;
  probe: Probe;
  /** Reduced motion: one still frame, so nothing may depend on live DOM positions. */
  still: boolean;
};

export const RULES_HEIGHT = 70;
export const RULES_FOV = 36;

const BASE: WorldState = {
  wordLight: 1,
  front: 400,
  channelLight: 0,
  plotLight: 0,
  clear: 0,
  spot: 0,
  flat: 0,
  rules: 0,
  exposure: 1,
  fogScale: 0.85,
  wake: 0,
  carve: 1,
  markers: 0,
  words: 0,
};

type Anchor = [number, number];

function anchorFor(
  layout: Layout,
  desktop: Anchor,
  tablet: Anchor,
  phone: Anchor,
): Anchor {
  if (layout.breakpoint === "desktop") {
    return desktop;
  }
  return layout.breakpoint === "tablet" ? tablet : phone;
}

/** A shot that frames `width` world units at `screenWidth` of the screen, anchored on screen per breakpoint. */
function framedShot(
  ctx: PoseContext,
  target: Vector3,
  width: number,
  screen: Anchor,
  look: Anchor,
  anchor: Anchor,
): Shot {
  const { layout, aspect } = ctx;
  const screenWidth = layout.breakpoint === "desktop" ? screen[0] : screen[1];
  const distance = framingDistance(
    width,
    screenWidth,
    layout.fov,
    aspect,
    look[1],
  );
  return {
    position: orbit(target, distance, look[0], look[1]),
    target,
    shiftX: anchor[0],
    shiftY: anchor[1],
    fov: layout.fov,
  };
}

function wordCenter(word: Wordmark): Vector3 {
  return new Vector3((word.leftX + word.rightX) / 2, 0, 0);
}

function heroRest(ctx: PoseContext): Shot {
  const { layout, aspect, frame, word } = ctx;
  const target = wordCenter(word);
  const distance = framingDistance(
    layout.wordWidth,
    frame.width,
    layout.fov,
    aspect,
    layout.yaw,
  );
  return {
    position: orbit(target, distance, layout.elevation, layout.yaw),
    target,
    shiftX: frame.cx,
    shiftY: frame.cy,
    fov: layout.fov,
  };
}

function corridorShot(ctx: PoseContext, travel: number, anchor: Anchor): Shot {
  const z = ctx.word.backZ - 3 - travel;
  return {
    position: new Vector3(0, 3.0, z),
    target: new Vector3(0, 0.6, z - 60),
    shiftX: anchor[0],
    shiftY: anchor[1],
    fov: ctx.layout.fov + 16,
  };
}

function blendShots(from: Shot, to: Shot, t: number, lift: number): Shot {
  const position = from.position.clone().lerp(to.position, t);
  position.y += Math.sin(Math.PI * t) * lift;
  return {
    position,
    target: from.target.clone().lerp(to.target, t),
    shiftX: lerp(from.shiftX, to.shiftX, t),
    shiftY: lerp(from.shiftY, to.shiftY, t),
    fov: lerp(from.fov, to.fov, t),
  };
}

function heroPose(ctx: PoseContext): Pose {
  const s = Math.max(0, ctx.probe.scrolled);
  const rest = heroRest(ctx);
  const dive = easeInOut(smoothstep(0.4, 0.95, s));
  const corridor = corridorShot(ctx, Math.max(0, s - 0.45) * 70, [0, 0]);
  const lift = rest.position.distanceTo(rest.target) * 0.1;
  return {
    name: "hero",
    shot: blendShots(rest, corridor, dive, lift),
    pageLock: Math.min(s, 0.42) * 2 * (1 - dive),
    world: {
      ...BASE,
      carve: 1 - smoothstep(0.32, 0.55, s),
      wordLight: 1 - 0.96 * smoothstep(0.28, 0.5, s),
      front: lerp(ctx.word.backZ + 16, CORRIDOR_END, smoothstep(0.1, 0.8, s)),
      channelLight:
        smoothstep(0.06, 0.32, s) * (1 - 0.6 * smoothstep(0.55, 0.9, s)),
      exposure: 1 - 0.3 * smoothstep(0.5, 0.9, s),
      wake: 1 - smoothstep(0.08, 0.3, s),
      markers: smoothstep(0.3, 0.45, s),
      words: 1,
    },
  };
}

/** Straight down on the floor; the engine locks the camera's z to the page so the rules scroll with the text. */
function principlesPose(ctx: PoseContext, unitsPerPx: number): Pose {
  const z = -72 - ctx.probe.scrolled * window.innerHeight * unitsPerPx;
  return {
    name: "principles",
    shot: {
      position: new Vector3(0, RULES_HEIGHT, z),
      target: new Vector3(0, 0, z - 0.02),
      shiftX: 0,
      shiftY: 0,
      fov: RULES_FOV,
    },
    world: {
      ...BASE,
      wordLight: 0,
      front: CORRIDOR_END,
      flat: 1,
      rules: ctx.still ? 0 : 1 - smoothstep(0.3, 0.62, ctx.probe.progress),
      exposure: 0.9,
      fogScale: 0.25,
    },
  };
}

function workPose(ctx: PoseContext, project: boolean): Pose {
  const { layout, probe } = ctx;
  const plot = PLOTS[0];
  const target = project
    ? new Vector3(plot[0], 0, plot[1])
    : new Vector3(PLOTS_CENTER.x, 0, PLOTS_CENTER.z - probe.scrolled * 5);
  const anchor = anchorFor(layout, [0.46, 0.02], [0, -0.42], [0, -0.48]);
  const width = project ? 22 : 48;
  return {
    name: project ? "project" : "work",
    shot: framedShot(
      ctx,
      target,
      width,
      [0.85, 1.5],
      [project ? 52 : 64, -12],
      anchor,
    ),
    world: {
      ...BASE,
      wordLight: 0.12,
      front: CORRIDOR_END,
      channelLight: 0.35,
      plotLight: 1,
      flat: 0.15,
      exposure: 0.82,
      fogScale: 0.6,
    },
  };
}

function founderPose(ctx: PoseContext): Pose {
  const target = new Vector3(FOUNDER_SLAB.x, 4, FOUNDER_SLAB.z);
  const anchor = anchorFor(ctx.layout, [0.45, 0.02], [0.05, -0.38], [0, -0.42]);
  return {
    name: "founder",
    shot: framedShot(ctx, target, 22, [0.62, 1.2], [16, 30], anchor),
    world: {
      ...BASE,
      wordLight: 0.15,
      spot: 1,
      flat: 0.45,
      exposure: 0.85,
      fogScale: 0.7,
    },
  };
}

function aboutPose(ctx: PoseContext): Pose {
  const { word } = ctx;
  const target = new Vector3(
    (word.leftX + word.rightX) / 2,
    0.4,
    word.backZ * 0.3,
  );
  const anchor = anchorFor(ctx.layout, [0.25, -0.4], [0, -0.4], [0, -0.42]);
  return {
    name: "about",
    shot: framedShot(
      ctx,
      target,
      ctx.layout.wordWidth * 0.8,
      [1.1, 1.9],
      [17, -20],
      anchor,
    ),
    world: { ...BASE, wake: 1, exposure: 0.85 },
  };
}

function notesPose(ctx: PoseContext, note: boolean): Pose {
  const anchor = anchorFor(ctx.layout, [0.42, -0.08], [0, -0.3], [0, -0.34]);
  const travel = 26 + Math.max(0, ctx.probe.scrolled) * (note ? 10 : 22);
  return {
    name: note ? "note" : "notes",
    shot: corridorShot(ctx, travel, anchor),
    world: {
      ...BASE,
      wordLight: 0.3,
      front: CORRIDOR_END,
      channelLight: 1,
      exposure: note ? 0.7 : 0.85,
      fogScale: 0.9,
    },
  };
}

function contactPose(ctx: PoseContext): Pose {
  const target = new Vector3(CLEARING.x, 0, CLEARING.z);
  const anchor = anchorFor(ctx.layout, [0.44, -0.24], [0, -0.42], [0, -0.46]);
  return {
    name: "contact",
    shot: framedShot(
      ctx,
      target,
      CLEARING.radius * 2.6,
      [0.6, 1.3],
      [74, 20],
      anchor,
    ),
    world: { ...BASE, wordLight: 0.08, clear: 1, wake: 1, exposure: 0.9 },
  };
}

function quietPose(ctx: PoseContext): Pose {
  const target = new Vector3(0, 0, -30 - ctx.probe.scrolled * 4);
  return {
    name: "quiet",
    shot: framedShot(ctx, target, 70, [1.2, 1.8], [70, 0], [0, 0]),
    world: {
      ...BASE,
      wordLight: 0.3,
      flat: 0.5,
      exposure: 0.55,
      fogScale: 0.5,
    },
  };
}

export function poseFor(ctx: PoseContext, unitsPerPx: number): Pose {
  switch (ctx.probe.pose) {
    case "hero":
      return heroPose(ctx);
    case "principles":
      return principlesPose(ctx, unitsPerPx);
    case "work":
    case "project":
      return workPose(ctx, ctx.probe.pose === "project");
    case "founder":
      return founderPose(ctx);
    case "about":
      return aboutPose(ctx);
    case "notes":
    case "note":
      return notesPose(ctx, ctx.probe.pose === "note");
    case "contact":
      return contactPose(ctx);
    default:
      return quietPose(ctx);
  }
}
