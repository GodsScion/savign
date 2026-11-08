// Gate over the built static export in out/. Run after `npm run build`.
// Usage: node scripts/check.mjs [--release] [--out <dir>]
// First load JS excludes nomodule scripts (legacy polyfills modern browsers skip); total JS counts every .js file.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FIRST_LOAD_JS_LIMIT = 160_000;
export const TOTAL_JS_LIMIT = 420_000;

const BINARY_EXTENSIONS = new Set([
  ".woff2",
  ".woff",
  ".ttf",
  ".otf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".gif",
  ".ico",
]);
const FONT_EXTENSIONS = new Set([".woff2", ".woff", ".ttf", ".otf"]);

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hyphen: "‐",
};

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] !== "#") {
      return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    }
    const isHex = body[1] === "x" || body[1] === "X";
    const code = isHex
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    return String.fromCodePoint(code);
  });
}

export function visibleText(html) {
  const withoutHidden = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  const withoutTags = withoutHidden.replace(/<[^>]*>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ");
}

function withoutUrls(text) {
  return text.replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ");
}

function contextAround(text, index) {
  return text.slice(Math.max(0, index - 20), index + 20).trim();
}

export function findDashes(text) {
  const searchable = withoutUrls(text);
  const pattern = /[—–]|\p{L}-\p{L}/gu;
  return [...searchable.matchAll(pattern)].map((match) =>
    contextAround(searchable, match.index),
  );
}

const FORBIDDEN_STRINGS = [
  /\bT[O]DO\b/g,
  /\bPLACEHOLDER\b/g,
  /lorem/gi,
  /auto_job_applier/gi,
  /linkedin bot/gi,
];

export function findForbiddenStrings(text) {
  return FORBIDDEN_STRINGS.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => match[0]),
  );
}

export function findMonoFonts(css) {
  return [...css.matchAll(/font-family\s*:[^;}]*mono[^;}]*/gi)].map(
    (match) => match[0],
  );
}

export function findPillRadius(css) {
  const radius =
    /border-radius\s*:[^;}]*(?<![\d.])(?:9999px|999px|50vh|100vh)/gi;
  const utility = /rounded-full/g;
  return [...css.matchAll(radius), ...css.matchAll(utility)].map(
    (match) => match[0],
  );
}

export function findTransitionAll(css) {
  return [...css.matchAll(/transition(?:-property)?\s*:\s*all\b/gi)].map(
    (match) => match[0],
  );
}

export function findImgWithoutSize(html) {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  return tags.filter((tag) => {
    const hasWidth = /\swidth\s*=/i.test(tag);
    const hasHeight = /\sheight\s*=/i.test(tag);
    return !(hasWidth && hasHeight);
  });
}

export function inlineStyles(html) {
  return [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
    (match) => match[1],
  );
}

export function referencedScripts(html) {
  const moduleScripts = (html.match(/<script\b[^>]*>/gi) ?? []).filter(
    (tag) => !/\snomodule\b/i.test(tag),
  );
  const scriptSrcs = moduleScripts
    .map((tag) => tag.match(/\ssrc="([^"]+)"/i))
    .filter(Boolean);
  const preloads = [
    ...html.matchAll(/<link\b(?=[^>]*\bas="script")[^>]*\shref="([^"]+)"/gi),
  ];
  const sources = [...scriptSrcs, ...preloads].map((match) => match[1]);
  return [...new Set(sources)];
}

export function nullFields(record) {
  return Object.entries(record)
    .filter(([, value]) => value === null)
    .map(([key]) => key);
}

export function gzipSize(buffer) {
  return gzipSync(buffer, { level: 9 }).length;
}

function listFiles(dir) {
  return readdirSync(dir, { recursive: true })
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isFile());
}

