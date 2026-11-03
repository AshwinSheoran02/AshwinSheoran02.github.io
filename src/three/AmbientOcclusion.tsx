import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { Color } from "three";
import { N8AOPostPass } from "n8ao";

/*
 * Screen-space ambient occlusion, loaded on demand for the high quality tier
 * only, so other devices never download it.
 */
export function AmbientOcclusion() {
  const camera = useThree((state) => state.camera);
  const scene = useThree((state) => state.scene);
  const pass = useMemo(() => new N8AOPostPass(scene, camera), [scene, camera]);
  useLayoutEffect(() => {
    Object.assign(pass.configuration, {
      aoRadius: 0.9,
      distanceFalloff: 0.6,
      intensity: 2.2,
      halfRes: true,
      depthAwareUpsampling: true,
      color: new Color("#05070c"),
    });
    pass.setQualityMode("Medium");
  }, [pass]);
  useLayoutEffect(() => () => pass.dispose(), [pass]);
  return <primitive object={pass} />;
}
