import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  visibleText,
  findDashes,
  findForbiddenStrings,
  findMonoFonts,
  findPillRadius,
  findTransitionAll,
  findImgWithoutSize,
  referencedScripts,
  nullFields,
  runChecks,
  FIRST_LOAD_JS_LIMIT,
  TOTAL_JS_LIMIT,
} from "./check.mjs";

const scratchRoot = mkdtempSync(join(tmpdir(), "savign-check-test-"));

after(() => {
  rmSync(scratchRoot, { recursive: true, force: true });
});

function writeTree(files) {
  const dir = mkdtempSync(join(scratchRoot, "out-"));
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
  return dir;
}

function writeCompany(fields) {
  const path = join(mkdtempSync(join(scratchRoot, "company-")), "company.mjs");
  writeFileSync(path, `export const company = ${JSON.stringify(fields)};`);
  return path;
}

function resultFor(results, rule) {
  return results.find((result) => result.rule.startsWith(rule));
}

const UNFINISHED_MARKER = ["TO", "DO"].join("");

const cleanIndex =
  '<html><body><h1>SAVIGN</h1><script src="/a.js"></script></body></html>';

test("visible text drops scripts, styles, comments and tags", () => {
  const html =
    "<style>a{b:c}</style><script>x-y</script><!-- a-b --><p title='a-b'>Hello &amp; welcome</p>";
  assert.equal(visibleText(html).trim(), "Hello & welcome");
});

test("dash rule fails on em dash, en dash and entities", () => {
  assert.equal(findDashes("one — two").length, 1);
  assert.equal(findDashes("2024–2025").length, 1);
  assert.equal(
    findDashes(visibleText("<p>a &mdash; b &#8211; c</p>")).length,
    2,
  );
});

test("dash rule fails on a hyphen between letters, e-mail included", () => {
  assert.equal(findDashes("state-of-the-art").length, 3);
  assert.equal(findDashes("send an e-mail").length, 1);
});

test("dash rule passes clean copy, numbers and URLs", () => {
  assert.deepEqual(findDashes("We build agents. Call 98 - 12."), []);
  assert.deepEqual(
    findDashes("See https://github.com/some-org/some-repo now"),
    [],
  );
  assert.deepEqual(findDashes("Visit www.my-site.org today"), []);
});

test("forbidden strings fail and clean text passes", () => {
  assert.deepEqual(findForbiddenStrings(`${UNFINISHED_MARKER}: write this`), [
    UNFINISHED_MARKER,
  ]);
  assert.deepEqual(findForbiddenStrings("PLACEHOLDER copy"), ["PLACEHOLDER"]);
  assert.deepEqual(findForbiddenStrings("Lorem ipsum"), ["Lorem"]);
  assert.deepEqual(findForbiddenStrings("see auto_job_applier"), [
    "auto_job_applier",
  ]);
  assert.deepEqual(findForbiddenStrings("a LinkedIn Bot"), ["LinkedIn Bot"]);
  assert.deepEqual(
    findForbiddenStrings('<input placeholder="Name"> todos'),
    [],
  );
});

test("monospace font rule", () => {
  assert.equal(findMonoFonts("code{font-family:ui-monospace,Menlo}").length, 1);
  assert.equal(findMonoFonts("p{font-family:'Geist Mono'}").length, 1);
  assert.deepEqual(findMonoFonts("p{font-family:var(--font-text),Arial}"), []);
});

test("pill radius rule", () => {
  assert.equal(findPillRadius("a{border-radius:9999px}").length, 1);
  assert.equal(findPillRadius("a{border-radius: 999px}").length, 1);
  assert.equal(findPillRadius("a{border-radius:50vh}").length, 1);
  assert.equal(findPillRadius("a{border-radius:0 100vh}").length, 1);
  assert.equal(findPillRadius(".rounded-full{x:y}").length, 1);
  assert.deepEqual(
    findPillRadius("a{border-radius:8px}b{border-radius:2px}"),
    [],
  );
});

test("transition all rule", () => {
  assert.equal(findTransitionAll("a{transition:all .2s}").length, 1);
  assert.equal(findTransitionAll("a{transition-property: all}").length, 1);
  assert.deepEqual(findTransitionAll("a{transition:opacity .2s}"), []);
});

test("img rule needs width and height", () => {
  assert.equal(findImgWithoutSize('<img src="a.png">').length, 1);
  assert.equal(findImgWithoutSize('<img src="a.png" width="10">').length, 1);
  assert.deepEqual(
    findImgWithoutSize('<img src="a.png" width="10" height="20">'),
    [],
  );
});

