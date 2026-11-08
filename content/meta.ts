// Title, description and path for every inner route; T5's buildMetadata consumes
// these objects as they are. Note metadata is derived from content/notes.ts.
import { notes } from "./notes";

export type PageMeta = {
  title: string;
  description: string;
  path: string;
};

export const workMeta: PageMeta = {
  title: "Work | SAVIGN",
  description:
    "Four projects from SAVIGN at different stages: trail, hansei, humanize and scoreboard. None of them is for sale.",
  path: "/work/",
};

export const projectMeta: Record<string, PageMeta> = {
  trail: {
    title: "trail | Record a browser task, replay it with any agent",
    description:
      "trail is an open source local server and Chrome extension. Record a browser task once, and any coding agent can replay it as a skill.",
    path: "/work/trail/",
  },
  hansei: {
    title: "hansei | A Claude Code plugin that learns from its runs",
    description:
      "hansei plans and builds software like a small crew, then reviews each run and keeps a lesson only when an eval holds it up.",
    path: "/work/hansei/",
  },
  humanize: {
    title: "humanize | Drafts that read like the person who signs them",
    description:
      "humanize is a Claude Code skill with a lint for the habits each model leaves in text, measured per model, and a playbook for each platform.",
    path: "/work/humanize/",
  },
  scoreboard: {
    title: "scoreboard | Which plugins and skills earn their place",
    description:
      "scoreboard reads Claude Code session logs on your machine and turns them into keep, remove or update calls for plugins and skills.",
    path: "/work/scoreboard/",
  },
};

export const aboutMeta: PageMeta = {
  title: "About SAVIGN | Named for the one who removes obstacles",
  description:
    "SAVIGN comes from Sai Vignesh, and Vignesh from Vighnesha, the one who removes obstacles. How we work, and the company's details.",
  path: "/about/",
};

export const founderMeta: PageMeta = {
  title: "Sai Vignesh Golla | Founder of SAVIGN",
  description:
    "Sai Vignesh Golla is the founder of SAVIGN. He builds identity, security and AI platform software, and tools that help AI agents do real work.",
  path: "/founder/",
};

export const notesMeta: PageMeta = {
  title: "Notes | SAVIGN",
  description:
    "Notes from the work at SAVIGN: what we measured while building tools for AI agents, and what the numbers do not say.",
  path: "/notes/",
};

export const noteMeta: Record<string, PageMeta> = Object.fromEntries(
  notes.map((note) => [
    note.slug,
    {
      title: note.title,
      description: note.description,
      path: `/notes/${note.slug}/`,
    },
  ]),
);

export const contactMeta: PageMeta = {
  title: "Contact | SAVIGN Private Limited",
  description:
    "Write to SAVIGN Private Limited, and find the company's identity number, registered office and grievance contact.",
  path: "/contact/",
};

export const privacyMeta: PageMeta = {
  title: "Privacy | SAVIGN",
  description:
    "This site sets no cookies, runs no analytics and has no forms. What our host logs about visits, and who to ask about it.",
  path: "/privacy/",
};

export const routeMeta: PageMeta[] = [
  workMeta,
  ...Object.values(projectMeta),
  aboutMeta,
  founderMeta,
  notesMeta,
  ...Object.values(noteMeta),
  contactMeta,
  privacyMeta,
];
