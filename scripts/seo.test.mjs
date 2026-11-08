// Tests for the SEO builders in app/lib, the metadata routes and the static SEO assets.
// Node strips the TypeScript types; the hook adds the ".ts" extension Next's bundler resolves on its own.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findDashes } from "./check.mjs";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL ?? "";
    const fromSource = parent.includes("/app/") || parent.includes("/content/");
    const isRelative = specifier.startsWith(".");
    const hasExtension = /\.[cm]?[jt]sx?$/.test(specifier);
    if (fromSource && isRelative && !hasExtension) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const seo = await import("../app/lib/seo.ts");
const jsonld = await import("../app/lib/jsonld.ts");
const sitemap = (await import("../app/sitemap.ts")).default;
const robots = (await import("../app/robots.ts")).default;
const manifest = (await import("../app/manifest.ts")).default;
const meta = await import("../content/meta.ts");
const { notes } = await import("../content/notes.ts");

const paths = seo.sitePages.map((page) => page.path);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

test("buildMetadata gives an absolute canonical with a trailing slash", () => {
  const meta = seo.buildMetadata({
    title: "Work",
    description: "Four projects.",
    path: "/work/",
  });
  assert.equal(meta.alternates.canonical, "https://www.savign.org/work/");
  assert.equal(meta.openGraph.url, "https://www.savign.org/work/");
});

test("the SAVIGN suffix is added only when it fits in 60 characters", () => {
  assert.equal(seo.pageTitle("Work"), "Work | SAVIGN");
  const long = "trail | Record a browser task, replay it with any agent";
  assert.equal(seo.pageTitle(long), long);
  assert.equal(
    seo.pageTitle(`${"x".repeat(51)}`),
    `${"x".repeat(51)} | SAVIGN`,
  );
  assert.equal(seo.pageTitle(`${"x".repeat(52)}`), "x".repeat(52));
});

test("the suffix is never doubled on a title that already names SAVIGN", () => {
  assert.equal(seo.pageTitle("Work | SAVIGN"), "Work | SAVIGN");
  assert.equal(
    seo.pageTitle("Contact | SAVIGN Private Limited"),
    "Contact | SAVIGN Private Limited",
  );
  for (const page of seo.sitePages) {
    const title = seo.buildMetadata(page).title.absolute;
    assert.equal(title.includes("SAVIGN | SAVIGN"), false, title);
  }
});

test("Open Graph and twitter carry a 1200x630 image with the full title as alt", () => {
  const trail = seo.buildMetadata(meta.projectMeta.trail);
  const [image] = trail.openGraph.images;
  assert.deepEqual(image, {
    url: "https://www.savign.org/og/work-trail.png",
    width: 1200,
    height: 630,
    alt: trail.title.absolute,
  });
  assert.equal(trail.openGraph.siteName, "SAVIGN");
  assert.equal(trail.openGraph.type, "website");
  assert.equal(trail.twitter.card, "summary_large_image");
  assert.deepEqual(trail.twitter.images, [image]);
  assert.deepEqual(trail.robots, { index: true, follow: true });
});

test("the page type passes through to Open Graph", () => {
  const founder = seo.buildMetadata({ ...meta.founderMeta, type: "profile" });
  assert.equal(founder.openGraph.type, "profile");
});

