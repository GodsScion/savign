import { fieldLight, shading } from "./field.glsl";

export const slabVertex = /* glsl */ `
  attribute vec4 aCell;
  attribute vec4 aInfo;
  ${fieldLight}
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vBox;
  varying vec3 vSize;
  varying float vSeed;
  varying float vSpecial;

  void main() {
    vec2 cell = aCell.xy;
    float special = aInfo.w * uSpot.z;
    float height = aCell.w * riseAt(cell.x) * (1.0 - uFlat * 0.97) + special * 7.5;
    float carved = aInfo.x * revealAt(cell.x, aInfo.z);
    float open = max(max(carved, channelOpen(cell)), max(plotOpen(cell), clearOpen(cell)));
    open = max(open, wakeSink(cell)) * (1.0 - aInfo.w * step(0.01, uSpot.z));
    vec3 size = vec3(aCell.z, height, aCell.z * (0.97 + aInfo.y * 0.06));
    vec3 world = vec3(cell.x, 0.0, cell.y) + position * size - vec3(0.0, open * (height + 0.35), 0.0);
    vWorld = world;
    vNormal = normal;
    vBox = position + vec3(0.5, 0.0, 0.5);
    vSize = size;
    vSeed = aInfo.y;
    vSpecial = special;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

export const slabFragment = /* glsl */ `
  ${fieldLight}
  ${shading}
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vBox;
  varying vec3 vSize;
  varying float vSeed;
  varying float vSpecial;

  float edgeMask(float dist) {
    vec3 q = vBox * vSize;
    vec3 d = min(q, vSize - q) + abs(vNormal) * 1000.0;
    float e = min(d.x, min(d.y, d.z));
    float w = 0.014 + dist * 0.0007;
    return 1.0 - smoothstep(0.0, w * 2.0, e);
  }

  vec3 environment(vec3 r) {
    float band = exp(-abs(r.y - 0.02) * 26.0);
    float sunSide = 0.3 + 0.7 * max(dot(normalize(r.xz + 0.0001), normalize(uSunDir.xz)), 0.0);
    return uGround + uHaze * band * sunSide * 2.2;
  }

  vec3 floorReflection(vec3 r) {
    if (r.y > -0.02) {
      return vec3(0.0);
    }
    float travel = max(vWorld.y, 0.0) / -r.y;
    vec2 hit = vWorld.xz + r.xz * travel;
    float letters = texture2D(uSharp, rectUv(hit, uRect)).a * revealAt(hit.x, 0.1) * uWordLight;
    return uMari * (letters * 2.0 + glowAt(hit) * 1.1) * exp(-travel * 0.42);
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(cameraPosition - vWorld);
    vec3 l = normalize(uSunDir);
    float dist = length(cameraPosition - vWorld);
    float ndl = max(dot(n, l), 0.0);
    float ndh = max(dot(n, normalize(l + v)), 0.0);
    float ndv = max(dot(n, v), 0.0);
    float y = max(vWorld.y, 0.0);
    float near = exp(-dist * 0.011);

    vec3 albedo = vec3(0.009, 0.0074, 0.006) * (0.75 + 0.5 * vSeed);
    float ao = mix(0.18, 1.0, smoothstep(0.0, 3.0, y));
    vec3 col = albedo * (0.14 + ndl * 1.5 * uSun) * ao;
    col += uSun * (pow(ndh, 240.0) * 3.0 * near + pow(ndh, 36.0) * 0.06) * ndl;

    vec3 r = reflect(-v, n);
    float fresnel = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);
    col += (environment(r) * ao * mix(0.5, 1.0, near) + floorReflection(r)) * fresnel;

    float side = 1.0 - abs(n.y);
    float spill = glowAt(vWorld.xz + n.xz * 0.95) * exp(-y * 0.5);
    col += mix(uEmber, uMari, exp(-y * 0.7)) * spill * side * 1.2;

    float top = step(0.5, n.y);
    float nearby = glowAt(vWorld.xz);
    float edge = edgeMask(dist);
    col += uMari * top * nearby * (0.03 + edge * 0.7);
    col += edge * uSun * ndl * 0.05 * near;

    col += uMari * vSpecial * (0.25 + 0.75 * smoothstep(0.0, 9.0, y)) * (0.55 + 0.45 * side);

    gl_FragColor = finish(applyFog(col, vWorld));
  }
`;
