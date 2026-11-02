import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  CylinderGeometry,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type Group,
  type Material,
} from "three";
import { interests, type InterestId } from "../../data/profile";
import { rig, ui, useUi } from "../../lib/store";
import { Label, Plinth, Station } from "../common";
import { damp } from "../helpers";
import { interestPedestal, Z } from "../layout";
import { useMaterials, type MaterialLibrary } from "../materials";
import type { QualitySettings } from "../quality";
import { keycapTexture, noiseTexture } from "../textures";

/* ---------- Cricket: leather ball with a stitched seam, and a set of stumps ---------- */
function CricketPiece({ m }: { m: MaterialLibrary }) {
  const resources = useMemo(() => {
    const bump = noiseTexture(17, 256);
    bump.repeat.set(3, 3);
    const leather = new MeshPhysicalMaterial({
      color: "#8b1b13",
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.28,
      bumpMap: bump,
      bumpScale: 0.35,
    });
    const thread = new MeshStandardMaterial({ color: "#efe6d2", roughness: 0.7 });
    const willow = new MeshPhysicalMaterial({ color: "#dcc49a", roughness: 0.45, clearcoat: 0.4 });
    const radius = 0.13;
    const ball = new SphereGeometry(radius, 64, 48);
    const seamRidge = new TorusGeometry(radius, 0.004, 8, 96);
    const stitch = new CylinderGeometry(0.0022, 0.0022, 0.012, 5);
    const count = 2 * 64;
    const stitches = new InstancedMesh(stitch, thread, count);
    const dummy = new Object3D();
    let index = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 64; i += 1) {
        const a = (i / 64) * Math.PI * 2;
        const offset = side * 0.0095;
        const r = Math.sqrt(radius * radius - offset * offset) + 0.0008;
        dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, offset);
        dummy.lookAt(0, 0, offset);
        dummy.rotateX(Math.PI / 2);
        dummy.rotateZ(side * 0.6);
        dummy.updateMatrix();
        stitches.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    stitches.instanceMatrix.needsUpdate = true;
    const stump = new CylinderGeometry(0.011, 0.011, 0.62, 16);
    const bail = new CylinderGeometry(0.006, 0.006, 0.06, 10);
    return { bump, leather, thread, willow, ball, seamRidge, stitch, stitches, stump, bail, radius };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => {
        if (typeof value === "object" && value && "dispose" in value) (value as { dispose: () => void }).dispose();
      });
    },
    [resources],
  );
  const r = resources.radius;
  return (
    <group>
      <group position={[0.06, r + 0.03, 0.08]} rotation={[0.3, 0.6, 0.15]}>
        <mesh geometry={resources.ball} material={resources.leather} castShadow receiveShadow />
        <mesh geometry={resources.seamRidge} material={resources.leather} />
        <primitive object={resources.stitches} />
      </group>
      <mesh position={[0.06, 0.012, 0.08]} material={m.brass} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.07, 0.01, 12, 48]} />
      </mesh>
      {[-0.07, 0, 0.07].map((x) => (
        <mesh key={x} geometry={resources.stump} material={resources.willow} position={[x - 0.04, 0.31, -0.16]} castShadow />
      ))}
      {[-0.035, 0.035].map((x) => (
        <mesh
          key={x}
          geometry={resources.bail}
          material={resources.willow}
          position={[x - 0.04, 0.625, -0.16]}
          rotation-z={Math.PI / 2}
          castShadow
        />
      ))}
    </group>
  );
}

