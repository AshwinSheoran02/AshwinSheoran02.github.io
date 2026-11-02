import { useRef, useState, type KeyboardEvent } from "react";
import { about, facts, interests, statement } from "../../data/profile";
import { ui, useUi } from "../../lib/store";
import { Lines, Panel, Station } from "../Panel";

function MainPlot() {
  return (
    <Station station="about" labelledBy="about-title">
      <Panel label={about.label}>
        <h2 id="about-title" className="display">
          <Lines lines={about.headline} />
        </h2>
        <div className="prose">
          {about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <ul className="status-list" aria-label="Current status">
          {about.status.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>
    </Station>
  );
}

function Interests() {
  const selected = useUi((state) => state.interest);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = interests.items;
  const active = items.find((item) => item.id === selected) ?? items[0];

  const select = (index: number) => {
    const wrapped = (index + items.length) % items.length;
    ui.set({ interest: items[wrapped].id });
    tabs.current[wrapped]?.focus();
  };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      select(moves[event.key]);
    }
  };

  return (
    <Station station="interests" labelledBy="interests-title" className="station--interests">
      <Panel label={interests.label}>
        <h2 id="interests-title" className="display">
          <Lines lines={interests.headline} />
        </h2>
        <div className="tabs" role="tablist" aria-label="Interests">
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              id={`interest-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={item.id === active.id}
              aria-controls="interest-panel"
              tabIndex={item.id === active.id ? 0 : -1}
              onClick={() => ui.set({ interest: item.id })}
              onKeyDown={(event) => onKey(event, index)}
            >
              <small>{item.number}</small>
              {item.label}
            </button>
          ))}
        </div>
        <div
          id="interest-panel"
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={`interest-tab-${active.id}`}
          tabIndex={0}
          key={active.id}
        >
          <p className="object-caption">
            <span>On the plinth</span> {active.object}
          </p>
          {active.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {"callout" in active && active.callout ? (
            <ul className="callout">
              {active.callout.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {"note" in active && active.note ? <p className="aside-note">{active.note}</p> : null}
        </div>
      </Panel>
    </Station>
  );
}

function CuratorStatement() {
  return (
    <Station station="statement" labelledBy="statement-title" className="station--statement">
      <Panel label={statement.label} className="panel--wide">
        <h2 id="statement-title" className="display">
          <Lines lines={statement.beauty.headline} />
        </h2>
        <div className="statement-grid">
          <div className="prose">
            <h3 className="minor">{statement.beauty.title}</h3>
            {statement.beauty.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="aside-note">{statement.beauty.annotation}</p>
          </div>
          <div className="prose">
            <h3 className="minor">{statement.product.title}</h3>
            <p className="subhead">
              <Lines lines={statement.product.headline} />
            </p>
            {statement.product.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul className="principles">
              {statement.product.principles.map((principle) => (
                <li key={principle}>{principle}</li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </Station>
  );
}

function VisitorInformation() {
  const [clicked, setClicked] = useState(false);
  return (
    <Station station="facts" labelledBy="facts-title" className="station--facts">
      <Panel label={facts.label} className="panel--wide">
        <h2 id="facts-title" className="display">
          {facts.headline}
        </h2>
        <dl className="facts">
          {facts.items.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="curiosity">
          <button
            type="button"
            className="button button--warning"
            onClick={() => {
              setClicked(true);
              ui.set({ alarmAt: performance.now() });
            }}
          >
            {facts.doNotClick.label}
          </button>
          <p role="status" aria-live="polite" className="curiosity__response">
            {clicked ? facts.doNotClick.response.join(" ") : ""}
          </p>
        </div>
      </Panel>
    </Station>
  );
}

export function About() {
  return (
    <section id="about" className="chapter" aria-label="About">
      <MainPlot />
      <Interests />
      <CuratorStatement />
      <VisitorInformation />
    </section>
  );
}
