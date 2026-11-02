import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  EdgesGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Group,
  type Mesh,
} from "three";
import { journey, statement, strengths } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { Label, letteringGeometry, Plinth, Station } from "../common";
import { clamp01, easeOutCubic } from "../helpers";
import { HALL, monolith, Z } from "../layout";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";
import { focus } from "../rigState";
import { kintsugiTextures } from "../textures";

/* ---------- Curator's statement: product principles set in brass on the wall ---------- */
export function Statement({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const lines = useMemo(
    () =>
      statement.product.principles.map((line) =>
        letteringGeometry(line, { size: 0.4, depth: 0.045, tracking: 0.02, bevel: 0.005, curveSegments: 6 }),
      ),
    [],
  );
  useEffect(() => () => lines.forEach((geometry) => geometry.dispose()), [lines]);
  return (
    <Station z={Z.statement} reach={quality.drawDistance}>
      <group position={[HALL.halfWidth - 0.03, 0, Z.statement - 0.5]} rotation-y={-Math.PI / 2}>
        {lines.map((geometry, index) => (
          <mesh
            key={statement.product.principles[index]}
            geometry={geometry}
            material={index === 1 ? m.brassPolished : m.brass}
            position={[0, 4.3 - index * 0.78, 0.03]}
            castShadow
            receiveShadow
          />
        ))}
        <Label size={0.11} position={[0, 5.15, 0.01]} letterSpacing={0.3}>
          {statement.product.title.toUpperCase()}
        </Label>
        <Label size={0.07} position={[0, 2.45, 0.01]} letterSpacing={0.2}>
          SCIENCE-LED · PRACTICAL · USER-FACING OUTPUT: CLEAR
        </Label>
      </group>
      {/* A long travertine bench, for reading the wall. */}
      <Plinth size={[0.62, 0.44, 2.8]} position={[4.4, 0, Z.statement]} material={m.travertine} radius={0.02} />
    </Station>
  );
}

/* ---------- Visitor information pylon, with an alarm lamp for the curious ---------- */
export function Facts({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const lamp = useRef<Mesh>(null);
  const lampMaterial = useMemo(
    () => new MeshStandardMaterial({ color: "#3a0e0b", emissive: new Color("#ff3b2b"), emissiveIntensity: 0, roughness: 0.3 }),
    [],
  );
  useEffect(() => () => lampMaterial.dispose(), [lampMaterial]);
  useFrame((state) => {
    const since = performance.now() - ui.get().alarmAt;
    const active = ui.get().alarmAt > 0 && since < 3200;
    const blink = active ? (Math.sin(state.clock.elapsedTime * 14) > 0 ? 1 : 0.15) : 0;
    lampMaterial.emissiveIntensity = blink * 6;
  });
  return (
    <Station z={Z.facts} reach={quality.drawDistance}>
      <group position={[-1.6, 0, Z.facts]} rotation-y={0.32}>
        <RoundedBox args={[1, 2.5, 0.14]} radius={0.02} position={[0, 1.25, 0]} material={m.lacquer} castShadow receiveShadow />
        <mesh position={[0, 2.12, 0.075]} material={m.brass}>
          <torusGeometry args={[0.13, 0.012, 12, 48]} />
        </mesh>
        <Label size={0.17} color="#d9b46a" position={[0, 2.12, 0.08]} letterSpacing={0}>
          i
        </Label>
        <Label size={0.06} color="#e9dcc4" position={[0, 1.72, 0.08]} letterSpacing={0.24} maxWidth={0.8}>
          VISITOR INFORMATION
        </Label>
        <Label size={0.038} color="#bfb19a" position={[0, 1.5, 0.08]} letterSpacing={0.16} maxWidth={0.8}>
          {"OPEN DAILY · TABS: CLASSIFIED"}
        </Label>
        <mesh ref={lamp} position={[0, 2.56, 0]} material={lampMaterial}>
          <sphereGeometry args={[0.06, 24, 16]} />
        </mesh>
        <mesh position={[0, 2.51, 0]} material={m.brass}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 24]} />
        </mesh>
      </group>
    </Station>
  );
}