test("referenced scripts include preloads and skip nomodule", () => {
  const html =
    '<link rel="preload" as="script" href="/p.js"/><script src="/a.js" async></script>' +
    '<script src="/legacy.js" noModule=""></script><script>inline()</script>';
  assert.deepEqual(referencedScripts(html).sort(), ["/a.js", "/p.js"]);
});

test("null fields lists only null values", () => {
  assert.deepEqual(nullFields({ name: "SAVIGN", cin: null, phone: "1" }), [
    "cin",
  ]);
  assert.deepEqual(nullFields({ name: "SAVIGN" }), []);
});

test("missing out/index.html fails with a clear message", async () => {
  const results = await runChecks({
    outDir: join(scratchRoot, "nothing"),
    release: false,
  });
  assert.equal(results.length, 1);
  assert.match(
    results[0].failures[0],
    /index\.html is missing; run npm run build first/,
  );
});

test("a clean tree passes every rule", async () => {
  const outDir = writeTree({
    "index.html": cleanIndex,
    "a.js": "console.log(1)",
  });
  const results = await runChecks({ outDir, release: false });
  assert.deepEqual(
    results.filter((result) => result.failures.length > 0),
    [],
  );
});

test("whole tree rules catch problems in built files", async () => {
  const outDir = writeTree({
    "index.html": cleanIndex + "<p>top-notch</p><img src=x.png>",
    "a.js": `// ${UNFINISHED_MARKER} later`,
    "s.css": "a{transition:all 1s;border-radius:9999px;font-family:monospace}",
  });
  const results = await runChecks({ outDir, release: false });
  for (const rule of [
    "dashes",
    "forbidden",
    "monospace",
    "pill",
    "transition",
    "img",
  ]) {
    assert.ok(resultFor(results, rule).failures.length > 0, rule);
  }
});

test("first load JS over the limit fails, a missing script fails", async () => {
  const big = randomBytes(FIRST_LOAD_JS_LIMIT + 1000).toString("base64");
  const overDir = writeTree({ "index.html": cleanIndex, "a.js": big });
  const over = resultFor(
    await runChecks({ outDir: overDir, release: false }),
    "first load JS",
  );
  assert.match(over.failures[0], /over 160\.0 kB/);
  const missingDir = writeTree({ "index.html": cleanIndex });
  const missing = resultFor(
    await runChecks({ outDir: missingDir, release: false }),
    "first load JS",
  );
  assert.match(missing.failures[0], /missing script \/a\.js/);
});

test("total JS counts unreferenced chunks against its own limit", async () => {
  const chunk = randomBytes(TOTAL_JS_LIMIT / 2).toString("base64");
  const outDir = writeTree({
    "index.html": cleanIndex,
    "a.js": "1",
    "lazy/one.js": chunk,
    "lazy/two.js": chunk,
  });
  const results = await runChecks({ outDir, release: false });
  assert.deepEqual(resultFor(results, "first load JS").failures, []);
  assert.match(resultFor(results, "total JS").failures[0], /over 420\.0 kB/);
});

test("font row reports count, preloads and woff2 bytes without failing", async () => {
  const outDir = writeTree({
    "index.html":
      '<link rel="preload" href="/f/a.woff2" as="font">' + cleanIndex,
    "a.js": "1",
    "f/a.woff2": Buffer.alloc(2000),
    "f/b.woff2": Buffer.alloc(500),
  });
  const fonts = resultFor(
    await runChecks({ outDir, release: false }),
    "font files",
  );
  assert.equal(fonts.detail, "2 files, 1 preloaded, woff2 2.5 kB raw");
  assert.deepEqual(fonts.failures, []);
});

test("release flag fails on null company fields, nulls pass without it", async () => {
  const outDir = writeTree({ "index.html": cleanIndex, "a.js": "1" });
  const companyFile = writeCompany({
    name: "SAVIGN Private Limited",
    cin: null,
  });
  const draft = await runChecks({ outDir, companyFile, release: false });
  assert.equal(resultFor(draft, "company"), undefined);
  const release = await runChecks({ outDir, companyFile, release: true });
  assert.deepEqual(resultFor(release, "company").failures, [
    "app/company.ts: cin is null",
  ]);
  const filled = writeCompany({ name: "SAVIGN Private Limited", cin: "U1" });
  const shipped = await runChecks({
    outDir,
    companyFile: filled,
    release: true,
  });
  assert.deepEqual(resultFor(shipped, "company").failures, []);
});
