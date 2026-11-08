import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";

// content/meta.ts imports "./notes" without an extension, as the Next bundler
// expects; Node needs the .ts suffix spelled out to load it.
function resolveExtensionlessTs(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
  const hasExtension = /\.[a-z]+$/i.test(specifier);
  if (isRelative && !hasExtension) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}

registerHooks({ resolve: resolveExtensionlessTs });

const { routeMeta, projectMeta, noteMeta } = await import("../content/meta.ts");
const { projects } = await import("../content/projects.ts");
const { notes } = await import("../content/notes.ts");

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

test("every project and note has its own route metadata", () => {
  assert.deepEqual(
    Object.keys(projectMeta).sort(),
    projects.map((project) => project.slug).sort(),
  );
  assert.deepEqual(
    Object.keys(noteMeta).sort(),
    notes.map((note) => note.slug).sort(),
  );
});

test("note metadata is the note's own title and description", () => {
  for (const note of notes) {
    assert.deepEqual(noteMeta[note.slug], {
      title: note.title,
      description: note.description,
      path: `/notes/${note.slug}/`,
    });
  }
});

test("every project links a note that exists", () => {
  const noteSlugs = new Set(notes.map((note) => note.slug));
  const broken = projects.filter((project) => !noteSlugs.has(project.noteSlug));
  assert.deepEqual(broken, []);
});

test("route titles and descriptions are unique", () => {
  const titles = new Set(routeMeta.map((meta) => meta.title));
  const descriptions = new Set(routeMeta.map((meta) => meta.description));
  assert.equal(titles.size, routeMeta.length);
  assert.equal(descriptions.size, routeMeta.length);
});

test(
  "every route in content/meta.ts builds to out/<route>/index.html",
  { skip: existsSync(outDir) ? false : "out/ is missing; run npm run build" },
  () => {
    const missing = routeMeta
      .map((meta) => join(outDir, meta.path, "index.html"))
      .filter((path) => !existsSync(path));
    assert.deepEqual(missing, []);
  },
);
