import { useEffect, useState } from "react";
import { useUi } from "../lib/store";

const LINES = ["Polishing the floor", "Hanging the exhibits", "Adjusting the sun", "Racking the balls", "Opening the doors"];

/** Opening curtain. Purely visual: the page content underneath is already readable by assistive tech. */
export function Loader() {
  const mode = useUi((state) => state.renderMode);
  const ready = useUi((state) => state.sceneReady);
  const [line, setLine] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [gone, setGone] = useState(false);
  const done = mode === "static" || (mode === "webgl" && ready) || timedOut;

  useEffect(() => {
    const cycle = window.setInterval(() => setLine((value) => (value + 1) % LINES.length), 900);
    const timeout = window.setTimeout(() => setTimedOut(true), 14000);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setGone(true), 1400);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (gone) return null;
  return (
    <div className="loader" data-done={done} aria-hidden="true">
      <div className="loader__inner">
        <p className="loader__brand">ASHWIN.TOP</p>
        <div className="loader__bar">
          <i />
        </div>
        <p className="loader__line">{LINES[line]}…</p>
      </div>
    </div>
  );
}
