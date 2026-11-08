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
| `/work/<slug>/`  | `app/work/[slug]/page.tsx`  | `generateStaticParams` (line 14) returns one entry per project; `dynamicParams = false` (line 12) makes any other slug a 404 at build time |
| `/about/`        | `app/about/page.tsx`        | static; reuses `CompanyInfo`                                                                                                               |
| `/founder/`      | `app/founder/page.tsx`      | reads `content/founder.ts`                                                                                                                 |
| `/notes/`        | `app/notes/page.tsx`        | lists `notes` from `content/notes.ts`, newest first                                                                                        |
| `/notes/<slug>/` | `app/notes/[slug]/page.tsx` | `generateStaticParams` (line 17) returns one entry per note; `dynamicParams = false` (line 15)                                             |
| `/contact/`      | `app/contact/page.tsx`      | reads `app/company.ts` through `CompanyInfo`                                                                                               |
| `/privacy/`      | `app/privacy/page.tsx`      | static text                                                                                                                                |
| `/404.html`      | `app/not-found.tsx`         | GitHub Pages serves it for any unknown path                                                                                                |

`app/layout.tsx` sets `<html lang="en-IN">`, loads the two fonts through `next/font` (self hosted at build, no request
to Google at runtime) and sets `metadataBase` (line 21), which turns every relative URL in metadata into an absolute
`https://www.savign.org/...` URL.

Each page exports `metadata` (or `generateMetadata` for the two dynamic routes), built by `buildMetadata` from its
`content/meta.ts` entry (section 4). Next reads it at build time and writes the `<title>`, description, canonical link,
Open Graph and twitter tags into that page's `<head>`.

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

One rule holds it together: `content/meta.ts` and `content/notes.ts` are the only place a route's title, description
and path are written. Everything below reads them.

