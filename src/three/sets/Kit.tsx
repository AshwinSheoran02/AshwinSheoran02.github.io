import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  InstancedMesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type Group,
} from "three";
import { rig } from "../../lib/store";
import { PITCH } from "../layout";
import { noiseTexture, paintTexture } from "../textures";

/* ---------- The ball: red leather, a raised seam and two rows of stitching ---------- */
export const BALL_RADIUS = 0.036;

export function useBall() {
  const resources = useMemo(() => {
    const bump = noiseTexture(17, 256);
    bump.repeat.set(3, 3);
    const leather = new MeshPhysicalMaterial({
      color: "#9a1a12",
      roughness: 0.36,
      clearcoat: 0.8,
      clearcoatRoughness: 0.22,
      bumpMap: bump,
      bumpScale: 0.3,
    });
    const thread = new MeshStandardMaterial({ color: "#f2ead8", roughness: 0.7 });
    const r = BALL_RADIUS;
    const ball = new SphereGeometry(r, 48, 32);
    const seam = new TorusGeometry(r, r * 0.03, 8, 96);
    const stitch = new CylinderGeometry(r * 0.017, r * 0.017, r * 0.09, 5);
    const stitches = new InstancedMesh(stitch, thread, 128);
    const dummy = new Object3D();
    let index = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 64; i += 1) {
        const a = (i / 64) * Math.PI * 2;
        const offset = side * r * 0.075;
        const rr = Math.sqrt(r * r - offset * offset) + r * 0.006;
        dummy.position.set(Math.cos(a) * rr, Math.sin(a) * rr, offset);
        dummy.lookAt(0, 0, offset);
        dummy.rotateX(Math.PI / 2);
        dummy.rotateZ(side * 0.6);
        dummy.updateMatrix();
        stitches.setMatrixAt(index, dummy.matrix);
        index += 1;
      }
    }
    stitches.instanceMatrix.needsUpdate = true;
    return { bump, leather, thread, ball, seam, stitch, stitches };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => (value as { dispose?: () => void }).dispose?.());
    },
    [resources],
  );
  return resources;
}

