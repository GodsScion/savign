export type ProjectStage = "dev" | "oss" | "research";

export type TitledLine = {
  title: string;
  text: string;
};

export type Project = {
  slug: string;
  name: string;
  h1: string;
  lead: string;
  stage: ProjectStage;
  stageLabel: string;
  statusText: string;
  whatItDoes: string;
  howItWorks: TitledLine[];
  measured: TitledLine[];
  noteSlug: string;
  noteLinkText: string;
};

// Order is the site order: trail leads, then hansei, humanize, scoreboard.
export const projects: Project[] = [
  {
    slug: "trail",
    name: "trail",
    h1: "Record a browser task once. Replay it with any agent.",
    lead: "trail records a browser task once and replays it as a skill any coding agent can run. It runs on your machine as a local server and a Chrome extension, with no backend and no telemetry.",
    stage: "oss",
    stageLabel: "Open source, MIT",
    statusText:
      "Open source under MIT. The workflow library has 0 of 15 planned entries recorded, and the extension still installs as an unpacked build rather than from the Chrome Web Store.",
    whatItDoes:
      "trail turns a browser task you did once into a skill any coding agent can run again. You record the task in a real Chrome window, and trail saves it as a folder you can read, diff and send to a colleague. When an agent replays it, each step uses the locator it recorded. A hit costs about nothing and fetches no page snapshot at all. A healthy run makes zero model calls and gives the same answer twice. It works with Claude Code, Cursor, Gemini, Copilot, Codex and Windsurf. Everything stays on your machine. There is no account, no backend and no telemetry.",
    howItWorks: [
      {
        title: "Record.",
        text: "In the Chrome side panel, type a name, press Record, do the task once, and press Stop.",
      },
      {
        title: "Review and promote.",
        text: "Check the recorded steps, then promote them into a workflow.",
      },
      {
        title: "Replay.",
        text: "Each step tries its recorded locator first. On a miss, the recorded alternatives are tried in order.",
      },
      {
        title: "Hand back.",
        text: "If nothing matches, the run stops and hands back to you. Agent repair is a later release.",
      },
      {
        title: "Stay small.",
        text: "Sixteen tools in five groups, held to a budget of 3,000 tokens of tool definitions that the build checks.",
      },
    ],
    measured: [
      {
        title: "Tool definitions: 2,045 tokens.",
        text: "Playwright MCP's take 4,319 and Chrome DevTools MCP's take 5,787. An agent pays this on every turn before it reads any page.",
      },
      {
        title: "Task results: not yet.",
        text: "The one smoke run so far used a local 9B model, and all three tools scored zero, so we do not quote task numbers.",
      },
      {
        title: "The 600x cliff.",
        text: "In a 28 step session measured on a scratch harness with the same step mechanics, an action took about 50 ms when its locator matched and about 30,000 ms when it missed. That is why trail stops on a miss instead of waiting.",
      },
    ],
    noteSlug: "browser-tools-token-cost-coding-agents",
    noteLinkText: "Read the token cost note",
  },
  {
    slug: "hansei",
    name: "hansei",
    h1: "A plugin that learns from its own runs, only when the lesson holds up.",
    lead: "hansei is a Claude Code plugin that plans and builds software the way a small startup would, on a budget. After each run it looks at what went wrong and patches its own playbook, but only when the lesson holds up in an eval.",
    stage: "dev",
    stageLabel: "In development",
    statusText:
      "In development. Nine measured runs so far, and the code is not public yet.",
    whatItDoes:
      "hansei is a Claude Code plugin that plans and builds software the way a small startup would, on a budget. The plan step runs an intake, parallel research, six lenses (product, market, engineering, legal, go to market and budget), one red team, and a decision to go or stop. The build step works in waves, with a verifier that runs every command a report claims to have run. Every run ends with a retro. It records the tokens spent and what a later step caught that an earlier step owned, then writes up to three lessons. A lesson goes into the playbook only when an eval holds it up.",
    howItWorks: [
      {
        title: "Plan.",
        text: "Intake, parallel research, six lenses, one red team, then a decision to go or stop.",
      },
      {
        title: "Build.",
        text: "The work runs in waves. A verifier runs every command a report says it ran, and a ledger records the run.",
      },
      {
        title: "Retro.",
        text: "Every run closes with the tokens it spent, what a later step caught that an earlier one owned, and zero to three lessons.",
      },
      {
        title: "Gate.",
        text: "Each lesson becomes a hook, an eval case or a checklist line, and it lands only if it passes an eval. A lesson that names no test or eval is refused once it is seven days old.",
      },
      {
        title: "Record.",
        text: "Eval scores are kept as recorded and never scored again, failed runs included.",
      },
    ],
    measured: [
      {
        title: "Pack on vs off: no verdict.",
        text: 'Six realistic tasks, three runs per task per arm, 18 runs each way. Both arms passed 18 of 18, at a mean cost of $0.6404 with the plugin and $0.6492 without. The report\'s own line is "no verdict (k=3)": a verdict needs at least five runs per arm.',
      },
      {
        title: "Slower on average, not proven slower.",
        text: "Mean wall time was 231.9 seconds with the plugin and 92.9 without, and the 90% interval on the difference runs from 37.6 seconds faster to 438 seconds slower.",
      },
      {
        title: "One lesson, a small move.",
        text: "A build triage case scored 8 of 12 over three runs before its lesson and 9 of 12 over three runs after.",
      },
    ],
    noteSlug: "build-pipeline-keeps-lessons-only-with-eval",
    noteLinkText: "Read how hansei decides what to keep",
  },
  {
    slug: "humanize",
    name: "humanize",
    h1: "Drafts that read like the person who signs them.",
    lead: "humanize makes a draft read like the person who signs it. It has a lint for the habits each model leaves in text, and a playbook for each platform.",
    stage: "research",
    stageLabel: "Research",
    statusText:
      "Research. Built on 17 September 2026 and used on our own writing, including this site; not released.",
    whatItDoes:
      "humanize is a Claude Code skill for text a person will sign. It makes a draft read like that person, on the surface where it lands: X, Reddit, Hacker News, a blog or an email. It builds on the open source blader/humanizer checklist and adds what that list lacks: tells measured for each Claude model, a deterministic lint, and a playbook for each platform with sourced numbers. The target is how a person reads the text. The lint stands in for that, because no source we found measures how humans judge natural writing. Detectors disagree with each other and with independent benchmarks, so beating a detector is not the goal.",
    howItWorks: [
      {
        title: "Measure each model.",
        text: "The same five prompts go to each Claude model with no tools and no skills, three runs each, and the habits are read off the table.",
      },
      {
        title: "One card per model.",
        text: "Each card lists what that model overuses, and the lint loads it for that model.",
      },
      {
        title: "Lint.",
        text: "38 checks, same answer every time, and a failing exit on any strong tell.",
      },
      {
        title: "Playbooks.",
        text: "One per platform, with tiered sources and the numbers behind each rule.",
      },
      {
        title: "Eval gate.",
        text: "Headless eval cases run before every commit.",
      },
    ],
    measured: [
      {
        title: "Without the skill, most drafts fail.",
        text: "The lint failed 15 of 15 Haiku samples, 13 of 15 Sonnet, 11 of 15 Opus and 7 of 15 Fable.",
      },
      {
        title: "With it, mostly passes, with one honest gap.",
        text: "Sonnet passed 9 of 9 over three eval cases and Haiku 3 of 3 when the request named the skill. When Haiku had to pick the skill from the listing alone, it passed 0 of 4.",
      },
      {
        title: "Dashes.",
        text: "With no help, Opus wrote 12.4 dashes per 1,000 words in our sample. The whole measurement cost $2.82.",
      },
    ],
    noteSlug: "where-the-name-savign-comes-from",
    noteLinkText: "Read where the name comes from",
  },
  {
    slug: "scoreboard",
    name: "scoreboard",
    h1: "Which plugins and skills earn their place?",
    lead: "scoreboard reads agent session logs and tells you which plugins and skills earn their place. Keep, remove or update, with ablation runs behind each call.",
    stage: "research",
    stageLabel: "Research",
    statusText: "Research. Runs locally only and is not released.",
    whatItDoes:
      "scoreboard turns Claude Code session logs into numbers you can act on. It reads the logs on your machine, takes stock of the skills, agents and plugins you have installed, and scores each one over 7, 30 and 90 days. Six rules turn those scores into calls. A plugin nobody used for 30 days that still costs over 1,000 tokens every session is a candidate for removal. One that is three or more minor versions behind gets an update. When the logs cannot settle a question, the ablation runner does: it runs real tasks under named conditions and grades each run. It needs only Python 3.11 and its standard library.",
    howItWorks: [
      {
        title: "Collect.",
        text: "One row per session, updated incrementally. If the log format changes, it stops and names the first file it could not read, never silent zeros.",
      },
      {
        title: "Inventory.",
        text: "For each pack: its skills, agents and hooks, the tokens its listing costs, and how much it injects.",
      },
      {
        title: "Score.",
        text: "7, 30 and 90 day metrics plus the rules, compared with the last snapshot. A rule with a missing input does not fire.",
      },
      {
        title: "Ablate.",
        text: "Tasks run under named conditions, graded by each task's own checks, with pass rate, lines of code, tests, complexity, tokens and wall time in the report.",
      },
      {
        title: "Mutation score.",
        text: "Each run's own test suite is scored for quality, not for how many tests it has.",
      },
    ],
    measured: [
      {
        title: "Graders that can fail.",
        text: "The realistic task's graders are tested against five broken variants and must tell each one apart.",
      },
      {
        title: "A brownfield task.",
        text: "It starts with three seeded bugs and two features to add.",
      },
      {
        title: "One published ablation.",
        text: 'scoreboard ran the hansei on vs off test: six tasks, three runs per arm, 18 runs each way, 90% bootstrap intervals. The result was "no verdict (k=3)".',
      },
    ],
    noteSlug: "build-pipeline-keeps-lessons-only-with-eval",
    noteLinkText: "Read the ablation note",
  },
];
