// Gate over the built static export in out/. Run after `npm run build`.
// Usage: node scripts/check.mjs [--release] [--out <dir>]
// First load JS excludes nomodule scripts (legacy polyfills modern browsers skip); total JS counts every .js file.
import {
  readdirSync,
  readFileSync,
  existsSync,
  statSync,
  realpathSync,
} from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

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

// Phrasing elements join their text to the neighbours, so removing them must not add a space.
const INLINE_TAGS = [
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
];
const INLINE_TAG = new RegExp(
  `<\\/?(?:${INLINE_TAGS.join("|")})\\b[^>]*>`,
  "gi",
);

function withoutScripts(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
}

// React separates adjacent text nodes with <!-- -->, so a comment joins its neighbours with nothing.
export function visibleText(html) {
  const text = withoutScripts(html)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(INLINE_TAG, "")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(text).replace(/\s+/g, " ");
}

const COPY_ATTRIBUTES = new Set([
  "alt",
  "title",
  "aria-label",
  "aria-description",
  "placeholder",
]);
const COPY_META = /^(?:description|og:.+|twitter:.+)$/i;
const URL_VALUE = /^(?:https?:)?\//i;

function tagAttributes(tag) {
  const pairs = tag.matchAll(/([^\s=/>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g);
  return Object.fromEntries(
    [...pairs].map((pair) => [
      pair[1].toLowerCase(),
      decodeEntities(pair[2] ?? pair[3]),
    ]),
  );
}

function tagsOf(html) {
  return (
    withoutScripts(html)
      .replace(/<!--[\s\S]*?-->/g, " ")
      .match(/<[a-z][^>]*>/gi) ?? []
  );
}

function copyValues(tag) {
  const attributes = tagAttributes(tag);
  const values = Object.entries(attributes)
    .filter(([name]) => COPY_ATTRIBUTES.has(name))
    .map(([, value]) => value);
  const metaName = attributes.name ?? attributes.property ?? "";
  const isCopyMeta = /^<meta\b/i.test(tag) && COPY_META.test(metaName);
  if (isCopyMeta && attributes.content && !URL_VALUE.test(attributes.content)) {
    values.push(attributes.content);
  }
  return values;
}

// Text a person reads or hears: alt, labels, titles and the meta copy search results show.
export function attributeText(html) {
  return tagsOf(html).flatMap(copyValues);
}

export function copyText(html) {
  return [visibleText(html), ...attributeText(html)].join("\n");
}

export function styleAttributes(html) {
  return tagsOf(html)
    .map((tag) => tagAttributes(tag).style)
    .filter((style) => style !== undefined);
}

function withoutUrls(text) {
  return text.replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ");
}

function contextAround(text, index) {
  return text.slice(Math.max(0, index - 20), index + 20).trim();
}

export function findDashes(text) {
  const searchable = withoutUrls(text);
  const pattern = /[\u2010-\u2015\u2212]|\p{L}-\p{L}/gu;
  return [...searchable.matchAll(pattern)].map((match) =>
    contextAround(searchable, match.index),
  );
}

const SEPARATOR = "[\\s_-]*";

// The wall: the site never names the job application bot or LinkedIn automation in any spelling.
export const BOT_WALL_PATTERNS = [
  new RegExp(`auto${SEPARATOR}job${SEPARATOR}applier`, "gi"),
  new RegExp(
    `linked${SEPARATOR}in\\b(?:[\\s_-]+\\w+){0,3}?[\\s_-]+(?:automation|automator|bots?|auto${SEPARATOR}appl(?:y|ier))\\b`,
    "gi",
  ),
  new RegExp(
    `easy${SEPARATOR}apply[\\s_-]+(?:bots?|automation|automator)\\b`,
    "gi",
  ),
];

const FORBIDDEN_STRINGS = [
  /\bT[O]DO\b/g,
  /\bPLACEHOLDER\b/g,
  /lorem/gi,
  ...BOT_WALL_PATTERNS,
];

export function findForbiddenStrings(text) {
  return FORBIDDEN_STRINGS.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => match[0]),
  );
}

// Every custom property defined in the css, last definition wins as in the cascade for one selector.
export function customProperties(css) {
  const definitions = css.matchAll(/(--[\w-]+)\s*:\s*([^;}]*)/g);
  return new Map([...definitions].map((match) => [match[1], match[2].trim()]));
}

