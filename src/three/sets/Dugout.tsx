import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
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
import { Label, Near } from "../common";
import { damp, InstancedBoxes, type BoxSpec } from "../helpers";
import { DUGOUT } from "../layout";
import { useMaterials, type MaterialLibrary } from "../materials";
import { codeScreenTexture, paintTexture, scoreboardTexture } from "../textures";

/* The side quests, laid out on the bench of the home dugout. */
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


const LENGTH = 8.4;
const SEAT_PITCH = LENGTH / (sideQuests.entries.length + 0.4);

export function Dugout() {
  const m = useMaterials();
  const r = useArtifactResources();
  const parts = useMemo(() => {
    const sign = paintTexture(
      1024,
      160,
      (g, w, h) => {
        g.fillStyle = "#0b1638";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#ffd400";
        g.fillRect(0, h - 14, w, 14);
        g.fillStyle = "#ffffff";
        g.font = `italic 900 ${h * 0.62}px "Barlow Condensed", sans-serif`;
        g.fillText("HOME DUGOUT", 36, h * 0.72);
        g.fillStyle = "#ffd400";
        g.font = `800 ${h * 0.34}px "Barlow Condensed", sans-serif`;
        g.textAlign = "right";
        g.fillText("SIDE QUESTS · 6", w - 36, h * 0.68);
      },
      { clamp: true },
    );
    const signMaterial = new MeshBasicMaterial({ map: sign, color: new Color(1.3, 1.3, 1.3) });
    const canopy = new MeshPhysicalMaterial({
      color: "#c9dcff",
      roughness: 0.06,
      transparent: true,
      opacity: 0.22,
      side: DoubleSide,
      depthWrite: false,
      clearcoat: 1,
      envMapIntensity: 1.6,
    });
    const canopyGeometry = new CylinderGeometry(1.75, 1.75, LENGTH, 40, 1, true, 0, Math.PI / 2);
    canopyGeometry.rotateZ(Math.PI / 2);
    const turf = new MeshStandardMaterial({ color: "#2c6a2a", roughness: 0.95 });
    const seat = new MeshPhysicalMaterial({ color: "#1d5bd6", roughness: 0.35, clearcoat: 0.7 });
    const strip = new MeshBasicMaterial({ color: new Color(0.4, 1.6, 2.4) });
    return { sign, signMaterial, canopy, canopyGeometry, turf, seat, strip };
  }, []);
  useEffect(
    () => () => {
      Object.values(parts).forEach((value) => value.dispose());
    },
    [parts],
  );
  const frame = useMemo<BoxSpec[]>(() => {
    const boxes: BoxSpec[] = [];
    for (const x of [-LENGTH / 2, 0, LENGTH / 2]) boxes.push({ p: [x, 1.1, -1.05], s: [0.08, 2.2, 0.08] });
    boxes.push({ p: [0, 2.2, -1.05], s: [LENGTH, 0.08, 0.08] });
    return boxes;
  }, []);

  return (
    <Near x={DUGOUT.x} z={DUGOUT.z} reach={26}>
      <group position={[DUGOUT.x, 0, DUGOUT.z]} rotation-y={DUGOUT.rotationY}>
        <mesh material={parts.turf} position={[0, 0.02, -0.2]} receiveShadow>
          <boxGeometry args={[LENGTH + 0.4, 0.04, 2.6]} />
        </mesh>
        <mesh material={m.lacquer} position={[0, 1.15, -1.2]} receiveShadow>
          <boxGeometry args={[LENGTH + 0.4, 2.3, 0.12]} />
        </mesh>
        <mesh material={parts.signMaterial} position={[0, 1.78, -1.13]}>
          <planeGeometry args={[4.6, 0.72]} />
        </mesh>
        <mesh material={parts.strip} position={[0, 0.06, 1.08]}>
          <boxGeometry args={[LENGTH + 0.4, 0.04, 0.04]} />
        </mesh>
        {/* Bench: a dark plinth with a row of bucket seats. */}
        <RoundedBox args={[LENGTH, 0.42, 0.62]} radius={0.04} position={[0, 0.21, -0.72]} material={m.lacquer} castShadow receiveShadow />
        {sideQuests.entries.map((quest, index) => {
          const x = (index - (sideQuests.entries.length - 1) / 2) * SEAT_PITCH;
          return (
            <group key={quest.id} position={[x, 0.42, -0.72]}>
              <RoundedBox args={[0.98, 0.08, 0.56]} radius={0.03} position={[0, 0.04, 0]} material={parts.seat} castShadow receiveShadow />
              <RoundedBox args={[0.98, 0.62, 0.08]} radius={0.03} position={[0, 0.35, -0.28]} material={parts.seat} castShadow />
              <group position={[0, 0.08, 0.02]} scale={2.6}>
                <Riser id={quest.id}>
                  <Artifact id={quest.id} m={m} r={r} />
                </Riser>
              </group>
              <group position={[0, -0.18, 0.32]}>
                <Label size={0.11} color="#ffd400" anchorY="top">
                  {String(index + 1).padStart(2, "0")}
                </Label>
              </group>
            </group>
          );
        })}
        <InstancedBoxes boxes={frame} material={m.steel} castShadow />
        <mesh geometry={parts.canopyGeometry} material={parts.canopy} position={[0, 0.5, -1.05]} renderOrder={8} />
      </group>
    </Near>
  );
}
