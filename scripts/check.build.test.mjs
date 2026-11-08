// Builds a throwaway Next app with every banned form planted and asserts check.mjs reports each one.
// Slow (a real next build), so it runs as `npm run test:build`, not in `npm test`.
// The probe lives in an ignored .probe-* folder inside the repo so Next resolves this repo's node_modules;
// Turbopack refuses a symlinked node_modules that points outside the project root.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runChecks } from "./check.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT_BIN = join(REPO_ROOT, "node_modules", "next", "dist", "bin", "next");
const BUILD_TIMEOUT_MS = 300_000;

const probeDir = mkdtempSync(join(REPO_ROOT, ".probe-"));

after(() => {
  rmSync(probeDir, { recursive: true, force: true });
});

const PROBE_FILES = {
  "package.json": JSON.stringify({ private: true, type: "module" }),
  "next.config.mjs":
    'export default { output: "export", images: { unoptimized: true } };',
  "app/globals.css":
    ":root { --pill: 9999px; }\n.pill { border-radius: var(--pill); }\n" +
    ".endless { border-radius: calc(infinity * 1px); }\n" +
    ".compound { font-family: GeistMono-Regular, serif; }\n",
  "app/layout.jsx": `import "./globals.css";
export const metadata = {
  title: "SAVIGN Private Limited",
  description: "Probe description — here",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  "app/page.jsx": `const first = "well";
const second = "known";
const network = "LinkedIn";
export default function Page() {
  return (
    <main>
      <p>
        {first}-{second}
      </p>
      <img src="/x.png" width="1" height="1" alt="a top-notch lab" />
      <a href="/" aria-label="first-rate link">
        home
      </a>
      <div style={{ borderRadius: 9999, transition: "all 0.2s" }}>style</div>
      <div className="pill">pill</div>
      <div className="endless">endless</div>
      <p className="compound">compound</p>
      <div style={{ transition: "0.2s" }}>bare transition</div>
      <code>probe</code>
      <p>{network} automation</p>
    </main>
  );
}
`,
  "company.mjs":
    'export const company = { name: "SAVIGN Private Limited", cin: "" };',
};

function writeProbe() {
  for (const [name, content] of Object.entries(PROBE_FILES)) {
    const path = join(probeDir, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

function buildProbe() {
  return spawnSync(process.execPath, [NEXT_BIN, "build", probeDir], {
    encoding: "utf8",
    timeout: BUILD_TIMEOUT_MS,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
}

test(
  "check.mjs reports every banned form a real Next build emits",
  { timeout: BUILD_TIMEOUT_MS + 60_000 },
  async () => {
    writeProbe();
    const build = buildProbe();
    assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
    const results = await runChecks({
      outDir: join(probeDir, "out"),
      companyFile: join(probeDir, "company.mjs"),
      release: true,
    });
    const failures = (rule) =>
      results
        .filter((result) => result.rule.startsWith(rule))
        .flatMap((result) => result.failures)
        .join("\n");
    assert.match(failures("dashes"), /well-known/, "React text separators");
    assert.match(failures("dashes"), /top-notch/, "alt text");
    assert.match(failures("dashes"), /first-rate/, "aria-label");
    assert.match(failures("dashes"), /description — here/, "meta description");
    assert.match(failures("pill"), /index\.html: border-radius:9999px/);
    assert.match(failures("pill"), /\.css: border-radius:var\(--pill\)/);
    assert.match(
      failures("pill"),
      /\.css: border-radius:(?:\d.*e\+?\d+px|calc)/,
    );
    assert.match(failures("monospace font"), /GeistMono-Regular/);
    assert.match(failures("transition"), /index\.html: transition:0\.2s/);
    assert.match(failures("transition"), /index\.html: transition:all 0\.2s/);
    assert.match(failures("monospace elements"), /<code>/);
    assert.match(failures("forbidden"), /LinkedIn automation/);
    assert.match(failures("company"), /cin is missing/);
    assert.match(failures("company"), /name is not shown/, "title only");
  },
);
