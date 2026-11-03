import { useState } from "react";
import { fieldPositions } from "../../data/field";
import { about, facts, interests, statement } from "../../data/profile";
import { ui } from "../../lib/store";
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
  const items = interests.items;
  return (
    <section className="interests" aria-labelledby="interests-title">
      {items.map((item, index) => {
        const position = fieldPositions[item.id].toLowerCase();
        return (
          <Station key={item.id} station={`interest:${item.id}`} as="div" className="station--interest">
            <Panel label={index === 0 ? interests.label : undefined}>
              {index === 0 ? (
                <h2 id="interests-title" className="display">
                  <Lines lines={interests.headline} />
                </h2>
              ) : null}
              <article className="interest" aria-labelledby={`interest-${item.id}`}>
                <p className="interest__position">
                  <span>{item.number}</span> Fielding at {position}
                </p>
                <h3 id={`interest-${item.id}`} className="interest__title">
                  {item.label}
                </h3>
                {item.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {"callout" in item && item.callout ? (
                  <ul className="callout">
                    {item.callout.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                {"note" in item && item.note ? <p className="aside-note">{item.note}</p> : null}
              </article>
            </Panel>
          </Station>
        );
      })}
    </section>
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
