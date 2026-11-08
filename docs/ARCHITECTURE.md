# How www.savign.org works

Written for the person who has to explain this site to a peer. It covers how a visit is served, how each page is
built, where the words live, the SEO layer, and the gates that stop a bad build from shipping. Paths are relative to
the repo root; `file:line` points at the line that does the thing.

## 1. How a request is served

There is no server of ours. A visit to `https://www.savign.org/work/trail/` is answered by GitHub Pages, which serves
the static file `out/work/trail/index.html` from the last deploy. Nothing runs per request: no API, no database, no
cookies, no analytics.

- `next.config.ts:4` sets `output: "export"`, so `next build` writes plain HTML, CSS and JS into `out/` instead of
  starting a Node server.
- `next.config.ts:6` sets `trailingSlash: true`, so every route is a folder with an `index.html`
  (`/work/trail/` becomes `out/work/trail/index.html`). Every canonical URL and sitemap entry ends in `/` to match.
- `next.config.ts:5` turns off the image optimiser, which needs a server; images ship as they are.
- `.github/workflows/deploy.yml` runs on every push to `main` (line 3 onwards): install, lint, format check, tests,
  build, the out/ tests, the release check, then uploads `out/` as the Pages artifact and deploys it.

The browser then gets the HTML with all the text already in it, so every page reads with JavaScript off. React
hydrates on top for links and, once merged, the scene.

## 2. How Next static export builds each route

Next's App Router maps folders under `app/` to URLs. A `page.tsx` is the page for its folder; `layout.tsx` wraps every
page. All pages here are React Server Components: they run once at build time, never in the browser, unless a file
says `"use client"`.

| URL              | File                        | How it is built                                                                                                                            |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`              | `app/page.tsx`              | one static page (home, owned by the shell package)                                                                                         |
| `/work/`         | `app/work/page.tsx`         | lists `projects` from `content/projects.ts`                                                                                                |
| `/work/<slug>/`  | `app/work/[slug]/page.tsx`  | `generateStaticParams` (line 12) returns one entry per project; `dynamicParams = false` (line 10) makes any other slug a 404 at build time |
| `/about/`        | `app/about/page.tsx`        | static; reuses `CompanyInfo`                                                                                                               |
| `/founder/`      | `app/founder/page.tsx`      | reads `content/founder.ts`                                                                                                                 |
| `/notes/`        | `app/notes/page.tsx`        | lists `notes` from `content/notes.ts`, newest first                                                                                        |
| `/notes/<slug>/` | `app/notes/[slug]/page.tsx` | `generateStaticParams` (line 15) returns one entry per note; `dynamicParams = false` (line 13)                                             |
| `/contact/`      | `app/contact/page.tsx`      | reads `app/company.ts` through `CompanyInfo`                                                                                               |
| `/privacy/`      | `app/privacy/page.tsx`      | static text                                                                                                                                |
| `/404.html`      | `app/not-found.tsx`         | GitHub Pages serves it for any unknown path                                                                                                |

`app/layout.tsx` sets `<html lang="en-IN">`, loads the two fonts through `next/font` (self hosted at build, no request
to Google at runtime) and sets `metadataBase` (line 21), which turns every relative URL in metadata into an absolute
`https://www.savign.org/...` URL.

Each page exports `metadata` (or `generateMetadata` for the two dynamic routes). Next reads it at build time and
writes the `<title>`, description, canonical link and Open Graph tags into that page's `<head>`.

Shared page parts: `app/notes/Breadcrumbs.tsx` (the visible breadcrumb trail), `app/notes/KeepReading.tsx` (the
"Next project" / "Next note" links), `app/notes/date.ts` (formats a note date), `app/contact/CompanyInfo.tsx` (the
company details list; a null field renders "Awaiting confirmation").

## 3. Where the words live

Pages hold layout; the words live in typed modules under `content/` so one edit changes every place a string appears.

