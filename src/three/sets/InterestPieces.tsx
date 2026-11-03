import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  Color,
  CylinderGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Group,
} from "three";
import type { InterestId } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { Near } from "../common";
import { damp } from "../helpers";
import { FIELD_POSITIONS } from "../layout";
import { useMaterials } from "../materials";
import { keycapTexture, paintTexture } from "../textures";
import { Die, pawnGeometry } from "./gamePieces";

/** Turns the piece to face the camera standing outside the fielder, a little off-square so it reads in three quarters. */
function facing(id: InterestId) {
  const p = FIELD_POSITIONS[id];
  const towardsCamera = Math.atan2(p.z, p.x) + 0.32;
  return Math.PI / 2 - towardsCamera + 0.3;
}

/** Rises out of the turf when the camera arrives at its fielding position. */
function Riser({ id, children }: { id: InterestId; children: ReactNode }) {
  const group = useRef<Group>(null);
  const state = useRef({ lift: 0 });
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const here = ui.get().activeStation === `interest:${id}`;
    const s = state.current;
    s.lift = rig.capture || rig.reducedMotion ? (here ? 1 : 0.0001) : damp(s.lift, here ? 1 : 0.0001, 3.2, Math.min(delta, 0.1));
    g.scale.setScalar(Math.max(0.0001, s.lift));
    g.visible = s.lift > 0.01;
  });
  const p = FIELD_POSITIONS[id];
  return (
    <group position={[p.x, 0, p.z]} rotation-y={facing(id)}>
      <group ref={group}>{children}</group>
    </group>
  );
}

/* Markets, at cover: a candlestick chart standing on the outfield, green glass up and red glass down. */
const CANDLES: [number, number, number, number][] = [
  [0.5, 0.9, 0.3, 1.1],
  [0.9, 0.7, 0.55, 1.15],
  [0.7, 1.25, 0.6, 1.45],
  [1.25, 1.1, 0.95, 1.5],
  [1.1, 1.75, 1.0, 1.95],
  [1.75, 1.5, 1.3, 1.9],
  [1.5, 2.1, 1.4, 2.35],
  [2.1, 2.6, 1.95, 2.85],
  [2.6, 2.35, 2.15, 2.9],
];
const RAIL = 0.22;
function Candles() {
  const resources = useMemo(() => {
    const up = new MeshPhysicalMaterial({ color: "#1fd17a", roughness: 0.12, clearcoat: 1, emissive: new Color("#0d8a4e"), emissiveIntensity: 0.9 });
    const down = new MeshPhysicalMaterial({ color: "#ff3b30", roughness: 0.12, clearcoat: 1, emissive: new Color("#9a1610"), emissiveIntensity: 0.9 });
    const wick = new MeshStandardMaterial({ color: "#dfe5ee", metalness: 0.9, roughness: 0.25 });
    const wickGeometry = new CylinderGeometry(0.03, 0.03, 1, 8);
    const base = new MeshPhysicalMaterial({ color: "#0e1118", roughness: 0.3, clearcoat: 1 });
    return { up, down, wick, wickGeometry, base };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current || rig.reducedMotion) return;
    group.current.children.forEach((child, index) => {
      child.position.y = Math.sin(state.clock.elapsedTime * 0.9 + index * 0.6) * 0.03;
    });
  });
  return (
    <group>
      <group ref={group}>
        {CANDLES.map(([open, close, , high], index) => {
          const rising = close >= open;
          const bottom = Math.min(open, close);
          const top = Math.max(open, close);
          const x = (index - (CANDLES.length - 1) / 2) * 0.72;
          return (
            <group key={index} position={[x, 0, 0]}>
              <RoundedBox args={[0.42, top - bottom, 0.42]} radius={0.04} position={[0, (top + bottom) / 2, 0]} material={rising ? resources.up : resources.down} castShadow />
              {/* The wick runs down to the rail, so every candle stands on it like a sculpture. */}
              <mesh geometry={resources.wickGeometry} material={resources.wick} position={[0, (RAIL + high) / 2, 0]} scale={[1, high - RAIL, 1]} castShadow />
            </group>
          );
        })}
      </group>
      <mesh material={resources.wick} position={[0, RAIL, 0]} castShadow receiveShadow>
        <boxGeometry args={[CANDLES.length * 0.72 + 0.4, 0.08, 0.5]} />
      </mesh>
      <mesh material={resources.base} position={[0, RAIL / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[CANDLES.length * 0.72 + 0.2, RAIL, 0.3]} />
      </mesh>
    </group>
  );
}

