import { company } from "../app/company";

export type StatusKind = "dev" | "oss" | "research";

export type ProjectRow = {
  slug: string;
  name: string;
  line: string;
  status: { kind: StatusKind; label: string };
};

export type CompanyRow = {
  label: string;
  value: string | null;
};

export const hero = {
  lines: ["Software that", "clears the way."],
  lead: "SAVIGN is a software company from India. We build tools that help AI agents do real work.",
  primary: { label: "See the work", href: "/work/" },
  secondary: { label: "Company information", href: "#company" },
};

export const work = {
  heading: "What we're building",
  intro: "Four projects at different stages. None of them is for sale.",
  projects: [
    {
      slug: "trail",
      name: "trail",
      line: "trail records a browser task once and replays it as a skill any coding agent can run.",
      status: { kind: "oss", label: "Open source, MIT" },
    },
    {
      slug: "hansei",
      name: "hansei",
      line: "hansei is a Claude Code plugin that plans and builds software like a small crew.",
      status: { kind: "dev", label: "In development" },
    },
    {
      slug: "humanize",
      name: "humanize",
      line: "humanize makes a draft read like the person who signs it.",
      status: { kind: "research", label: "Research" },
    },
    {
      slug: "scoreboard",
      name: "scoreboard",
      line: "scoreboard reads agent session logs and tells you which plugins and skills earn their place.",
      status: { kind: "research", label: "Research" },
    },
  ] satisfies ProjectRow[],
};

export const principles = {
  heading: "How we work",
  statements: ["Measure first.", "Fix the cause.", "Keep it local."],
  more: { label: "Read all five principles", href: "/about/" },
};

export const founder = {
  heading: "Founder",
  name: "Sai Vignesh Golla",
  bio: "Sai is a software engineer who builds agent tooling and browser automation. He studied computer science at Stevens Institute of Technology. SAVIGN is where his tools live.",
  more: { label: "More about Sai", href: "/founder/" },
};

export const contact = {
  heading: "Get in touch",
  body: "Questions about the tools, or ideas you want to share? Write to us.",
  email: company.email,
};

export const companyInfo = {
  heading: "Company information",
  rows: [
    { label: "Company", value: company.name },
    { label: "Corporate identity number", value: company.cin },
    { label: "Registered office", value: company.registeredOffice },
    { label: "Phone", value: company.phone },
    { label: "Email", value: company.email },
    { label: "Queries and grievances", value: company.grievanceContact },
  ] satisfies CompanyRow[],
};