export function resolveVars(value, vars, depth = 0) {
  if (depth > 10) {
    return value;
  }
  const resolved = value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,([^()]*))?\)/g,
    (match, name, fallback) => vars.get(name) ?? fallback ?? match,
  );
  return resolved === value ? value : resolveVars(resolved, vars, depth + 1);
}

function declarations(css, property) {
  const pattern = new RegExp(`(?<![\\w-])(${property})\\s*:\\s*([^;}]*)`, "gi");
  return [...css.matchAll(pattern)].map((match) => ({
    text: match[0].trim(),
    value: match[2],
  }));
}

function findDeclarations(css, vars, property, isBanned) {
  return declarations(css, property)
    .filter((declaration) => isBanned(resolveVars(declaration.value, vars)))
    .map((declaration) => declaration.text);
}

// "mono" anywhere catches monospace, ui-monospace and compound names such as GeistMono-Regular or IBMPlexMono.
const MONO_FONT =
  /mono|menlo|consolas|courier|monaco|fira\s*code|source\s*code\s*pro/i;

export function findMonoFonts(css, vars = customProperties(css)) {
  return findDeclarations(css, vars, "font(?:-family)?", (value) =>
    MONO_FONT.test(value),
  );
}

// The site shows no code, so an element the browser renders in monospace is a failure by itself.
export function findMonoElements(html) {
  return withoutScripts(html).match(/<(?:code|pre|kbd|samp)\b[^>]*>/gi) ?? [];
}

const PILL_PX = 999;
const PX_PER_EM = 16;

function isPillLength(amount, unit) {
  const lower = unit.toLowerCase();
  if (lower === "%") {
    return amount >= 50;
  }
  if (/^[dsl]?v(?:h|w|min|max)$/.test(lower)) {
    return amount >= 50;
  }
  if (lower === "rem" || lower === "em") {
    return amount * PX_PER_EM >= PILL_PX;
  }
  return lower === "px" && amount >= PILL_PX;
}

function isPillRadius(value) {
  if (/infinity/i.test(value)) {
    return true;
  }
  const lengths = value.matchAll(
    /(\d*\.?\d+(?:e[+-]?\d+)?)(px|r?em|%|[dsl]?v(?:h|w|min|max))/gi,
  );
  return [...lengths].some((match) => isPillLength(Number(match[1]), match[2]));
}

export function findPillRadius(css, vars = customProperties(css)) {
  const radii = findDeclarations(
    css,
    vars,
    "border(?:-[a-z]+)*-radius",
    isPillRadius,
  );
  const utilities = css.match(/rounded-full/g) ?? [];
  return [...radii, ...utilities];
}

const TIMING_TOKEN =
  /^(?:-?\d*\.?\d+m?s|ease(?:-in|-out|-in-out)?|linear|step-start|step-end|allow-discrete|normal)$/i;
const TIMING_FUNCTION = /(?:cubic-bezier|steps|linear)\([^()]*\)/gi;

// A transition item with no property name, like `transition: 0.2s`, transitions all properties.
function isTransitionAllItem(item) {
  const tokens = item.trim().split(/\s+/).filter(Boolean);
  if (tokens.some((token) => /^all$/i.test(token))) {
    return true;
  }
  return tokens.length > 0 && tokens.every((token) => TIMING_TOKEN.test(token));
}

function isTransitionAll(value) {
  const items = value.replace(TIMING_FUNCTION, "linear").split(",");
  return items.some(isTransitionAllItem);
}

