import { journey, projects, type NavTarget } from "./profile";

/*
 * A station is one camera stop on the tour. Each one is bound to a DOM element
 * with a matching `data-station` attribute, in document order.
 */
export const stationOrder: readonly string[] = [
  "home",
  "about",
  "interests",
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
  if (["about", "interests", "statement", "facts"].includes(id)) return "about";
  if (id.startsWith("project:")) return "projects";
  if (id === "contact") return "contact";
  return "experience";
}
