import { fieldLight, shading } from "./field.glsl";

export const worldVertex = /* glsl */ `
  varying vec3 vWorld;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const floorFragment = /* glsl */ `
  ${fieldLight}
  ${shading}
  uniform vec4 uRules;
  uniform vec3 uLine;
  varying vec3 vWorld;

  float seams(vec2 xz) {
    vec2 f = abs(fract(xz) - 0.5);
    return smoothstep(0.42, 0.5, max(f.x, f.y));
  }

  float hairline(float z) {
    float u = (z - uRules.z) / uRules.y;
    float d = abs(fract(u + 0.5) - 0.5) / max(fwidth(u), 1e-5);
    return 1.0 - clamp(d - 0.25, 0.0, 1.0);
  }

  void main() {
    vec2 xz = vWorld.xz;
    float reveal = revealAt(xz.x, 0.1) * uWordLight;
    float letters = texture2D(uSharp, rectUv(xz, uRect)).a * reveal;
    float soft = texture2D(uSoft, rectUv(xz, uRect)).a * reveal;
    vec2 plazaUv = rectUv(xz, uPlaza);
    vec4 wake = wakeAt(xz) * uWakeLight;
    float words = texture2D(uWords, plazaUv).a * insideUv(plazaUv);
    float flicker = 0.88 + 0.12 * sin(uTime * 0.8 + xz.x * 0.35 + sin(xz.y * 0.5 + uTime * 0.6) * 2.0);
    float tile = 1.0 - seams(xz) * 0.55 * (1.0 - uRules.x);

    vec3 col = uGround * 0.7;
    col += uEmber * soft * 0.22;
    col += uMari * letters * (0.8 + soft * 0.6) * flicker * tile;
    col += vec3(1.0, 0.82, 0.55) * pow(letters * soft, 3.0) * 0.3;
    col += uMari * channelGlow(xz) * 1.5 * tile;
    col += uMari * plotGlow(xz) * 1.15 * tile;
    col += uMari * clearGlow(xz) * 1.25 * tile;
    col += uMari * wake.g * 0.85 * tile;
    col += vec3(1.0, 0.86, 0.62) * words * smoothstep(0.08, 0.6, wake.g) * 1.6;
    col += uMari * lanternGlow(xz) * 1.6 * tile;

    vec3 lit = applyFog(col, vWorld);
    lit = mix(lit, uLine, hairline(xz.y) * uRules.x);
    gl_FragColor = finish(lit);
  }
`;

export const skyFragment = /* glsl */ `
  ${shading}
  varying vec3 vWorld;

  void main() {
    gl_FragColor = finish(fogColor(normalize(vWorld - cameraPosition)));
  }
`;

export const hazeFragment = /* glsl */ `
  ${fieldLight}
  ${shading}
  uniform float uHazeStrength;
  varying vec3 vWorld;

  void main() {
    float glow = glowAt(vWorld.xz);
    vec3 col = uMari * glow * uHazeStrength * uExposure;
    gl_FragColor = vec4(linearToOutputTexel(vec4(col, 1.0)).rgb, 1.0);
  }
`;