export function Ball({ scale = 1, ...props }: { scale?: number; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const r = useBall();
  return (
    <group {...props} scale={scale}>
      <mesh geometry={r.ball} material={r.leather} castShadow receiveShadow />
      <mesh geometry={r.seam} material={r.leather} />
      <primitive object={r.stitches} />
    </group>
  );
}

/* ---------- Stumps with LED bails that flash red when the wicket is broken ---------- */
export function Stumps({ end = 1, flashAt }: { end?: 1 | -1; flashAt?: { current: number } }) {
  const resources = useMemo(() => {
    const decal = paintTexture(
      64,
      512,
      (g, w, h) => {
        g.fillStyle = "#f4f4f2";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#1238a8";
        g.fillRect(0, h * 0.18, w, h * 0.32);
        g.fillStyle = "#ffd400";
        g.fillRect(0, h * 0.2, w, h * 0.04);
        g.fillStyle = "#ffffff";
        g.font = `800 ${w * 0.7}px "Barlow Condensed", sans-serif`;
        g.save();
        g.translate(w * 0.72, h * 0.47);
        g.rotate(-Math.PI / 2);
        g.fillText("ASHWIN.TOP", 0, 0);
        g.restore();
      },
      { clamp: true },
    );
    const stump = new MeshPhysicalMaterial({ map: decal, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    const bail = new MeshPhysicalMaterial({ color: "#d9dde3", roughness: 0.25, emissive: new Color("#ff2a1f"), emissiveIntensity: 0 });
    const stumpGeometry = new CylinderGeometry(0.017, 0.017, 0.71, 20);
    const spike = new CylinderGeometry(0.017, 0.002, 0.08, 12);
    const bailGeometry = new CylinderGeometry(0.008, 0.008, 0.11, 12);
    return { decal, stump, bail, stumpGeometry, spike, bailGeometry };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  useFrame((state) => {
    const since = flashAt ? state.clock.elapsedTime - flashAt.current : 99;
    const on = since >= 0 && since < 2.2 && Math.floor(since * 6) % 2 === 0;
    resources.bail.emissiveIntensity = on ? 9 : 0.0;
  });
  const z = end * PITCH.half;
  return (
    <group position={[0, 0, z]}>
      {[-0.114, 0, 0.114].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh geometry={resources.stumpGeometry} material={resources.stump} position-y={0.355} castShadow receiveShadow />
        </group>
      ))}
      {[-0.057, 0.057].map((x) => (
        <mesh
          key={x}
          geometry={resources.bailGeometry}
          material={resources.bail}
          position={[x, 0.718, 0]}
          rotation-z={Math.PI / 2}
          castShadow
        />
      ))}
    </group>
  );
}

/* ---------- The bat: a willow blade with a sticker, a cane handle and a rubber grip ---------- */
export function Bat(props: { position?: [number, number, number]; rotation?: [number, number, number] }) {
  const resources = useMemo(() => {
    const bladeShape = new Shape();
    const w = 0.054;
    bladeShape.moveTo(-w, 0);
    bladeShape.lineTo(-w, 0.54);
    bladeShape.quadraticCurveTo(-w, 0.565, -w * 0.55, 0.57);
    bladeShape.lineTo(w * 0.55, 0.57);
    bladeShape.quadraticCurveTo(w, 0.565, w, 0.54);
    bladeShape.lineTo(w, 0);
    bladeShape.quadraticCurveTo(0, -0.012, -w, 0);
    const blade = new ExtrudeGeometry(bladeShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.006,
      bevelSegments: 4,
      curveSegments: 12,
    });
    blade.translate(0, 0, -0.016);
    const grain = paintTexture(
      256,
      512,
      (g, width, height) => {
        g.fillStyle = "#e3c793";
        g.fillRect(0, 0, width, height);
        for (let i = 0; i < 26; i += 1) {
          const x = (i / 26) * width + Math.sin(i) * 3;
          g.fillStyle = `rgba(160,120,60,${0.12 + (i % 3) * 0.05})`;
          g.fillRect(x, 0, 2 + (i % 4), height);
        }
        // Sticker on the face.
        g.fillStyle = "#0b1638";
        g.fillRect(width * 0.18, height * 0.42, width * 0.64, height * 0.3);
        g.fillStyle = "#ffd400";
        g.font = `italic 900 ${width * 0.2}px "Barlow Condensed", sans-serif`;
        g.textAlign = "center";
        g.fillText("ASHWIN", width / 2, height * 0.55);
        g.fillStyle = "#ffffff";
        g.font = `800 ${width * 0.12}px "Barlow Condensed", sans-serif`;
        g.fillText("NOT OUT", width / 2, height * 0.65);
      },
      { clamp: true },
    );
    const willow = new MeshPhysicalMaterial({ map: grain, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3 });
    // UVs for the face: ExtrudeGeometry maps shape coordinates directly, so rescale them to 0..1.
    const uv = blade.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) uv.setXY(i, (uv.getX(i) + w) / (w * 2), uv.getY(i) / 0.57);
    const handle = new CylinderGeometry(0.0165, 0.0175, 0.29, 24);
    const grip = new MeshPhysicalMaterial({ color: "#121a33", roughness: 0.7, sheen: 0.4, sheenColor: new Color("#3a4f8f") });
    const cap = new SphereGeometry(0.019, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    return { blade, grain, willow, handle, grip, cap };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  return (
    <group {...props}>
      <mesh geometry={resources.blade} material={resources.willow} castShadow receiveShadow />
      <mesh geometry={resources.handle} material={resources.grip} position-y={0.57 + 0.145} castShadow />
      <mesh geometry={resources.cap} material={resources.grip} position-y={0.86} />
    </group>
  );
}

/** A bowled delivery, on a loop: run-up implied, ball pitches and hits the stumps, bails flash. */
export function Delivery({ flashAt, period = 7 }: { flashAt: { current: number }; period?: number }) {
  const ball = useRef<Group>(null);
  useFrame((state) => {
    const g = ball.current;
    if (!g) return;
    if (rig.reducedMotion || rig.capture) {
      g.position.set(0.18, BALL_RADIUS, PITCH.half - 1.6);
      return;
    }
    const t = state.clock.elapsedTime % period;
    const flight = 0.62;
    if (t < flight) {
      const u = t / flight;
      // Release at the bowler's end, pitch on a good length, rise into the stumps.
      const z = -PITCH.half + 0.8 + u * (PITCH.half * 2 - 0.8);
      const bounceAt = 0.72;
      const y = u < bounceAt ? 2.2 * (1 - u / bounceAt) + BALL_RADIUS : BALL_RADIUS + ((u - bounceAt) / (1 - bounceAt)) * 0.42;
      g.position.set(0.05 * u, y, z);
      g.rotation.x -= 0.6;
      g.visible = true;
      if (u > 0.985 && flashAt.current < state.clock.elapsedTime - 1) flashAt.current = state.clock.elapsedTime;
    } else {
      g.visible = t < flight + 0.05;
    }
  });
  return (
    <group ref={ball}>
      <Ball />
    </group>
  );
}
