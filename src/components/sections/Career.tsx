import { useState, type CSSProperties } from "react";
import { journey, knownIssues, sideQuests, strengths } from "../../data/profile";
import { ui, useUi } from "../../lib/store";
import { Lines, Panel, Station } from "../Panel";

function Journey() {
  const count = journey.entries.length;
  return (
    <section className="journey" aria-labelledby="journey-title">
      {journey.entries.map((entry, index) => (
        <Station key={entry.period} station={`journey-${index}`} as="div" className="station--journey">
          <Panel label={index === 0 ? journey.label : undefined}>
            {index === 0 ? (
              <h2 id="journey-title" className="display">
                <Lines lines={journey.headline} />
              </h2>
            ) : null}
            <article className="milestone" aria-label={`${entry.period}: ${entry.title}`}>
              <p className="milestone__index">
                <span>
                  {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                </span>
                <span className={`stamp stamp--${entry.status.toLowerCase()}`}>{entry.status}</span>
              </p>
              <p className="milestone__period">{entry.period}</p>
              <h3 className="milestone__title">{entry.title}</h3>
              {entry.subtitle ? <p className="milestone__subtitle">{entry.subtitle}</p> : null}
              <p className="milestone__detail">{entry.detail}</p>
            </article>
          </Panel>
        </Station>
      ))}
    </section>
  );
}

function SideQuests() {
  const active = useUi((state) => state.sideQuest);
  return (
    <Station station="side-quests" labelledBy="quests-title" className="station--quests">
      <Panel label={sideQuests.label} className="panel--wide">
        <h2 id="quests-title" className="display">
          {sideQuests.headline}
        </h2>
        <ol className="quests">
          {sideQuests.entries.map((quest, index) => (
            <li
              key={quest.id}
              data-active={active === quest.id}
              onMouseEnter={() => ui.set({ sideQuest: quest.id })}
              onMouseLeave={() => ui.set({ sideQuest: null })}
              onFocus={() => ui.set({ sideQuest: quest.id })}
              onBlur={() => ui.set({ sideQuest: null })}
              tabIndex={0}
            >
              <span className="quests__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{quest.title}</h3>
                {"subtitle" in quest && quest.subtitle ? <p className="quests__subtitle">{quest.subtitle}</p> : null}
                <p>{quest.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </Station>
  );
}

function Strengths() {
  return (
    <Station station="strengths" labelledBy="strengths-title">
      <Panel label={strengths.label}>
        <h2 id="strengths-title" className="display">
          <Lines lines={strengths.headline} />
        </h2>
        <ul className="meters">
          {strengths.items.map((item) => (
            <li key={item.id}>
              <div className="meters__head">
                <h3>
                  <span>{item.number}</span> {item.title}
                </h3>
                <strong aria-hidden="true">{item.value}</strong>
              </div>
              <p>{item.description}</p>
              <div
                className="meter"
                role="meter"
                aria-label={item.meterLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={item.value}
                style={{ "--value": `${item.value}%` } as CSSProperties}
              >
                <i />
              </div>
            </li>
          ))}
        </ul>
        <p className="aside-note">{strengths.note.join(" ")}</p>
      </Panel>
    </Station>
  );
}

function KnownIssues() {
  const [message, setMessage] = useState<string>(knownIssues.idle);
  return (
    <Station station="known-issues" labelledBy="issues-title">
      <Panel label={knownIssues.label} className="panel--wide">
        <h2 id="issues-title" className="display">
          <Lines lines={knownIssues.headline} />
        </h2>
        <div className="issues">
          {knownIssues.items.map((issue) => (
            <article key={issue.id} className="issue">
              <header>
                <span>BUG_{issue.number}</span>
                <span className="issue__severity">Severity: {issue.severity}</span>
              </header>
              <h3>{issue.title}</h3>
              <dl>
                <div>
                  <dt>Description</dt>
                  <dd>{issue.description}</dd>
                </div>
                <div>
                  <dt>Current patch</dt>
                  <dd>{issue.currentPatch}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="issue-controls">
          {knownIssues.controls.map((control) => (
            <button
              key={control.label}
              type="button"
              className="button button--quiet"
              onClick={() => {
                setMessage(control.response);
                ui.set({ patchAt: performance.now() });
              }}
            >
              {control.label}
            </button>
          ))}
          <p className="issue-controls__response" role="status" aria-live="polite">
            {message}
          </p>
        </div>
      </Panel>
    </Station>
  );
}

export function Career() {
  return (
    <section id="experience" className="chapter" aria-label="Experience">
      <Journey />
      <SideQuests />
      <Strengths />
      <KnownIssues />
    </section>
  );
}
