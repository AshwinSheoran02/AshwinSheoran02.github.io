import { useCallback, useEffect, useState } from "react";
import { Loader } from "./components/Loader";
import { ScoreBug } from "./components/ScoreBug";
import { Scorecard } from "./components/Scorecard";
import { SiteNav } from "./components/SiteNav";
import { Stage } from "./components/Stage";
import { About } from "./components/sections/About";
import { Career } from "./components/sections/Career";
import { Contact } from "./components/sections/Contact";
import { Home } from "./components/sections/Home";
import { Projects } from "./components/sections/Projects";
import { interactions } from "./data/profile";
import { useKeySequence } from "./hooks/useKeySequence";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useStationTracking } from "./hooks/useStationTracking";
import { rig, ui, useUi, type QualityTier } from "./lib/store";
import { hasWebGL2, staticRequested } from "./lib/webgl";
import { detectInitialTier } from "./three/quality";

export default function App() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [tier] = useState<QualityTier>(() => detectInitialTier());
  const [scorecard, setScorecard] = useState(false);
  const showScorecard = useCallback(() => setScorecard(true), []);
  const hideScorecard = useCallback(() => setScorecard(false), []);

  useEffect(() => {
    rig.reducedMotion = reducedMotion;
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  useEffect(() => {
    const mode = !staticRequested() && hasWebGL2() ? "webgl" : "static";
    ui.set({ renderMode: mode, tier });
    document.documentElement.dataset.renderer = mode;
    if (rig.capture) document.documentElement.dataset.capture = new URLSearchParams(window.location.search).get("capture") || "true";
  }, [tier]);

  const renderMode = useUi((state) => state.renderMode);
  const introDone = useUi((state) => state.introDone);
  const sceneReady = useUi((state) => state.sceneReady);
  useEffect(() => {
    // The lower third waits for the opening flight. A safety timer shows it regardless:
    // a few seconds after the flight should have ended, or if the scene never gets going.
    const playing = renderMode === "webgl" && !introDone && !reducedMotion && !rig.capture;
    document.documentElement.dataset.intro = playing ? "playing" : "done";
    if (!playing) return;
    const timer = window.setTimeout(() => ui.set({ introDone: true }), sceneReady ? 10000 : 15000);
    return () => window.clearTimeout(timer);
  }, [renderMode, introDone, reducedMotion, sceneReady]);

  useStationTracking();
  useKeySequence(interactions.keyboardEasterEgg.sequence, showScorecard);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteNav />
      <Stage tier={tier} />
      <Loader />
      <main id="main-content">
        <Home />
        <About />
        <Career />
        <Projects />
      </main>
      <Contact />
      <ScoreBug />
      <Scorecard visible={scorecard} onDismiss={hideScorecard} />
    </>
  );
}
