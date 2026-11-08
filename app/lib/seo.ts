import type { Metadata } from "next";
import { homeMeta, routeMeta, type PageMeta } from "../../content/meta";
import { notes } from "../../content/notes";

export const SITE_URL = "https://www.savign.org";
export const SITE_NAME = "SAVIGN";
export const SITE_UPDATED = "2026-11-09";
export const OG_SIZE = { width: 1200, height: 630 };
export const TITLE_LIMIT = 60;

const TITLE_SUFFIX = ` | ${SITE_NAME}`;

export type PageType = "website" | "article" | "profile";

// Every page the site serves, home first; content/meta.ts is the single source.
export const sitePages: PageMeta[] = [homeMeta, ...routeMeta];

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function assertPagePath(path: string): string {
  if (!path.startsWith("/") || !path.endsWith("/")) {
    throw new Error(`SEO path must start and end with /: ${path}`);
  }
  return path;
}

export function pageTitle(title: string): string {
  const withSuffix = `${title}${TITLE_SUFFIX}`;
  if (title.includes(SITE_NAME) || withSuffix.length > TITLE_LIMIT) {
    return title;
  }
  return withSuffix;
}

export function ogImagePath(path: string): string {
  const name = path.split("/").filter(Boolean).join("-");
  return `/og/${name || "home"}.png`;
}

export function lastModified(path: string): string {
  const note = notes.find((candidate) => `/notes/${candidate.slug}/` === path);
  return note?.date ?? SITE_UPDATED;
}

export type MetadataInput = PageMeta & {
  image?: string;
  type?: PageType;
};

export function buildMetadata({
  title,
  description,
  path,
  image = ogImagePath(path),
  type = "website",
}: MetadataInput): Metadata {
  const fullTitle = pageTitle(title);
  const url = absoluteUrl(assertPagePath(path));
  const images = [{ url: absoluteUrl(image), ...OG_SIZE, alt: fullTitle }];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images,
    },
    robots: { index: true, follow: true },
  };
}
