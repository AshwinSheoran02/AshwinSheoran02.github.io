import { lazy, Suspense, useEffect, useState } from "react";
import { stationOrder } from "../data/stations";
import { publicAsset } from "../lib/publicAsset";
import { ui, useUi, type QualityTier } from "../lib/store";

const Experience = lazy(() => import("../three/Experience"));

/** Stills rendered from the 3D stadium, used when WebGL is unavailable. */
const STILLS = new Set([
  "home",
  "about",
  "interest-cricket",
  "interest-markets",
  "interest-gaming",
  "interest-vibe-coding",
  "interest-photography",
  "statement",
  "facts",
  "journey-0",
  "journey-2",
  "journey-4",
  "side-quests",
  "strengths",
  "known-issues",
  "project-harry-potter",
  "project-pool-game",
  "contact",
]);

function stillFor(station: string): string | null {
  const name = station.replace(":", "-");
  if (STILLS.has(name)) return name;
  if (name.startsWith("journey-")) {
    const index = Number(name.slice(8));
    return index <= 1 ? "journey-0" : index <= 3 ? "journey-2" : "journey-4";
  }
  return null;
}

function StaticStage() {
  const active = useUi((state) => state.activeStation);
  const [layers, setLayers] = useState<string[]>(() => [stillFor(active) ?? "home"]);
  const current = stillFor(active);

  if (current && layers[layers.length - 1] !== current) {
    setLayers([...layers.slice(-1), current]);
  }

  useEffect(() => {
    // Warm the cache for the neighbouring stations so cross-fades are instant.
    const index = stationOrder.indexOf(active);
    [index - 1, index + 1].forEach((neighbour) => {
      const name = stillFor(stationOrder[neighbour] ?? "");
      if (name) new Image().src = publicAsset(`stills/${name}.webp`);
    });
  }, [active]);

  return (
    <div className="static-stage" data-generic={current ? "false" : "true"}>
      {layers.map((name, index) => (
        <div
          key={`${name}-${index}`}
          className="static-stage__layer"
          data-current={index === layers.length - 1}
          style={{ backgroundImage: `url(${publicAsset(`stills/${name}.webp`)})` }}
        />
      ))}
    </div>
  );
}

export function Stage({ tier }: { tier: QualityTier }) {
  const mode = useUi((state) => state.renderMode);
  return (
    <div className="stage" aria-hidden="true">
      {mode === "webgl" ? (
        <Suspense fallback={null}>
          <Experience
            initialTier={tier}
            onFailure={(reason) => {
              console.warn(`3D stadium unavailable (${reason}); showing still frames instead.`);
              ui.set({ renderMode: "static" });
            }}
          />
        </Suspense>
      ) : null}
      {mode === "static" ? <StaticStage /> : null}
    </div>
  );
}
