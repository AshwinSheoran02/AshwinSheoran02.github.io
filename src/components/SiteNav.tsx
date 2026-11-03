import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  navigation,
  projectKindLabels,
  projects,
  projectsSection,
  site,
  type NavTarget,
  type Project,
  type ProjectKind,
} from "../data/profile";
import { navTargetForStation } from "../data/stations";
import { scrollToTarget } from "../lib/scroll";
import { useUi } from "../lib/store";

const kinds = Object.keys(projectKindLabels) as ProjectKind[];

function groupedProjects() {
  return kinds
    .map((kind) => ({ kind, label: projectKindLabels[kind], items: projects.filter((project) => project.kind === kind) }))
    .filter((group) => group.items.length > 0);
}

/** A cricket ball, seam and all. */
function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#d3261d" />
      <path d="M7.2 4.6c3.2 3.6 3.2 11.2 0 14.8M16.8 4.6c-3.2 3.6-3.2 11.2 0 14.8" fill="none" stroke="#fff3e0" strokeWidth="1.2" strokeDasharray="1.4 1.3" />
      <circle cx="9" cy="8.5" r="2.4" fill="#fff" opacity="0.18" />
    </svg>
  );
}

function ProjectList({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="project-menu__groups">
      {groupedProjects().map((group) => (
        <div className="project-menu__group" key={group.kind}>
          <p className="project-menu__kind">{group.label}</p>
          <ul>
            {group.items.map((project: Project) => (
              <li key={project.id} className="project-menu__item">
                <a
                  href={`#project-${project.id}`}
                  className="project-menu__title"
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate();
                    scrollToTarget(`project-${project.id}`);
                  }}
                >
                  <span>{project.navLabel}</span>
                  <small>{project.medium}</small>
                </a>
                <a className="project-menu__play" href={project.url}>
                  {project.kind === "game" ? "Play" : "Open"}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> {project.navLabel}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function SiteNav() {
  const activeStation = useUi((state) => state.activeStation);
  const active: NavTarget = navTargetForStation(activeStation);
  const [projectsOpen, setProjectsOpenState] = useState(false);
  // Mirrors the state so hover and click handlers in the same tick agree on it.
  const projectsOpenRef = useRef(false);
  const setProjectsOpen = (open: boolean) => {
    projectsOpenRef.current = open;
    setProjectsOpenState(open);
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const projectsButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const openedByHover = useRef(false);
  const dropdownId = useId();
  const sheetId = useId();

  useEffect(() => {
    if (!projectsOpen && !menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (projectsOpen) {
        setProjectsOpen(false);
        projectsButton.current?.focus();
      }
      if (menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (projectsOpen && !dropdown.current?.contains(target) && !projectsButton.current?.contains(target)) {
        setProjectsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [projectsOpen, menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menuOpen);
    if (menuOpen) sheet.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [menuOpen]);

  const go = (target: NavTarget) => (event: ReactMouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    setProjectsOpen(false);
    scrollToTarget(target);
  };

  const hoverOpen = () => {
    window.clearTimeout(closeTimer.current);
    if (!window.matchMedia("(hover: hover)").matches || projectsOpenRef.current) return;
    openedByHover.current = true;
    setProjectsOpen(true);
  };
  const toggleProjects = () => {
    // A click right after hovering pins the menu open instead of closing it.
    if (projectsOpenRef.current && openedByHover.current) {
      openedByHover.current = false;
      return;
    }
    openedByHover.current = false;
    setProjectsOpen(!projectsOpenRef.current);
  };
  const hoverClose = () => {
    window.clearTimeout(closeTimer.current);
    if (!openedByHover.current) return;
    closeTimer.current = window.setTimeout(() => {
      openedByHover.current = false;
      setProjectsOpen(false);
    }, 220);
  };

  return (
    <header className="site-nav" data-ui>
      <nav aria-label="Main">
        <a className="brand" href="#home" onClick={go("home")}>
          <Mark />
          <span>{site.brand}</span>
          <span className="live-badge" aria-hidden="true">
            <i /> Live
          </span>
        </a>

        <ul className="nav-links">
          {navigation.map((item) =>
            item.target === "projects" ? (
              <li key={item.target} className="nav-projects" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
                <a href="#projects" aria-current={active === "projects" ? "location" : undefined} onClick={go("projects")}>
                  {item.label}
                </a>
                <button
                  ref={projectsButton}
                  type="button"
                  className="nav-projects__toggle"
                  aria-expanded={projectsOpen}
                  aria-controls={dropdownId}
                  aria-label="Show projects"
                  onClick={toggleProjects}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
                <div ref={dropdown} id={dropdownId} className="project-menu" data-open={projectsOpen} hidden={!projectsOpen}>
                  <p className="project-menu__intro">{projectsSection.label}</p>
                  <ProjectList onNavigate={() => setProjectsOpen(false)} />
                </div>
              </li>
            ) : (
              <li key={item.target}>
                <a
                  href={`#${item.target}`}
                  aria-current={active === item.target ? "location" : undefined}
                  onClick={go(item.target)}
                >
                  {item.label}
                </a>
              </li>
            ),
          )}
        </ul>

        <button
          ref={menuButton}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={sheetId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          <i aria-hidden="true" data-open={menuOpen} />
        </button>
      </nav>

      <div ref={sheet} id={sheetId} className="menu-sheet" data-open={menuOpen} hidden={!menuOpen}>
        <ul className="menu-sheet__links">
          {navigation.map((item, index) => (
            <li key={item.target}>
              <a
                href={`#${item.target}`}
                aria-current={active === item.target ? "location" : undefined}
                onClick={go(item.target)}
              >
                <small aria-hidden="true">{String(index + 1).padStart(2, "0")}</small>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <ProjectList onNavigate={() => setMenuOpen(false)} />
      </div>
      <TourProgress />
    </header>
  );
}

function TourProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? window.scrollY / max : 0;
      ref.current?.style.setProperty("--progress", value.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={ref} className="tour-progress" aria-hidden="true" />;
}
