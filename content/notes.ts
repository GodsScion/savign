export type NoteBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string };

export type Note = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  projectSlug: string | null;
  body: NoteBlock[];
};

// Newest first; notes sharing a date keep this order.
export const notes: Note[] = [
  {
    slug: "where-the-name-savign-comes-from",
    title:
      "Where the name SAVIGN comes from, and what it means for what we build",
    description:
      "SAVIGN comes from Sai Vignesh, and Vignesh from Vighnesha, the one who removes obstacles. How that brief picks the tools we build.",
    date: "2026-11-09",
    author: "Sai Vignesh Golla",
    body: [
      {
        kind: "paragraph",
        text: "SAVIGN comes from my name, Sai Vignesh. Vignesh comes from Vighnesha, the one who removes obstacles. We took that as our brief: find what stops the work, and move it out of the way.",
      },
      {
        kind: "paragraph",
        text: "That sounds abstract, so here is what it looks like in practice. We build tools that help AI agents do real work. Agents get stuck in specific, boring ways, and each of our four projects started from one of them.",
      },
      {
        kind: "paragraph",
        text: "The first is a browser step that hangs. We timed a session of 28 browser steps that took about 12 minutes. An action cost about 50 milliseconds when the agent's locator matched the page. When it missed, it cost 30,000 milliseconds, because the driver waits out its 30 second default before it admits the miss. There was nothing in between. The browser itself was never slow. trail is our answer. It records a browser task once and replays the recorded steps. If a step cannot find its target, the run stops and hands back to you instead of guessing. A healthy run makes zero model calls.",
      },
      {
        kind: "paragraph",
        text: "The second is the cost an agent pays before any work starts. Every tool it can call is described in its context on every turn. trail's tool definitions take 2,045 tokens. Playwright MCP's take 4,319, and Chrome DevTools MCP's take 5,787. We hold trail to a budget of 3,000 tokens, and the build checks it.",
      },
      {
        kind: "paragraph",
        text: 'The third is the same mistake made twice. hansei is named after the Toyota practice of reflecting on a mistake before improving. It plans and builds software, and every run ends with a retro that writes up to three lessons. A lesson stays only if an eval holds it up. We also publish the result when an eval shows nothing. Our one ablation of the whole plugin ended with "no verdict" at three runs per arm.',
      },
      {
        kind: "paragraph",
        text: "The fourth is text that reads like a machine wrote it. We asked four Claude models to write the same five pieces with no tools and no skills. Opus used 12.4 dashes per 1,000 words. Without our humanize skill, the lint failed 11 of 15 Opus samples and all 15 from Haiku. That is why you will not find a dash on this site. humanize is how we check.",
      },
      {
        kind: "paragraph",
        text: "The last one sits under the other three: tools that cost more than they give. scoreboard reads our own agent session logs. It flags any plugin that went 30 days unused while costing more than 1,000 tokens every session. The fix there is to remove it.",
      },
      {
        kind: "paragraph",
        text: "The name also tells us what to leave alone. Removing an obstacle is a narrow job. It does not mean adding an account, a dashboard or a backend. trail has no backend and no account, and nothing leaves your machine. Our tools run on your machine, with no backend of our own. None of the four is for sale.",
      },
      {
        kind: "paragraph",
        text: "The brief also sets the order of work. Before we build anything, we try to name what stops the work and then measure it. A number without a source is a guess, and we say so when we use one. Patching a symptom only moves the bug to next week, so we look for the cause. And each build ends with a review, so what we learn goes back into the tools.",
      },
      {
        kind: "paragraph",
        text: "Most of what we find is small. A locator that misses. Tool lists that run too long. Words a model likes too much. None of these is hard to fix once someone has measured it. Finding them is the job, and the name keeps reminding us of it.",
      },
    ],
    projectSlug: null,
  },
  {
    slug: "browser-tools-token-cost-coding-agents",
    title:
      "What browser tools cost a coding agent: 2,045 vs 4,319 vs 5,787 tokens",
    description:
      "trail's tool definitions take 2,045 tokens, Playwright MCP's 4,319, Chrome DevTools MCP's 5,787. What that number measures and what it does not.",
    date: "2026-11-09",
    author: "Sai Vignesh Golla",
    body: [
      {
        kind: "paragraph",
        text: "An agent that drives a browser pays for its tools before it reads a single page. Every tool the agent can call is described in its context, and the agent pays for that description again on every turn. We measured that cost for three browser tools that coding agents use.",
      },
      {
        kind: "paragraph",
        text: "trail's tool definitions take 2,045 tokens. Playwright MCP's take 4,319. Chrome DevTools MCP's take 5,787. By subtraction, trail carries 2,274 fewer tokens per turn than Playwright MCP and 3,742 fewer than Chrome DevTools MCP. The benchmark that produced these counts ships with trail, so anyone can run it again.",
      },
      {
        kind: "paragraph",
        text: "The number is small because we budget it. We do not cap the number of tools. We cap their size: the serialized definitions must fit in 3,000 tokens, and the build checks that on every change. Today that buys 16 tools in five groups: observe, navigate, act, workflow and ask. One of them, ask_user, is registered but not built. It returns a typed answer that says so and names what to do instead. We would rather a tool admit that than pretend.",
      },
      {
        kind: "paragraph",
        text: "So what does 2,045 mean? It is a fixed charge on context, paid on every turn. A smaller charge leaves more room for the page and the task, and the saving repeats for as long as the session runs. It is also easy to check. You can count it without running a single task.",
      },
      {
        kind: "paragraph",
        text: "It does not tell you three things.",
      },
      {
        kind: "paragraph",
        text: "First, it says nothing about whether the agent finishes the job. Our task benchmark is not done. The one smoke run we have used a local 9B model, and all three tools scored zero. A run where everyone scores zero cannot rank anyone, so those numbers stay out of the headline. Full task results go up only once they exist.",
      },
      {
        kind: "paragraph",
        text: "Second, tool definitions are not the biggest token cost in browser work. Page snapshots are a separate cost. In one session we measured, about 15,000 tokens went into repeated page chrome such as navigation, cookie banners and footers. Vercel says its Agent Browser produces accessibility snapshots about 93% smaller than Playwright MCP's. We have not tested that claim, and we have not published a snapshot size for trail.",
      },
      {
        kind: "paragraph",
        text: 'Third, it is not a speed number. In that same session, 28 browser steps took about 12 minutes. The browser was not the slow part. Snapshots took 5 to 52 milliseconds and a page load took about half a second. An action took about 50 milliseconds when its locator matched and 30,000 when it missed. That session ran on a scratch test setup rather than trail, with the same step mechanics. Once the misses were gone, the time went to the model. A large model at high effort ran all 28 steps of "click the button named X", which is not a reasoning task.',
      },
      {
        kind: "paragraph",
        text: "That last point is where most of the saving is. A token saved on definitions helps. A turn the agent never takes helps more. trail replays each recorded step with its recorded locator first, and a hit fetches no page snapshot at all. A healthy run makes zero model calls and gives the same answer twice. When a locator misses, trail tries the recorded alternatives in order. If none match, it stops and hands the run back to you. Agent repair comes in a later release.",
      },
      {
        kind: "paragraph",
        text: "So read 2,045 for what it is: the smallest of three fixed costs, counted the same way for all three tools. It is not a claim that trail finishes more tasks. We do not have that number yet. When we do, we will publish it with the run behind it, even if it is zero again.",
      },
    ],
    projectSlug: "trail",
  },
  {
    slug: "build-pipeline-keeps-lessons-only-with-eval",
    title: "A build pipeline that keeps a lesson only when an eval holds it up",
    description:
      "hansei reviews every run of its own build pipeline and keeps a lesson only if an eval backs it. Our ablation of the whole plugin came back no verdict.",
    date: "2026-11-09",
    author: "Sai Vignesh Golla",
    body: [
      {
        kind: "paragraph",
        text: "Hansei is the Toyota practice of reflecting on a mistake before improving. We named our Claude Code plugin after it because reflection is its main job. hansei plans and builds software the way a small startup would, on a budget, and after each run it patches its own playbook. The part we care about most is the condition on that patch: it lands only behind an eval.",
      },
      {
        kind: "paragraph",
        text: "The pipeline has three steps. Plan runs an intake, parallel research, six lenses (product, market, engineering, legal, go to market and budget), one red team, and a decision to go or stop. Build works in waves, with a verifier that runs every command a report claims to have run, and a ledger. Retro closes every run. It records the tokens spent and what a later step caught that an earlier step owned, and it writes zero to three lessons.",
      },
      {
        kind: "paragraph",
        text: "The retro is where a self improving setup can go wrong. Writing down a lesson is cheap, and a model will always find one. If every lesson goes into the playbook, the playbook grows and nobody can say which rule earns its place. So in hansei each lesson has to become a hook, an eval case or a checklist line, and it has to pass an eval gate to land. Each lesson has to name its test or eval, and one that names none is refused once it is seven days old.",
      },
      {
        kind: "paragraph",
        text: "On 6 October 2026 we ran the evals before and after three lessons landed. A build case that checks how the pipeline triages a report scored 8 of 12 over three runs before its lesson, and 9 of 12 over three runs after. The retro case went from 1 of 2 to 2 of 2. One plan case scored 2 of 3 after its lesson. Each graded line on Sonnet cost between $0.1124 and $0.2929. These are small moves on small samples. Three runs is not much, and we do not read more into them than that.",
      },
      {
        kind: "paragraph",
        text: "We also keep scores as they were recorded. Eval scores are never scored again, and every eval run appends its receipt. Two bad lines stay in the file as history. One is a 0 of 3 that came from the official runner refusing a linked folder. The other is a 1 of 4 caused by a bug in our own test runner, which graded the text before the skill was even called. Deleting them would make the record cleaner and less true.",
      },
      {
        kind: "paragraph",
        text: "Then the larger question: does the plugin help at all? We ran an ablation with scoreboard, our tool for measuring plugins. It used six realistic tasks, three runs per task per arm, and Claude Opus 5 at low effort, for 18 runs with the plugin on and 18 with it off. Both arms passed 18 of 18.",
      },
      {
        kind: "paragraph",
        text: "Cost averaged $0.6404 with the plugin and $0.6492 without. Turns averaged 7.9 and 7.6. Wall time averaged 231.9 seconds with the plugin and 92.9 seconds without. The 90% interval on that gap runs from 37.6 seconds faster to 438 seconds slower.",
      },
      {
        kind: "paragraph",
        text: "The report's own line is \"no verdict (k=3)\". A verdict needs at least five runs per arm. On these six tasks at three runs, the ablation shows no measured gain or loss from the plugin. There is a second limit as well. The plugin's hooks were skipped in every run of both arms. So the test did not exercise part of what it was meant to test.",
      },
      {
        kind: "paragraph",
        text: "We publish this because it is where things stand. A pipeline that keeps only the lessons an eval backs should be judged the same way. So far the eval on the whole plugin has neither backed it nor counted against it. The report also says what would settle it: five or more runs per arm, with the hooks running.",
      },
      {
        kind: "paragraph",
        text: 'The easy way to fool yourself with agents is to let them grade their own work in prose. A retro that says "this went well" costs nothing to write. hansei asks for a number with a run behind it instead, and it keeps that number even when the number says nothing yet.',
      },
    ],
    projectSlug: "hansei",
  },
];
