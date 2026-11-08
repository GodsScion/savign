// Review-time QA over the built static export: Lighthouse mobile and desktop (median of 3 each) and
// Playwright screenshots. Exits 1 when a Lighthouse gate fails, unless --allow-fail (exploratory runs).
// Builds nothing. Usage: node scripts/qa.mjs <output-dir> [--site <dir>] [--allow-fail]
// QA_TOOLS points at a node_modules folder holding lighthouse, chrome-launcher and playwright-core;
// QA_CHROME at a Chromium binary. Neither tool is a dependency of this repo.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";
import { join, resolve, extname, dirname, sep } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { realpathSync } from "node:fs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const QA_TOOLS = process.env.QA_TOOLS;
const QA_CHROME =
  process.env.QA_CHROME ??
  join(
    homedir(),
    "Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64",
    "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
  );

const VIEWPORTS = [
  [320, 700],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const SCROLL_STOPS = [0, 25, 50, 75, 100];
const VARIANT_WIDTHS = [
  [390, 844],
  [1440, 900],
];
const LIGHTHOUSE_RUNS = 3;
const FORM_FACTORS = [
  { name: "mobile", configPath: null },
  { name: "desktop", configPath: "lighthouse/core/config/desktop-config.js" },
];
export const SCORE_GATES = { performance: 90, accessibility: 90 };
export const CLS_LIMIT = 0.1;
const SETTLE_MS = 600;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

const USAGE =
  "usage: node scripts/qa.mjs <output-dir> [--site <dir>] [--allow-fail]";

function readArgs(argv) {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        site: { type: "string" },
        "allow-fail": { type: "boolean" },
      },
    });
    if (positionals.length !== 1) {
      throw new Error("expected exactly one output dir");
    }
    return { values, outputArg: positionals[0] };
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exit(2);
  }
}

function cliArgs(argv) {
  const { values, outputArg } = readArgs(argv);
  const siteDir = values.site ? resolve(values.site) : join(REPO_ROOT, "out");
  const outputDir = resolve(outputArg);
  if (outputDir === REPO_ROOT || outputDir.startsWith(REPO_ROOT + sep)) {
    throw new Error(
      `output dir ${outputDir} is inside the repo; pick a folder outside it`,
    );
  }
  return { siteDir, outputDir, allowFail: values["allow-fail"] ?? false };
}