function localPath(outDir, src) {
  const pathname = src.split(/[?#]/)[0].replace(/^\//, "");
  return join(outDir, decodeURIComponent(pathname));
}

function kb(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

function fileFindings(files, outDir, read, find) {
  return files.flatMap((path) =>
    find(read(path)).map((hit) => `${relative(outDir, path)}: ${hit}`),
  );
}

function firstLoadJs(outDir, indexHtml) {
  const failures = [];
  let bytes = 0;
  for (const src of referencedScripts(indexHtml)) {
    if (/^(?:https?:)?\/\//.test(src)) {
      failures.push(`external script ${src}`);
      continue;
    }
    const path = localPath(outDir, src);
    if (!existsSync(path)) {
      failures.push(`missing script ${src}`);
      continue;
    }
    bytes += gzipSize(readFileSync(path));
  }
  return { bytes, failures };
}

function sizeResult(rule, bytes, limit, extraFailures = []) {
  const failures = [...extraFailures];
  if (bytes > limit) {
    failures.push(`${kb(bytes)} gz is over ${kb(limit)}`);
  }
  return { rule, failures, detail: `${kb(bytes)} gz (limit ${kb(limit)})` };
}

function fontResult(files, indexHtml) {
  const preloadedFonts = (indexHtml.match(/<link\b[^>]*\bas="font"/gi) ?? [])
    .length;
  const fonts = files.filter((path) => FONT_EXTENSIONS.has(extname(path)));
  const woff2Bytes = fonts
    .filter((path) => extname(path) === ".woff2")
    .reduce((sum, path) => sum + statSync(path).size, 0);
  return {
    rule: "font files (report only)",
    failures: [],
    detail: `${fonts.length} files, ${preloadedFonts} preloaded, woff2 ${kb(woff2Bytes)} raw`,
  };
}

async function companyResult(companyFile) {
  const { company } = await import(pathToFileURL(companyFile).href);
  const missing = nullFields(company);
  return {
    rule: "company fields (release)",
    failures: missing.map((key) => `app/company.ts: ${key} is null`),
    detail: missing.length === 0 ? "all set" : `${missing.length} null`,
  };
}

export async function runChecks({ outDir, companyFile, release }) {
  const indexPath = join(outDir, "index.html");
  if (!existsSync(indexPath)) {
    return [
      {
        rule: "build output",
        failures: [`${indexPath} is missing; run npm run build first`],
        detail: "",
      },
    ];
  }
  const files = listFiles(outDir);
  const read = (path) => readFileSync(path, "utf8");
  const htmlFiles = files.filter((path) => extname(path) === ".html");
  const cssFiles = files.filter((path) => extname(path) === ".css");
  const jsFiles = files.filter((path) => extname(path) === ".js");
  const textFiles = files.filter(
    (path) => !BINARY_EXTENSIONS.has(extname(path)),
  );
  const allCss = (path) =>
    extname(path) === ".css" ? read(path) : inlineStyles(read(path)).join("\n");
  const cssSources = [...cssFiles, ...htmlFiles];
  const cssRule = (rule, find) => ({
    rule,
    failures: fileFindings(cssSources, outDir, allCss, find),
    detail: `${cssSources.length} sources`,
  });

  const firstLoad = firstLoadJs(outDir, read(indexPath));
  const totalJs = jsFiles.reduce(
    (sum, path) => sum + gzipSize(readFileSync(path)),
    0,
  );

  const results = [
    {
      rule: "dashes in visible text",
      failures: fileFindings(
        htmlFiles,
        outDir,
        (path) => visibleText(read(path)),
        findDashes,
      ),
      detail: `${htmlFiles.length} html files`,
    },
    {
      rule: "forbidden strings",
      failures: fileFindings(textFiles, outDir, read, findForbiddenStrings),
      detail: `${textFiles.length} text files`,
    },
    cssRule("monospace font", findMonoFonts),
    cssRule("pill radius", findPillRadius),
    cssRule("transition: all", findTransitionAll),
    {
      rule: "img width and height",
      failures: fileFindings(htmlFiles, outDir, read, findImgWithoutSize),
      detail: `${htmlFiles.length} html files`,
    },
    sizeResult(
      "first load JS",
      firstLoad.bytes,
      FIRST_LOAD_JS_LIMIT,
      firstLoad.failures,
    ),
    sizeResult("total JS", totalJs, TOTAL_JS_LIMIT),
    fontResult(files, read(indexPath)),
  ];
  if (release) {
    results.push(await companyResult(companyFile));
  }
  return results;
}

export function formatTable(results) {
  const rows = results.map((result) => [
    result.failures.length === 0 ? "PASS" : "FAIL",
    result.rule,
    result.detail,
  ]);
  const widths = [
    4,
    ...[1, 2].map((column) =>
      Math.max(...rows.map((row) => row[column].length)),
    ),
  ];
  const line = (row) =>
    row.map((cell, column) => cell.padEnd(widths[column])).join("  ");
  return rows.map(line).join("\n");
}

function parseArgs(argv) {
  const outFlag = argv.indexOf("--out");
  return {
    release: argv.includes("--release"),
    outDir: outFlag === -1 ? null : argv[outFlag + 1],
  };
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const args = parseArgs(process.argv.slice(2));
  const results = await runChecks({
    outDir: args.outDir ?? join(root, "out"),
    companyFile: join(root, "app", "company.ts"),
    release: args.release,
  });
  console.log(formatTable(results));
  const failures = results.flatMap((result) =>
    result.failures.map((failure) => `${result.rule}: ${failure}`),
  );
  if (failures.length > 0) {
    console.error(`\ncheck failed, ${failures.length} problem(s):`);
    for (const failure of failures) {
      console.error(`  ${failure}`);
    }
    process.exit(1);
  }
  console.log("\ncheck passed");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
