// Unit tests for the scene's pure functions in app/scene (TypeScript, run through Node's type stripping).
// The scene modules import each other without extensions, as the bundler allows; the resolve hook below adds
// ".ts" for those relative imports. Nothing here needs a browser or a GPU.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    const bare = !/\.[cm]?[jt]sx?$/.test(specifier);
    if (relative && bare && context.parentURL?.includes("/app/")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const scene = (name) => import(`../app/scene/${name}.ts`);
const { poseForPath } = await scene("sections");
const { pickLayout } = await scene("breakpoints");
const { heroFrame } = await scene("compose");
const { createWake, stampWake, stepWake } = await scene("wake");
const { tierFor, createFrameProbe, SLOW_WORK_SECONDS } = await scene("quality");
const { wandererOn, WANDER_SECONDS } = await scene("pointer");
const { markerPads } = await scene("words");
const { poseFor } = await scene("poses");
const { frameDelta } = await scene("driver");

function sceneBusyFlags(overrides = {}) {
  return {
    introDone: true,
    rigSettled: true,
    worldSettled: true,
    wakeMoving: false,
    parting: false,
    pointerLit: false,
    active: false,
    lively: true,
    ...overrides,
  };
}

test("each route maps to its pose, with and without the trailing slash", () => {
  assert.equal(poseForPath("/"), "hero");
  assert.equal(poseForPath("/work/"), "work");
  assert.equal(poseForPath("/work/x/"), "project");
  assert.equal(poseForPath("/notes"), "notes");
  assert.equal(poseForPath("/notes/a-note/"), "note");
  assert.equal(poseForPath("/about/"), "about");
  assert.equal(poseForPath("/founder/"), "founder");
  assert.equal(poseForPath("/contact/"), "contact");
  assert.equal(poseForPath("/privacy/"), "quiet");
});

test("the layout follows the viewport: phone, tablet, desktop", () => {
  assert.equal(pickLayout(390, 844).breakpoint, "phone");
  assert.equal(pickLayout(320, 700).breakpoint, "phone");
  assert.equal(pickLayout(768, 1024).breakpoint, "tablet");
  assert.equal(pickLayout(1024, 1366).breakpoint, "tablet");
  assert.equal(pickLayout(1440, 900).breakpoint, "desktop");
  assert.equal(pickLayout(1920, 1080).breakpoint, "desktop");
});

function frameToPx(frame, vw, vh, aspect) {
  const width = (frame.width / 2) * vw;
  const centerY = ((1 - frame.cy) / 2) * vh;
  return {
    width,
    top: centerY - (width * aspect) / 2,
    bottom: centerY + (width * aspect) / 2,
  };
}

test("on portrait screens the word sits just above the copy, with no dead band", () => {
  for (const [vw, vh] of [
    [390, 844],
    [768, 1024],
  ]) {
    const copy = {
      top: vh * 0.62,
      bottom: vh * 0.95,
      left: 24,
      right: vw - 24,
    };
    const aspect = 0.19;
    const box = frameToPx(heroFrame(copy, vw, vh, aspect), vw, vh, aspect);
    const gap = copy.top - box.bottom;
    assert.ok(gap > 0, `word overlaps the copy at ${vw}: gap ${gap}`);
    assert.ok(gap < 110, `dead band of ${Math.round(gap)} px at ${vw}`);
    assert.ok(box.top > 72, `word under the header at ${vw}`);
  }
});

test("on a wide screen the word sits right of centre, above the copy", () => {
  const frame = heroFrame(
    { top: 560, bottom: 860, left: 64, right: 640 },
    1440,
    900,
    0.19,
  );
  assert.ok(frame.cx > 0.1, `cx ${frame.cx}`);
  assert.ok(frame.width <= 2 * 0.54 + 1e-9);
});

test("the wake stamps, springs, fades and comes to rest", () => {
  const wake = createWake({ x: -10, z: -10, w: 20, d: 20 });
  assert.equal(stepWake(wake, 1 / 60), false);
  stampWake(wake, 0, 0, 3, 1);
  const center = 10 * 20 + 10;
  assert.ok(wake.energy[center] > 0.5);
  assert.equal(stepWake(wake, 1 / 60), true);
  assert.ok(wake.sink[center] > 0);
  let moving = true;
  let seconds = 0;
  while (moving && seconds < 20) {
    moving = stepWake(wake, 1 / 30);
    seconds += 1 / 30;
  }
  assert.equal(moving, false, "the wake never settled");
  assert.equal(wake.sink[center], 0);
  assert.ok(seconds > 2, `settled too fast: ${seconds}`);
});

test("quality tiers come from cores, memory and pointer", () => {
  assert.equal(
    tierFor({ cores: 4, memory: 8, coarse: false, breakpoint: "desktop" }).name,
    "low",
  );
  assert.equal(
    tierFor({ cores: 8, memory: 2, coarse: false, breakpoint: "desktop" }).name,
    "low",
  );
  assert.equal(
    tierFor({ cores: 8, memory: 8, coarse: true, breakpoint: "desktop" }).name,
    "mid",
  );
  assert.equal(
    tierFor({ cores: 8, memory: 8, coarse: false, breakpoint: "phone" }).name,
    "mid",
  );
  const high = tierFor({
    cores: 10,
    memory: 16,
    coarse: false,
    breakpoint: "desktop",
  });
  assert.equal(high.name, "high");
  assert.equal(high.dprCap, 2);
  assert.equal(
    tierFor({ cores: 8, memory: 8, coarse: true, breakpoint: "phone" }).dprCap,
    1.5,
  );
});

function runProbe(workSeconds) {
  const probe = createFrameProbe();
  const answers = [];
  for (let i = 0; i < 120; i += 1) {
    const answer = probe(workSeconds);
    if (answer) {
      answers.push(answer);
    }
  }
  return answers;
}

test("the quality probe judges frame work, answers once, and ignores display cadence", () => {
  assert.deepEqual(
    runProbe(0.004),
    ["ok"],
    "light work at any cadence is fine",
  );
  assert.deepEqual(
    runProbe(SLOW_WORK_SECONDS * 2),
    ["slow"],
    "one probe, one answer",
  );
});

test("the wanderer runs on touch screens only, for 8 s after start and after each touch", () => {
  assert.equal(wandererOn(3, 0, -100, false), false);
  assert.equal(wandererOn(3, 0, -100, true), true);
  assert.equal(wandererOn(WANDER_SECONDS + 1, 0, -100, true), false);
  assert.equal(wandererOn(30, 0, 25, true), true);
  assert.equal(wandererOn(30, 0, 20, true), false);
});

test("the five corridor markers sit beside the corridor, behind the letters, one after another", () => {
  const backZ = -12;
  const pads = markerPads(backZ);
  assert.equal(pads.length, 5);
  assert.deepEqual(
    pads.map((pad) => pad.word),
    ["measure", "the cause", "local", "readable", "every run"],
  );
  pads.forEach((pad, i) => {
    assert.ok(Math.abs(pad.x) - pad.halfW >= 2, `pad ${i} covers the corridor`);
    assert.ok(pad.z + pad.halfD < backZ, `pad ${i} overlaps the letters`);
    if (i > 0) {
      assert.ok(
        pads[i - 1].z - pad.z >= pad.halfD * 2,
        `pads ${i - 1} and ${i} overlap`,
      );
    }
  });
});

const fakeWord = {
  rect: { x: -50, z: -22, w: 100, d: 44 },
  backZ: -12,
  frontZ: 12,
  leftX: -40,
  rightX: 32,
};

function context(pose, overrides = {}) {
  return {
    layout: pickLayout(1440, 900),
    word: fakeWord,
    aspect: 1.6,
    frame: { cx: 0.3, cy: 0.4, width: 1 },
    probe: { pose, scrolled: 0, progress: 0, rows: null },
    still: false,
    ...overrides,
  };
}

test("the hero word rides with the page, then the dive releases it", () => {
  globalThis.window ??= { innerHeight: 900 };
  const at = (scrolled) =>
    poseFor(
      context("hero", {
        probe: { pose: "hero", scrolled, progress: 0, rows: null },
      }),
      0.05,
    );
  assert.equal(at(0).pageLock, 0);
  assert.ok(
    Math.abs(at(0.2).pageLock - 0.4) < 1e-9,
    "locked 1:1 with the page",
  );
  assert.equal(
    at(1.2).pageLock,
    0,
    "released once the camera is in the corridor",
  );
  assert.equal(at(1.2).world.carve, 0, "the letters close behind the dive");
});

test("under reduced motion the principles still draws no scene rules", () => {
  globalThis.window ??= { innerHeight: 900 };
  assert.equal(poseFor(context("principles"), 0.05).world.rules, 1);
  assert.equal(
    poseFor(context("principles", { still: true }), 0.05).world.rules,
    0,
  );
});

test("the contact clearing is anchored below the header on desktop", () => {
  globalThis.window ??= { innerHeight: 900 };
  assert.ok(poseFor(context("contact"), 0.05).shot.shiftY < 0);
});

test("the frame driver turns ticker milliseconds into a clamped delta", () => {
  assert.equal(frameDelta(null, 5), 1 / 60);
  assert.ok(Math.abs(frameDelta(1, 1.016) - 0.016) < 1e-9);
  assert.equal(
    frameDelta(1, 9),
    0.05,
    "a wake after sleep counts as one frame",
  );
});

test("the busy rule lets an idle scene sleep and keeps a live one drawing", async () => {
  const { sceneBusy } = await scene("frame");
  assert.equal(
    sceneBusy(sceneBusyFlags()),
    false,
    "settled and inactive: no frames",
  );
  assert.equal(
    sceneBusy(sceneBusyFlags({ active: true })),
    true,
    "recent input on the hero",
  );
  assert.equal(
    sceneBusy(sceneBusyFlags({ active: true, lively: false })),
    false,
    "a still pose",
  );
  assert.equal(sceneBusy(sceneBusyFlags({ introDone: false })), true);
  assert.equal(sceneBusy(sceneBusyFlags({ wakeMoving: true })), true);
  assert.equal(sceneBusy(sceneBusyFlags({ pointerLit: true })), true);
});

test("the scene runs on the site's one ticker: seconds in, busy out, and the loop sleeps", async () => {
  const queue = [];
  globalThis.window = {
    innerHeight: 900,
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.requestAnimationFrame = (callback) => queue.push(callback);
  globalThis.cancelAnimationFrame = () => {};
  const { onFrame } = await scene("driver");
  const calls = [];
  let busyFrames = 2;
  const stop = onFrame((time, dt) => {
    calls.push([time, dt]);
    busyFrames -= 1;
    return busyFrames > 0;
  });
  let clock = 10000;
  while (queue.length > 0 && calls.length < 10) {
    clock += 16;
    queue.shift()(clock);
  }
  stop();
  assert.equal(
    calls.length,
    2,
    "the ticker stops asking for frames once the scene is idle",
  );
  assert.equal(calls[0][0], 10.016);
  assert.ok(Math.abs(calls[1][1] - 0.016) < 1e-9);
});
