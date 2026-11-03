import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactElement } from "react";
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  Shape,
  SphereGeometry,
  Vector3,
} from "three";
import { rig, ui } from "../../lib/store";
import { InstancedBoxes, clamp01, easeInOut, type BoxSpec } from "../helpers";
import { useMaterials } from "../materials";
import { focus } from "../rigState";
import { poolBallTexture } from "../textures";

/* A full-size 9 ft table, built to regulation proportions. Long axis runs along x. */
const HX = 1.27;
const HZ = 0.635;
const CUSHION = 0.05;
const RAIL = 0.13;
const BED_TOP = 0.79;
const R = 0.028575;
const OUTER_X = HX + CUSHION + RAIL;
const OUTER_Z = HZ + CUSHION + RAIL;

const RACK_ORDER = [[1], [9, 2], [10, 8, 3], [11, 4, 12, 5], [6, 13, 14, 7, 15]];

function rackPositions(): [number, number][] {
  const positions: [number, number][] = [[-HX / 2, 0]];
  const foot = HX / 2;
  const slots: { id: number; x: number; z: number }[] = [];
  RACK_ORDER.forEach((row, k) => {
    row.forEach((id, j) => {
      slots.push({ id, x: foot + k * (R * 2 + 0.0008) * Math.sqrt(3) / 2, z: (j - k / 2) * (R * 2 + 0.0008) });
    });
  });
  for (let id = 1; id <= 15; id += 1) {
    const slot = slots.find((s) => s.id === id)!;
    positions[id] = [slot.x, slot.z];
  }
  return positions;
}

const POCKETS: [number, number, number][] = [
  [-HX - 0.012, -HZ - 0.012, 0.062],
  [HX + 0.012, -HZ - 0.012, 0.062],
  [-HX - 0.012, HZ + 0.012, 0.062],
  [HX + 0.012, HZ + 0.012, 0.062],
  [0, -HZ - 0.03, 0.064],
  [0, HZ + 0.03, 0.064],
];

interface Ball {
  x: number;
  z: number;
  vx: number;
  vz: number;
  pocketed: boolean;
  drop: number;
}

type Phase = "ready" | "aim" | "strike" | "rolling" | "settled" | "rerack";

const RAIL_TOP = BED_TOP + 0.06;
const IRON_DEPTH = 0.075;
const LINER_HEIGHT = 0.09;

/*
 * Pocket irons: brass castings that wrap each pocket, cut with the pocket's curve.
 * Shapes are drawn in table x/z for the (+x, +z) corner and the +z side pocket, then
 * mirrored into place.
 */
