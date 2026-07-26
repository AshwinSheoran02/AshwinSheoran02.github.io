import { useEffect, useState } from "react";

export function useActiveSection(
  sectionIds: readonly string[],
  initialSection: string,
) {
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const visibleSections = new Map<string, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) {
            visibleSections.set(id, entry);
          } else {
            visibleSections.delete(id);
          }
        }

        const nearest = [...visibleSections.entries()].sort(
          ([, first], [, second]) =>
            Math.abs(first.boundingClientRect.top) -
            Math.abs(second.boundingClientRect.top),
        )[0];

        if (nearest) {
          setActiveSection(nearest[0]);
        }
      },
      {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0, 0.1, 0.4],
      },
    );

    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}
