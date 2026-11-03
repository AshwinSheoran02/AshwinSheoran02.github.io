import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CircleGeometry,
  Color,
  DoubleSide,
  Group,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  type Mesh,
} from "three";
import { interests, type InterestId } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { Label } from "../common";
import { damp } from "../helpers";
import { FIELD_POSITIONS, PITCH } from "../layout";
import { seeded } from "../textures";

export const AR = {
  yellow: "#ffd400",
  cyan: "#5ad1ff",
  red: "#ff4d3d",
  green: "#3ddc84",
} as const;

function arMaterial(colour: string, opacity: number, boost = 1.6) {
  return new MeshBasicMaterial({
    color: new Color(colour).multiplyScalar(boost),
    transparent: true,
    opacity,
    depthWrite: false,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    toneMapped: true,
  });
}

/* Broadcast-style field placement, painted on the grass: one ring per interest and a line back to the striker. */
export function FieldPlacement() {
  const group = useRef<Group>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const resources = useMemo(() => {
    const ring = new RingGeometry(1.45, 1.75, 64);
    const disc = new CircleGeometry(1.45, 64);
    const line = new PlaneGeometry(1, 0.16);
    return {
      ring,
      disc,
      line,
      ringActive: arMaterial(AR.yellow, 0.95),
      ringIdle: arMaterial(AR.cyan, 0.85),
      discMaterial: arMaterial(AR.cyan, 0.16, 1),
      lineMaterial: arMaterial("#ffffff", 0.45, 1.2),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );

  const state = useRef({ opacity: 0 });
  useFrame((frame, delta) => {
    const g = group.current;
    if (!g) return;
    const active = ui.get().activeStation;
    const showing = active.startsWith("interest:") || active === "about";
    const s = state.current;
    s.opacity = rig.capture ? (showing ? 1 : 0) : damp(s.opacity, showing ? 1 : 0, 3, Math.min(delta, 0.1));
    g.visible = s.opacity > 0.01;
    resources.ringActive.opacity = 0.95 * s.opacity;
    resources.ringIdle.opacity = 0.85 * s.opacity;
    resources.discMaterial.opacity = 0.16 * s.opacity;
    resources.lineMaterial.opacity = 0.45 * s.opacity;
    const id = active.startsWith("interest:") ? (active.slice(9) as InterestId) : null;
    const pulse = rig.reducedMotion ? 1 : 1 + Math.sin(frame.clock.elapsedTime * 3) * 0.06;
    interests.items.forEach((item, index) => {
      const ring = rings.current[index];
      if (!ring) return;
      const isActive = item.id === id;
      ring.material = isActive ? resources.ringActive : resources.ringIdle;
      ring.scale.setScalar(isActive ? pulse * 1.15 : 1);
    });
  });

  const striker = { x: 0, z: PITCH.half };
  return (
    <group ref={group}>
      {interests.items.map((item, index) => {
        const p = FIELD_POSITIONS[item.id];
        const dx = p.x - striker.x;
        const dz = p.z - striker.z;
        const length = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);
        return (
          <group key={item.id}>
            <mesh
              ref={(mesh) => {
                rings.current[index] = mesh;
              }}
              geometry={resources.ring}
              material={resources.ringIdle}
              position={[p.x, 0.03, p.z]}
              rotation-x={-Math.PI / 2}
              renderOrder={3}
            />
            <mesh geometry={resources.disc} material={resources.discMaterial} position={[p.x, 0.025, p.z]} rotation-x={-Math.PI / 2} renderOrder={2} />
            {length > 3 ? (
              <mesh
                geometry={resources.line}
                material={resources.lineMaterial}
                position={[striker.x + dx / 2, 0.022, striker.z + dz / 2]}
                rotation={[-Math.PI / 2, 0, angle - Math.PI / 2]}
                scale={[length - 2, 1, 1]}
                renderOrder={2}
              />
            ) : null}
            <group position={[p.x, 0.04, p.z + (p.z > 0 ? 3.4 : -3.4)]} rotation-x={-Math.PI / 2}>
              <Label size={1.7} italic color="#ffffff" anchorY="bottom" letterSpacing={0.02}>
                {p.name}
              </Label>
              <Label size={1.15} color={AR.yellow} anchorY="top" position={[0, -0.2, 0]} letterSpacing={0.06}>
                {item.label.toUpperCase()}
              </Label>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* Pitch map for the statement: where the deliveries landed, most of them on a good length. */
export function PitchMap() {
  const group = useRef<Group>(null);
  const resources = useMemo(() => {
    const rand = seeded(31);
    const dots: { x: number; z: number; zone: "good" | "full" | "short" }[] = [];
    for (let i = 0; i < 26; i += 1) {
      const roll = rand();
      const zone = roll < 0.72 ? "good" : roll < 0.86 ? "full" : "short";
      const fromStumps = zone === "good" ? 4.2 + rand() * 3.2 : zone === "full" ? 1.4 + rand() * 2.4 : 8 + rand() * 3.2;
      dots.push({ x: (rand() - 0.5) * 0.7 + 0.12, z: PITCH.half - fromStumps, zone });
    }
    return {
      dots,
      dot: new CircleGeometry(0.075, 24),
      band: new PlaneGeometry(PITCH.width, 1),
      materials: {
        good: arMaterial(AR.yellow, 1, 2.2),
        full: arMaterial(AR.cyan, 1, 2),
        short: arMaterial(AR.red, 1, 2),
      },
      bands: {
        good: arMaterial(AR.yellow, 0.16, 1),
        full: arMaterial(AR.cyan, 0.12, 1),
        short: arMaterial(AR.red, 0.12, 1),
      },
    };
  }, []);
  useEffect(
    () => () => {
      resources.dot.dispose();
      resources.band.dispose();
      Object.values(resources.materials).forEach((material) => material.dispose());
      Object.values(resources.bands).forEach((material) => material.dispose());
    },
    [resources],
  );
  const state = useRef({ opacity: 0 });
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const showing = ui.get().activeStation === "statement";
    const s = state.current;
    s.opacity = rig.capture ? (showing ? 1 : 0) : damp(s.opacity, showing ? 1 : 0, 3, Math.min(delta, 0.1));
    g.visible = s.opacity > 0.01;
    Object.values(resources.materials).forEach((material) => {
      material.opacity = s.opacity;
    });
    resources.bands.good.opacity = 0.18 * s.opacity;
    resources.bands.full.opacity = 0.12 * s.opacity;
    resources.bands.short.opacity = 0.12 * s.opacity;
  });
  const zones: { key: "full" | "good" | "short"; from: number; to: number; label: string }[] = [
    { key: "full", from: 1.2, to: 4, label: "FULL" },
    { key: "good", from: 4, to: 7.6, label: "GOOD LENGTH" },
    { key: "short", from: 7.6, to: 11.5, label: "SHORT" },
  ];
  return (
    <group ref={group}>
      {zones.map((zone) => (
        <group key={zone.key}>
          <mesh
            geometry={resources.band}
            material={resources.bands[zone.key]}
            position={[0, 0.03, PITCH.half - (zone.from + zone.to) / 2]}
            rotation-x={-Math.PI / 2}
            scale={[1, zone.to - zone.from - 0.06, 1]}
            renderOrder={2}
          />
          <group position={[-PITCH.width / 2 - 0.25, 0.035, PITCH.half - (zone.from + zone.to) / 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <Label size={0.42} italic color={AR[zone.key === "good" ? "yellow" : zone.key === "full" ? "cyan" : "red"]}>
              {zone.label}
            </Label>
          </group>
        </group>
      ))}
      {resources.dots.map((dot, index) => (
        <mesh
          key={index}
          geometry={resources.dot}
          material={resources.materials[dot.zone]}
          position={[dot.x, 0.04, dot.z]}
          rotation-x={-Math.PI / 2}
          renderOrder={4}
        />
      ))}
    </group>
  );
}

