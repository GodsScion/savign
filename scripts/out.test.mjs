// Tests over the real build in out/. `npm test` skips them when out/ is missing (it runs before the build);
// `npm run test:out` sets REQUIRE_OUT=1, which turns a missing out/ into a failure, and deploy runs it after the build.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runChecks } from "./check.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "out");

export function outSkipReason(outDir, env) {
  if (existsSync(join(outDir, "index.html"))) {
    return null;
  }
  if (env.REQUIRE_OUT === "1") {
    throw new Error(
      `${outDir}/index.html is missing and REQUIRE_OUT=1; run npm run build first`,
    );
  }
  return `${outDir}/index.html is missing; run npm run build, or npm run test:out after it`;
}

test("a missing out/ skips by default and fails with REQUIRE_OUT=1", () => {
  const nowhere = join(OUT_DIR, "no-such-build");
  assert.match(outSkipReason(nowhere, {}), /is missing/);
  assert.throws(
    () => outSkipReason(nowhere, { REQUIRE_OUT: "1" }),
    /REQUIRE_OUT=1/,
  );
});

test("the real build in out/ passes every non-release rule", async (context) => {
  const skipReason = outSkipReason(OUT_DIR, process.env);
  if (skipReason) {
    context.skip(skipReason);
    return;
  }
  const results = await runChecks({ outDir: OUT_DIR, release: false });
  const failing = results.filter((result) => result.failures.length > 0);
  assert.deepEqual(failing, []);
});