/* ---------- The journey: five monoliths, each a release ---------- */
export function Journey({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const install = useRef<Group>(null);
  const years = useMemo(
    () =>
      journey.entries.map((entry) => {
        const geometry = letteringGeometry(entry.period.toUpperCase(), {
          size: 0.17,
          depth: 0.02,
          tracking: 0.04,
          bevel: 0.003,
          curveSegments: 6,
        });
        // Long periods are scaled down to sit inside the monolith's face.
        const box = geometry.boundingBox!;
        const width = box.max.x - box.min.x;
        const fit = Math.min(1, 0.84 / width);
        geometry.scale(fit, fit, 1);
        geometry.computeBoundingBox();
        return geometry;
      }),
    [],
  );
  useEffect(() => () => years.forEach((geometry) => geometry.dispose()), [years]);
  const ghostEdges = useMemo(() => {
    const last = monolith(journey.entries.length - 1);
    const box = new BoxGeometry(1.05, last.height * 0.36, 0.62);
    const edges = new EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);
  useEffect(() => () => ghostEdges.dispose(), [ghostEdges]);
  const bodies = [m.plasterShade, m.travertine, m.smokedGlass, m.steel, m.brass];
  const inks = [m.brass, m.brass, m.brassPolished, m.lacquer, m.lacquer];
  const first = monolith(0);
  const last = monolith(journey.entries.length - 1);

  useFrame((state) => {
    if (!install.current) return;
    const t = rig.reducedMotion ? 0.62 : (state.clock.elapsedTime * 0.08) % 1;
    install.current.scale.y = Math.max(0.001, easeOutCubic(t));
  });

  return (
    <Station z={(first.z + last.z) / 2} reach={quality.drawDistance + 16}>
      {/* Brass timeline inlaid in the floor. */}
      <mesh position={[first.x - 0.9, 0.003, (first.z + last.z) / 2]} material={m.brass} receiveShadow>
        <boxGeometry args={[0.03, 0.006, first.z - last.z + 6]} />
      </mesh>
      {journey.entries.map((entry, index) => {
        const mo = monolith(index);
        const installing = entry.status === "INSTALLING";
        const solid = installing ? mo.height * 0.64 : mo.height;
        return (
          <group key={entry.period} position={[mo.x, 0, mo.z]} rotation-y={mo.rotationY}>
            <RoundedBox
              args={[1.05, solid, 0.62]}
              radius={0.025}
              smoothness={3}
              position={[0, solid / 2, 0]}
              material={bodies[index]}
              castShadow
              receiveShadow
            />
            {installing ? (
              <group position={[0, solid, 0]}>
                <mesh position={[0, (mo.height - solid) / 2, 0]} material={m.caseGlass} renderOrder={2}>
                  <boxGeometry args={[1.05, mo.height - solid, 0.62]} />
                </mesh>
                <lineSegments position={[0, (mo.height - solid) / 2, 0]} material={m.brassLine} geometry={ghostEdges} />
                <group ref={install}>
                  <mesh position={[0, (mo.height - solid) / 2, 0]} material={m.brassPolished}>
                    <boxGeometry args={[0.98, mo.height - solid, 0.55]} />
                  </mesh>
                </group>
              </group>
            ) : null}
            <mesh
              geometry={years[index]}
              material={inks[index]}
              position={[0, Math.min(solid - 0.42, 1.25), 0.32]}
              castShadow
            />
            <mesh position={[-0.9, 0.004, 0.2]} rotation-x={-Math.PI / 2} material={m.brass}>
              <circleGeometry args={[0.09, 32]} />
            </mesh>
            <Label size={0.05} position={[0, 0.16, 0.315]} letterSpacing={0.18} color={index >= 3 ? "#efe6d6" : "#2b2723"}>
              {`${entry.title.toUpperCase()} · ${entry.status}`}
            </Label>
          </group>
        );
      })}
    </Station>
  );
}

/* ---------- Character build: four glass tubes filled to the self-reported value ---------- */
export function Strengths({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const fills = useRef<(Mesh | null)[]>([]);
  const progress = useRef(0);
  const amber = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#c98a1e",
        emissive: new Color("#ffb02e"),
        emissiveIntensity: 0.35,
        roughness: 0.18,
        clearcoat: 1,
      }),
    [],
  );
  useEffect(() => () => amber.dispose(), [amber]);
  const tubeHeight = 2.1;
  useFrame((_, delta) => {
    const near = Math.abs(focus.z - Z.strengths) < 7;
    progress.current = rig.reducedMotion ? 1 : clamp01(progress.current + (near ? delta / 2.2 : -delta / 3));
    fills.current.forEach((fill, index) => {
      if (!fill) return;
      const value = strengths.items[index].value / 100;
      const h = Math.max(0.001, easeOutCubic(progress.current) * value * tubeHeight);
      fill.scale.y = h;
      fill.position.y = 0.12 + h / 2;
    });
  });
  return (
    <Station z={Z.strengths} reach={quality.drawDistance}>
      <RoundedBox args={[3.8, 0.12, 0.8]} radius={0.02} position={[2.9, 0.06, Z.strengths]} material={m.lacquer} castShadow receiveShadow />
      {strengths.items.map((item, index) => {
        const x = 1.6 + index * 0.88;
        const z = Z.strengths + Math.abs(index - 1.5) * 0.08;
        return (
          <group key={item.id} position={[x, 0, z]}>
            <mesh position={[0, 0.12 + tubeHeight / 2, 0]} material={m.caseGlass} renderOrder={2}>
              <cylinderGeometry args={[0.17, 0.17, tubeHeight, 48, 1, true]} />
            </mesh>
            <mesh
              ref={(mesh) => {
                fills.current[index] = mesh;
              }}
              material={amber}
            >
              <cylinderGeometry args={[0.145, 0.145, 1, 40]} />
            </mesh>
            {[0.12, 0.12 + tubeHeight].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={m.brass} castShadow>
                <cylinderGeometry args={[0.19, 0.19, 0.05, 48]} />
              </mesh>
            ))}
            <Label size={0.05} position={[0, 0.06, 0.41]} color="#efe6d6" letterSpacing={0.12}>
              {`${item.number} · ${item.value}`}
            </Label>
          </group>
        );
      })}
    </Station>
  );
}