function pocketIronGeometries() {
  const [cx, cz, cr] = POCKETS[3];
  const rho = cr + 0.008;
  const inner = 0.05;
  const arm = 0.07;
  const corner = new Shape();
  const ez = HZ + inner - cz;
  const ex = HX + inner - cx;
  const a0 = Math.atan2(ez, -Math.sqrt(rho * rho - ez * ez));
  const a1 = Math.atan2(-Math.sqrt(rho * rho - ex * ex), ex);
  corner.moveTo(HX - arm, HZ + inner);
  corner.lineTo(cx + rho * Math.cos(a0), cz + rho * Math.sin(a0));
  corner.absarc(cx, cz, rho, a0, a1, true);
  corner.lineTo(HX + inner, HZ - arm);
  corner.lineTo(OUTER_X, HZ - arm);
  corner.lineTo(OUTER_X, OUTER_Z - 0.05);
  corner.absarc(OUTER_X - 0.05, OUTER_Z - 0.05, 0.05, 0, Math.PI / 2, false);
  corner.lineTo(HX - arm, OUTER_Z);
  corner.closePath();

  const [, sz, sr] = POCKETS[5];
  const sideRho = sr + 0.008;
  const dz = HZ + inner - sz;
  const s0 = Math.atan2(dz, -Math.sqrt(sideRho * sideRho - dz * dz));
  const s1 = Math.atan2(dz, Math.sqrt(sideRho * sideRho - dz * dz));
  const side = new Shape();
  side.moveTo(-0.1, HZ + inner);
  side.lineTo(sideRho * Math.cos(s0), sz + sideRho * Math.sin(s0));
  side.absarc(0, sz, sideRho, s0, s1, true);
  side.lineTo(0.1, HZ + inner);
  side.lineTo(0.1, OUTER_Z);
  side.lineTo(-0.1, OUTER_Z);
  side.closePath();

  // Leather lining only on the far side of each pocket, where the cut through the iron is.
  const linerRadius = rho - 0.005;
  const lining = (radius: number, from: number, to: number) =>
    new CylinderGeometry(radius, radius * 0.92, LINER_HEIGHT, 40, 1, true, Math.PI / 2 - from, from - to);

  const extrude = (shape: Shape) => {
    const geometry = new ExtrudeGeometry(shape, {
      depth: IRON_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 28,
    });
    // Shape y becomes table z; the extrusion runs downwards from the top face.
    geometry.rotateX(Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  };
  return {
    corner: extrude(corner),
    side: extrude(side),
    cornerLiner: lining(linerRadius, a0, a1),
    sideLiner: lining(sideRho - 0.005, s0, s1),
  };
}

function staticBoxes(): { wood: BoxSpec[]; cushions: BoxSpec[] } {
  const railY = BED_TOP + 0.03;
  const wood: BoxSpec[] = [];
  const gapCorner = 0.075;
  const gapSide = 0.07;
  for (const sz of [-1, 1]) {
    const z = sz * (HZ + CUSHION + RAIL / 2);
    const length = HX - gapCorner - gapSide + CUSHION;
    wood.push({ p: [-(gapSide + length / 2), railY, z], s: [length, 0.06, RAIL] });
    wood.push({ p: [gapSide + length / 2, railY, z], s: [length, 0.06, RAIL] });
  }
  for (const sx of [-1, 1]) {
    const x = sx * (HX + CUSHION + RAIL / 2);
    wood.push({ p: [x, railY, 0], s: [RAIL, 0.06, (HZ - gapCorner + CUSHION) * 2] });
  }
  const cushions: BoxSpec[] = [];
  const cushionY = BED_TOP + 0.018;
  for (const sz of [-1, 1]) {
    const z = sz * (HZ + CUSHION / 2);
    const length = HX - gapCorner - gapSide;
    cushions.push({ p: [-(gapSide + length / 2), cushionY, z], s: [length, 0.036, CUSHION] });
    cushions.push({ p: [gapSide + length / 2, cushionY, z], s: [length, 0.036, CUSHION] });
  }
  for (const sx of [-1, 1]) {
    cushions.push({ p: [sx * (HX + CUSHION / 2), cushionY, 0], s: [CUSHION, 0.036, (HZ - gapCorner) * 2] });
  }
  return { wood, cushions };
}

export function PoolTable({ exhibitId, x, z }: { exhibitId: string; x: number; z: number }) {
  const m = useMaterials();
  const ballGroup = useRef<(Group | null)[]>([]);
  const cue = useRef<Group>(null);
  const boxes = useMemo(() => staticBoxes(), []);

  const resources = useMemo(() => {
    const geometry = new SphereGeometry(R, 40, 28);
    const textures = Array.from({ length: 16 }, (_, id) => poolBallTexture(id));
    const materials = textures.map(
      (map) =>
        new MeshPhysicalMaterial({ map, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 }),
    );
    const pocket = new MeshBasicMaterial({ color: "#050403" });
    const liner = new MeshPhysicalMaterial({ color: "#14100d", roughness: 0.55, clearcoat: 0.3, side: DoubleSide });
    const irons = pocketIronGeometries();
    const hole = new CircleGeometry(1, 40);
    const pearl = new MeshPhysicalMaterial({ color: "#f3efe4", roughness: 0.25, iridescence: 0.6, clearcoat: 1 });
    const diamonds = new InstancedMesh(new SphereGeometry(0.009, 12, 8), pearl, 18);
    const dummy = new Object3D();
    let index = 0;
    for (const sz of [-1, 1]) {
      for (const f of [-3, -2, -1, 1, 2, 3]) {
        dummy.position.set((f * HX) / 4 + (f > 0 ? 0 : 0), BED_TOP + 0.061, sz * (HZ + CUSHION + RAIL * 0.55));
        dummy.scale.set(1.4, 0.25, 0.8);
        dummy.updateMatrix();
        diamonds.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    for (const sx of [-1, 1]) {
      for (const f of [-1, 0, 1]) {
        dummy.position.set(sx * (HX + CUSHION + RAIL * 0.55), BED_TOP + 0.061, (f * HZ) / 2);
        dummy.scale.set(0.8, 0.25, 1.4);
        dummy.updateMatrix();
        diamonds.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    diamonds.instanceMatrix.needsUpdate = true;
    const maple = new MeshPhysicalMaterial({ color: "#e9d3a6", roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const chalk = new MeshPhysicalMaterial({ color: "#3d78b8", roughness: 0.9 });
    const lampGlow = new MeshBasicMaterial({ color: new Color(2.2, 2.05, 1.8) });
    const leg = new CylinderGeometry(0.07, 0.055, 0.64, 24);
    return { geometry, textures, materials, pocket, liner, irons, hole, pearl, diamonds, maple, chalk, lampGlow, leg };
  }, []);

  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.textures.forEach((t) => t.dispose());
      resources.materials.forEach((material) => material.dispose());
      resources.pocket.dispose();
      resources.liner.dispose();
      Object.values(resources.irons).forEach((geometry) => geometry.dispose());
      resources.hole.dispose();
      resources.pearl.dispose();
      resources.diamonds.geometry.dispose();
      resources.diamonds.dispose();
      resources.maple.dispose();
      resources.chalk.dispose();
      resources.lampGlow.dispose();
      resources.leg.dispose();
    },
    [resources],
  );

  const rack = useMemo(() => rackPositions(), []);
  const sim = useRef({
    phase: "ready" as Phase,
    phaseTime: 0,
    balls: rack.map(([x, z]) => ({ x, z, vx: 0, vz: 0, pocketed: false, drop: 0 }) as Ball),
    from: [] as [number, number][],
    lastShot: 0,
    autoBroken: false,
    nearTime: 0,
  });
  const temp = useMemo(() => ({ q: new Quaternion(), axis: new Vector3() }), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const s = sim.current;
    const balls = s.balls;
    const near = Math.hypot(focus.x - x, focus.z - z) < 6;
    s.phaseTime += dt;

    const shotRequest = ui.get().breakShotAt;
    const wantsShot = shotRequest > s.lastShot;
    if (near) s.nearTime += dt;
    else s.nearTime = 0;
    const autoShot = !s.autoBroken && s.nearTime > 1.4;

    if (!rig.reducedMotion && s.phase === "ready" && (wantsShot || autoShot)) {
      s.lastShot = shotRequest;
      s.autoBroken = true;
      s.phase = "aim";
      s.phaseTime = 0;
    }

    // Cue choreography: draw back, then strike.
    let cueOffset = 0.06;
    if (s.phase === "aim") {
      cueOffset = 0.06 + easeInOut(clamp01(s.phaseTime / 0.55)) * 0.16;
      if (s.phaseTime > 0.75) {
        s.phase = "strike";
        s.phaseTime = 0;
      }
    } else if (s.phase === "strike") {
      cueOffset = 0.22 - clamp01(s.phaseTime / 0.07) * 0.22;
      if (s.phaseTime >= 0.07) {
        const cueBall = balls[0];
        const angle = (Math.random() - 0.5) * 0.012;
        cueBall.vx = Math.cos(angle) * 6.2;
        cueBall.vz = Math.sin(angle) * 6.2;
        s.phase = "rolling";
        s.phaseTime = 0;
      }
    } else if (s.phase === "rolling" || s.phase === "settled") {
      cueOffset = 0.06 + clamp01(s.phaseTime / 0.6) * 0.5;
    } else if (s.phase === "rerack") {
      cueOffset = 0.56 - easeInOut(clamp01(s.phaseTime / 1.4)) * 0.5;
    }

    if (s.phase === "rolling") {
      const steps = 8;
      const h = dt / steps;
      for (let step = 0; step < steps; step += 1) simulate(balls, h);
      const moving = balls.some((b) => !b.pocketed && Math.hypot(b.vx, b.vz) > 0.004);
      if (!moving && s.phaseTime > 1) {
        s.phase = "settled";
        s.phaseTime = 0;
      }
    } else if (s.phase === "settled" && s.phaseTime > 3.2) {
      s.phase = "rerack";
      s.phaseTime = 0;
      s.from = balls.map((b) => [b.x, b.z]);
    } else if (s.phase === "rerack") {
      const k = easeInOut(clamp01(s.phaseTime / 1.4));
      balls.forEach((b, id) => {
        b.x = s.from[id][0] + (rack[id][0] - s.from[id][0]) * k;
        b.z = s.from[id][1] + (rack[id][1] - s.from[id][1]) * k;
        b.vx = b.vz = 0;
        b.drop = b.pocketed ? 1 - k : 0;
        if (k >= 1) b.pocketed = false;
      });
      if (k >= 1) {
        s.phase = "ready";
        s.phaseTime = 0;
      }
    }

    balls.forEach((b, id) => {
      const g = ballGroup.current[id];
      if (!g) return;
      if (b.pocketed && s.phase !== "rerack") b.drop = Math.min(1, b.drop + dt * 3);
      const lift = s.phase === "rerack" ? Math.sin(Math.PI * clamp01(s.phaseTime / 1.4)) * 0.08 : 0;
      g.position.set(b.x, BED_TOP + R - b.drop * 0.12 + lift, b.z);
      g.visible = b.drop < 0.98;
      const speed = Math.hypot(b.vx, b.vz);
      if (speed > 0.0005 && s.phase === "rolling") {
        temp.axis.set(b.vz, 0, -b.vx).normalize();
        temp.q.setFromAxisAngle(temp.axis, (speed * dt) / R);
        g.quaternion.premultiply(temp.q);
      }
    });

    if (cue.current) {
      const cueBall = balls[0];
      cue.current.position.set(cueBall.x - R - cueOffset, BED_TOP + R + 0.012, cueBall.z);
      cue.current.visible = !(s.phase === "settled" || (s.phase === "rolling" && s.phaseTime > 0.6));
    }
  });

  return (
    <group name={exhibitId}>
      {/* Cloth bed */}
      <mesh position={[0, BED_TOP - 0.025, 0]} material={m.felt} receiveShadow>
        <boxGeometry args={[(HX + CUSHION) * 2, 0.05, (HZ + CUSHION) * 2]} />
      </mesh>
      <InstancedBoxes boxes={boxes.cushions} material={m.felt} castShadow receiveShadow />
      <InstancedBoxes boxes={boxes.wood} material={m.walnut} castShadow receiveShadow />
      <primitive object={resources.diamonds} />
      {/* Pockets: a dark mouth in the cloth, leather lining, and a brass iron cut to the pocket's curve. */}
      {POCKETS.map(([x, z, r]) => (
        <mesh
          key={`hole${x}${z}`}
          geometry={resources.hole}
          material={resources.pocket}
          position={[x, BED_TOP + 0.0015, z]}
          rotation-x={-Math.PI / 2}
          scale={r}
        />
      ))}
      {POCKETS.map(([x, z], index) => {
        const isSide = index >= 4;
        const mirror: [number, number, number] = [isSide ? 1 : Math.sign(x), 1, Math.sign(z)];
        const [lx, lz] = isSide ? POCKETS[5] : POCKETS[3];
        return (
          <group key={`iron${index}`} scale={mirror}>
            <mesh
              geometry={isSide ? resources.irons.sideLiner : resources.irons.cornerLiner}
              material={resources.liner}
              position={[lx, RAIL_TOP + 0.008 - LINER_HEIGHT / 2, lz]}
            />
            <mesh
              geometry={isSide ? resources.irons.side : resources.irons.corner}
              material={m.brass}
              position-y={RAIL_TOP + 0.006}
              castShadow
              receiveShadow
            />
          </group>
        );
      })}
      {/* Apron and legs */}
      <RoundedBox args={[OUTER_X * 2, 0.17, OUTER_Z * 2]} radius={0.02} position={[0, BED_TOP - 0.1, 0]} material={m.walnutMatte} castShadow receiveShadow />
      {[-1.15, 0, 1.15].flatMap((x) =>
        [-0.66, 0.66].map((z) => (
          <mesh key={`${x}${z}`} geometry={resources.leg} position={[x, 0.32, z]} material={m.walnut} castShadow />
        )),
      )}

      {/* Balls */}
      {resources.materials.map((material, id) => (
        <group
          key={id}
          ref={(group) => {
            ballGroup.current[id] = group;
          }}
          position={[rack[id][0], BED_TOP + R, rack[id][1]]}
          rotation={[0.2 * id, 0.7 * id, 0]}
        >
          <mesh geometry={resources.geometry} material={material} castShadow receiveShadow />
        </group>
      ))}

      {/* Cue: tip, ferrule, maple shaft, walnut forearm, wrap and butt */}
      <group ref={cue} rotation-z={-0.05}>
        <group rotation-z={-Math.PI / 2}>
          {[
            [0.008, 0.0062, 0.0062, resources.chalk],
            [0.022, 0.0062, 0.0064, m.ceramic],
            [0.7, 0.0064, 0.0105, resources.maple],
            [0.38, 0.0105, 0.0128, m.walnut],
            [0.25, 0.0128, 0.0136, m.leatherBlack],
            [0.12, 0.0136, 0.0145, m.walnut],
          ].reduce<{ y: number; parts: ReactElement[] }>(
            (acc, [length, top, bottom, material], index) => {
              const l = length as number;
              acc.parts.push(
                <mesh key={index} position={[0, acc.y - l / 2, 0]} material={material as MeshPhysicalMaterial} castShadow>
                  <cylinderGeometry args={[top as number, bottom as number, l, 20]} />
                </mesh>,
              );
              acc.y -= l;
              return acc;
            },
            { y: 0, parts: [] },
          ).parts}
        </group>
      </group>

      {/* Billiard lamp */}
      <group position={[0, 1.98, 0]}>
        <RoundedBox args={[1.7, 0.12, 0.44]} radius={0.03} material={m.lacquer} />
        <mesh position={[0, -0.061, 0]} rotation-x={Math.PI / 2} material={resources.lampGlow}>
          <planeGeometry args={[1.56, 0.32]} />
        </mesh>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.78, 0]} material={m.bronze}>
            <cylinderGeometry args={[0.008, 0.008, 1.56, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function simulate(balls: Ball[], h: number) {
  for (const b of balls) {
    if (b.pocketed) continue;
    const speed = Math.hypot(b.vx, b.vz);
    if (speed > 0) {
      const slowed = Math.max(0, speed - (0.22 + speed * 0.12) * h);
      const k = slowed / speed;
      b.vx *= k;
      b.vz *= k;
    }
    b.x += b.vx * h;
    b.z += b.vz * h;
    for (const [px, pz, pr] of POCKETS) {
      if (Math.hypot(b.x - px, b.z - pz) < pr) {
        b.pocketed = true;
        b.vx = b.vz = 0;
      }
    }
    if (b.pocketed) continue;
    if (Math.abs(b.x) > HX - R) {
      b.x = Math.sign(b.x) * (HX - R);
      b.vx = -b.vx * 0.78;
    }
    if (Math.abs(b.z) > HZ - R) {
      b.z = Math.sign(b.z) * (HZ - R);
      b.vz = -b.vz * 0.78;
    }
  }
  for (let i = 0; i < balls.length; i += 1) {
    const a = balls[i];
    if (a.pocketed) continue;
    for (let j = i + 1; j < balls.length; j += 1) {
      const b = balls[j];
      if (b.pocketed) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      if (d >= R * 2 || d === 0) continue;
      const nx = dx / d;
      const nz = dz / d;
      const overlap = R * 2 - d;
      a.x -= (nx * overlap) / 2;
      a.z -= (nz * overlap) / 2;
      b.x += (nx * overlap) / 2;
      b.z += (nz * overlap) / 2;
      const relative = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      if (relative <= 0) continue;
      const impulse = relative * 0.96;
      a.vx -= impulse * nx;
      a.vz -= impulse * nz;
      b.vx += impulse * nx;
      b.vz += impulse * nz;
    }
  }
}

export const poolTableFootprint = { width: OUTER_X * 2, depth: OUTER_Z * 2, height: BED_TOP };