test("a path without a trailing slash is an error, not a redirecting canonical", () => {
  const work = { title: "Work", description: "Four projects.", path: "/work" };
  assert.throws(() => seo.buildMetadata(work), /must start and end with \//);
  assert.throws(
    () => jsonld.breadcrumbJsonLd([{ name: "Work", path: "/work" }]),
    /must start and end with \//,
  );
});

test("About, Founder and Contact titles follow the strategy title table", () => {
  const titleOf = (page) => seo.buildMetadata(page).title.absolute;
  assert.equal(
    titleOf(meta.aboutMeta),
    "About SAVIGN | Named for the one who removes obstacles",
  );
  assert.equal(
    titleOf(meta.founderMeta),
    "Sai Vignesh Golla | Founder of SAVIGN",
  );
  assert.equal(titleOf(meta.contactMeta), "Contact | SAVIGN Private Limited");
  assert.equal(
    titleOf(meta.homeMeta),
    "SAVIGN | Tools that help AI agents do real work",
  );
});

test("every route ends with a slash and covers the IA", () => {
  const expected = [
    "/",
    "/work/",
    "/work/trail/",
    "/work/hansei/",
    "/work/humanize/",
    "/work/scoreboard/",
    "/about/",
    "/founder/",
    "/notes/",
    "/contact/",
  ];
  for (const path of expected) {
    assert.ok(paths.includes(path), path);
  }
  for (const path of paths) {
    assert.match(path, /\/$/);
  }
});

test("titles and descriptions are unique, dash free and snippet sized", () => {
  const routes = seo.sitePages;
  const titles = routes.map((route) => route.title);
  const descriptions = routes.map((route) => route.description);
  assert.equal(new Set(titles).size, titles.length);
  assert.equal(new Set(descriptions).size, descriptions.length);
  for (const text of [...titles, ...descriptions]) {
    assert.deepEqual(findDashes(text), [], text);
  }
  for (const description of descriptions) {
    assert.ok(description.length >= 70, description);
    assert.ok(description.length <= 160, description);
  }
});

test("every route has a committed 1200x630 Open Graph PNG", () => {
  for (const path of paths) {
    const file = join(ROOT, "public", seo.ogImagePath(path));
    assert.ok(existsSync(file), file);
    const png = readFileSync(file);
    assert.equal(png.readUInt32BE(16), 1200, file);
    assert.equal(png.readUInt32BE(20), 630, file);
  }
});

test("sitemap lists every route with lastmod and no priority or changefreq", () => {
  const entries = sitemap();
  assert.equal(entries.length, paths.length);
  for (const entry of entries) {
    assert.match(
      entry.url,
      /^https:\/\/www\.savign\.org\/.*\/$|^https:\/\/www\.savign\.org\/$/,
    );
    assert.match(entry.lastModified, ISO_DATE);
    assert.equal(entry.priority, undefined);
    assert.equal(entry.changeFrequency, undefined);
  }
  const note = entries.find((entry) =>
    entry.url.endsWith(`/${notes[0].slug}/`),
  );
  assert.equal(note.lastModified, notes[0].date);
});

test("robots allows everything and names the sitemap", () => {
  assert.deepEqual(robots(), {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.savign.org/sitemap.xml",
  });
});

test("manifest names the site and points at real icons", () => {
  const result = manifest();
  assert.equal(result.name, "SAVIGN");
  assert.ok(existsSync(join(ROOT, "app/icon.svg")));
  assert.ok(existsSync(join(ROOT, "public/og/logo.png")));
});

function assertSchemaBase(data, type) {
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], type);
}