- `app/lib/seo.ts` turns a `PageMeta` into Next `Metadata`. `sitePages` (line 16) is every page, home first.
  `buildMetadata` (line 52) sets the title, description, absolute canonical, Open Graph (with the page's card)
  and twitter card. `pageTitle` (line 29) appends " | SAVIGN" only when the title does not already name SAVIGN and the
  result stays within 60 characters, so Google does not cut it. `assertPagePath` (line 22) throws on a path without a
  trailing slash: such a canonical would point at a URL GitHub Pages answers with a redirect. `lastModified` (line 42)
  gives a note its own date and every other page the site date.
- `app/lib/jsonld.ts` builds the structured data Google reads, as plain objects, and `JsonLd` (line 160) renders one
  as `<script type="application/ld+json">`; `serializeJsonLd` (line 156) escapes every `<`, so text can never close
  the tag. Which page carries what: home gets `organizationJsonLd` and `websiteJsonLd` (wired by the shell package);
  `/founder/` gets `profilePageJsonLd` (a ProfilePage around the Person, with LinkedIn as `sameAs`); each project page
  gets `breadcrumbJsonLd`; each note gets `articleJsonLd` (a BlogPosting built from the `content/notes.ts` Note) and
  `breadcrumbJsonLd`. Nodes that point at the Organization or the Person by `@id` also carry `@type` and `name`.
  `companyContactFields` (line 40) adds address, telephone, email and the CIN to the Organization once
  `app/company.ts` has them; a null field is left out.
- `app/sitemap.ts`, `app/robots.ts` and `app/manifest.ts` are Next metadata routes; with `force-static` they build to
  `out/sitemap.xml`, `out/robots.txt` and `out/manifest.webmanifest`. The sitemap lists `sitePages` with a lastmod.
- Icons: `app/icon.svg` (the monogram, pure paths), `app/apple-icon.png` (180), `app/favicon.ico` (16, 32 and 48);
  Next links them from every page's head. `public/og/<route>.png` holds one 1200x630 share card per page.
- `scripts/og.mjs` renders the cards and icons with headless Chromium and they are committed, so the build stays
  static. It runs by hand after a build (`QA_TOOLS=<node_modules with playwright-core> node scripts/og.mjs`): it walks
  `sitePages`, reads each page's h1 from `out/<path>/index.html` (`headlineFromHtml`), and draws it with the site's own
  fonts. Rerun it after an h1 changes.
- `public/<32 hex>.txt` is the IndexNow key, public by design, which lets the site tell search engines a page changed.

## 5. The scene and the shell

The persistent WebGL scene is documented in section 8. The shell is everything in
`app/layout.tsx` around a page, plus the home page and the global styles.

**What wraps every page** (`app/layout.tsx`). Before first paint an inline script (`motionFlags`, line 27) adds
`html.js`, and `html.motion` when the visitor has not asked for reduced motion. CSS may dim or offset content only
under `html.js`, and move it only under `html.motion`, so with JS off or reduced motion everything is at rest and
readable. The body then holds, in order: the skip link (to `#content`), the 2px progress line, the server rendered
`.scene-fallback` (line 55: ground with a soft marigold glow, so there is never a blank or a pop in), `SceneMount`
(line 56), `Header`, the page inside `div#content`, `Footer` and `MotionRoot` (line 62).

**The scene slot** (`app/components/SceneMount.tsx`). A client component that loads the scene with
`next/dynamic(..., { ssr: false })`, so three.js never reaches the server render or the first load bundle. Today
`loadScene` imports `app/scene/SceneRoot.tsx`. Each home section carries `data-scene` (hero, work, principles, founder,
contact) and every inner page sets it on its `<main>`, so the scene can pick a pose per route and per section.

**Header and menu** (`app/components/Header.tsx`, `MenuSheet.tsx`, `IndiaClock.tsx`). The header is fixed. It turns
solid after 40px of scroll and hides on scroll down (`app/motion/header.ts`). Keyboard focus inside it shows it at
once with no slide. Below 720px the links move into a full screen sheet: the toggle has `aria-expanded`, opening
focuses the first link, Tab and Shift+Tab wrap inside the sheet (`trapTab`), Esc closes it and returns focus to the
toggle, and Lenis is stopped while it is open (`useScrollLock`). With JS off the links show inline instead. The clock
renders nothing until its first reading on the client, and is hidden with JS off.

**The frame loop** (`app/motion/ticker.ts`). One `requestAnimationFrame` loop serves the whole site.
`onFrame(callback)` (line 62) subscribes and returns an unsubscribe. A callback returns `true` while it is still
moving. After a frame where nothing returned true and no input arrived for `INPUT_GRACE_MS` (600 ms), the loop
stops requesting frames. Wheel, touch, keys, scroll, pointer, click and resize wake it (`wakeTicker`, line 42).
Measured: about 0 to 2 frames a second at idle (`scripts/behavior.test.mjs`), where Lenis's own loop asked for 61.
The scene subscribes through `app/scene/driver.ts` and returns true only while it is busy (section 8).

**Smooth scroll** (`app/motion/smoothScroll.ts`). Lenis 1.3.27 with `autoRaf: false`, driven by `onFrame`. It is
created only for fine pointers without reduced motion, so phones keep native momentum. Two details:

- After the loop sleeps, Lenis would see a gap of seconds and jump to the end, so a gap over 100 ms counts as one frame.
- Same page `#` links glide through `glideToAnchor` (line 35). It measures the target from the real scroll position
  and the CSS `scroll-padding-top`, pushes the hash, and moves the keyboard start point to the target, so the skip
  link still works.

`startSmoothScroll` uses a generation counter, so a stop that lands while Lenis is still importing cancels that start.

**Scroll effects** (`app/motion/scrollFrame.ts`). `onScrollFrame({ measure, apply })` (line 31) runs on the ticker
only on frames where the scroll position or viewport changed. Every effect measures first, then every effect applies
(`runEffects`, line 20), so layout is read once per frame and never after a style write. The effects:

- `progress.ts` sets the top line's `scaleX`.
- `header.ts` sets `is-solid` and `is-hidden`.
- `scrubWords.ts` brightens the principles teaser word by word. Unlit words keep 3:1 contrast, and a line whose
  progress did not change is not written.
- `footerMark.ts` uncovers the footer wordmark with `clip-path`.

**Pointer and enter effects.**

- `rise.ts` lifts the work rows once, with an IntersectionObserver.
- `magnetic.ts` leans the contact email toward a pointer within 12px. It samples the pointer once per ticker frame.

`MotionRoot.tsx` starts Lenis, the progress line and the header once. On each route it binds the page effects, and
only when motion is allowed.

**Home** (`app/page.tsx`, words in `content/home.ts`). One function per section: `Hero` (line 19), `Work` (46),
`Principles` (86), `Founder` (116), `Contact` (161), then `Home` (186). `Home` also exports
`buildMetadata(homeMeta)` and renders the Organization and WebSite JSON-LD. The hero entrance is CSS only
(`app/components/home.css`, `line-in` and `rise-in`), so the h1 paints at once and is never below 0.12 opacity. The
company block is `app/components/CompanyInfo.tsx`, the one Rule 26 component used on home, about and contact.

**Styles.** `app/globals.css` holds the tokens (OKLCH colour, type steps, the 4px spacing scale, radius 0, 2 and 8,
curves), the base elements, the browser surfaces and the shared page classes the inner pages use (`.page`, `.prose`,
`.status`, `.rule-list`, `.card-link`, `.company` and the rest). `app/components/shell.css` styles the shell and
`home.css` the home sections. Component CSS uses tokens only. Marigold has one job: links, the primary action, the
focus ring, the progress line and the footer mark.

**Where the time goes.** The first load is the HTML, the CSS and the React and Next runtime, about 142 kB gzip of
JS. Lenis (about 4 kB) is a separate chunk imported after hydration, only for fine pointers. On scroll the cost is
one `measure` and `apply` pass per changed frame. At idle nothing runs. To optimise, look first at the scene chunk
and its per-frame work on the shared ticker.

## 6. Gates: what checks a build, and when

| Gate                         | What it does                                                                                                                                                                                                | When it runs                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run lint`               | ESLint with the Next rules and `curly: all` (`eslint.config.mjs`)                                                                                                                                           | every commit locally, CI                                             |
| `npm run format:check`       | Prettier over the repo                                                                                                                                                                                      | every commit locally, CI                                             |
| `npm test`                   | the fast unit tests, including `scripts/seo.test.mjs` and `scripts/routes.test.mjs`; the out/ tests skip if there is no build                                                                               | merge hook, CI before the build                                      |
| `npm run test:build`         | `scripts/check.build.test.mjs` builds a throwaway Next app with every banned form planted and asserts `check.mjs` catches each one; slow (a real build)                                                     | CI, and before a release                                             |
| `npm run build`              | `next build` into `out/`                                                                                                                                                                                    | CI                                                                   |
| `npm run test:out`           | `scripts/out.test.mjs` and `scripts/routes.test.mjs` with `REQUIRE_OUT=1`: every non-release rule of `check.mjs` on the real `out/`, and every route in `content/meta.ts` built; fails if `out/` is missing | CI after the build                                                   |
| `npm run check`              | `scripts/check.mjs` over `out/`                                                                                                                                                                             | after every build                                                    |
| `npm run check -- --release` | the same plus the company fields: fails while any `app/company.ts` field is null                                                                                                                            | CI before deploy, so the site cannot ship with blank company details |
| `npm run test:e2e`           | `scripts/behavior.test.mjs`: Playwright on the built `out/` for the skip link, menu trap, Esc, Lenis stopped, reduced motion, JS off, `#company` and the idle frame loop; skips without `QA_TOOLS`          | by hand at review time, after a build                                |
| `npm run qa -- <dir>`        | `scripts/qa.mjs`: Lighthouse mobile and desktop and screenshots; needs `QA_TOOLS`                                                                                                                           | by hand at review time, not in CI                                    |

What `scripts/check.mjs` checks (`runChecks`, line 522): the build exists; first load JS within 160 kB gzip and total
JS within 420 kB; no dashes or hyphens in visible text, alt, aria, title or meta copy (URLs excepted); no forbidden
strings (leftover placeholder words and the bot wall patterns, `BOT_WALL_PATTERNS` line 182); no monospace font and
no pill radius in any CSS; no `transition: all`; every `<img>` has a width and height; a report only line on font
files; and with `--release`, every `app/company.ts` field is filled and shown on the home page. `main` (line 641) prints a table and exits 1 on any failure.

## 7. Every module over 100 lines

| Module                         | What it does                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/check.mjs`            | the build gate over `out/` described in section 6                                                                                                       |
| `app/page.tsx`                 | the home page: one function per section (section 5)                                                                                                     |
| `app/components/MenuSheet.tsx` | the phone menu sheet: focus trap, Esc, scroll lock with Lenis stopped (section 5)                                                                       |
| `scripts/behavior.test.mjs`    | browser acceptance tests on the built site: skip link, menu, reduced motion, JS off, anchors, idle frame loop (section 6)                               |
| `scripts/qa.mjs`               | review time QA: serves `out/` on a local port, runs Lighthouse three times per form factor and takes the median, takes screenshots at 390, 768 and 1440 |
| `content/projects.ts`          | the four project records, typed by `Project`                                                                                                            |
| `content/notes.ts`             | the note records and their body blocks, typed by `Note`                                                                                                 |
| `app/notes/[slug]/page.tsx`    | renders one note: its blocks, byline, project link and next note                                                                                        |
| `app/lib/jsonld.ts`            | the JSON-LD builders described in section 4                                                                                                             |
| `scripts/og.mjs`               | renders the share cards and icons described in section 4                                                                                                |
| `scripts/seo.test.mjs`         | tests for every SEO builder, the title rule, the slash guard, the sitemap, robots, manifest, cards and icons                                            |
| `scripts/check.test.mjs`       | unit tests for each `check.mjs` finder on small HTML and CSS strings                                                                                    |
| `scripts/qa.test.mjs`          | unit tests for the QA gate logic and its CLI, with no browser                                                                                           |
| `scripts/check.build.test.mjs` | the planted probe build described in section 6                                                                                                          |

## 8. The scene (app/scene)

One WebGL world sits behind every page: a field of dark slabs with the SAVIGN letters carved into the floor and lit
from below. It lives in the root layout, so a route change moves the camera instead of reloading the world.

### Load path, end to end

1. `app/layout.tsx` server renders `.scene-fallback` (ground with a soft marigold glow) and then `SceneMount`
   (`app/components/SceneMount.tsx`), which loads `app/scene/SceneRoot.tsx` with `next/dynamic` and `ssr: false`.
2. `SceneRoot` renders one empty `<canvas aria-hidden="true">`, fixed, at the fallback's z-index and after it in the
   DOM, so it paints over the fallback and under every positioned section. After the `load` event and an idle
   callback (`afterFirstPaint`) it imports `./engine`: the only place three enters the bundle.
3. `engine.ts` `startScene`: `createRuntime` makes the renderer, `buildFor` (`build.ts`) builds the world for the
   breakpoint and quality tier, `listen` attaches context loss, visibility, resize and reduced motion scroll, and
   `warmUp` uploads each texture and compiles each material in its own task. A failure there tears everything down
   and the page keeps the fallback. Then `createLoop` subscribes `tick` to the site's ticker.
4. The first drawn frame calls `hooks.onReady`; `SceneRoot` fades the canvas in and dispatches `scene:ready` once.

### One frame (`renderPose` in frame.ts)

1. `probeSections` (`sections.ts`) finds the deepest `[data-scene]` element under a line 40% down the viewport and
   reports its pose name, how far it has scrolled, and for the principles section where its ruled rows are.
2. `poseFor` (`poses.ts`) turns that into a `Pose`: a camera `Shot` (position, look target, lens shift, field of
   view) and a `WorldState` (letters lit and carved, corridor open, plots, clearing, founder slab, flatten, rules,
   exposure, fog, wake).
3. `moveRig` springs each camera number toward the shot (`camera.ts`), `dampWorld` eases the world numbers, and
   `applyRig` writes the camera, including the lens shift in the projection matrix.
4. `updatePointer` (`steer.ts`) raycasts the pointer, the press parting toward the h1, or the touch screen wanderer
   onto the floor and stamps the wake grid; `stepWake` (`wake.ts`) springs every cell and uploads the grid.
5. `sceneBusy` decides whether another frame is needed: intro running, camera or world still moving, wake moving,
   pointer lit, or a hero, about or contact pose within 4 s (`ACTIVE_SECONDS`) of the last input, scroll or route
   change. Only then does it draw, and `tick` returns that answer, so the shared loop sleeps when the scene rests.
   When that window closes, `settleWake` ends the wake's tail at once, so the scene stops about 5 s after the last
   input (measured: 4.5 s after a pointer sweep on desktop, 5.4 s after a touch drag on a phone).

### Concepts the code relies on

- **Instanced slabs.** Every slab is the same unit box. `world.ts` `buildSlabs` gives the GPU one box plus a
  per-instance attribute (`aCell`: x, z, width, height; `aInfo`: carved, seed, delay, special) and draws all of them
  in one call. The vertex shader (`shaders/slab.glsl.ts`) decides per slab how far it sinks: carved letter, open
  corridor, marker pad, plot, clearing or pointer wake.
- **Shared light model.** `shaders/field.glsl.ts` holds what every surface uses: where the floor is open and how
  much light it gives off (`glowAt`). The floor draws that light, slab sides pick it up as spill from the neighbour
  cell, slab tops get a warm rim near it, and two additive haze sheets fake light in the air.
- **Lens shift.** `applyRig` shifts the projection, which slides the picture across the screen without changing
  perspective. `compose.ts` `heroFrame` reads the hero copy box and puts the word in the largest free area, just
  above the copy on portrait screens; other poses use per breakpoint anchors so the lit thing sits where text is not.
- **The scroll walk.** In the hero pose the vertical lens shift tracks the scroll exactly for the first 0.42 of a
  viewport (`pageLock`, applied without a spring), so the word rides up with the page and never passes under the h1.
  Then the letters close, the camera drops into the corridor behind the I, and passes the five principle words lit
  on pads beside it (`words.ts` `markerPads`). Those markers have their own light (`markers` in `WorldState`), on
  only during the walk; the plaza words light only on the hero. Neither ever draws over text: `updateTextMask` passes
  the hero copy box and the hero's bottom edge to the floor shader (`textFree`), which drops scene words inside
  that box and anywhere below the hero, where the next section's text begins. The principles pose looks straight down on a flattened floor whose
  seams become hairlines placed at the section's own ruled rows (`updateRules`).
- **Route flights.** A pose change switches the rig to a slower spring for 2.2 s, lifts the camera in proportion to
  the distance left (`flightLift`) so it arcs over the field, and dims exposure mid flight (`flightDip`).
- **One frame loop.** `driver.ts` adapts the site's `onFrame` (milliseconds, sleeps when no callback returns true)
  to the scene's `(seconds, dt) => busy`, clamping dt so a wake after sleep counts as one frame.

### Modules over 100 lines

| file                                | idea                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `app/scene/engine.ts`               | start and stop: runtime, listeners, loop subscription, reduced motion still, teardown |
| `app/scene/frame.ts`                | one frame: probe, pose, rig, world, rules, busy rule, quality probe                   |
| `app/scene/runtime.ts`              | the state one running scene holds, and the activity window                            |
| `app/scene/steer.ts`                | pointer, press parting and wanderer into the wake                                     |
| `app/scene/poses.ts`                | one pose per route or section, and the hero scroll walk                               |
| `app/scene/world.ts`                | slab cells, instanced mesh, floor, sky, haze, shared uniforms                         |
| `app/scene/wake.ts`                 | pointer wake grid: stamp, spring, upload                                              |
| `app/scene/wordmark.ts`             | the SAVIGN letters as a floor mask in world units, I at x = 0                         |
| `app/scene/words.ts`                | the five principle words: buried in the plaza, and the corridor markers               |
| `app/scene/camera.ts`               | spring rig, orbit helper, lens shift, framing distance                                |
| `app/scene/compose.ts`              | where the hero word goes around the h1                                                |
| `app/scene/sections.ts`             | which pose the page asks for right now                                                |
| `app/scene/SceneRoot.tsx`           | lazy start after first paint, ready event                                             |
| `app/scene/shaders/field.glsl.ts`   | shared GLSL: openings, glow, markers, fog, tone                                       |
| `app/scene/shaders/slab.glsl.ts`    | slab vertex and fragment shaders                                                      |
| `app/scene/shaders/surface.glsl.ts` | floor, sky and haze shaders                                                           |
| `scripts/scene.test.mjs`            | unit tests for the scene's pure functions, run through Node's type stripping          |

### Where the time goes, and where to optimise

- Bundle: the scene chunk (three plus the engine) is about 145 kB gzipped and loads after `load` plus idle.
- Start: building the cells (about 40,000 on desktop, 17,600 on phones) and compiling five materials; `warmUp`
  spreads uploads and compiles over separate tasks. If start ever shows as a long task, split `buildCells` next.
- Per frame: one draw call for all slabs plus floor, sky and two haze sheets; the CPU side is the wake spring over
  the plaza grid (about 10,000 cells, skipped at rest). Fill rate is the GPU cost: pixel ratio is capped at 2 (1.5
  on phones, 1 on the low tier). `quality.ts` judges 30 busy frames by their cost: the scene's CPU work, or its GPU
  time from `gpu-timer.ts` (EXT_disjoint_timer_query_webgl2) where the browser offers it. Without a timer, frames
  that stretch past 1.5 times the warmup cadence stand in for GPU load; a steady 30 Hz display is not "slow". Each
  probe answers once, so it drops at most one tier; there are at most two.
- At rest: no frames at all. The scene draws while busy (above) and stops about 5 s after the last input. On touch
  screens the wanderer runs for 8 s after the scene starts and 4 s after each touch.

### Resilience

- `webglcontextlost`: the loop unsubscribes and the canvas fades to the fallback; on restore three re-uploads
  everything and the next frame fades it back in.
- Reduced motion: no loop. One still frame per pose, redrawn on route change, section change, resize and font load;
  the still never draws the principles rules, so the DOM rules carry that section alone.
- No WebGL: `startScene` throws, `SceneRoot` logs it in development, and the page keeps the fallback.
