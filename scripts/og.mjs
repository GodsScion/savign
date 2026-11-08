// Renders the static social and icon images with headless Chromium, then they are committed.
// Open Graph cards (1200x630) go to public/og/<route>.png, plus public/og/logo.png (512),
// app/apple-icon.png (180) and app/favicon.ico (16 and 32) from app/icon.svg.
// Run after `npm run build`: the fonts come from the built CSS in out/, the same files the site serves.
// Usage: QA_TOOLS=<node_modules with playwright-core> node scripts/og.mjs
import { registerHooks, createRequire } from "node:module";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromApp = context.parentURL?.includes("/app/") ?? false;
    const isRelative = specifier.startsWith(".");
    const hasExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (fromApp && isRelative && !hasExtension) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { routes, ogImagePath, OG_SIZE } = await import("../app/lib/seo.ts");

const QA_CHROME =
  process.env.QA_CHROME ??
  join(
    homedir(),
    "Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64",
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );

const COLORS = {
  ground: "#0e0c09",
  ink: "#f4f0e7",
  muted: "#afaaa1",
  line: "#36322d",
  accent: "#faab35",
};

// The card shows the page's h1, which reads better large than the search title.
const HEADLINES = {
  "/": "Software that clears the way.",
  "/work/": "What we're building",
  "/work/trail/": "trail: skills for websites",
  "/work/hansei/": "hansei plans, builds, and reviews its own runs",
  "/work/humanize/": "humanize: writing that reads like its author",
  "/work/scoreboard/": "scoreboard: keep, remove or update",
  "/about/": "Named for the one who removes obstacles.",
  "/founder/": "Sai Vignesh Golla",
  "/notes/": "Notes from the work",
  "/contact/": "Get in touch",
};

function loadPlaywright() {
  if (!process.env.QA_TOOLS) {
    throw new Error(
      "Set QA_TOOLS to a node_modules folder with playwright-core",
    );
  }
  const require = createRequire(join(process.env.QA_TOOLS, "noop.js"));
  return require("playwright-core");
}

function fontFaceCss() {
  const cssDir = join(ROOT, "out/_next/static/chunks");
  const mediaDir = join(ROOT, "out/_next/static/media");
  const css = readdirSync(cssDir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => readFileSync(join(cssDir, name), "utf8"))
    .join("\n");
  const faces = css.match(/@font-face\{[^}]*\}/g) ?? [];
  if (faces.length === 0) {
    throw new Error("No @font-face in out/: run `npm run build` first");
  }
  return faces
    .map((face) =>
      face.replace(/url\(\.\.\/media\/([^)]+)\)/g, (match, file) => {
        const data = readFileSync(join(mediaDir, file)).toString("base64");
        return `url(data:font/woff2;base64,${data})`;
      }),
    )
    .join("\n");
}

function iconSvg() {
  return readFileSync(join(ROOT, "app/icon.svg"), "utf8");
}