function assertAbsolute(url) {
  assert.match(url, /^https:\/\/www\.savign\.org\//);
}

test("Organization has name, legalName, url and a raster logo, no empty sameAs", () => {
  const data = jsonld.organizationJsonLd();
  assertSchemaBase(data, "Organization");
  assert.equal(data.name, "SAVIGN");
  assert.equal(data.legalName, "SAVIGN Private Limited");
  assertAbsolute(data.url);
  assert.match(data.logo, /\.png$/);
  assert.equal("sameAs" in data, false);
  for (const key of ["address", "telephone", "email", "identifier"]) {
    assert.equal(key in data, false, key);
  }
});

test("Organization adds address, telephone, email and the CIN once confirmed", () => {
  const data = jsonld.organizationJsonLd({
    name: "SAVIGN Private Limited",
    cin: "U00000AA0000PTC000000",
    registeredOffice: "1 Example Road, Example City",
    phone: "+91 00000 00000",
    email: "hello@example.com",
    grievanceContact: null,
  });
  assert.deepEqual(data.address, {
    "@type": "PostalAddress",
    streetAddress: "1 Example Road, Example City",
    addressCountry: "IN",
  });
  assert.equal(data.telephone, "+91 00000 00000");
  assert.equal(data.email, "hello@example.com");
  assert.deepEqual(data.identifier, {
    "@type": "PropertyValue",
    propertyID: "CIN",
    value: "U00000AA0000PTC000000",
  });
});

test("every @id reference carries its @type and name", () => {
  const references = [
    jsonld.organizationJsonLd().founder,
    jsonld.websiteJsonLd().publisher,
    jsonld.personJsonLd().worksFor,
    jsonld.articleJsonLd(notes[0]).author,
    jsonld.articleJsonLd(notes[0]).publisher,
  ];
  for (const reference of references) {
    assert.match(reference["@id"], /^https:\/\/www\.savign\.org\/.*#/);
    assert.ok(["Person", "Organization"].includes(reference["@type"]));
    assert.ok(reference.name, reference["@id"]);
  }
});

test("WebSite has name and the home url", () => {
  const data = jsonld.websiteJsonLd();
  assertSchemaBase(data, "WebSite");
  assert.equal(data.name, "SAVIGN");
  assert.equal(data.url, "https://www.savign.org/");
});

test("ProfilePage wraps a Person with LinkedIn only and no location", () => {
  const data = jsonld.profilePageJsonLd();
  assertSchemaBase(data, "ProfilePage");
  const person = data.mainEntity;
  assert.equal(person["@type"], "Person");
  assert.equal(person.name, "Sai Vignesh Golla");
  assert.deepEqual(person.sameAs, [
    "https://www.linkedin.com/in/saivigneshgolla/",
  ]);
  for (const key of ["address", "homeLocation", "location"]) {
    assert.equal(key in person, false, key);
  }
  assert.equal(person.url, "https://www.savign.org/founder/");
  assert.match(data.dateCreated, ISO_DATE);
  assert.match(data.dateModified, ISO_DATE);
});

test("BreadcrumbList items carry position, name and an absolute item", () => {
  const data = jsonld.breadcrumbJsonLd([
    { name: "Work", path: "/work/" },
    { name: "trail", path: "/work/trail/" },
  ]);
  assertSchemaBase(data, "BreadcrumbList");
  assert.deepEqual(data.itemListElement[1], {
    "@type": "ListItem",
    position: 2,
    name: "trail",
    item: "https://www.savign.org/work/trail/",
  });
});

test("BlogPosting has headline, dated author linked to the founder page and an image", () => {
  const note = notes[1];
  const data = jsonld.articleJsonLd(note);
  assertSchemaBase(data, "BlogPosting");
  assert.equal(data.headline, note.title);
  assert.ok(data.headline.length <= 110);
  assert.equal(data.datePublished, note.date);
  assert.match(data.dateModified, ISO_DATE);
  assert.equal(data.author.name, "Sai Vignesh Golla");
  assert.equal(data.author.url, "https://www.savign.org/founder/");
  assert.deepEqual(data.image, [
    `https://www.savign.org/og/notes-${note.slug}.png`,
  ]);
});

test("JsonLd renders a script whose JSON cannot close the tag", () => {
  const element = jsonld.JsonLd({ data: { name: "</script><b>" } });
  assert.equal(element.type, "script");
  assert.equal(element.props.type, "application/ld+json");
  const html = element.props.dangerouslySetInnerHTML.__html;
  assert.equal(html.includes("<"), false);
  assert.deepEqual(JSON.parse(html), { name: "</script><b>" });
});

test("the IndexNow key file holds its own 32 hex key", () => {
  const keyFiles = readdirSync(join(ROOT, "public")).filter((name) =>
    /^[0-9a-f]{32}\.txt$/.test(name),
  );
  assert.equal(keyFiles.length, 1);
  const [file] = keyFiles;
  const content = readFileSync(join(ROOT, "public", file), "utf8");
  assert.equal(content, file.replace(".txt", ""));
});

test("the icon is pure paths, no font or text", () => {
  const svg = readFileSync(join(ROOT, "app/icon.svg"), "utf8");
  assert.match(svg, /<path\b/);
  assert.doesNotMatch(svg, /<text\b|font-family/);
});

test("icoFromPngs writes a header and one entry per PNG", async () => {
  const { icoFromPngs } = await import("./og.mjs");
  const png = Buffer.from("png bytes");
  const ico = icoFromPngs([
    { size: 16, png },
    { size: 32, png },
  ]);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  assert.equal(ico.readUInt8(6), 16);
  assert.equal(ico.readUInt8(22), 32);
  assert.equal(ico.readUInt32LE(14), png.length);
  assert.equal(ico.readUInt32LE(18), 6 + 32);
  assert.equal(ico.readUInt32LE(34), 6 + 32 + png.length);
  assert.equal(ico.length, 6 + 32 + 2 * png.length);
});

test("the OG card headline is the page's h1 as text", async () => {
  const { headlineFromHtml } = await import("./og.mjs");
  const html =
    '<main><h1 class="x">trail: <em>skills</em> &amp; sites</h1></main>';
  assert.equal(headlineFromHtml(html), "trail: skills & sites");
  assert.equal(headlineFromHtml("<main></main>"), null);
});
