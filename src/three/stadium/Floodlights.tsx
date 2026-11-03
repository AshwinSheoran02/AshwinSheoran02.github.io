import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";
import { rig, ui } from "../../lib/store";
import { clamp01 } from "../helpers";
import { TOWERS } from "../layout";
import type { QualitySettings } from "../quality";
import { lights } from "./lightState";

const HEAD_W = 17;
const HEAD_H = 10;
const COLS = 9;
const ROWS = 5;

/** Turns the floodlights on, tower by tower, once the scene is ready. Also drives the light show. */
export function SwitchOn() {
  const start = useRef(-1);
  const lastAlarm = useRef(0);
  const showStart = useRef(-100);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { sceneReady, alarmAt } = ui.get();
    if (alarmAt !== lastAlarm.current) {
      lastAlarm.current = alarmAt;
      showStart.current = t;
    }
    const sinceShow = t - showStart.current;
    lights.show = !rig.reducedMotion && sinceShow < 3 ? (Math.sin(sinceShow * 18) > 0 ? 1 : 0) * (1 - sinceShow / 3) : 0;

    if (rig.reducedMotion || rig.capture) {
      lights.towers.fill(1);
      lights.level = 1;
      return;
    }
    if (!sceneReady) {
      lights.towers.fill(0.04);
      lights.level = 0.04;
      return;
    }
    if (start.current < 0) start.current = t;
    const elapsed = t - start.current;
    let sum = 0;
    lights.towers.forEach((_, index) => {
      const local = elapsed - 0.35 - index * 0.32;
      // A short flicker as the lamps strike, then up to full.
      const flicker = local > 0 && local < 0.18 ? (Math.sin(local * 90) > 0 ? 0.7 : 0.15) : local >= 0.18 ? 1 : 0.04;
      const value = local >= 0.18 ? Math.min(1, 0.7 + (local - 0.18) * 1.5) : flicker;
      lights.towers[index] = Math.max(0.04, value);
      sum += lights.towers[index];
    });
    lights.level = sum / lights.towers.length;
  });
  return null;
}

const beamVertex = /* glsl */ `
  varying float vAlong;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  void main() {
    vAlong = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mv.xyz;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;
const beamFragment = /* glsl */ `
  uniform float uLevel;
  varying float vAlong;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  void main() {
    float facing = abs(dot(normalize(vNormalView), normalize(vViewPosition)));
    float soft = pow(facing, 1.6);
    float fade = pow(vAlong, 2.2);
    float alpha = uLevel * soft * fade * 0.05;
    gl_FragColor = vec4(vec3(0.82, 0.88, 1.0) * alpha, 1.0);
  }
`;

function Tower({ index, quality, resources }: { index: number; quality: QualitySettings; resources: TowerResources }) {
  const tower = TOWERS[index];
  const head = useRef<Group>(null);
  const lampMaterial = useMemo(() => new MeshBasicMaterial({ color: new Color(1, 1, 1), fog: false }), []);
  const beamMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uLevel: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  const lamps = useMemo(() => {
    const mesh = new InstancedMesh(resources.lamp, lampMaterial, COLS * ROWS);
    const dummy = new Object3D();
    let i = 0;
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        dummy.position.set((c - (COLS - 1) / 2) * (HEAD_W / COLS), (r - (ROWS - 1) / 2) * (HEAD_H / ROWS), 0.36);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    // Bounds must cover every lamp, or the bank vanishes when the head's centre leaves the frame.
    mesh.computeBoundingSphere();
    return mesh;
  }, [resources.lamp, lampMaterial]);
  useEffect(
    () => () => {
      lampMaterial.dispose();
      beamMaterial.dispose();
      lamps.dispose();
    },
    [lampMaterial, beamMaterial, lamps],
  );

  const headPosition = useMemo(() => new Vector3(tower.x, tower.height, tower.z), [tower]);
  const beam = useMemo(() => {
    const aim = new Vector3(0, 0, 0);
    const direction = aim.clone().sub(headPosition);
    const length = direction.length();
    return { length, quaternion: new Object3D().quaternion.setFromUnitVectors(new Vector3(0, -1, 0), direction.normalize()) };
  }, [headPosition]);

  useEffect(() => {
    head.current?.lookAt(0, -18, 0);
  }, []);

  useFrame(() => {
    const level = lights.towers[index] + lights.show * 0.6;
    lampMaterial.color.setScalar(0.08 + 9 * clamp01(level) * (1 + lights.show));
    beamMaterial.uniforms.uLevel.value = level;
  });

  return (
    <group>
      <mesh geometry={resources.mast} material={resources.steel} position={[tower.x, tower.height / 2, tower.z]} />
      <group ref={head} position={headPosition}>
        <mesh material={resources.steel} position={[0, 0, -0.1]}>
          <boxGeometry args={[HEAD_W + 1.4, HEAD_H + 1.4, 0.7]} />
        </mesh>
        <mesh material={resources.steel} position={[0, -HEAD_H / 2 - 1.6, 1]}>
          <boxGeometry args={[HEAD_W, 0.4, 2.2]} />
        </mesh>
        <primitive object={lamps} />
      </group>
      {quality.beams ? (
        <mesh
          geometry={resources.beam}
          material={beamMaterial}
          position={headPosition.clone().lerp(new Vector3(0, 0, 0), 0.5)}
          quaternion={beam.quaternion}
          scale={[1, beam.length, 1]}
          renderOrder={5}
          frustumCulled={false}
        />
      ) : null}
    </group>
  );
}

interface TowerResources {
  mast: CylinderGeometry;
  lamp: CircleGeometry;
  steel: MeshStandardMaterial;
  beam: ConeGeometry;
}

export function Floodlights({ quality }: { quality: QualitySettings }) {
  const resources = useMemo<TowerResources>(() => {
    // Apex at +0.5 (the lamps), open base at -0.5 (the field); uv.y runs 1 at the apex to 0 at the base.
    const beam = new ConeGeometry(34, 1, 40, 1, true);
    return {
      mast: new CylinderGeometry(0.9, 1.9, TOWERS[0].height, 10),
      lamp: new CircleGeometry(0.62, 20),
      steel: new MeshStandardMaterial({ color: "#3a404b", metalness: 0.75, roughness: 0.45 }),
      beam,
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  return (
    <>
      {TOWERS.map((_, index) => (
        <Tower key={index} index={index} quality={quality} resources={resources} />
      ))}
    </>
  );
}