function monogramPath() {
  return iconSvg().match(/<path\b[^>]*\/>/)[0];
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A note's slug is long, so a note card names only its section.
function displayUrl(path) {
  const [section, slug] = path.split("/").filter(Boolean);
  const shown = section === "notes" ? [section] : [section, slug];
  return ["savign.org", ...shown.filter(Boolean)].join("/");
}

function headlineSize(headline) {
  if (headline.length <= 32) {
    return 112;
  }
  if (headline.length <= 52) {
    return 92;
  }
  return 76;
}

function cardHtml(path, headline, fonts) {
  const glyph = monogramPath()
    .replace(/fill="[^"]*"/, 'fill="none"')
    .replace(
      "<path",
      '<path stroke-width="1.6" vector-effect="non-scaling-stroke"',
    );
  return `<!doctype html><html><head><style>
${fonts}
* { margin: 0; box-sizing: border-box; }
html, body { width: ${OG_SIZE.width}px; height: ${OG_SIZE.height}px; }
body {
  position: relative; overflow: hidden; background: ${COLORS.ground}; color: ${COLORS.ink};
  font-family: Geist, Arial, sans-serif; -webkit-font-smoothing: antialiased;
}
.glow {
  position: absolute; right: -180px; top: -120px; width: 820px; height: 820px;
  background: radial-gradient(closest-side, rgba(250, 171, 53, 0.16), rgba(250, 171, 53, 0));
}
.mark { position: absolute; right: -40px; top: -70px; width: 760px; height: 760px; stroke: ${COLORS.accent}; opacity: 0.34; }
.top {
  position: absolute; left: 80px; right: 80px; top: 64px;
  display: flex; justify-content: space-between; align-items: baseline;
}
.brand { font-weight: 600; font-size: 22px; letter-spacing: 0.24em; }
.url { color: ${COLORS.muted}; font-size: 22px; }
.bottom { position: absolute; left: 80px; right: 80px; bottom: 72px; }
h1 {
  font-family: "Instrument Serif", Georgia, serif; font-weight: 400;
  font-size: ${headlineSize(headline)}px; line-height: 1.02; letter-spacing: -0.02em;
  max-width: 940px; text-wrap: balance;
}
.rule { position: relative; height: 1px; background: ${COLORS.line}; margin-top: 40px; }
.rule::before { content: ""; position: absolute; left: 0; top: -1px; width: 160px; height: 2px; background: ${COLORS.accent}; }
.line { margin-top: 20px; color: ${COLORS.muted}; font-size: 22px; }
</style></head><body>
<div class="glow"></div>
<svg class="mark" viewBox="0 0 512 512" aria-hidden="true">${glyph}</svg>
<div class="top"><span class="brand">SAVIGN</span><span class="url">${escapeHtml(displayUrl(path))}</span></div>
<div class="bottom"><h1>${escapeHtml(headline)}</h1><div class="rule"></div>
<p class="line">SAVIGN Private Limited, India</p></div>
</body></html>`;
}

async function screenshot(browser, html, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return png;
}

function drawSvgToPng({ svg, size }) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d").drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = reject;
    image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
  });
}

// Icons come from a canvas, not a screenshot: a screenshot of an opaque page is an RGB PNG,
// and the build's .ico decoder accepts RGBA PNGs only.
async function renderIcon(browser, size) {
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(drawSvgToPng, { svg: iconSvg(), size });
  await page.close();
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

// An .ico file may hold PNG images directly: a 6 byte header, one 16 byte entry per image, then the PNGs.
export function icoFromPngs(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

function headlineFor(path, route) {
  return HEADLINES[path] ?? route.title;
}

async function renderCards(browser, fonts) {
  mkdirSync(join(ROOT, "public/og"), { recursive: true });
  for (const [path, route] of Object.entries(routes)) {
    const html = cardHtml(path, headlineFor(path, route), fonts);
    const png = await screenshot(browser, html, OG_SIZE.width, OG_SIZE.height);
    writeFileSync(join(ROOT, "public", ogImagePath(path)), png);
    console.log(`og ${ogImagePath(path)}`);
  }
}

async function renderIcons(browser) {
  const icon = (size) => renderIcon(browser, size);
  writeFileSync(join(ROOT, "public/og/logo.png"), await icon(512));
  writeFileSync(join(ROOT, "app/apple-icon.png"), await icon(180));
  const favicon = icoFromPngs([
    { size: 16, png: await icon(16) },
    { size: 32, png: await icon(32) },
  ]);
  writeFileSync(join(ROOT, "app/favicon.ico"), favicon);
  console.log("icons public/og/logo.png app/apple-icon.png app/favicon.ico");
}

async function main() {
  const { chromium } = loadPlaywright();
  const fonts = fontFaceCss();
  const browser = await chromium.launch({ executablePath: QA_CHROME });
  try {
    await renderCards(browser, fonts);
    await renderIcons(browser);
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
