import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { useEffect, type ReactElement } from "react";
import { ACESFilmicToneMapping } from "three";
import { ToneMappingMode } from "postprocessing";
import type { QualitySettings } from "./quality";

/*
 * Post-processing stack. Bloom makes the floodlights, screens and LED boards
 * glow, ACES gives the broadcast contrast. Kept deliberately short: an open
 * stadium at night does not need screen-space ambient occlusion.
 * When the composer is off the renderer applies the same curve itself.
 */
export function Effects({ quality, antialiased }: { quality: QualitySettings; antialiased: boolean }) {
  const gl = useThree((state) => state.gl);
  const useComposer = quality.postprocessing || !antialiased;

  useEffect(() => {
    if (useComposer) return;
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
  }, [gl, useComposer]);

  if (!useComposer) return null;

  const effects: ReactElement[] = [];
  if (quality.bloom) {
    effects.push(
      <Bloom key="bloom" mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.25} intensity={0.9} radius={0.72} />,
    );
  }
  effects.push(<ToneMapping key="tone" mode={ToneMappingMode.ACES_FILMIC} />);
  effects.push(<Vignette key="vignette" offset={0.3} darkness={0.5} />);
  effects.push(<SMAA key="smaa" />);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {effects}
    </EffectComposer>
  );
}