/* ---------- Known issues: a kintsugi vessel, broken and repaired in gold ---------- */
function vesselGeometry() {
  const profile = [
    [0.0, 0.0],
    [0.11, 0.0],
    [0.13, 0.02],
    [0.17, 0.09],
    [0.215, 0.2],
    [0.22, 0.27],
    [0.2, 0.35],
    [0.15, 0.42],
    [0.11, 0.47],
    [0.105, 0.52],
    [0.125, 0.56],
    [0.118, 0.565],
    [0.095, 0.53],
    [0.09, 0.47],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(profile, 96);
}

export function KnownIssues({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const vessel = useRef<Group>(null);
  const resources = useMemo(() => {
    const maps = kintsugiTextures(quality.textureScale);
    const material = new MeshPhysicalMaterial({
      map: maps.map,
      metalnessMap: maps.metalness,
      roughnessMap: maps.roughness,
      metalness: 1,
      roughness: 1,
      clearcoat: 0.7,
      clearcoatRoughness: 0.12,
      emissive: new Color("#e2a33c"),
      emissiveMap: maps.metalness,
      emissiveIntensity: 0,
    });
    return { maps, material, geometry: vesselGeometry() };
  }, [quality.textureScale]);
  useEffect(
    () => () => {
      resources.maps.map.dispose();
      resources.maps.metalness.dispose();
      resources.maps.roughness.dispose();
      resources.material.dispose();
      resources.geometry.dispose();
    },
    [resources],
  );
  const spin = useRef(0);
  useFrame((_, delta) => {
    const since = performance.now() - ui.get().patchAt;
    const pulse = ui.get().patchAt > 0 && since < 2400 ? Math.sin((since / 2400) * Math.PI) : 0;
    resources.material.emissiveIntensity = pulse * 2.2;
    if (!rig.reducedMotion) spin.current += Math.min(delta, 0.1) * 0.12;
    if (vessel.current) vessel.current.rotation.y = spin.current;
  });
  return (
    <Station z={Z.issues} reach={quality.drawDistance}>
      <Plinth size={[0.6, 1.02, 0.6]} position={[2.1, 0, Z.issues]} material={m.travertine}>
        <group ref={vessel}>
          <mesh geometry={resources.geometry} material={resources.material} scale={1.25} castShadow receiveShadow />
        </group>
        <Label size={0.03} position={[0, -0.12, 0.302]} letterSpacing={0.14} maxWidth={0.56}>
          {"STABLE. NOT BUG-FREE. REPAIRED IN PLACE."}
        </Label>
      </Plinth>
    </Station>
  );
}
