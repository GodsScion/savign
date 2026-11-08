import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  copyFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import {
  visibleText,
  copyText,
  htmlCss,
  findDashes,
  findForbiddenStrings,
  BOT_WALL_PATTERNS,
  findMonoFonts,
  findMonoElements,
  findPillRadius,
  findTransitionAll,
  findImgWithoutSize,
  referencedScripts,
  missingFields,
  fieldsNotShown,
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

test("visible text joins React separators and inline tags without a space", () => {
  const joined = renderToString(createElement("p", null, "well", "-", "known"));
  assert.equal(joined, "<p>well<!-- -->-<!-- -->known</p>");
  assert.equal(visibleText(joined).trim(), "well-known");
  assert.equal(findDashes(visibleText(joined)).length, 1);
  assert.equal(visibleText("<em>state</em>-<span>of</span>"), "state-of");
  assert.equal(visibleText("<p>one</p><p>two</p>").trim(), "one two");
  assert.equal(visibleText("<li>a</li><li>b</li><br>c").trim(), "a b c");
});

test("copy text scans alt, title, labels, placeholder and meta copy", () => {
  const cases = [
    '<img alt="a top-notch lab">',
    '<a title="first-rate">x</a>',
    '<a aria-label="state-of link">x</a>',
    '<a aria-description="well-known">x</a>',
    '<input placeholder="e-mail">',
    '<meta name="description" content="A company &mdash; honestly">',
    '<meta property="og:title" content="top-notch">',
    '<meta name="twitter:description" content="a — b">',
  ];
  for (const html of cases) {
    assert.equal(findDashes(copyText(html)).length, 1, html);
  }
});

test("copy text skips urls, other attributes and other meta tags", () => {
  const html =
    '<meta property="og:url" content="https://www.savign.org/a-b">' +
    '<meta property="og:image" content="/opengraph-image-x.png">' +
    '<meta name="viewport" content="width=device-width">' +
    '<a class="nav-link" href="/a-b" data-x="y-z">Home</a>';
  assert.deepEqual(findDashes(copyText(html)), []);
});

test("dash rule fails on every unicode hyphen and dash", () => {
  for (const code of [0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2212]) {
    const text = `state${String.fromCodePoint(code)}of`;
    assert.equal(findDashes(text).length, 1, code.toString(16));
  }
  assert.equal(findDashes(visibleText("state&hyphen;of")).length, 1);
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

test("bot wall patterns catch every spelling", () => {
  const banned = [
    "Auto_job_applier",
    "Auto Job Applier",
    "auto-job-applier",
    "autojobapplier",
    "LinkedIn automation",
    "linkedin bot",
    "Linked-In bots",
    "LinkedIn Easy Apply bot",
    "a LinkedIn auto apply tool",
    "LinkedIn auto-applier",
    "Easy Apply bot",
    "easy-apply automation",
  ];
  for (const text of banned) {
    assert.equal(findForbiddenStrings(text).length > 0, true, text);
  }
  const clean = [
    "Find me on LinkedIn",
    "LinkedIn profile and GitHub",
    "Apply easily",
    "a robot arm",
    "automation for builders",
  ];
  for (const text of clean) {
    assert.deepEqual(findForbiddenStrings(text), [], text);
  }
  assert.equal(BOT_WALL_PATTERNS.length, 3);
});

test("monospace font rule", () => {
  assert.equal(findMonoFonts("code{font-family:ui-monospace,Menlo}").length, 1);
  assert.equal(findMonoFonts("p{font-family:'Geist Mono'}").length, 1);
  assert.deepEqual(findMonoFonts("p{font-family:var(--font-text),Arial}"), []);
  const named = [
    "monospace",
    "Menlo",
    "Consolas",
    "Courier New",
    "Monaco",
    '"Fira Code"',
    '"JetBrains Mono"',
    '"SF Mono"',
  ];
  for (const font of named) {
    assert.equal(findMonoFonts(`p{font-family:${font}}`).length, 1, font);
  }
  assert.equal(findMonoFonts("p{font:14px/1.4 Menlo,Consolas}").length, 1);
  const viaVar = ":root{--code:Menlo, monospace}p{font-family:var(--code)}";
  assert.deepEqual(findMonoFonts(viaVar), ["font-family:var(--code)"]);
  assert.deepEqual(
    findMonoFonts(
      ":root{--font-text:Geist}p{font-size:12px;font:var(--x,1em) Geist}",
    ),
    [],
  );
});

test("monospace elements fail in html, script strings do not", () => {
  for (const tag of ["code", "pre", "kbd", "samp"]) {
    assert.equal(findMonoElements(`<p><${tag}>x</${tag}></p>`).length, 1, tag);
  }
  assert.deepEqual(
    findMonoElements('<p>precise</p><script>"<code>"</script><a class="code">'),
    [],
  );
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

test("pill radius resolves custom properties and large or relative values", () => {
  assert.deepEqual(
    findPillRadius(":root{--pill:9999px}a{border-radius:var(--pill)}"),
    ["border-radius:var(--pill)"],
  );
  for (const value of [
    "10000px",
    "99999px",
    "50%",
    "100%",
    "999rem",
    "calc(infinity*1px)",
  ]) {
    assert.equal(findPillRadius(`a{border-radius:${value}}`).length, 1, value);
  }
  assert.equal(findPillRadius("a{border-top-left-radius:9999px}").length, 1);
  assert.deepEqual(
    findPillRadius(":root{--r:12px}a{border-radius:var(--r) 4%}"),
    [],
  );
});

test("transition all rule", () => {
  assert.equal(findTransitionAll("a{transition:all .2s}").length, 1);
  assert.equal(findTransitionAll("a{transition-property: all}").length, 1);
  assert.deepEqual(findTransitionAll("a{transition:opacity .2s}"), []);
  assert.equal(
    findTransitionAll("a{transition:opacity .2s,all .3s}").length,
    1,
  );
  assert.equal(findTransitionAll("a{transition:.2s all ease}").length, 1);
  assert.equal(
    findTransitionAll(":root{--t:all .2s}a{transition:var(--t)}").length,
    1,
  );
  assert.deepEqual(
    findTransitionAll("a{transition:opacity .2s ease-in-out,color 1s}"),
    [],
  );
});

test("style attributes reach the css rules", () => {
  const html = renderToString(
    createElement(
      "div",
      {
        style: {
          borderRadius: 9999,
          transition: "all 0.2s",
          fontFamily: "Menlo",
        },
      },
      "x",
    ),
  );
  const css = htmlCss(html);
  assert.equal(findPillRadius(css).length, 1);
  assert.equal(findTransitionAll(css).length, 1);
  assert.equal(findMonoFonts(css).length, 1);
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

// Replaces "null fields lists only null values": blank strings and preview words are missing too.
test("missing fields: null, undefined, blank and preview words", () => {
  assert.deepEqual(missingFields({ name: "SAVIGN", cin: null, phone: "1" }), [
    "cin",
  ]);
  assert.deepEqual(missingFields({ name: "SAVIGN" }), []);
  const blanks = {
    a: undefined,
    b: "",
    c: " ",
    d: "TBD",
    e: UNFINISHED_MARKER.toLowerCase(),
    f: "N/A",
    g: "Pending",
    h: "Awaiting confirmation",
    i: "awaiting",
  };
  assert.deepEqual(missingFields(blanks), Object.keys(blanks));
  assert.deepEqual(missingFields({ office: "12 Pending Road, Hyderabad" }), []);
});

test("fields not shown: each value must be visible text on the page", () => {
  const company = { name: "SAVIGN Private Limited", cin: "U72900TG2024PTC1" };
  const page =
    "<p>SAVIGN <em>Private</em>   Limited</p><p>CIN <!-- -->U72900TG2024PTC1</p>";
  assert.deepEqual(fieldsNotShown(company, page), []);
  assert.deepEqual(fieldsNotShown(company, "<p>SAVIGN Private Limited</p>"), [
    "cin",
  ]);
  const hidden =
    '<p>SAVIGN Private Limited</p><meta content="U72900TG2024PTC1">';
  assert.deepEqual(fieldsNotShown(company, hidden), ["cin"]);
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
    "app/company.ts: cin is missing",
    "out/index.html: name is not shown",
  ]);
  const filled = writeCompany({ name: "SAVIGN Private Limited", cin: "U1" });
  const shownDir = writeTree({
    "index.html": cleanIndex + "<p>SAVIGN Private Limited</p><p>CIN U1</p>",
    "a.js": "1",
  });
  const shipped = await runChecks({
    outDir: shownDir,
    companyFile: filled,
    release: true,
  });
  assert.deepEqual(resultFor(shipped, "company").failures, []);
});

test("release fails a filled company file when the page lacks the block", async () => {
  const outDir = writeTree({ "index.html": cleanIndex, "a.js": "1" });
  const companyFile = writeCompany({
    name: "SAVIGN Private Limited",
    cin: "U1",
  });
  const results = await runChecks({ outDir, companyFile, release: true });
  assert.deepEqual(resultFor(results, "company").failures, [
    "out/index.html: name is not shown",
    "out/index.html: cin is not shown",
  ]);
});

test("release fails on blank company strings", async () => {
  const outDir = writeTree({ "index.html": cleanIndex, "a.js": "1" });
  const companyFile = writeCompany({ cin: "", phone: " ", email: "TBD" });
  const results = await runChecks({ outDir, companyFile, release: true });
  assert.deepEqual(resultFor(results, "company").failures, [
    "app/company.ts: cin is missing",
    "app/company.ts: phone is missing",
    "app/company.ts: email is missing",
  ]);
});

test("whole tree rules read copy attributes, style attributes and separators", async () => {
  const outDir = writeTree({
    "index.html":
      cleanIndex +
      '<img src="/x.png" width="1" height="1" alt="a top-notch lab">' +
      '<div style="border-radius:9999px;transition:all 0.2s">x</div>' +
      "<p>LinkedIn<!-- --> automation</p><pre>x</pre>",
    "a.js": "1",
    "s.css": ":root{--pill:9999px}a{border-radius:var(--pill)}",
  });
  const results = await runChecks({ outDir, release: false });
  const failures = (rule) => resultFor(results, rule).failures.join("\n");
  assert.match(failures("dashes"), /top-notch/);
  assert.match(failures("pill"), /index\.html: border-radius:9999px/);
  assert.match(failures("pill"), /s\.css: border-radius:var\(--pill\)/);
  assert.match(failures("transition"), /index\.html: transition:all 0\.2s/);
  assert.match(failures("forbidden"), /LinkedIn automation/);
  assert.match(failures("monospace elements"), /<pre>/);
});

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

function cliCopy() {
  const root = mkdtempSync(join(scratchRoot, "repo-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "app"));
  mkdirSync(join(root, "out"));
  copyFileSync(
    join(SCRIPTS_DIR, "check.mjs"),
    join(root, "scripts", "check.mjs"),
  );
  copyFileSync(
    join(SCRIPTS_DIR, "..", "app", "company.ts"),
    join(root, "app", "company.ts"),
  );
  writeFileSync(join(root, "out", "index.html"), cleanIndex);
  writeFileSync(join(root, "out", "a.js"), "1");
  return root;
}

function runCli(root, args) {
  return spawnSync(
    process.execPath,
    [join(root, "scripts", "check.mjs"), ...args],
    {
      encoding: "utf8",
    },
  );
}

test("CLI on default paths: shipped company.ts fails --release, passes without", () => {
  const root = cliCopy();
  const draft = runCli(root, []);
  assert.equal(draft.status, 0, draft.stderr);
  const release = runCli(root, ["--release"]);
  assert.equal(release.status, 1);
  assert.match(release.stderr, /app\/company\.ts: cin is missing/);
});

test("CLI exits 2 with usage on unknown flags and a bare --out", () => {
  const root = cliCopy();
  for (const args of [["--relase"], ["--out"], ["extra"]]) {
    const run = runCli(root, args);
    assert.equal(run.status, 2, args.join(" "));
    assert.match(run.stderr, /usage: node scripts\/check\.mjs/);
  }
});
