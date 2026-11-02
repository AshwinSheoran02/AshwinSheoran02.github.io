import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  CatmullRomCurve3,
  Color,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
} from "three";
import { sideQuests, type SideQuestId } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { InstancedBoxes, damp, type BoxSpec } from "../helpers";
import { Label, Station } from "../common";
import { Z } from "../layout";
import { useMaterials, type MaterialLibrary } from "../materials";
import type { QualitySettings } from "../quality";
import { codeScreenTexture, scoreboardTexture } from "../textures";

const CASE = { x: 1.2, length: 5.8, depth: 0.82, baseHeight: 0.86, glassHeight: 0.62 };

function useArtifactResources() {
  const resources = useMemo(() => {
    const scoreboard = scoreboardTexture();
    const screen = codeScreenTexture();
    const ecgPoints = [
      [-0.16, 0],
      [-0.08, 0],
      [-0.06, 0.02],
      [-0.04, 0],
      [-0.02, -0.03],
      [0, 0.12],
      [0.02, -0.06],
      [0.04, 0],
      [0.08, 0.025],
      [0.1, 0],
      [0.16, 0],
    ].map(([x, y]) => new Vector3(x, y, 0));
    const pot = new LatheGeometry(
      [
        [0, 0],
        [0.05, 0],
        [0.058, 0.01],
        [0.07, 0.09],
        [0.078, 0.095],
        [0.078, 0.105],
        [0.068, 0.105],
        [0.06, 0.09],
        [0, 0.09],
      ].map(([x, y]) => new Vector2(x, y)),
      40,
    );
    return {
      scoreboard,
      screen,
      ecg: new TubeGeometry(new CatmullRomCurve3(ecgPoints, false, "catmullrom", 0.1), 120, 0.0045, 8, false),
      pot,
      glow: new MeshStandardMaterial({
        color: "#ffcf8a",
        emissive: new Color("#ffb85c"),
        emissiveIntensity: 3.2,
      }),
      board: new MeshBasicMaterial({ map: scoreboard, toneMapped: true }),
      display: new MeshBasicMaterial({ map: screen, color: new Color(1.2, 1.2, 1.2) }),
      leaf: new MeshPhysicalMaterial({ color: "#6f8f4e", roughness: 0.55, sheen: 0.4, sheenColor: new Color("#c8e0a0") }),
      soil: new MeshStandardMaterial({ color: "#3b2a1e", roughness: 1 }),
      ribbon: new MeshPhysicalMaterial({ color: "#a33a26", roughness: 0.55, sheen: 1, sheenColor: new Color("#f2b8a0") }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  return resources;
}

type Resources = ReturnType<typeof useArtifactResources>;

function Artifact({ id, m, r }: { id: SideQuestId; m: MaterialLibrary; r: Resources }) {
  switch (id) {
    case "atom":
      return (
        <group position={[0, 0.07, 0]} rotation-y={-0.4}>
          <RoundedBox args={[0.2, 0.12, 0.08]} radius={0.012} material={m.lacquer} castShadow />
          <mesh position={[0, 0, 0.065]} rotation-x={Math.PI / 2} material={m.ink} castShadow>
            <cylinderGeometry args={[0.042, 0.046, 0.06, 32]} />
          </mesh>
          <mesh position={[0, 0, 0.097]} rotation-x={Math.PI / 2} material={m.glass}>
            <cylinderGeometry args={[0.032, 0.032, 0.006, 32]} />
          </mesh>
          <mesh position={[0.06, 0.07, 0]} material={m.chrome}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 24]} />
          </mesh>
        </group>
      );
    case "game-design":
      return (
        <group position={[0, 0.02, 0]}>
          <mesh position={[0, 0.1, 0]} rotation-x={Math.PI / 2} material={m.brassPolished} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.012, 48]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.025, 0.2, -0.004]} rotation-z={side * 0.32} material={r.ribbon} castShadow>
              <boxGeometry args={[0.04, 0.15, 0.004]} />
            </mesh>
          ))}
          <Label size={0.032} position={[0, 0.1, 0.008]} color="#5a4220" letterSpacing={0.02}>
            1ST
          </Label>
          <mesh position={[0, 0.01, 0]} material={m.lacquer}>
            <boxGeometry args={[0.1, 0.02, 0.06]} />
          </mesh>
        </group>
      );
    case "sports-council":
      return (
        <group position={[0, 0.09, 0]} rotation-y={0.2}>
          <RoundedBox args={[0.24, 0.16, 0.05]} radius={0.008} material={m.lacquer} castShadow />
          <mesh position={[0, 0, 0.026]} material={r.board}>
            <planeGeometry args={[0.21, 0.13]} />
          </mesh>
        </group>
      );
    case "ai-healthcare":
      return (
        <group position={[0, 0.02, 0]}>
          <mesh position={[0, 0.0, 0]} material={m.lacquer}>
            <boxGeometry args={[0.36, 0.03, 0.1]} />
          </mesh>
          <mesh geometry={r.ecg} material={r.glow} position={[0, 0.1, 0]} />
        </group>
      );
    case "hackathons":
      return (
        <group position={[0, 0.006, 0]} rotation-y={0.25}>
          <RoundedBox args={[0.26, 0.012, 0.18]} radius={0.004} material={m.steel} castShadow />
          <group position={[0, 0.006, -0.09]} rotation-x={-0.32}>
            <RoundedBox args={[0.26, 0.17, 0.008]} radius={0.004} position={[0, 0.085, 0]} material={m.steel} castShadow />
            <mesh position={[0, 0.087, 0.0045]} material={r.display}>
              <planeGeometry args={[0.235, 0.145]} />
            </mesh>
          </group>
        </group>
      );
    case "volunteering":
      return (
        <group>
          <mesh geometry={r.pot} material={m.terracotta} castShadow />
          <mesh position={[0, 0.088, 0]} material={r.soil}>
            <cylinderGeometry args={[0.064, 0.064, 0.006, 32]} />
          </mesh>
          <mesh position={[0, 0.14, 0]} material={r.leaf}>
            <cylinderGeometry args={[0.003, 0.004, 0.11, 8]} />
          </mesh>
          {[0, 1.3, 2.6, 3.9, 5.2].map((angle, index) => (
            <mesh
              key={angle}
              position={[Math.cos(angle) * 0.03, 0.15 + index * 0.012, Math.sin(angle) * 0.03]}
              rotation={[0.4, -angle, 0.5]}
              scale={[0.04, 0.008, 0.02]}
              material={r.leaf}
              castShadow
            >
              <sphereGeometry args={[1, 16, 10]} />
            </mesh>
          ))}
        </group>
      );
  }
}

