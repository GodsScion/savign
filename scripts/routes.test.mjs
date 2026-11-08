import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { routeMeta, projectMeta, noteMeta } from "../content/meta.ts";
import { projects } from "../content/projects.ts";
import { notes } from "../content/notes.ts";

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
