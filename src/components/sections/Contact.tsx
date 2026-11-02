import { closing, contact } from "../../data/profile";
import { publicAsset } from "../../lib/publicAsset";
import { Lines, Station } from "../Panel";

export function Contact() {
  return (
    <footer id="contact" className="contact-footer">
      <Station station="contact" as="div" className="station--contact" labelledBy="contact-title">
        <div className="panel panel--center contact-panel" data-ui>
          <p className="kicker">{closing.label}</p>
          <h2 id="contact-title" className="display display--xl">
            <Lines lines={closing.statement} />
          </h2>
          <p className="contact-identity">
            {closing.identity.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <div className="contact-actions">
            <a className="button button--primary" href={publicAsset(contact.cvHref)} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 1.5h5.5L12.5 4.5v10H4Z M9.5 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              {closing.actions.cv}
              <span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
            <a className="button button--secondary" href={contact.linkedInHref} target="_blank" rel="noreferrer">
              <span className="in-glyph" aria-hidden="true">
                in
              </span>
              {closing.actions.linkedIn}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <p className="end-line">
            <Lines lines={closing.systemLine} />
          </p>
        </div>
      </Station>
    </footer>
  );
}
