import { Preload } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { rig, ui } from "../lib/store";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { clamp01, easeInOut } from "./helpers";
import { MaterialProvider } from "./materials";
import type { QualitySettings } from "./quality";
import { Collection } from "./stations/Collection";
import { Exit } from "./stations/Exit";
import { Foyer } from "./stations/Foyer";
import { Journey, KnownIssues, Facts, Statement, Strengths } from "./stations/Galleries";
import { Interests } from "./stations/Interests";
import { Prism } from "./stations/Prism";
import { SideQuests } from "./stations/SideQuests";
import { Hall } from "./world/Hall";
import { Dust, LightShafts } from "./world/LightShafts";
import { Atmosphere, GalleryEnvironment, Sun } from "./world/Lighting";
import { SpotRig } from "./world/SpotRig";

/** Brings the sun up over the opening seconds, then reports the scene as ready. */
function Sunrise({ intensity, onReady }: { intensity: { current: number }; onReady: () => void }) {
  const frames = useRef(0);
  const start = useRef(-1);
  const reported = useRef(false);
  useFrame((state) => {
    frames.current += 1;
    if (rig.capture) {
      const target = window as Window & { __frames?: number; __render?: { calls: number; triangles: number } };
      target.__frames = frames.current;
      target.__render = { calls: state.gl.info.render.calls, triangles: state.gl.info.render.triangles };
    }
    // A few frames in, shaders are compiled and the first image is on screen.
    if (!reported.current && frames.current > 3) {
      reported.current = true;
      onReady();
    }
    if (rig.capture) {
      intensity.current = 1;
      return;
    }
    if (!ui.get().sceneReady) {
      intensity.current = rig.reducedMotion ? 1 : 0.35;
      return;
    }
    if (start.current < 0) start.current = state.clock.elapsedTime;
    const t = rig.reducedMotion ? 1 : clamp01((state.clock.elapsedTime - start.current) / 2.6);
    intensity.current = 0.35 + 0.65 * easeInOut(t);
  });
  return null;
}

export function World({
  quality,
  antialiased,
  onReady,
}: {
  quality: QualitySettings;
  antialiased: boolean;
  onReady: () => void;
}) {
  const sunIntensity = useRef(rig.reducedMotion ? 1 : 0.35);
  return (
    <MaterialProvider quality={quality}>
      <Atmosphere />
      <GalleryEnvironment quality={quality} />
      <Sun quality={quality} intensity={sunIntensity} />
      <SpotRig quality={quality} />
      <Hall quality={quality} />
      {quality.lightShafts ? <LightShafts intensity={sunIntensity} /> : null}
      {quality.dust ? <Dust count={quality.tier === "high" ? 1100 : 700} /> : null}

      <Foyer quality={quality} />
      <Prism quality={quality} />
      <Interests quality={quality} />
      <Statement quality={quality} />
      <Facts quality={quality} />
      <Journey quality={quality} />
      <SideQuests quality={quality} />
      <Strengths quality={quality} />
      <KnownIssues quality={quality} />
      <Collection quality={quality} />
      <Exit quality={quality} />

      <CameraRig />
      <Sunrise intensity={sunIntensity} onReady={onReady} />
      <Effects quality={quality} antialiased={antialiased} />
      <Preload all />
    </MaterialProvider>
  );
}
