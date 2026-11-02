import { Bloom, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { useEffect, useState, type ComponentType, type ReactElement } from "react";
import { AgXToneMapping } from "three";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import type { QualitySettings } from "./quality";

/*
 * Post-processing stack. Ambient occlusion grounds objects, bloom lets the
 * sunlit windows and the spectrum glow, AgX keeps highlights natural.
 * When the composer is off the renderer applies the same AgX curve itself.
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
    gl.toneMapping = AgXToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl, useComposer]);

  if (!useComposer) return null;

  const effects: ReactElement[] = [];
  const occlusion = quality.ambientOcclusion && Occlusion;
  if (occlusion) effects.push(<Occlusion key="ao" />);
  if (quality.bloom) {
    effects.push(
      <Bloom key="bloom" mipmapBlur luminanceThreshold={0.92} luminanceSmoothing={0.2} intensity={0.55} radius={0.75} />,
    );
  }
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.AGX} />);
  effects.push(<Vignette key="vignette" offset={0.32} darkness={0.42} />);
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
