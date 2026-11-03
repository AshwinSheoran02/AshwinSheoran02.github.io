import { interests, journey, projects, type NavTarget } from "./profile";

/*
 * A station is one camera stop on the tour. Each one is bound to a DOM element
 * with a matching `data-station` attribute, in document order.
 */
export const stationOrder: readonly string[] = [
  "home",
  "about",
  ...interests.items.map((item) => `interest:${item.id}`),
  "statement",
  "facts",
  ...journey.entries.map((_, index) => `journey-${index}`),
  "side-quests",
  "strengths",
  "known-issues",
  ...projects.map((project) => `project:${project.id}`),
  "contact",
];

export function stationIndex(id: string): number {
  return Math.max(0, stationOrder.indexOf(id));
}

export function navTargetForStation(id: string): NavTarget {
  if (id === "home") return "home";
  if (id === "about" || id === "statement" || id === "facts" || id.startsWith("interest:")) return "about";
  if (id.startsWith("project:")) return "projects";
  if (id === "contact") return "contact";
  return "experience";
}

/** Cricket notation for how far into the tour a station is: one station per ball, six balls an over. */
export function oversFor(id: string): string {
  const ball = stationIndex(id) + 1;
  return `${Math.floor((ball - 1) / 6)}.${((ball - 1) % 6) + 1}`;
}

/** Broadcast caption for each station, shown in the score bug. */
export function captionFor(id: string): string {
  if (id === "home") return "Now batting";
  if (id === "about") return "Player profile";
  if (id.startsWith("interest:")) return "Field placement";
  if (id === "statement") return "Pitch map";
  if (id === "facts") return "Unsolicited information";
  if (id.startsWith("journey-")) return "Innings progression";
  if (id === "side-quests") return "In the dugout";
  if (id === "strengths") return "Player ratings";
  if (id === "known-issues") return "Third umpire review";
  if (id.startsWith("project:")) return "Now showing";
  return "Post-match";
}
