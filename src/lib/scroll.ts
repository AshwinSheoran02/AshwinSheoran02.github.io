/** Scrolls a section into view and moves focus there for keyboard and screen reader users. */
export function scrollToTarget(id: string) {
  const element = document.getElementById(id) ?? document.querySelector(`[data-station="${id}"]`);
  if (!element) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  if (element instanceof HTMLElement) {
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
  }
}
