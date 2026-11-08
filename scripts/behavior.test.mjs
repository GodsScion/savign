// Browser acceptance tests over the built site in out/: keyboard, menu, Lenis, reduced motion, JS off, anchors
// and the idle frame loop. Local only: needs QA_TOOLS (a node_modules folder holding playwright-core, as for
// scripts/qa.mjs) and a build. Without either it skips with the reason. Run: npm run build && npm run test:e2e
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { serve } from "./qa.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
const QA_TOOLS = process.env.QA_TOOLS;
const QA_CHROME =
  process.env.QA_CHROME ??
  join(
    homedir(),
    "Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64",
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );

function skipReason() {
  if (!QA_TOOLS) {
    return "QA_TOOLS is not set; point it at a node_modules folder with playwright-core to run browser tests";
  }
  if (!existsSync(join(OUT_DIR, "index.html"))) {
    return "out/index.html is missing; run npm run build first";
  }
  return null;
}

const SKIP = skipReason();
if (SKIP) {
  console.log(`behavior tests skipped: ${SKIP}`);
}

let browser;
let server;
let baseUrl;

before(async () => {
  if (SKIP) {
    return;
  }
  const { chromium } = await import(
    pathToFileURL(join(QA_TOOLS, "playwright-core/index.mjs")).href
  );
  browser = await chromium.launch({ executablePath: QA_CHROME });
  ({ server, url: baseUrl } = await serve(OUT_DIR));
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function openHome(options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...options,
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  return { context, page };
}

function activeText(page) {
  return page.evaluate(() => document.activeElement?.textContent?.trim());
}

function htmlClasses(page) {
  return page.evaluate(() => [...document.documentElement.classList]);
}

test(
  "the skip link is the first tab stop and moves focus to the content",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome();
    await page.keyboard.press("Tab");
    assert.equal(await activeText(page), "Skip to content");
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(() => document.activeElement?.id),
      "content",
    );
    await context.close();
  },
);

test(
  "the phone menu traps focus, stops Lenis, and Esc closes it back to the toggle",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome({
      viewport: { width: 600, height: 900 },
    });
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("lenis"),
    );
    const toggle = page.locator("[data-menu-toggle]");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.equal(await activeText(page), "Work");
    assert.ok((await htmlClasses(page)).includes("lenis-stopped"));
    const visited = [];
    for (let step = 0; step < 6; step++) {
      await page.keyboard.press("Tab");
      visited.push(await activeText(page));
    }
    assert.deepEqual(visited, [
      "Notes",
      "About",
      "Founder",
      "Contact",
      "Close",
      "Work",
    ]);
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await activeText(page), "Menu");
    assert.ok(!(await htmlClasses(page)).includes("lenis-stopped"));
    await context.close();
  },
);

test(
  "reduced motion runs no Lenis and hides or dims nothing",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome({ reducedMotion: "reduce" });
    const classes = await htmlClasses(page);
    assert.ok(classes.includes("js"));
    assert.ok(!classes.includes("lenis") && !classes.includes("motion"));
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      scrubSpans: document.querySelectorAll(".scrub-word").length,
      rowOpacity: getComputedStyle(document.querySelector("[data-rise] > li"))
        .opacity,
      markClip: getComputedStyle(document.querySelector("[data-footer-mark]"))
        .clipPath,
      lineOpacity: getComputedStyle(document.querySelector(".hero__line"))
        .opacity,
    }));
    assert.deepEqual(state, {
      scrubSpans: 0,
      rowOpacity: "1",
      markClip: "none",
      lineOpacity: "1",
    });
    await context.close();
  },
);

test(
  "with JS off the home page reads whole, with the scene fallback and no clock",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const text = await page.evaluate(() => document.body.innerText);
    for (const phrase of [
      "Software that",
      "What we're building",
      "How we work",
      "Sai Vignesh Golla",
      "Get in touch",
      "Company information",
      "Back to top",
    ]) {
      assert.ok(text.includes(phrase), `missing: ${phrase}`);
    }
    assert.equal(await page.locator(".scene-fallback").count(), 1);
    assert.equal(await page.locator(".clock").isVisible(), false);
    await context.close();
  },
);

