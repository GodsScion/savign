/** Which pose the page asks for right now: the deepest [data-scene] element under the probe line. */
export type PoseName =
  | "hero"
  | "principles"
  | "work"
  | "project"
  | "founder"
  | "about"
  | "notes"
  | "note"
  | "contact"
  | "quiet";

export type Probe = {
  pose: PoseName;
  /** Viewports scrolled past the top of the active section (negative while it is still below). */
  scrolled: number;
  /** 0 to 1 through the active section. */
  progress: number;
  /** Screen y of the first ruled row in the section and the distance between rows, when there are rows. */
  rows: { first: number; pitch: number } | null;
};

const POSES: PoseName[] = [
  "hero",
  "principles",
  "work",
  "project",
  "founder",
  "about",
  "notes",
  "note",
  "contact",
  "quiet",
];
const PROBE_LINE = 0.4;

export function poseForPath(pathname: string): PoseName {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "hero";
  }
  const [first, second] = parts;
  if (first === "work") {
    return second ? "project" : "work";
  }
  if (first === "notes") {
    return second ? "note" : "notes";
  }
  if (first === "about" || first === "founder" || first === "contact") {
    return first;
  }
  return "quiet";
}

function asPose(value: string | undefined): PoseName | null {
  return POSES.find((pose) => pose === value) ?? null;
}

function readRows(section: Element): Probe["rows"] {
  const rows = section.querySelectorAll(".rule-list__row");
  if (rows.length < 2) {
    return null;
  }
  const first = rows[0].getBoundingClientRect().top;
  const pitch =
    (rows[rows.length - 1].getBoundingClientRect().top - first) /
    (rows.length - 1);
  return pitch > 8 ? { first, pitch } : null;
}

export function probeSections(pathname: string): Probe {
  const line = window.innerHeight * PROBE_LINE;
  let chosen: { element: Element; rect: DOMRect; pose: PoseName } | null = null;
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-scene]",
  )) {
    const pose = asPose(element.dataset.scene);
    const rect = element.getBoundingClientRect();
    if (!pose || rect.top > line || rect.bottom < line) {
      continue;
    }
    if (!chosen || rect.height <= chosen.rect.height) {
      chosen = { element, rect, pose };
    }
  }
  if (!chosen) {
    return {
      pose: poseForPath(pathname),
      scrolled: window.scrollY / window.innerHeight,
      progress: 0,
      rows: null,
    };
  }
  const { rect } = chosen;
  return {
    pose: chosen.pose,
    scrolled: -rect.top / window.innerHeight,
    progress: Math.min(1, Math.max(0, (line - rect.top) / rect.height)),
    rows: chosen.pose === "principles" ? readRows(chosen.element) : null,
  };
}
