/** Builds the field: slabs, floor, sky and the haze over the lit floor, all sharing one set of uniforms. */
import {
  BackSide,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Mesh,
  NoColorSpace,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  Vector4,
  type IUniform,
  type Texture,
} from "three";
import { CLEARING, FOUNDER_SLAB, PLOTS } from "./landmarks";
import type { FieldBounds } from "./breakpoints";
import { hash, smoothstep, valueNoise } from "./motion";
import { slabFragment, slabVertex } from "./shaders/slab.glsl";
import {
  floorFragment,
  hazeFragment,
  skyFragment,
  worldVertex,
} from "./shaders/surface.glsl";
import type { Wake } from "./wake";
import type { Rect, Wordmark } from "./wordmark";

export type Uniforms = Record<string, IUniform>;

export type World = {
  uniforms: Uniforms;
  slabs: Mesh<InstancedBufferGeometry, ShaderMaterial>;
  cellCount: number;
  meshes: Mesh[];
  textures: Texture[];
};

type Cell = {
  x: number;
  z: number;
  height: number;
  carved: number;
  special: number;
};

const GROUND = "#0e0c09";

function canvasTexture(source: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(source);
  texture.flipY = false;
  texture.colorSpace = NoColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

/** Slabs stay low around the letters so the word reads, and melt into the floor at the field's edge. */
function slabHeight(
  x: number,
  z: number,
  word: Wordmark,
  field: FieldBounds,
): number {
  const dx = Math.max(word.leftX - x, x - word.rightX, 0);
  const dz = Math.max(word.backZ - z, z - word.frontZ, 0);
  const plaza = 0.38 + 0.62 * smoothstep(0, 16, Math.hypot(dx, dz));
  const edge = Math.min(
    x - field.minX,
    field.maxX - x,
    z - field.minZ,
    field.maxZ - z,
  );
  const melt = smoothstep(0, 9, edge);
  const cluster = valueNoise(x * 0.07, z * 0.07);
  const towers = Math.pow(hash(x, z), 5) * 4.2;
  const distance = 1 + Math.max(0, -z - 24) / 80;
  return (0.5 + cluster * 2.3 + towers) * distance * plaza * melt + 0.04;
}

function buildCells(word: Wordmark, field: FieldBounds): Cell[] {
  const cells: Cell[] = [];
  for (let z = field.minZ; z < field.maxZ; z += 1) {
    for (let x = field.minX; x < field.maxX; x += 1) {
      const cx = x + 0.5;
      const cz = z + 0.5;
      const special = cx === FOUNDER_SLAB.x && cz === FOUNDER_SLAB.z ? 1 : 0;
      cells.push({
        x: cx,
        z: cz,
        height: slabHeight(cx, cz, word, field),
        carved: word.isCarved(cx, cz) ? 1 : 0,
        special,
      });
    }
  }
  return cells.sort((a, b) => Math.abs(a.x) - Math.abs(b.x));
}

function buildSlabs(
  cells: Cell[],
  uniforms: Uniforms,
): Mesh<InstancedBufferGeometry, ShaderMaterial> {
  const box = new BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const geometry = new InstancedBufferGeometry();
  geometry.index = box.index;
  geometry.setAttribute("position", box.getAttribute("position"));
  geometry.setAttribute("normal", box.getAttribute("normal"));
  const cellData = new Float32Array(cells.length * 4);
  const info = new Float32Array(cells.length * 4);
  cells.forEach((cell, i) => {
    const seed = hash(cell.x * 3.1, cell.z * 1.7);
    cellData.set([cell.x, cell.z, 0.8 + seed * 0.08, cell.height], i * 4);
    info.set(
      [cell.carved, seed, hash(cell.x, cell.z * 2.3) * 0.25, cell.special],
      i * 4,
    );
  });
  geometry.setAttribute("aCell", new InstancedBufferAttribute(cellData, 4));
  geometry.setAttribute("aInfo", new InstancedBufferAttribute(info, 4));
  geometry.instanceCount = cells.length;
  const material = new ShaderMaterial({
    vertexShader: slabVertex,
    fragmentShader: slabFragment,
    uniforms,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function surface(
  geometry: PlaneGeometry | SphereGeometry,
  material: ShaderMaterial,
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function buildFloor(uniforms: Uniforms): Mesh {
  const geometry = new PlaneGeometry(900, 900);
  geometry.rotateX(-Math.PI / 2);
  const material = new ShaderMaterial({
    vertexShader: worldVertex,
    fragmentShader: floorFragment,
    uniforms,
  });
  const floor = surface(geometry, material);
  floor.position.y = -0.001;
  return floor;
}

function buildSky(uniforms: Uniforms): Mesh {
  const geometry = new SphereGeometry(800, 32, 16);
  const material = new ShaderMaterial({
    vertexShader: worldVertex,
    fragmentShader: skyFragment,
    uniforms,
    side: BackSide,
    depthWrite: false,
  });
  return surface(geometry, material);
}

/** Two glowing sheets above the plaza floor: a cheap stand in for light scattering in the air. */
function buildHaze(uniforms: Uniforms, plaza: Rect): Mesh[] {
  return [
    [0.7, 0.08],
    [1.9, 0.045],
  ].map(([height, strength]) => {
    const geometry = new PlaneGeometry(plaza.w, plaza.d);
    geometry.rotateX(-Math.PI / 2);
    const material = new ShaderMaterial({
      vertexShader: worldVertex,
      fragmentShader: hazeFragment,
      uniforms: { ...uniforms, uHazeStrength: { value: strength } },
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const mesh = surface(geometry, material);
    mesh.position.set(plaza.x + plaza.w / 2, height, plaza.z + plaza.d / 2);
    mesh.renderOrder = 2;
    return mesh;
  });
}

function plotUniforms(): Vector4[] {
  return PLOTS.map(([x, z, halfW, halfD]) => new Vector4(x, z, halfW, halfD));
}

function sharedUniforms(
  word: Wordmark,
  plaza: Rect,
  field: FieldBounds,
  wake: Wake,
  words: Texture,
): Uniforms {
  const { rect } = word;
  return {
    uSharp: { value: canvasTexture(word.sharp) },
    uSoft: { value: canvasTexture(word.soft) },
    uWake: { value: wake.texture },
    uWords: { value: words },
    uRect: { value: new Vector4(rect.x, rect.z, rect.w, rect.d) },
    uPlaza: { value: new Vector4(plaza.x, plaza.z, plaza.w, plaza.d) },
    uField: {
      value: new Vector4(
        field.minX,
        field.minZ,
        field.maxX - field.minX,
        field.maxZ - field.minZ,
      ),
    },
    uCarve: { value: 0 },
    uWordLight: { value: 1 },
    uRise: { value: 0 },
    uFront: { value: 400 },
    uChannelStart: { value: 0 },
    uChannelLight: { value: 0 },
    uHalf: { value: 1.9 },
    uPlots: { value: plotUniforms() },
    uPlotLight: { value: 0 },
    uClear: { value: new Vector4(CLEARING.x, CLEARING.z, CLEARING.radius, 0) },
    uSpot: { value: new Vector4(FOUNDER_SLAB.x, FOUNDER_SLAB.z, 0, 0) },
    uFlat: { value: 0 },
    uTime: { value: 0 },
    uPointer: { value: new Vector4(0, 0, 0, 6) },
    uRules: { value: new Vector4(0, 6, 0, 0) },
    uLine: { value: new Color("#38332d") },
    uGround: { value: new Color(GROUND) },
    uHaze: { value: new Color("#2c190a") },
    uSun: { value: new Color("#ffa860") },
    uSunDir: { value: new Vector3(-0.5, 0.22, -0.84) },
    uMari: { value: new Color("#faab35") },
    uEmber: { value: new Color("#c8600e") },
    uFog: { value: 0.01 },
    uExposure: { value: 1 },
  };
}

export const CLEAR_COLOR = GROUND;

export function buildWorld(
  word: Wordmark,
  plaza: Rect,
  field: FieldBounds,
  wake: Wake,
  words: HTMLCanvasElement,
): World {
  const wordsTexture = canvasTexture(words);
  const uniforms = sharedUniforms(word, plaza, field, wake, wordsTexture);
  const cells = buildCells(word, field);
  uniforms.uChannelStart.value = word.backZ + 4;
  const slabs = buildSlabs(cells, uniforms);
  const meshes: Mesh[] = [
    buildSky(uniforms),
    buildFloor(uniforms),
    slabs,
    ...buildHaze(uniforms, plaza),
  ];
  return {
    uniforms,
    slabs,
    cellCount: cells.length,
    meshes,
    textures: [
      uniforms.uSharp.value,
      uniforms.uSoft.value,
      wordsTexture,
      wake.texture,
    ],
  };
}
