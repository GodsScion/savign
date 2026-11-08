/** Shared GLSL: where the floor is open and how much light it gives off. Used by slabs, floor and haze. */
export const fieldLight = /* glsl */ `
  uniform sampler2D uSharp;
  uniform sampler2D uSoft;
  uniform sampler2D uWake;
  uniform sampler2D uWords;
  uniform sampler2D uMarkers;
  uniform vec4 uMarkerRect;
  uniform vec4 uPads[5];
  uniform vec4 uRect;
  uniform vec4 uPlaza;
  uniform vec4 uField;
  uniform float uCarve;
  uniform float uWakeLight;
  uniform float uWordLight;
  uniform float uRise;
  uniform float uFront;
  uniform float uChannelStart;
  uniform float uChannelLight;
  uniform float uHalf;
  uniform vec4 uPlots[4];
  uniform float uPlotLight;
  uniform vec4 uClear;
  uniform vec4 uSpot;
  uniform float uFlat;
  uniform float uTime;
  uniform vec4 uPointer;

  vec2 rectUv(vec2 xz, vec4 r) {
    return (xz - r.xy) / r.zw;
  }

  float insideUv(vec2 uv) {
    return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  }

  float revealAt(float x, float delay) {
    float start = (x - uRect.x) / uRect.z * 0.6 + delay;
    return smoothstep(0.0, 1.0, clamp((uCarve * 1.6 - start) / 0.6, 0.0, 1.0));
  }

  float riseAt(float x) {
    float start = (x - uField.x) / uField.z * 0.55;
    return smoothstep(0.0, 1.0, clamp((uRise * 1.55 - start) / 0.45, 0.0, 1.0));
  }

  float channelOpen(vec2 xz) {
    float inside = 1.0 - step(uHalf, abs(xz.x));
    return inside * smoothstep(uFront, uFront + 8.0, xz.y) * step(xz.y, uChannelStart);
  }

  float channelGlow(vec2 xz) {
    float along = smoothstep(uFront, uFront + 14.0, xz.y) * (1.0 - smoothstep(uChannelStart, uChannelStart + 4.0, xz.y));
    return along * exp(-abs(xz.x) / uHalf * 1.4) * uChannelLight;
  }

  float plotDistance(vec2 xz) {
    float best = 1e3;
    for (int i = 0; i < 4; i++) {
      vec2 d = abs(xz - uPlots[i].xy) - uPlots[i].zw;
      best = min(best, max(d.x, d.y));
    }
    return best;
  }

  float plotOpen(vec2 xz) {
    return step(plotDistance(xz), 0.0) * step(0.02, uPlotLight) * smoothstep(0.0, 0.6, uPlotLight);
  }

  float plotGlow(vec2 xz) {
    return smoothstep(1.2, -0.8, plotDistance(xz)) * uPlotLight;
  }

  float clearDistance(vec2 xz) {
    return length(xz - uClear.xy) / max(uClear.z, 0.001);
  }

  float clearOpen(vec2 xz) {
    return step(clearDistance(xz), uClear.w);
  }

  float clearGlow(vec2 xz) {
    float d = clearDistance(xz);
    return exp(-d * d * 1.3) * uClear.w;
  }

  float padInside(vec2 xz) {
    float inside = 0.0;
    for (int i = 0; i < 5; i++) {
      vec2 d = abs(xz - uPads[i].xy) - uPads[i].zw;
      inside = max(inside, step(max(d.x, d.y), 0.0));
    }
    return inside;
  }

  float padReveal(vec2 xz, float soften) {
    return padInside(xz) * smoothstep(uFront, uFront + soften, xz.y) * uChannelLight;
  }

  float padOpen(vec2 xz) {
    return step(0.05, padReveal(xz, 8.0));
  }

  float markerAt(vec2 xz) {
    vec2 uv = rectUv(xz, uMarkerRect);
    return texture2D(uMarkers, uv).a * insideUv(uv) * padReveal(xz, 14.0);
  }

  vec4 wakeAt(vec2 xz) {
    vec2 uv = rectUv(xz, uPlaza);
    return texture2D(uWake, uv) * insideUv(uv);
  }

  float wakeSink(vec2 xz) {
    return clamp(wakeAt(xz).r * 1.4 - 0.2, 0.0, 1.2);
  }

  float lanternGlow(vec2 xz) {
    vec2 d = (xz - uPointer.xy) / uPointer.w;
    return exp(-dot(d, d) * 1.4) * uPointer.z;
  }

  float wordGlow(vec2 xz) {
    return texture2D(uSoft, rectUv(xz, uRect)).a * revealAt(xz.x, 0.1) * uWordLight;
  }

  float glowAt(vec2 xz) {
    float wake = wakeAt(xz).g * uWakeLight;
    return wordGlow(xz) + channelGlow(xz) * 0.55 + plotGlow(xz) * 0.55 + clearGlow(xz) * 0.6 + wake * 0.6
      + lanternGlow(xz) * 0.45 + padReveal(xz, 14.0) * 0.12;
  }
`;

/** Shared GLSL: fog, tone and output. */
export const shading = /* glsl */ `
  uniform vec3 uGround;
  uniform vec3 uHaze;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform vec3 uMari;
  uniform vec3 uEmber;
  uniform float uFog;
  uniform float uExposure;

  vec3 fogColor(vec3 dir) {
    float horizon = exp(-abs(dir.y + 0.01) * 30.0) + exp(-abs(dir.y) * 5.0) * 0.14;
    float sunSide = 0.45 + 0.55 * max(dot(normalize(dir.xz + 0.0001), normalize(uSunDir.xz)), 0.0);
    return uGround * 0.9 + uHaze * horizon * sunSide;
  }

  vec3 applyFog(vec3 col, vec3 world) {
    vec3 ray = world - cameraPosition;
    float fog = 1.0 - exp(-pow(length(ray) * uFog, 2.0));
    return mix(col, fogColor(normalize(ray)), fog);
  }

  vec3 softClip(vec3 c) {
    float peak = max(c.r, max(c.g, c.b));
    if (peak <= 0.72) {
      return c;
    }
    float mapped = 0.72 + 0.28 * (1.0 - exp(-(peak - 0.72) / 0.28));
    return c * (mapped / peak);
  }

  vec4 finish(vec3 col) {
    vec3 exposed = mix(uGround, col, uExposure);
    vec4 outColor = linearToOutputTexel(vec4(softClip(exposed), 1.0));
    float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    outColor.rgb += dither / 255.0;
    return outColor;
  }
`;
