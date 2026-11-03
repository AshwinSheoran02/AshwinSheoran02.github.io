import { Bloom, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { useEffect, useState, type ComponentType, type ReactElement } from "react";
import { ACESFilmicToneMapping } from "three";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { QualitySettings } from "./quality";

/*
 * Post-processing stack. Ambient occlusion grounds objects, bloom makes the
 * floodlights, screens and LED boards glow, ACES gives the broadcast contrast.
 * When the composer is off the renderer applies the same curve itself.
 */
export function Effects({ quality, antialiased }: { quality: QualitySettings; antialiased: boolean }) {
  const gl = useThree((state) => state.gl);
  const useComposer = quality.postprocessing || !antialiased;
  const [Occlusion, setOcclusion] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!quality.ambientOcclusion) return;
    let alive = true;
    import("./AmbientOcclusion").then((module) => {
      if (alive) setOcclusion(() => module.AmbientOcclusion);
    });
    return () => {
      alive = false;
    };
  }, [quality.ambientOcclusion]);

  useEffect(() => {
    if (useComposer) return;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl, useComposer]);

  if (!useComposer) return null;

  const effects: ReactElement[] = [];
  const occlusion = quality.ambientOcclusion && Occlusion;
  if (occlusion) effects.push(<Occlusion key="ao" />);
  if (quality.bloom) {
    effects.push(
      <Bloom key="bloom" mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.25} intensity={0.9} radius={0.72} />,
    );
  }
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />);
  effects.push(<Vignette key="vignette" offset={0.3} darkness={0.55} />);
  if (quality.tier === "high") {
    effects.push(<Noise key="grain" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.22} />);
  }
  effects.push(<SMAA key="smaa" />);

  return (
    <EffectComposer key={occlusion ? "with-ao" : "plain"} multisampling={0} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
