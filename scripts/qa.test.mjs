import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { serve, gateFailures, reportGates } from "./qa.mjs";

const scratchRoot = mkdtempSync(join(tmpdir(), "savign-qa-test-"));

after(() => {
  rmSync(scratchRoot, { recursive: true, force: true });
});

const passing = {
  performance: 95,
  accessibility: 100,
  CLS: 0.01,
};

test("gate failures: perf or accessibility under 90 or CLS over 0.1 on either form factor", () => {
  assert.deepEqual(gateFailures({ mobile: passing, desktop: passing }), []);
  const failures = gateFailures({
    mobile: { ...passing, performance: 89 },
    desktop: { ...passing, accessibility: 85, CLS: 0.2 },
  });
  assert.deepEqual(failures, [
    "mobile performance 89 < 90",
    "desktop accessibility 85 < 90",
    "desktop CLS 0.2 > 0.1",
  ]);
});

test("report gates sets exit code 1 on a failure unless --allow-fail", (context) => {
  context.mock.method(console, "error", () => {});
  context.mock.method(console, "log", () => {});
  const before = process.exitCode;
  try {
    reportGates(["mobile performance 40 < 90"], true);
    assert.equal(process.exitCode, before);
    reportGates([], false);
    assert.equal(process.exitCode, before);
    reportGates(["mobile performance 40 < 90"], false);
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = before;
  }
});

function rawGet(url, path) {
  return new Promise((done, fail) => {
    const target = new URL(url);
    const outgoing = request(
      { host: target.hostname, port: target.port, path, method: "GET" },
      (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          done({ status: response.statusCode, body });
        });
      },
    );
    outgoing.on("error", fail);
    outgoing.end();
  });
}

test(
  "the QA server answers a bad escape with 400 and stays up",
  { timeout: 10_000 },
  async () => {
    const siteDir = join(scratchRoot, "bad-escape", "out");
    mkdirSync(siteDir, { recursive: true });
    writeFileSync(join(siteDir, "index.html"), "<h1>home</h1>");
    const { server, url } = await serve(siteDir);
    try {
      assert.equal((await rawGet(url, "/%E0%A4%A")).status, 400);
      const home = await rawGet(url, "/");
      assert.equal(home.status, 200);
      assert.equal(home.body, "<h1>home</h1>");
    } finally {
      server.close();
    }
  },
);

test(
  "the QA server never serves a file outside out/",
  { timeout: 10_000 },
  async () => {
    const root = join(scratchRoot, "containment");
    const siteDir = join(root, "out");
    mkdirSync(siteDir, { recursive: true });
    mkdirSync(join(root, "out-evil"));
    writeFileSync(join(siteDir, "index.html"), "<h1>home</h1>");
    writeFileSync(join(root, "secret.txt"), "SECRET");
    writeFileSync(join(root, "out-evil", "secret.txt"), "SECRET");
    const { server, url } = await serve(siteDir);
    try {
      for (const path of [
        "/../secret.txt",
        "/%2e%2e/secret.txt",
        "/..%2fsecret.txt",
        "/..%2fout-evil%2fsecret.txt",
        "/../out-evil/secret.txt",
        "/a%00b",
      ]) {
        const response = await rawGet(url, path);
        assert.equal(response.status, 404, path);
        assert.doesNotMatch(response.body, /SECRET/, path);
      }
    } finally {
      server.close();
    }
  },
);

test("qa CLI exits 2 with usage on unknown flags or a missing output dir", () => {
  const qa = join(dirname(fileURLToPath(import.meta.url)), "qa.mjs");
  for (const args of [[], ["--bogus", "/tmp/x"], ["a", "b"]]) {
    const run = spawnSync(process.execPath, [qa, ...args], {
      encoding: "utf8",
    });
    assert.equal(run.status, 2, args.join(" "));
    assert.match(run.stderr, /usage: node scripts\/qa\.mjs/);
  }
});

test("importing qa.mjs from node -e does not run or crash the CLI", () => {
  const qa = join(dirname(fileURLToPath(import.meta.url)), "qa.mjs");
  const run = spawnSync(
    process.execPath,
    ["-e", `import(${JSON.stringify(qa)})`],
    {
      encoding: "utf8",
    },
  );
  assert.equal(run.status, 0, run.stderr);
});