function Riser({ id, children }: { id: SideQuestId; children: ReactNode }) {
  const group = useRef<Group>(null);
  const state = useRef({ lift: 0, spin: 0 });
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const active = ui.get().sideQuest === id;
    const s = state.current;
    s.lift = damp(s.lift, active ? 0.07 : 0, 6, dt);
    if (!rig.reducedMotion && active) s.spin += dt * 0.8;
    s.spin = active ? s.spin : damp(s.spin, 0, 3, dt);
    g.position.y = s.lift;
    g.rotation.y = s.spin;
  });
  return <group ref={group}>{children}</group>;
}

export function SideQuests({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const r = useArtifactResources();
  const top = CASE.baseHeight;
  const frame = useMemo<BoxSpec[]>(() => {
    const t = 0.018;
    const { length: L, depth: D, glassHeight: H } = CASE;
    const y0 = top;
    const boxes: BoxSpec[] = [];
    for (const z of [-D / 2, D / 2]) {
      for (const y of [y0, y0 + H]) boxes.push({ p: [CASE.x, y, Z.sideQuests + z], s: [L, t, t] });
      for (const x of [-L / 2, L / 2]) boxes.push({ p: [CASE.x + x, y0 + H / 2, Z.sideQuests + z], s: [t, H, t] });
    }
    for (const x of [-L / 2, L / 2]) {
      for (const y of [y0, y0 + H]) boxes.push({ p: [CASE.x + x, y, Z.sideQuests], s: [t, t, D] });
    }
    return boxes;
  }, [top]);

  const spacing = CASE.length / sideQuests.entries.length;
  return (
    <Station z={Z.sideQuests} reach={quality.drawDistance}>
      <RoundedBox
        args={[CASE.length, top, CASE.depth]}
        radius={0.02}
        position={[CASE.x, top / 2, Z.sideQuests]}
        material={m.walnutMatte}
        castShadow
        receiveShadow
      />
      <mesh position={[CASE.x, top + CASE.glassHeight / 2, Z.sideQuests]} material={m.caseGlass} renderOrder={2}>
        <boxGeometry args={[CASE.length - 0.02, CASE.glassHeight - 0.02, CASE.depth - 0.02]} />
      </mesh>
      <InstancedBoxes boxes={frame} material={m.bronze} castShadow />
      {sideQuests.entries.map((quest, index) => {
        const x = CASE.x - CASE.length / 2 + spacing * (index + 0.5);
        return (
          <group
            key={quest.id}
            position={[x, top + 0.012, Z.sideQuests]}
            onPointerOver={(event) => {
              event.stopPropagation();
              ui.set({ sideQuest: quest.id });
            }}
            onPointerOut={() => ui.set({ sideQuest: null })}
          >
            <mesh position={[0, 0, 0]} material={m.ceramic} receiveShadow>
              <cylinderGeometry args={[0.27, 0.27, 0.024, 48]} />
            </mesh>
            <group position={[0, 0.012, 0]}>
              <Riser id={quest.id}>
                <group scale={1.45}>
                  <Artifact id={quest.id} m={m} r={r} />
                </group>
              </Riser>
            </group>
            <Label size={0.026} position={[0, -top * 0.42, CASE.depth / 2 + 0.003]} color="#efe2cc" letterSpacing={0.16}>
              {`0${index + 1} · ${quest.artifact.toUpperCase()}`}
            </Label>
          </group>
        );
      })}
    </Station>
  );
}
