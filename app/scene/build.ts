/** Builds, warms up and disposes the world for one layout and quality tier. */
import { MathUtils, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { scaleField, type Layout } from "./breakpoints";
import type { Tier } from "./quality";
import { createWake, type Wake } from "./wake";
import { buildWordmark, type Rect, type Wordmark } from "./wordmark";
import {
  drawBuriedWords,
  drawCorridorMarkers,
  markerPads,
  markerRect,
} from "./words";
import { buildWorld, type World } from "./world";

export type Build = {
  layout: Layout;
  word: Wordmark;
  plaza: Rect;
  wake: Wake;
  world: World;
  scene: Scene;
};

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** The plaza is the floor around the letters that the pointer wake can clear. */
function plazaAround(word: Wordmark): Rect {
  const x = Math.floor(word.leftX) - 20;
  const z = Math.floor(word.backZ) - 22;
  return {
    x,
    z,
    w: Math.ceil(word.rightX) + 20 - x,
    d: Math.ceil(word.frontZ) + 30 - z,
  };
}

export function buildFor(layout: Layout, tier: Tier): Build {
  const stretch = 1.15 / Math.sin(MathUtils.degToRad(layout.elevation));
  const word = buildWordmark(layout.wordWidth, stretch);
  const plaza = plazaAround(word);
  const wake = createWake(plaza);
  const pads = markerPads(word.backZ);
  const rect = markerRect(pads);
  const markers = { pads, rect, canvas: drawCorridorMarkers(pads, rect) };
  const world = buildWorld(
    word,
    plaza,
    scaleField(layout.field, tier.fieldScale),
    wake,
    drawBuriedWords(plaza),
    markers,
  );
  const scene = new Scene();
  scene.add(...world.meshes);
  return { layout, word, plaza, wake, world, scene };
}

/** Builds with `make`; if that throws, the renderer (and its GL context) is released before the error goes on. */
export function buildOrDispose<T>(
  renderer: { dispose: () => void },
  make: () => T,
): T {
  try {
    return make();
  } catch (error) {
    renderer.dispose();
    throw error;
  }
}

/** Uploads textures and compiles each material in its own task, so no single task blocks input for long. */
export async function warmUp(
  renderer: WebGLRenderer,
  build: Build,
  camera: PerspectiveCamera,
): Promise<void> {
  for (const texture of build.world.textures) {
    renderer.initTexture(texture);
    await yieldToMain();
  }
  for (const mesh of build.world.meshes) {
    await renderer.compileAsync(mesh, camera, build.scene);
    await yieldToMain();
  }
}

export function disposeBuild(build: Build): void {
  for (const mesh of build.world.meshes) {
    mesh.geometry.dispose();
    const material = mesh.material;
    if (!Array.isArray(material)) {
      material.dispose();
    }
  }
  build.world.textures.forEach((texture) => texture.dispose());
}

/** The word's on-screen height over its width, seen from the hero camera. */
export function wordScreenAspect(build: Build): number {
  const { word, layout } = build;
  const depth = word.frontZ - word.backZ;
  const elevation = MathUtils.degToRad(layout.elevation);
  return (
    (depth * Math.sin(elevation)) /
    (layout.wordWidth * Math.cos(MathUtils.degToRad(layout.yaw)))
  );
}
