import { hero } from "../../data/profile";
import { scrollToTarget } from "../../lib/scroll";
import { Station } from "../Panel";

/* The opening lower third. The giant screen in the stadium carries the name too; this is the readable version. */
export function Home() {
  return (
    <Station station="home" id="home" labelledBy="home-title" className="station--home">
      <div className="hero-label" data-ui>
        <div className="hero-label__main">
          <p className="kicker">{hero.kicker}</p>
          <h1 id="home-title">{hero.name}</h1>
          <p className="hero-roles">
            {hero.roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </p>
        </div>
        <div className="hero-label__side">
          <dl className="hero-meta">
            {hero.metadata.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="hero-actions">
            <a
              className="button button--primary"
              href="#about"
              onClick={(event) => {
                event.preventDefault();
                scrollToTarget("about");
              }}
            >
              {hero.cta}
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </a>
            <p className="hero-medium">{hero.medium}</p>
          </div>
        </div>
      </div>
      <div className="ticker" data-ui>
        <p className="ticker__label" aria-hidden="true">
          Breaking
        </p>
        <p className="sr-only">{hero.ticker.join(". ")}</p>
        <div className="ticker__window" aria-hidden="true">
          <div className="ticker__track">
            {[...hero.ticker, ...hero.ticker].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </Station>
  );
}