/* ---------- Markets: a candlestick chart cast in brass (up) and smoked glass (down) ---------- */
const CANDLES = [
  [0.1, 0.16],
  [0.16, 0.13],
  [0.13, 0.2],
  [0.2, 0.18],
  [0.18, 0.27],
  [0.27, 0.23],
  [0.23, 0.31],
  [0.31, 0.37],
  [0.37, 0.34],
];
function MarketsPiece({ m }: { m: MaterialLibrary }) {
  const candles = useRef<(Group | null)[]>([]);
  useFrame((state) => {
    if (rig.reducedMotion) return;
    const t = state.clock.elapsedTime;
    candles.current.forEach((candle, index) => {
      if (candle) candle.position.y = Math.sin(t * 0.8 + index * 0.7) * 0.006;
    });
  });
  return (
    <group>
      <RoundedBox args={[0.56, 0.035, 0.2]} radius={0.008} position={[0, 0.0175, 0]} material={m.lacquer} castShadow receiveShadow />
      {CANDLES.map(([open, close], index) => {
        const up = close >= open;
        const low = Math.min(open, close);
        const high = Math.max(open, close);
        const x = (index - (CANDLES.length - 1) / 2) * 0.058;
        const base = 0.035;
        return (
          <group
            key={index}
            ref={(group) => {
              candles.current[index] = group;
            }}
          >
            <mesh position={[x, base + (low + high) / 2, 0]} material={up ? m.brassPolished : m.smokedGlass} castShadow>
              <boxGeometry args={[0.036, high - low, 0.036]} />
            </mesh>
            {/* The wick runs down to the base, so each candle stands on its own brass rod. */}
            <mesh position={[x, base + (high + 0.04) / 2, 0]} material={m.brass}>
              <cylinderGeometry args={[0.0028, 0.0028, high + 0.04, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ---------- Gaming: a pair of dice and a pawn borrowed from the board game ---------- */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
export function Die({ size, body, pip }: { size: number; body: Material; pip: Material }) {
  const pips = useMemo(() => {
    const geometry = new SphereGeometry(size * 0.085, 12, 8);
    const faces: [Vector3, Vector3, Vector3, number][] = [
      [new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(0, 1, 0), 1],
      [new Vector3(0, 0, -1), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), 6],
      [new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 2],
      [new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0), 5],
      [new Vector3(0, 1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1), 3],
      [new Vector3(0, -1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1), 4],
    ];
    const total = faces.reduce((sum, face) => sum + PIPS[face[3]].length, 0);
    const mesh = new InstancedMesh(geometry, pip, total);
    const matrix = new Matrix4();
    let index = 0;
    for (const [normal, u, v, value] of faces) {
      for (const [a, b] of PIPS[value]) {
        const position = normal
          .clone()
          .multiplyScalar(size / 2 - size * 0.035)
          .addScaledVector(u, a * size * 0.25)
          .addScaledVector(v, b * size * 0.25);
        matrix.makeScale(1, 1, 1).setPosition(position);
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [size, pip]);
  useEffect(
    () => () => {
      pips.geometry.dispose();
      pips.dispose();
    },
    [pips],
  );
  return (
    <group>
      <RoundedBox args={[size, size, size]} radius={size * 0.16} smoothness={4} material={body} castShadow receiveShadow />
      <primitive object={pips} />
    </group>
  );
}

export function pawnGeometry(height: number) {
  const points = [
    [0, 0],
    [0.42, 0],
    [0.44, 0.06],
    [0.36, 0.12],
    [0.22, 0.22],
    [0.16, 0.5],
    [0.24, 0.56],
    [0.16, 0.6],
    [0.2, 0.72],
    [0.22, 0.84],
    [0.16, 0.96],
    [0.06, 1.0],
    [0, 1.0],
  ].map(([x, y]) => new Vector2(x * height * 0.62, y * height));
  return new LatheGeometry(points, 40);
}

function GamingPiece({ m }: { m: MaterialLibrary }) {
  const dieA = useRef<Group>(null);
  const roll = useRef({ start: -10 });
  const { pawn, pawnMaterial, pipMaterial } = useMemo(
    () => ({
      pawn: pawnGeometry(0.2),
      pawnMaterial: new MeshPhysicalMaterial({ color: "#b3261e", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
      pipMaterial: new MeshStandardMaterial({ color: "#1d1915", roughness: 0.5 }),
    }),
    [],
  );
  useEffect(
    () => () => {
      pawn.dispose();
      pawnMaterial.dispose();
      pipMaterial.dispose();
    },
    [pawn, pawnMaterial, pipMaterial],
  );
  const selected = useUi((state) => state.interest === "gaming");
  useEffect(() => {
    if (selected) roll.current.start = -1;
  }, [selected]);
  useFrame((state) => {
    const die = dieA.current;
    if (!die) return;
    if (roll.current.start === -1) roll.current.start = state.clock.elapsedTime;
    const t = rig.reducedMotion ? 1 : Math.min(1, (state.clock.elapsedTime - roll.current.start) / 1.1);
    const hop = Math.sin(Math.PI * t) * 0.12;
    die.position.set(-0.08, 0.06 + hop, 0.05);
    die.rotation.set(0.0 + (1 - t) * 7.5, 0.5 + (1 - t) * 4, (1 - t) * 3);
  });
  return (
    <group>
      <group ref={dieA}>
        <Die size={0.12} body={m.ceramic} pip={pipMaterial} />
      </group>
      <group position={[0.1, 0.06, -0.04]} rotation={[0.0, 0.8, Math.PI / 2 - 0.62]}>
        <group position={[0, 0.0, 0]}>
          <Die size={0.12} body={m.ceramic} pip={pipMaterial} />
        </group>
      </group>
      <mesh geometry={pawn} material={pawnMaterial} position={[0.02, 0, -0.16]} castShadow />
    </group>
  );
}

/* ---------- Vibe coding: keycaps that type on their own ---------- */
const KEYS = ["B", "U", "I", "L", "D"];
function KeycapsPiece({ m }: { m: MaterialLibrary }) {
  const keys = useRef<(Group | null)[]>([]);
  const resources = useMemo(() => {
    const legends = [...KEYS, "↵"].map((legend, index) =>
      keycapTexture(legend, index === KEYS.length ? "#b9532f" : "#f1ece2", index === KEYS.length ? "#fff3e6" : "#2b2723"),
    );
    const tops = legends.map(
      (map) => new MeshPhysicalMaterial({ map, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    );
    return { legends, tops };
  }, []);
  useEffect(
    () => () => {
      resources.legends.forEach((texture) => texture.dispose());
      resources.tops.forEach((material) => material.dispose());
    },
    [resources],
  );
  useFrame((state) => {
    const t = rig.reducedMotion ? 0 : state.clock.elapsedTime;
    keys.current.forEach((key, index) => {
      if (!key) return;
      const cycle = (t * 1.4 - index * 0.32) % 4.2;
      const press = cycle > 0 && cycle < 0.22 ? Math.sin((cycle / 0.22) * Math.PI) : 0;
      key.position.y = 0.04 - press * 0.014;
    });
  });
  const pitch = 0.098;
  return (
    <group rotation-y={0.12}>
      <RoundedBox args={[0.68, 0.03, 0.2]} radius={0.01} position={[0.02, 0.015, 0]} material={m.steel} castShadow receiveShadow />
      {[...KEYS, "↵"].map((legend, index) => {
        const wide = index === KEYS.length;
        const width = wide ? 0.13 : 0.085;
        const x = -0.27 + index * pitch + (wide ? 0.022 : 0);
        return (
          <group
            key={legend}
            ref={(group) => {
              keys.current[index] = group;
            }}
            position={[x, 0.04, 0]}
          >
            <RoundedBox
              args={[width, 0.05, 0.085]}
              radius={0.012}
              smoothness={3}
              position={[0, 0.025, 0]}
              material={wide ? m.terracotta : m.ceramic}
              castShadow
            />
            <mesh position={[0, 0.0505, 0]} rotation-x={-Math.PI / 2} material={resources.tops[index]}>
              <planeGeometry args={[width - 0.026, 0.06]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ---------- Photography: a lens with coated front glass ---------- */
function LensPiece({ m, quality }: { m: MaterialLibrary; quality: QualitySettings }) {
  const ring = useRef<Group>(null);
  const resources = useMemo(() => {
    const anodised = new MeshPhysicalMaterial({ color: "#171717", roughness: 0.42, metalness: 0.6, clearcoat: 0.3 });
    const coating = new MeshPhysicalMaterial({
      color: "#2c3a37",
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      iridescence: 1,
      iridescenceIOR: 1.35,
      transmission: quality.transmission ? 0.35 : 0,
      thickness: 0.05,
      envMapIntensity: 2.6,
    });
    coating.iridescenceThicknessMinimum = 180;
    coating.iridescenceThicknessMaximum = 520;
    const ridge = new CylinderGeometry(0.0035, 0.0035, 0.046, 4);
    const ridges = new InstancedMesh(ridge, anodised, 72);
    const dummy = new Object3D();
    for (let i = 0; i < 72; i += 1) {
      const a = (i / 72) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 0.0905, 0, Math.sin(a) * 0.0905);
      dummy.updateMatrix();
      ridges.setMatrixAt(i, dummy.matrix);
    }
    ridges.instanceMatrix.needsUpdate = true;
    const glassCap = new SphereGeometry(0.16, 48, 16, 0, Math.PI * 2, 0, 0.5);
    return { anodised, coating, ridge, ridges, glassCap };
  }, [quality.transmission]);
  useEffect(
    () => () => {
      resources.anodised.dispose();
      resources.coating.dispose();
      resources.ridge.dispose();
      resources.ridges.dispose();
      resources.glassCap.dispose();
    },
    [resources],
  );
  useFrame((state) => {
    if (ring.current && !rig.reducedMotion) ring.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.6;
  });
  return (
    <group position={[0, 0.115, 0.02]} rotation={[Math.PI / 2 - 0.62, -0.5, 0]}>
      <mesh material={m.chrome} position={[0, -0.13, 0]} castShadow>
        <cylinderGeometry args={[0.072, 0.072, 0.02, 48]} />
      </mesh>
      <mesh material={resources.anodised} position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.082, 0.078, 0.14, 48]} />
      </mesh>
      <group ref={ring} position={[0, 0.03, 0]}>
        <mesh material={resources.anodised} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 48]} />
        </mesh>
        <primitive object={resources.ridges} />
      </group>
      <mesh material={m.brassPolished} position={[0, 0.062, 0]}>
        <torusGeometry args={[0.087, 0.0035, 8, 64]} />
      </mesh>
      <mesh material={resources.anodised} position={[0, 0.085, 0]} castShadow>
        <cylinderGeometry args={[0.094, 0.088, 0.04, 48]} />
      </mesh>
      <mesh geometry={resources.glassCap} material={resources.coating} position={[0, 0.0, 0]} scale={[0.5, 0.42, 0.5]} />
    </group>
  );
}

const PIECE_SCALE: Record<InterestId, number> = {
  cricket: 1,
  markets: 1.45,
  gaming: 1.35,
  "vibe-coding": 1.3,
  photography: 1.65,
};

function Piece({ id, m, quality }: { id: InterestId; m: MaterialLibrary; quality: QualitySettings }) {
  const piece = (() => {
    switch (id) {
      case "cricket":
        return <CricketPiece m={m} />;
      case "markets":
        return <MarketsPiece m={m} />;
      case "gaming":
        return <GamingPiece m={m} />;
      case "vibe-coding":
        return <KeycapsPiece m={m} />;
      case "photography":
        return <LensPiece m={m} quality={quality} />;
    }
  })();
  return <group scale={PIECE_SCALE[id]}>{piece}</group>;
}

function Turntable({ id, children }: { id: InterestId; children: ReactNode }) {
  const group = useRef<Group>(null);
  const motion = useRef({ lift: 0, spin: 0 });
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    const active = ui.get().interest === id;
    const mo = motion.current;
    mo.lift = damp(mo.lift, active ? 0.05 : 0, 5, dt);
    if (!rig.reducedMotion) mo.spin += dt * (active ? 0.35 : 0);
    g.position.y = mo.lift;
    g.rotation.y = Math.sin(mo.spin) * 0.5;
  });
  return <group ref={group}>{children}</group>;
}

export function Interests({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  return (
    <Station z={Z.interests} reach={quality.drawDistance}>
      {interests.items.map((item, index) => {
        const p = interestPedestal(index);
        return (
          <group
            key={item.id}
            onClick={(event) => {
              event.stopPropagation();
              ui.set({ interest: item.id });
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <Plinth
              size={[0.62, p.height, 0.62]}
              position={[p.x, 0, p.z]}
              rotationY={p.rotationY}
              material={index % 2 === 0 ? m.travertine : m.plasterShade}
            >
              <Turntable id={item.id}>
                <Piece id={item.id} m={m} quality={quality} />
              </Turntable>
              <Label size={0.032} position={[0, -0.09, 0.312]}>
                {`${item.number} · ${item.label.toUpperCase()}`}
              </Label>
            </Plinth>
          </group>
        );
      })}
    </Station>
  );
}
