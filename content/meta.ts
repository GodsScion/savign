// Title, description and path for every inner route. Kept free of imports so a plain
// Node test can read it; T5's buildMetadata consumes these objects as they are.
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

export const noteMeta: Record<string, PageMeta> = {
  "where-the-name-savign-comes-from": {
    title:
      "Where the name SAVIGN comes from, and what it means for what we build",
    description:
      "SAVIGN comes from Sai Vignesh, and Vignesh from Vighnesha, the one who removes obstacles. How that brief picks the tools we build.",
    path: "/notes/where-the-name-savign-comes-from/",
  },
  "browser-tools-token-cost-coding-agents": {
    title:
      "What browser tools cost a coding agent: 2,045 vs 4,319 vs 5,787 tokens",
    description:
      "trail's tool definitions take 2,045 tokens, Playwright MCP's 4,319, Chrome DevTools MCP's 5,787. What that number measures and what it does not.",
    path: "/notes/browser-tools-token-cost-coding-agents/",
  },
  "build-pipeline-keeps-lessons-only-with-eval": {
    title: "A build pipeline that keeps a lesson only when an eval holds it up",
    description:
      "hansei reviews every run of its own build pipeline and keeps a lesson only if an eval backs it. Our ablation of the whole plugin came back no verdict.",
    path: "/notes/build-pipeline-keeps-lessons-only-with-eval/",
  },
};

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