| Module                | What it holds                                                                                                                                       | Read by                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `content/projects.ts` | the four projects: slug, h1, lead, stage and its label, what it does, how it works, measured lines, status, the note it links                       | `/work/`, `/work/<slug>/`, note pages (project link) |
| `content/notes.ts`    | the notes: slug, title, description, date, author, project slug, and the body as typed blocks (paragraph, heading, list, quote)                     | `/notes/`, `/notes/<slug>/`, `content/meta.ts`       |
| `content/founder.ts`  | the founder page text and portrait                                                                                                                  | `/founder/`                                          |
| `content/meta.ts`     | the title, description and path of every inner route; note entries are derived from `content/notes.ts` (line 66), so a note's title is written once | every inner page's metadata                          |
| `app/company.ts`      | the company record (name, CIN, registered office, phone, email, grievance contact); null until confirmed                                            | `/contact/`, `/about/`, the release check            |

## 4. SEO layer

Built in pkg/seo, documented when merged.

## 5. The scene and the shell

The persistent WebGL scene is built in pkg/scene and the header, footer, home page and global styles in pkg/shell;
documented when merged.

## 6. Gates: what checks a build, and when

| Gate                         | What it does                                                                                                                                            | When it runs                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run lint`               | ESLint with the Next rules and `curly: all` (`eslint.config.mjs`)                                                                                       | every commit locally, CI                                             |
| `npm run format:check`       | Prettier over the repo                                                                                                                                  | every commit locally, CI                                             |
| `npm test`                   | the fast unit tests (below); the out/ test skips if there is no build                                                                                   | merge hook, CI before the build                                      |
| `npm run test:build`         | `scripts/check.build.test.mjs` builds a throwaway Next app with every banned form planted and asserts `check.mjs` catches each one; slow (a real build) | CI, and before a release                                             |
| `npm run build`              | `next build` into `out/`                                                                                                                                | CI                                                                   |
| `npm run test:out`           | `scripts/out.test.mjs` with `REQUIRE_OUT=1`: runs every non-release rule of `check.mjs` on the real `out/`, and fails if `out/` is missing              | CI after the build                                                   |
| `npm run check`              | `scripts/check.mjs` over `out/`                                                                                                                         | after every build                                                    |
| `npm run check -- --release` | the same plus the company fields: fails while any `app/company.ts` field is null                                                                        | CI before deploy, so the site cannot ship with blank company details |
| `npm run qa -- <dir>`        | `scripts/qa.mjs`: Lighthouse mobile and desktop and screenshots; needs `QA_TOOLS`                                                                       | by hand at review time, not in CI                                    |

What `scripts/check.mjs` checks (`runChecks`, line 522): the build exists; first load JS within 160 kB gzip and total
JS within 420 kB; no dashes or hyphens in visible text, alt, aria, title or meta copy (URLs excepted); no forbidden
strings (leftover placeholder words and the bot wall patterns, `BOT_WALL_PATTERNS` line 182); no monospace font and
no pill radius in any CSS; no `transition: all`; every `<img>` has a width and height; a report only line on font
files; and with `--release`, every `app/company.ts` field is filled and shown on the home page. `main` (line 641) prints a table and exits 1 on any failure.

## 7. Every module over 100 lines

| Module                         | What it does                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check.mjs`            | the build gate over `out/` described in section 6                                                                                                       |
| `scripts/qa.mjs`               | review time QA: serves `out/` on a local port, runs Lighthouse three times per form factor and takes the median, takes screenshots at 390, 768 and 1440 |
| `content/projects.ts`          | the four project records, typed by `Project`                                                                                                            |
| `content/notes.ts`             | the note records and their body blocks, typed by `Note`                                                                                                 |
| `app/notes/[slug]/page.tsx`    | renders one note: its blocks, byline, project link and next note                                                                                        |
| `scripts/check.test.mjs`       | unit tests for each `check.mjs` finder on small HTML and CSS strings                                                                                    |
| `scripts/qa.test.mjs`          | unit tests for the QA gate logic and its CLI, with no browser                                                                                           |
| `scripts/check.build.test.mjs` | the planted probe build described in section 6                                                                                                          |