function decodePath(urlPath) {
  try {
    return decodeURIComponent(urlPath.split(/[?#]/)[0]);
  } catch {
    return null;
  }
}

// The file a request names, or null when it is missing or outside siteDir.
export async function resolveFile(siteDir, pathname) {
  const target = resolve(siteDir, "." + pathname);
  if (target !== siteDir && !target.startsWith(siteDir + sep)) {
    return null;
  }
  const info = await stat(target).catch(() => null);
  if (info?.isDirectory()) {
    return join(target, "index.html");
  }
  return info ? target : null;
}

export async function serve(siteDir) {
  const server = createServer(async (request, response) => {
    const pathname = decodePath(request.url ?? "/");
    if (pathname === null) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("bad request");
      return;
    }
    const file = await resolveFile(siteDir, pathname);
    const body = file ? await readFile(file).catch(() => null) : null;
    if (body) {
      response.writeHead(200, {
        "content-type":
          CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
      });
      response.end(body);
      return;
    }
    const notFound = await readFile(join(siteDir, "404.html")).catch(
      () => "not found",
    );
    response.writeHead(404, { "content-type": CONTENT_TYPES[".html"] });
    response.end(notFound);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

function toolImport(path) {
  if (!QA_TOOLS) {
    throw new Error(
      "set QA_TOOLS to a node_modules folder with lighthouse, chrome-launcher and playwright-core",
    );
  }
  return import(pathToFileURL(join(QA_TOOLS, path)).href);
}

async function lighthouseOnce(lighthouse, chromeLauncher, url, config) {
  const chrome = await chromeLauncher.launch({
    chromePath: QA_CHROME,
    chromeFlags: ["--headless=new"],
  });
  try {
    const flags = {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    };
    const result = await lighthouse(url, flags, config);
    return result.lhr;
  } finally {
    await chrome.kill();
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function summarise(reports) {
  const score = (key) =>
    Math.round(median(reports.map((lhr) => lhr.categories[key].score * 100)));
  const audit = (key) =>
    median(reports.map((lhr) => lhr.audits[key].numericValue));
  return {
    performance: score("performance"),
    accessibility: score("accessibility"),
    "best-practices": score("best-practices"),
    seo: score("seo"),
    "LCP ms": Math.round(audit("largest-contentful-paint")),
    CLS: Number(audit("cumulative-layout-shift").toFixed(3)),
    "TBT ms": Math.round(audit("total-blocking-time")),
  };
}

async function formFactorConfig(formFactor) {
  if (!formFactor.configPath) {
    return undefined;
  }
  return (await toolImport(formFactor.configPath)).default;
}

async function runLighthouse(url, outputDir, formFactor) {
  const { default: lighthouse } = await toolImport("lighthouse/core/index.js");
  const chromeLauncher = await toolImport("chrome-launcher/dist/index.js");
  const config = await formFactorConfig(formFactor);
  const reports = [];
  for (let run = 1; run <= LIGHTHOUSE_RUNS; run++) {
    const lhr = await lighthouseOnce(lighthouse, chromeLauncher, url, config);
    await writeFile(
      join(outputDir, `lighthouse-${formFactor.name}-${run}.json`),
      JSON.stringify(lhr),
    );
    reports.push(lhr);
  }
  return summarise(reports);
}

// One line per gate a form factor misses: perf and accessibility at least 90, CLS at most 0.1.
export function gateFailures(summaries) {
  return Object.entries(summaries).flatMap(([name, summary]) => {
    const scores = Object.entries(SCORE_GATES)
      .filter(([key, floor]) => summary[key] < floor)
      .map(([key, floor]) => `${name} ${key} ${summary[key]} < ${floor}`);
    const cls =
      summary.CLS > CLS_LIMIT
        ? [`${name} CLS ${summary.CLS} > ${CLS_LIMIT}`]
        : [];
    return [...scores, ...cls];
  });
}

async function scrollTo(page, percent) {
  await page.evaluate((fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.max(0, max) * fraction);
  }, percent / 100);
  await page.waitForTimeout(SETTLE_MS);
}

async function screenshotScrollStops(browser, url, outputDir, [width, height]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  for (const percent of SCROLL_STOPS) {
    await scrollTo(page, percent);
    await page.screenshot({
      path: join(outputDir, `${width}x${height}-scroll${percent}.png`),
    });
  }
  await context.close();
}

async function screenshotVariant(
  browser,
  url,
  outputDir,
  name,
  options,
  [width, height],
) {
  const context = await browser.newContext({
    viewport: { width, height },
    ...options,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({
    path: join(outputDir, `${width}x${height}-${name}.png`),
    fullPage: true,
  });
  await context.close();
}

async function runScreenshots(url, outputDir) {
  const { chromium } = await toolImport("playwright-core/index.mjs");
  const browser = await chromium.launch({
    executablePath: QA_CHROME,
    headless: true,
  });
  try {
    for (const viewport of VIEWPORTS) {
      await screenshotScrollStops(browser, url, outputDir, viewport);
    }
    for (const viewport of VARIANT_WIDTHS) {
      await screenshotVariant(
        browser,
        url,
        outputDir,
        "reduced-motion",
        { reducedMotion: "reduce" },
        viewport,
      );
      await screenshotVariant(
        browser,
        url,
        outputDir,
        "no-js",
        { javaScriptEnabled: false },
        viewport,
      );
    }
  } finally {
    await browser.close();
  }
}

async function lighthouseSummaries(url, outputDir) {
  const summaries = {};
  for (const formFactor of FORM_FACTORS) {
    summaries[formFactor.name] = await runLighthouse(
      url,
      outputDir,
      formFactor,
    );
    console.log(`Lighthouse ${formFactor.name}, median of ${LIGHTHOUSE_RUNS}`);
    console.table(summaries[formFactor.name]);
  }
  return summaries;
}

export function reportGates(failures, allowFail) {
  if (failures.length === 0) {
    console.log("Lighthouse gates passed");
    return;
  }
  console.error(`Lighthouse gates failed:\n  ${failures.join("\n  ")}`);
  if (allowFail) {
    console.error("--allow-fail: exiting 0 anyway");
    return;
  }
  process.exitCode = 1;
}

async function main() {
  const { siteDir, outputDir, allowFail } = cliArgs(process.argv.slice(2));
  await stat(join(siteDir, "index.html")).catch(() => {
    throw new Error(
      `${siteDir}/index.html is missing; run npm run build first`,
    );
  });
  await mkdir(outputDir, { recursive: true });
  const { server, url } = await serve(siteDir);
  try {
    const summaries = await lighthouseSummaries(url, outputDir);
    await writeFile(
      join(outputDir, "lighthouse-summary.json"),
      JSON.stringify(summaries, null, 2),
    );
    await runScreenshots(url, outputDir);
    console.log(`screenshots and reports in ${outputDir}`);
    reportGates(gateFailures(summaries), allowFail);
  } finally {
    server.close();
  }
}

if (import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  await main();
}
