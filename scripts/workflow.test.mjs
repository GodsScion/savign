import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOW = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    ".github",
    "workflows",
    "deploy.yml",
  ),
  "utf8",
);

function section(start, end) {
  const from = WORKFLOW.indexOf(start);
  const to = end ? WORKFLOW.indexOf(end, from) : WORKFLOW.length;
  assert.ok(from !== -1 && to !== -1, `${start} section not found`);
  return WORKFLOW.slice(from, to);
}

test("every action is pinned to a full commit sha with its version in a comment", () => {
  const uses = WORKFLOW.match(/^\s*uses:.*$/gm) ?? [];
  assert.equal(uses.length, 5);
  for (const line of uses) {
    assert.match(
      line,
      /uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/,
      line,
    );
  }
});

test("only the deploy job holds the Pages write and OIDC token", () => {
  const workflowWide = section("permissions:", "\njobs:");
  const build = section("\n  build:", "\n  deploy:");
  const deploy = section("\n  deploy:");
  for (const part of [workflowWide, build]) {
    assert.doesNotMatch(part, /pages: write|id-token: write/);
  }
  assert.match(build, /contents: read/);
  assert.match(deploy, /pages: write/);
  assert.match(deploy, /id-token: write/);
});

test("the probe build test runs before the build and the release check after it", () => {
  const order = [
    "npm run test:build",
    "npm run build",
    "npm run check -- --release",
  ];
  const positions = order.map((step) => WORKFLOW.indexOf(`run: ${step}`));
  assert.ok(
    positions.every((position) => position !== -1),
    positions.join(","),
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
});