test(
  "the Company information link scrolls #company under the header",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome();
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("lenis"),
    );
    await page
      .getByRole("link", { name: "Company information" })
      .first()
      .click();
    await page.waitForTimeout(2000);
    const top = await page.evaluate(
      () => document.getElementById("company").getBoundingClientRect().top,
    );
    assert.ok(top > 60 && top < 140, `#company top is ${top}`);
    assert.equal(await page.evaluate(() => location.hash), "#company");
    await context.close();
  },
);

test(
  "the shared frame loop sleeps when nothing moves",
  { skip: SKIP ?? false },
  async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    await context.addInitScript(() => {
      const original = window.requestAnimationFrame.bind(window);
      window.__frames = 0;
      window.requestAnimationFrame = (callback) => {
        window.__frames += 1;
        return original(callback);
      };
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() =>
      document.documentElement.classList.contains("lenis"),
    );
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(2000);
    const before = await page.evaluate(() => window.__frames);
    await page.waitForTimeout(1000);
    const idleFrames = (await page.evaluate(() => window.__frames)) - before;
    assert.ok(idleFrames <= 2, `${idleFrames} frames requested in 1 s of idle`);
    await context.close();
  },
);

async function waitForLenis(page) {
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("lenis"),
  );
}

test(
  "a route change mid inertia opens the new page at the top",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome();
    await waitForLenis(page);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 1600);
    await page.waitForTimeout(250);
    await page.evaluate(() =>
      document.querySelector('.site-nav a[href="/work/"]').click(),
    );
    await page.waitForURL(/\/work\/$/);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await context.close();
  },
);

test(
  "Back right after a wheel restores the previous page, not the inertia",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome();
    await waitForLenis(page);
    await page.evaluate(() =>
      document.querySelector('.site-nav a[href="/work/"]').click(),
    );
    await page.waitForURL(/\/work\/$/);
    await page.waitForTimeout(800);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(300);
    await page.goBack();
    await page.waitForURL(baseUrl);
    await page.waitForTimeout(1500);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await context.close();
  },
);

test(
  "a modified or non primary click on a # link is left to the browser",
  { skip: SKIP ?? false },
  async () => {
    const { context, page } = await openHome();
    await waitForLenis(page);
    await page.evaluate(() => {
      window.__prevented = [];
      window.addEventListener("click", (event) => {
        window.__prevented.push(event.defaultPrevented);
      });
    });
    const link = page.locator('.hero a[href="#company"]');
    await link.click({ modifiers: ["Meta"] });
    await link.click({ modifiers: ["Shift"] });
    await link.click({ modifiers: ["Alt"] });
    // Control+click is a context menu click on macOS, and a middle click fires no click from Playwright, so
    // both are dispatched as the events another platform would deliver.
    await link.evaluate((element) => {
      for (const init of [{ ctrlKey: true }, { button: 1 }]) {
        element.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
        );
      }
    });
    assert.deepEqual(await page.evaluate(() => window.__prevented), [
      false,
      false,
      false,
      false,
      false,
    ]);
    await context.close();
  },
);

test(
  "a note's first paragraph sits a heading gap below its meta lines",
  { skip: SKIP ?? false },
  async () => {
    for (const width of [390, 768]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(
        `${baseUrl}notes/browser-tools-token-cost-coding-agents/`,
      );
      const gap = await page.evaluate(() => {
        const hero = document.querySelector("article > .page-hero");
        const next = hero.nextElementSibling.firstElementChild;
        return (
          next.getBoundingClientRect().top - hero.getBoundingClientRect().bottom
        );
      });
      assert.ok(gap >= 32, `gap below the note hero is ${gap}px at ${width}`);
      await context.close();
    }
  },
);
