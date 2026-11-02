import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CircleGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PMREMGenerator,
  PlaneGeometry,
  Scene,
  Vector3,
  type BufferGeometry,
  type DirectionalLight,
} from "three";
import { SUN_DIRECTION } from "../layout";
import type { QualitySettings } from "../quality";
import { focus } from "../rigState";

const SHADOW_HALF = 16;
const sun = new Vector3(...SUN_DIRECTION);
// Light-space basis, used to snap the shadow camera to whole texels so shadows do not shimmer while the camera moves.
const forward = sun.clone().negate();
const right = new Vector3(0, 1, 0).cross(forward).normalize();
const up = forward.clone().cross(right).normalize();

export function Sun({ quality, intensity }: { quality: QualitySettings; intensity: { current: number } }) {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  const snapped = useMemo(() => new Vector3(), []);
  const texel = (SHADOW_HALF * 2) / quality.shadowMapSize;

  useEffect(() => {
    const current = light.current;
    if (!current) return;
    current.target = target;
    current.shadow.needsUpdate = true;
  }, [target]);

  useFrame(() => {
    const current = light.current;
    if (!current) return;
    const a = Math.round(focus.dot(right) / texel) * texel;
    const b = Math.round(focus.dot(up) / texel) * texel;
    const c = focus.dot(forward);
    snapped.set(0, 0, 0).addScaledVector(right, a).addScaledVector(up, b).addScaledVector(forward, c);
    target.position.copy(snapped);
    target.updateMatrixWorld();
    current.position.copy(snapped).addScaledVector(sun, 45);
    current.intensity = 6.2 * intensity.current;
  });

  return (
    <directionalLight
      ref={light}
      color="#ffd0a0"
      intensity={6.2}
      castShadow
      shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
      shadow-bias={-0.00025}
      shadow-normalBias={0.025}
      shadow-radius={4}
      shadow-camera-left={-SHADOW_HALF}
      shadow-camera-right={SHADOW_HALF}
      shadow-camera-top={SHADOW_HALF}
      shadow-camera-bottom={-SHADOW_HALF}
      shadow-camera-near={5}
      shadow-camera-far={90}
    />
  );
}

/*
 * The reflection environment is painted with emissive panels arranged like the hall:
 * bright windows on the left, skylights above, warm plaster bounce on the right and
 * below. It is baked once into a prefiltered cube map, so glass, brass and lacquer
 * reflect something that matches the room without downloading an HDR file.
 */
export function GalleryEnvironment({ quality }: { quality: QualitySettings }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const room = new Scene();
    room.background = new Color("#4d443b");
    const plane = new PlaneGeometry(1, 1);
    const disc = new CircleGeometry(0.5, 48);
    const materials: MeshBasicMaterial[] = [];
    const panel = (
      color: string,
      intensity: number,
      position: [number, number, number],
      rotation: [number, number, number],
      scale: [number, number],
      geometry: BufferGeometry = plane,
    ) => {
      const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide });
      materials.push(material);
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.scale.set(scale[0], scale[1], 1);
      room.add(mesh);
    };
    for (const z of [-21, -7, 7, 21]) panel("#fff0da", 7, [-11, 3.8, z], [0, Math.PI / 2, 0], [4.2, 6]);
    panel("#f7f4ef", 2.2, [0, 9, 0], [Math.PI / 2, 0, 0], [2.4, 60]);
    panel("#efe2cf", 0.55, [11, 4, 0], [0, -Math.PI / 2, 0], [60, 8]);
    panel("#a8957c", 0.35, [0, -3, 0], [-Math.PI / 2, 0, 0], [60, 60]);
    // Ceiling and the far ends of the hall, so glossy surfaces reflect a room rather than a void.
    panel("#efe8dc", 0.42, [0, 9.2, 0], [Math.PI / 2, 0, 0], [24, 80]);
    panel("#e2d4bf", 0.4, [0, 4, -32], [0, 0, 0], [24, 10]);
    panel("#e2d4bf", 0.4, [0, 4, 32], [0, Math.PI, 0], [24, 10]);
    panel("#ffe7c4", 2.4, [-4, 7, 9], [0, 0, 0], [3, 3], disc);

    const generator = new PMREMGenerator(gl);
    const target = generator.fromScene(room, 0.02, 0.1, 100, { size: quality.environmentResolution });
    scene.environment = target.texture;
    scene.environmentIntensity = 0.75;

    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      generator.dispose();
      plane.dispose();
      disc.dispose();
      materials.forEach((material) => material.dispose());
    };
  }, [gl, scene, quality.environmentResolution]);

  return null;
}

export function Atmosphere() {
  return (
    <>
      <color attach="background" args={["#e8dfd1"]} />
      <fog attach="fog" args={["#e2d5c3", 38, 130]} />
      <hemisphereLight args={["#fff3e4", "#7d6c58", 0.22]} />
    </>
  );
}
