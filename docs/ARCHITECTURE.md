# Architecture

## The scene (app/scene)

One WebGL world sits behind every page: a field of dark slabs with the SAVIGN letters carved into the floor and lit
from below. It lives in the root layout, so a route change moves the camera instead of reloading the world.

### Load path, end to end

1. `app/scene/SceneMount.tsx` is the client boundary the layout renders. It loads `SceneRoot` with
   `next/dynamic` and `ssr: false`, because the scene needs `window`.
2. `app/scene/SceneRoot.tsx` renders two fixed layers behind the page: a CSS fallback (ground colour with a soft
   marigold glow where the letters will be) and an empty `<canvas aria-hidden="true">`. After the `load` event and an
   idle callback (`afterFirstPaint`), it imports `./engine`. That dynamic import is the only place three enters the
   bundle, so the first paint never waits on it.
3. `app/scene/engine.ts` `startScene` creates the `WebGLRenderer`, then `buildFor` builds the world for the current
   breakpoint and quality tier, then `warmUp` uploads each texture and compiles each material in its own task, so no
   single task blocks input for long. Then the frame loop starts.
4. The first rendered frame calls `hooks.onReady`; `SceneRoot` fades the canvas in and dispatches the
   `scene:ready` window event.

### One frame (`renderPose` in engine.ts)

1. `probeSections` (`sections.ts`) finds the deepest `[data-scene]` element under a line 40% down the viewport and
   reports its pose name, how far it has scrolled, and for the principles section where its ruled rows are.
2. `poseFor` (`poses.ts`) turns that into a `Pose`: a camera `Shot` (position, look target, lens shift, field of
   view) and a `WorldState` (how lit the letters are, how far the corridor is open, plots, clearing, founder slab,
   flatten, rules, exposure, fog).
3. `stepRig` (`camera.ts`) moves each camera number on a critically damped spring toward the shot; `applyRig` writes
   it into the three camera, including the lens shift in the projection matrix. `dampWorld` eases the world numbers.
4. `updatePointer` raycasts the pointer (or the idle wanderer, or a press parting toward the h1) onto the floor and
   stamps the wake grid; `stepWake` (`wake.ts`) springs every cell and uploads the grid as a small texture.
5. `renderer.render`. When nothing moves (camera settled, wake at rest, intro done, a pose without the pointer
   wake), the frame skips the draw.

### Concepts the code relies on

- **Instanced slabs.** Every slab is the same unit box. `world.ts` `buildSlabs` gives the GPU one box plus a
  per-instance attribute (`aCell`: x, z, width, height; `aInfo`: carved, seed, delay, special), and draws all of them
  in one call. The vertex shader (`shaders/slab.glsl.ts`) decides per slab how far it sinks: carved letter, open
  corridor, plot, clearing or pointer wake.
- **Shared light model.** `shaders/field.glsl.ts` holds the functions every surface uses: where the floor is open
  and how much light it gives off (`glowAt`). The floor draws that light, slab sides pick it up as spill from the
  neighbour cell, slab tops get a warm rim near it, and two additive haze sheets fake light in the air.
- **Lens shift.** Instead of aiming the camera off the subject, `applyRig` shifts the projection, which slides the
  picture across the screen without changing perspective. `compose.ts` `heroFrame` reads the hero copy box from the
  DOM and picks the largest free area (above, right of or below the copy) for the word; other poses use per
  breakpoint anchors so the lit thing sits where the text is not.
- **The scroll walk.** In the hero pose the lens shift tracks the scroll exactly for the first 0.42 of a viewport,
  so the word rides up with the page and never passes under the h1. Then the camera drops into the corridor behind
  the I, and the principles pose looks straight down on a flattened floor whose seams become hairlines placed at the
  section's own ruled rows (`updateRules`), so the scene's lines hand over to the DOM's lines.
- **Route flights.** A pose change switches the rig to a slower spring for 2.2 s, lifts the camera in proportion to
  the distance left (`flightLift`) so it arcs over the field, and dims exposure mid flight (`flightDip`).

### Modules over 100 lines

| file                                | idea                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `app/scene/engine.ts`               | build, warm up, run frames, resize, context loss, reduced motion stills |
| `app/scene/poses.ts`                | one pose per route or section, and the hero scroll walk                 |
| `app/scene/world.ts`                | slab cells, instanced mesh, floor, sky, haze, shared uniforms           |
| `app/scene/wake.ts`                 | pointer wake grid: stamp, spring, upload                                |
| `app/scene/wordmark.ts`             | the SAVIGN letters as a floor mask in world units, I at x = 0           |
| `app/scene/camera.ts`               | spring rig, orbit helper, lens shift, framing distance                  |
| `app/scene/compose.ts`              | where the hero word goes around the h1                                  |
| `app/scene/sections.ts`             | which pose the page asks for right now                                  |
| `app/scene/pointer.ts`              | pointer and touch input from window                                     |
| `app/scene/quality.ts`              | device tiers and the 30 frame timing probe                              |
| `app/scene/SceneRoot.tsx`           | lazy start after first paint, fallback, ready event                     |
| `app/scene/shaders/field.glsl.ts`   | shared GLSL: openings, glow, fog, tone                                  |
| `app/scene/shaders/slab.glsl.ts`    | slab vertex and fragment shaders                                        |
| `app/scene/shaders/surface.glsl.ts` | floor, sky and haze shaders                                             |

### Where the time goes, and where to optimise

- Bundle: the scene chunk (three plus the engine) is about 142 kB gzipped and loads after `load` plus idle.
- Start: building the cells (up to about 40,000 on desktop, about 17,000 on phones) and compiling five materials.
  `warmUp` spreads uploads and compiles over separate tasks. If start ever shows as a long task, split `buildCells`
  across tasks next.
- Per frame: one draw call for all slabs plus floor, sky and two haze sheets; the CPU side is the wake spring over
  the plaza grid (about 10,000 cells, skipped when at rest). Fill rate is the GPU cost: device pixel ratio is capped
  at 2 (1.5 on phones, 1 on the low tier), and `quality.ts` drops a tier after 30 slow frames (lower pixel ratio,
  fewer outer columns of slabs).
- Pauses: the loop stops when the tab is hidden, and skips drawing whenever nothing moves.

### Resilience

- `webglcontextlost`: the loop stops and the canvas fades back to the CSS fallback; on restore three re-uploads
  everything and the next frame fades it back in.
- Reduced motion: no loop. One still frame per pose, re-rendered on route change, section change, resize and font
  load.
- No WebGL: `startScene` throws, `SceneRoot` stays on the CSS fallback.
- Frame driver: `app/scene/driver.ts` has the same signature as the site's shared ticker; at merge it becomes a
  re-export of it, so the site runs one requestAnimationFrame loop.
