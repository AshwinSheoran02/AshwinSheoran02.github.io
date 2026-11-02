import { projects, projectsSection, type Project } from "../../data/profile";
import { ui, useUi } from "../../lib/store";
import { Lines, Panel, Station } from "../Panel";

function ProjectExhibit({ project, index, total }: { project: Project; index: number; total: number }) {
  const hovered = useUi((state) => state.hoveredExhibit === project.id);
  const live = useUi((state) => state.renderMode === "webgl");
  const actionLabel = project.kind === "game" ? projectsSection.playLabel : projectsSection.openLabel;
  return (
    <Station
      station={`project:${project.id}`}
      id={`project-${project.id}`}
      as="article"
      labelledBy={`project-${project.id}-title`}
      className="station--project"
    >
      <Panel label={index === 0 ? projectsSection.label : undefined} className={hovered ? "is-highlighted" : ""}>
        {index === 0 ? (
          <>
            <h2 className="display">
              <Lines lines={projectsSection.headline} />
            </h2>
            <p className="lede">{projectsSection.intro}</p>
          </>
        ) : null}
        <div className="exhibit-label">
          <p className="exhibit-label__number">
            Exhibit {String(index + 1).padStart(2, "0")} of {String(total).padStart(2, "0")} · {project.kind === "game" ? "Game" : "App"}
          </p>
          <h3 id={`project-${project.id}-title`} className="exhibit-label__title">
            {project.title}
          </h3>
          <p className="exhibit-label__medium">{project.medium}</p>
          <p>{project.summary}</p>
          <ul className="exhibit-label__details">
            {project.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <div className="exhibit-label__actions">
            <a className="button button--primary button--play" href={project.url}>
              {actionLabel}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 3.5 12 8l-7 4.5Z" fill="currentColor" />
              </svg>
              <span className="sr-only">: {project.navLabel}</span>
            </a>
            {project.exhibit === "pool-table" && live ? (
              <button
                type="button"
                className="button button--quiet"
                onClick={() => ui.set({ breakShotAt: performance.now() })}
              >
                Take the break shot
              </button>
            ) : null}
          </div>
          <p className="exhibit-label__url">{project.url.replace(/^https?:\/\//, "")}</p>
        </div>
      </Panel>
    </Station>
  );
}

export function Projects() {
  return (
    <section id="projects" className="chapter" aria-label="Projects">
      {projects.map((project, index) => (
        <ProjectExhibit key={project.id} project={project} index={index} total={projects.length} />
      ))}
    </section>
  );
}