export function findTransitionAll(css, vars = customProperties(css)) {
  return findDeclarations(
    css,
    vars,
    "transition(?:-property)?",
    isTransitionAll,
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

// Style blocks plus every style="" attribute, each wrapped as a rule so declarations end at }.
export function htmlCss(html) {
  const attributes = styleAttributes(html).map((style) => `[style]{${style}}`);
  return [...inlineStyles(html), ...attributes].join("\n");
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

const MISSING_VALUE = /^(?:tbd|t[o]do|n\/?a|pending|awaiting(?:\s.*)?)?$/i;

export function isMissing(value) {
  if (value === null || value === undefined) {
    return true;
  }
  return MISSING_VALUE.test(String(value).trim());
}

export function missingFields(record) {
  return Object.entries(record)
    .filter(([, value]) => isMissing(value))
    .map(([key]) => key);
}

function normalised(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

// Rule 26: each value must be shown on the home page, not only set in app/company.ts.
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);
const HIDDEN_ATTRIBUTE =
  /\s(?:hidden(?=[\s=/>])|aria-hidden\s*=\s*["']?true\b)/i;

// Index just past the tag that closes the element opened at start, counting nested same-name tags.
function elementEnd(html, start, name) {
  const tags = new RegExp(`<(/?)${name}\\b[^>]*>`, "gi");
  tags.lastIndex = start;
  let depth = 0;
  let match = tags.exec(html);
  while (match) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      return tags.lastIndex;
    }
    match = tags.exec(html);
  }
  return html.length;
}

export function withoutHiddenElements(html) {
  const opening = /<([a-z][\w-]*)\b[^>]*>/gi;
  let kept = "";
  let cursor = 0;
  let match = opening.exec(html);
  while (match) {
    if (HIDDEN_ATTRIBUTE.test(match[0])) {
      const isVoid = VOID_TAGS.has(match[1].toLowerCase());
      const end = isVoid
        ? opening.lastIndex
        : elementEnd(html, match.index, match[1]);
      kept += html.slice(cursor, match.index);
      cursor = end;
      opening.lastIndex = end;
    }
    match = opening.exec(html);
  }
  return kept + html.slice(cursor);
}

// Text a visitor sees in the page body: no head, no title, no hidden or aria-hidden element.
export function bodyText(html) {
  const withoutHead = withoutScripts(html)
    .replace(/<head\b[\s\S]*?<\/head>/gi, " ")
    .replace(/<title\b[\s\S]*?<\/title>/gi, " ");
  return visibleText(withoutHiddenElements(withoutHead));
}

export function fieldsNotShown(record, html) {
  const shown = normalised(bodyText(html));
  return Object.entries(record)
    .filter(([, value]) => !isMissing(value))
    .filter(([, value]) => !shown.includes(normalised(String(value))))
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

async function companyResult(companyFile, indexHtml) {
  const { company } = await import(pathToFileURL(companyFile).href);
  const missing = missingFields(company);
  const notShown = fieldsNotShown(company, indexHtml);
  return {
    rule: "company fields (release)",
    failures: [
      ...missing.map((key) => `app/company.ts: ${key} is missing`),
      ...notShown.map((key) => `out/index.html: ${key} is not shown`),
    ],
    detail: `${missing.length} missing, ${notShown.length} not shown`,
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
    extname(path) === ".css" ? read(path) : htmlCss(read(path));
  const cssSources = [...cssFiles, ...htmlFiles];
  const vars = customProperties(cssSources.map(allCss).join("\n"));
  const cssRule = (rule, find) => ({
    rule,
    failures: fileFindings(cssSources, outDir, allCss, (css) =>
      find(css, vars),
    ),
    detail: `${cssSources.length} sources`,
  });
  const readForbidden = (path) =>
    extname(path) === ".html"
      ? `${read(path)}\n${copyText(read(path))}`
      : read(path);

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
        (path) => copyText(read(path)),
        findDashes,
      ),
      detail: `${htmlFiles.length} html files`,
    },
    {
      rule: "forbidden strings",
      failures: fileFindings(textFiles, outDir, readForbidden, (text) => [
        ...new Set(findForbiddenStrings(text)),
      ]),
      detail: `${textFiles.length} text files`,
    },
    cssRule("monospace font", findMonoFonts),
    {
      rule: "monospace elements",
      failures: fileFindings(htmlFiles, outDir, read, findMonoElements),
      detail: `${htmlFiles.length} html files`,
    },
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
    results.push(await companyResult(companyFile, read(indexPath)));
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

const USAGE = "usage: node scripts/check.mjs [--release] [--out <dir>]";

function parseCliArgs(argv) {
  try {
    const { values } = parseArgs({
      args: argv,
      options: { release: { type: "boolean" }, out: { type: "string" } },
    });
    return { release: values.release ?? false, outDir: values.out ?? null };
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exit(2);
  }
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const args = parseCliArgs(process.argv.slice(2));
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

// realpath, because a script run through a symlinked dir (macOS /var) has a resolved import.meta.url.
function isEntryPoint() {
  const entry = process.argv[1];
  return (
    Boolean(entry) &&
    import.meta.url === pathToFileURL(realpathSync(entry)).href
  );
}

if (isEntryPoint()) {
  await main();
}
