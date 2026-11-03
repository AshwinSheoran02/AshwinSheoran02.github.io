/*
 * The page can be scrolled by the window (a normal visit) or by the body or
 * root element (some embedded previews). Everything that reads the scroll
 * position goes through here, so the tour works in both.
 */
export function scroller(): HTMLElement {
  const root = (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
  if (root.scrollHeight - root.clientHeight > 1 && getComputedStyle(root).overflowY !== "hidden") return root;
  const body = document.body;
  if (body && body.scrollHeight - body.clientHeight > 1) return body;
  return root;
}

export function scrollOffset(): number {
  const element = scroller();
  return Math.max(window.scrollY || 0, element.scrollTop || 0);
}

export function scrollRange(): { offset: number; max: number; viewport: number } {
  const element = scroller();
  const viewport = element === document.body ? element.clientHeight : window.innerHeight;
  return {
    offset: scrollOffset(),
    max: Math.max(0, element.scrollHeight - viewport),
    viewport,
  };
}

/** Listens for scrolling on any element (capture phase), plus resizes. */
export function onScroll(listener: () => void): () => void {
  document.addEventListener("scroll", listener, { capture: true, passive: true });
  window.addEventListener("scroll", listener, { passive: true });
  window.addEventListener("resize", listener);
  return () => {
    document.removeEventListener("scroll", listener, { capture: true });
    window.removeEventListener("scroll", listener);
    window.removeEventListener("resize", listener);
  };
}
