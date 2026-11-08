import type { Metadata } from "next";

export const SITE_URL = "https://www.savign.org";
export const SITE_NAME = "SAVIGN";
export const SITE_UPDATED = "2026-11-09";
export const OG_SIZE = { width: 1200, height: 630 };

export type PageType = "website" | "article" | "profile";

export type Route = {
  title: string;
  description: string;
  type?: PageType;
  datePublished?: string;
};

export type Note = Route & {
  slug: string;
  datePublished: string;
};

export const notes: Note[] = [
  {
    slug: "where-the-name-savign-comes-from",
    title:
      "Where the name SAVIGN comes from, and what it means for what we build",
    description:
      "SAVIGN comes from Sai Vignesh, and Vignesh from Vighnesha, the one who removes obstacles. How that brief picks the tools we build.",
    datePublished: "2026-11-09",
  },
  {
    slug: "browser-tools-token-cost-coding-agents",
    title:
      "What browser tools cost a coding agent: 2,045 vs 4,319 vs 5,787 tokens",
    description:
      "trail's tool definitions take 2,045 tokens, Playwright MCP's 4,319, Chrome DevTools MCP's 5,787. What that number measures and what it does not.",
    datePublished: "2026-11-09",
  },
  {
    slug: "build-pipeline-keeps-lessons-only-with-eval",
    title: "A build pipeline that keeps a lesson only when an eval holds it up",
    description:
      "hansei reviews every run of its own build pipeline and keeps a lesson only if an eval backs it. Our ablation of the whole plugin came back no verdict.",
    datePublished: "2026-11-09",
  },
];

function notePath(note: Note): string {
  return `/notes/${note.slug}/`;
}

const noteRoutes: Record<string, Route> = Object.fromEntries(
  notes.map((note) => [notePath(note), { ...note, type: "article" }]),
);

export const HOME_TITLE = "SAVIGN | Tools that help AI agents do real work";

export const routes: Record<string, Route> = {
  "/": {
    title: HOME_TITLE,
    description:
      "SAVIGN Private Limited is a software company from India. We build tools that help AI agents do real work.",
  },
  "/work/": {
    title: "Work",
    description:
      "Four projects from SAVIGN, each at its own stage: hansei, trail, humanize and scoreboard. None of them is for sale.",
  },
  "/work/trail/": {
    title: "trail: record a browser task once, replay it as a skill",
    description:
      "trail is an open source local server and Chrome extension. Record a browser task once, and any coding agent can replay it as a skill.",
  },
  "/work/hansei/": {
    title: "hansei: a Claude Code plugin that learns from each run",
    description:
      "hansei plans and builds software like a small crew, then reviews each run and keeps a lesson only when an eval holds it up.",
  },
  "/work/humanize/": {
    title: "humanize: make a draft read like the person who signs it",
    description:
      "humanize is a Claude Code skill with a lint for the habits each model leaves in text, measured per model, and a playbook for each platform.",
  },
  "/work/scoreboard/": {
    title: "scoreboard: which Claude Code plugins earn their place",
    description:
      "scoreboard reads Claude Code session logs on your machine and turns them into keep, remove or update calls for plugins and skills.",
  },
  "/about/": {
    title: "About: named for the one who removes obstacles",
    description:
      "SAVIGN comes from its founder's name, Sai Vignesh, and Vignesh from Vighnesha, the one who removes obstacles. The company, the name and how we work.",
  },
  "/founder/": {
    title: "Sai Vignesh Golla, founder",
    description:
      "Sai Vignesh Golla is the founder of SAVIGN. He builds identity, security and AI platform software, and tools that help AI agents do real work.",
    type: "profile",
  },
  "/notes/": {
    title: "Notes",
    description:
      "Notes from the work at SAVIGN: what our tools measure, how they decide what to keep, and results we publish even when they say nothing yet.",
  },
  ...noteRoutes,
  "/contact/": {
    title: "Contact",
    description:
      "How to reach SAVIGN Private Limited, with the full company information: corporate identity number, registered office, phone and email.",
  },
  "/privacy/": {
    title: "Privacy",
    description:
      "The privacy policy of SAVIGN Private Limited for www.savign.org: what the site collects from visitors and what it does not.",
  },
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function pageTitle(path: string, title: string): string {
  if (path === "/") {
    return title;
  }
  return `${title} | ${SITE_NAME}`;
}

export function ogImagePath(path: string): string {
  const name = path.split("/").filter(Boolean).join("-");
  return `/og/${name || "home"}.png`;
}

export type MetadataInput = {
  title: string;
  description: string;
  path: string;
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
  const fullTitle = pageTitle(path, title);
  const url = absoluteUrl(path);
  const images = [{ url: absoluteUrl(image), ...OG_SIZE, alt: title }];
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

export function routeMetadata(path: string): Metadata {
  const route = routes[path];
  if (!route) {
    throw new Error(`No SEO route for ${path}`);
  }
  return buildMetadata({ ...route, path });
}