/* Gaming, at mid-wicket: two giant dice mid-roll and a pawn from the board game. */
function GamingSet() {
  const resources = useMemo(() => {
    const body = new MeshPhysicalMaterial({ color: "#f4f1ea", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
    const pip = new MeshStandardMaterial({ color: "#c0221b", roughness: 0.4 });
    const pawnMaterial = new MeshPhysicalMaterial({ color: "#1d5bd6", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
    const pawn = pawnGeometry(1.5);
    return { body, pip, pawnMaterial, pawn };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  const die = useRef<Group>(null);
  useFrame((state) => {
    if (!die.current || rig.reducedMotion) return;
    const t = state.clock.elapsedTime;
    die.current.rotation.set(t * 0.7, t * 0.45, 0.3);
    die.current.position.y = 1.9 + Math.sin(t * 1.3) * 0.15;
  });
  return (
    <group>
      <group position={[-0.9, 0.45, 0.2]} rotation={[0, 0.5, 0]}>
        <Die size={0.9} body={resources.body} pip={resources.pip} />
      </group>
      <group ref={die} position={[0.4, 1.9, -0.2]} rotation={[0.6, 0.4, 0.3]}>
        <Die size={0.8} body={resources.body} pip={resources.pip} />
      </group>
      <mesh geometry={resources.pawn} material={resources.pawnMaterial} position={[1.3, 0, 0.4]} castShadow receiveShadow />
    </group>
  );
}

/* Vibe coding, at long-off: B U I L D and enter, as giant keycaps with an RGB underglow. */
const KEYS = ["B", "U", "I", "L", "D", "↵"];
function Keycaps() {
  const m = useMaterials();
  const keys = useRef<(Group | null)[]>([]);
  const resources = useMemo(() => {
    const legends = KEYS.map((legend, index) =>
      keycapTexture(legend, index === KEYS.length - 1 ? "#ffd400" : "#eef1f6", "#0b1638"),
    );
    const tops = legends.map((map) => new MeshPhysicalMaterial({ map, roughness: 0.4, clearcoat: 0.4 }));
    const body = new MeshPhysicalMaterial({ color: "#eef1f6", roughness: 0.45, clearcoat: 0.3 });
    const enter = new MeshPhysicalMaterial({ color: "#ffd400", roughness: 0.4, clearcoat: 0.3 });
    const glow = new MeshBasicMaterial({ color: new Color(0, 2.4, 3) });
    return { legends, tops, body, enter, glow };
  }, []);
  useEffect(
    () => () => {
      resources.legends.forEach((texture) => texture.dispose());
      resources.tops.forEach((material) => material.dispose());
      resources.body.dispose();
      resources.enter.dispose();
      resources.glow.dispose();
    },
    [resources],
  );
  useFrame((state) => {
    const t = rig.reducedMotion ? 0 : state.clock.elapsedTime;
    // RGB underglow, cycling slowly, because of course it does.
    resources.glow.color.setHSL((t * 0.08) % 1, 1, 0.55).multiplyScalar(2.6);
    keys.current.forEach((key, index) => {
      if (!key) return;
      const cycle = (t * 1.4 - index * 0.32) % 4.2;
      const press = cycle > 0 && cycle < 0.22 ? Math.sin((cycle / 0.22) * Math.PI) : 0;
      key.position.y = 0.36 - press * 0.12;
    });
  });
  const pitch = 0.82;
  return (
    <group>
      <RoundedBox args={[KEYS.length * pitch + 0.6, 0.28, 1.2]} radius={0.06} position={[0.2, 0.14, 0]} material={m.steel} castShadow receiveShadow />
      <mesh material={resources.glow} position={[0.2, 0.03, 0]}>
        <boxGeometry args={[KEYS.length * pitch + 0.7, 0.05, 1.3]} />
      </mesh>
      {KEYS.map((legend, index) => {
        const wide = index === KEYS.length - 1;
        const width = wide ? 1.1 : 0.72;
        const x = (index - (KEYS.length - 1) / 2) * pitch + (wide ? 0.18 : 0);
        return (
          <group
            key={legend}
            ref={(group) => {
              keys.current[index] = group;
            }}
            position={[x, 0.36, 0]}
          >
            <RoundedBox args={[width, 0.42, 0.72]} radius={0.09} smoothness={4} position={[0, 0.21, 0]} material={wide ? resources.enter : resources.body} castShadow />
            <mesh position={[0, 0.425, 0]} rotation-x={-Math.PI / 2} material={resources.tops[index]}>
              <planeGeometry args={[width - 0.18, 0.54]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* Photography, at fine leg: a broadcast camera on its tripod, tally light on. */
function BroadcastCamera() {
  const m = useMaterials();
  const resources = useMemo(() => {
    const side = paintTexture(
      512,
      256,
      (g, w, h) => {
        g.fillStyle = "#e9ecf1";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#0b1638";
        g.fillRect(0, h * 0.62, w, h * 0.38);
        g.fillStyle = "#ffd400";
        g.font = `italic 900 ${h * 0.3}px "Barlow Condensed", sans-serif`;
        g.fillText("ASHWIN.TOP", w * 0.06, h * 0.92);
        g.fillStyle = "#0b1638";
        g.font = `800 ${h * 0.16}px "Barlow Condensed", sans-serif`;
        g.fillText("CAM 7 · STILL LEARNING", w * 0.06, h * 0.3);
      },
      { clamp: true },
    );
    const body = new MeshPhysicalMaterial({ map: side, roughness: 0.4, clearcoat: 0.5 });
    const dark = new MeshPhysicalMaterial({ color: "#14171d", roughness: 0.5, metalness: 0.4 });
    const lens = new MeshPhysicalMaterial({
      color: "#1c2a33",
      roughness: 0.02,
      clearcoat: 1,
      iridescence: 1,
      iridescenceIOR: 1.4,
      envMapIntensity: 2.5,
    });
    const tally = new MeshBasicMaterial({ color: new Color(6, 0.3, 0.2) });
    return { side, body, dark, lens, tally };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  const head = useRef<Group>(null);
  useFrame((state) => {
    if (head.current && !rig.reducedMotion) head.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.25;
  });
  // Tripod: three legs from the head down to feet spread on the turf.
  const legs = useMemo(() => {
    const top = new Vector3(0, 1.24, 0);
    return [0.3, 2.39, 4.48].map((angle) => {
      const foot = new Vector3(Math.sin(angle) * 0.62, 0, Math.cos(angle) * 0.62);
      const along = top.clone().sub(foot);
      return {
        position: foot.clone().add(top).multiplyScalar(0.5).toArray() as [number, number, number],
        quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), along.clone().normalize()),
        length: along.length(),
      };
    });
  }, []);
  return (
    <group>
      {legs.map((leg, index) => (
        <mesh key={index} material={resources.dark} position={leg.position} quaternion={leg.quaternion} castShadow>
          <cylinderGeometry args={[0.028, 0.034, leg.length, 10]} />
        </mesh>
      ))}
      <mesh material={resources.dark} position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.18, 20]} />
      </mesh>
      <group ref={head} position={[0, 1.55, 0]} scale={1.25}>
        <RoundedBox args={[0.42, 0.42, 0.8]} radius={0.04} material={resources.body} castShadow />
        <mesh material={resources.dark} position={[0, 0.02, -0.72]} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.15, 0.13, 0.7, 32]} />
        </mesh>
        <mesh material={resources.lens} position={[0, 0.02, -1.075]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.135, 0.135, 0.01, 32]} />
        </mesh>
        <RoundedBox args={[0.26, 0.18, 0.22]} radius={0.02} position={[0.08, 0.32, 0.2]} material={resources.dark} castShadow />
        <mesh material={resources.tally} position={[0.18, 0.18, -0.38]}>
          <sphereGeometry args={[0.025, 12, 8]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} material={m.steel} position={[side * 0.3, -0.1, 0.65]} rotation-z={side * 0.2} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.6, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function InterestPieces() {
  const pieces: [InterestId, ReactNode][] = [
    ["markets", <Candles key="m" />],
    ["gaming", <GamingSet key="g" />],
    ["vibe-coding", <Keycaps key="k" />],
    ["photography", <BroadcastCamera key="p" />],
  ];
  return (
    <>
      {pieces.map(([id, piece]) => {
        const p = FIELD_POSITIONS[id];
        return (
          <Near key={id} x={p.x} z={p.z} reach={30}>
            <Riser id={id}>{piece}</Riser>
          </Near>
        );
      })}
    </>
  );
}
