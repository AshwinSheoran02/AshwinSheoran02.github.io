import { captionFor, oversFor } from "../data/stations";
import { useUi } from "../lib/store";

/** The broadcast score bug in the corner: how far into the tour you are, in overs, and what is on screen. */
export function ScoreBug() {
  const station = useUi((state) => state.activeStation);
  return (
    <div className="score-bug" aria-hidden="true" data-hidden={station === "home"}>
      <span className="score-bug__live">Live</span>
      <span className="score-bug__team">ASHWIN.TOP</span>
      <span className="score-bug__overs">
        <small>OV</small> {oversFor(station)}
      </span>
      <span className="score-bug__caption" key={station}>
        {captionFor(station)}
      </span>
    </div>
  );
}
