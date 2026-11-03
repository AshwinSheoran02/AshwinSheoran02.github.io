import { Preload } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { rig } from "../lib/store";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { MaterialProvider } from "./materials";
import type { QualitySettings } from "./quality";
import { FloodLighting, NightFog, NightSky, StadiumEnvironment } from "./stadium/Atmosphere";
import { Boards } from "./stadium/Boards";
import { Floodlights, SwitchOn } from "./stadium/Floodlights";
import { Ground } from "./stadium/Ground";
import { Scoreboard } from "./stadium/Scoreboard";
import { Stands } from "./stadium/Stands";
import { SetPieces } from "./sets/SetPieces";

/** Reports the scene as ready once shaders are compiled and the first frames are on screen. */
function ReadyReporter({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const reported = useRef(false);
  useFrame((state) => {
    frames.current += 1;
    if (rig.capture) {
      const target = window as Window & { __frames?: number; __render?: { calls: number; triangles: number } };
      target.__frames = frames.current;
      target.__render = { calls: state.gl.info.render.calls, triangles: state.gl.info.render.triangles };
    }
    if (!reported.current && frames.current > 3) {
      reported.current = true;
      onReady();
    }
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
  return (
    <MaterialProvider quality={quality}>
      <NightFog />
      <NightSky quality={quality} />
      <StadiumEnvironment quality={quality} />
      <FloodLighting quality={quality} />
      <SwitchOn />

      <Ground quality={quality} />
      <Stands quality={quality} />
      <Floodlights quality={quality} />
      <Scoreboard />
      <Boards />
      <SetPieces quality={quality} />

      <CameraRig />
      <ReadyReporter onReady={onReady} />
      <Effects quality={quality} antialiased={antialiased} />
      <Preload all />
    </MaterialProvider>
  );
}
