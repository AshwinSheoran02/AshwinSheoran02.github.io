import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Points,
  ShaderMaterial,
  Vector2,
  type Group,
} from "three";
import { rig, ui } from "../../lib/store";
import { PRESENTATION } from "../layout";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";
import { paintTexture, seeded } from "../textures";

/* The post-match presentation: a stage, a step-and-repeat backdrop and a trophy. */
export function PresentationStage() {
  const m = useMaterials();
  const resources = useMemo(() => {
    const backdrop = paintTexture(
      2048,
      640,
      (g, w, h) => {
        g.fillStyle = "#0b1638";
        g.fillRect(0, 0, w, h);
        for (let row = 0; row < 4; row += 1) {
          for (let col = 0; col < 6; col += 1) {
            const x = col * 360 + (row % 2) * 180 + 40;
            const y = row * 160 + 110;
            g.fillStyle = (row + col) % 2 ? "#ffd400" : "#ffffff";
            g.font = `italic 900 70px "Barlow Condensed", sans-serif`;
            g.fillText("ASHWIN.TOP", x, y);
          }
        }
        g.fillStyle = "rgba(5,8,16,0.82)";
        g.fillRect(0, h * 0.36, w, h * 0.3);
        g.fillStyle = "#ffffff";
        g.font = `italic 900 ${h * 0.2}px "Barlow Condensed", sans-serif`;
        g.textAlign = "center";
        g.fillText("POST-MATCH PRESENTATION", w / 2, h * 0.58);
      },
      { clamp: true },
    );
    const backdropMaterial = new MeshBasicMaterial({ map: backdrop, color: new Color(1.15, 1.15, 1.15) });
    const gold = new MeshPhysicalMaterial({ color: "#f2c14e", metalness: 1, roughness: 0.14, clearcoat: 0.6 });
    const cup = new LatheGeometry(
      [
        [0, 0],
        [0.22, 0],
        [0.22, 0.05],
        [0.08, 0.1],
        [0.05, 0.32],
        [0.07, 0.38],
        [0.2, 0.46],
        [0.27, 0.62],
        [0.29, 0.8],
        [0.27, 0.82],
        [0.24, 0.64],
        [0, 0.6],
      ].map(([x, y]) => new Vector2(x, y)),
      64,
    );
    const strip = new MeshBasicMaterial({ color: new Color(2.2, 1.9, 0.3) });
    return { backdrop, backdropMaterial, gold, cup, strip };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => value.dispose());
    },
    [resources],
  );
  const { x, z } = PRESENTATION;
  const group = useRef<Group>(null);
  useFrame(() => {
    // Only built for the closing shot, so it never gives the ending away earlier.
    if (group.current) group.current.visible = ui.get().activeStation === "contact";
  });
  return (
    <group ref={group}>
      <group position={[x, 0, z]}>
        <RoundedBox args={[10, 0.3, 4.4]} radius={0.04} position={[0, 0.15, 0]} material={m.lacquer} castShadow receiveShadow />
        <mesh material={resources.strip} position={[0, 0.3, 2.21]}>
          <boxGeometry args={[10, 0.03, 0.03]} />
        </mesh>
        <mesh material={resources.backdropMaterial} position={[0, 2.1, -1.9]}>
          <planeGeometry args={[9.6, 3]} />
        </mesh>
        <mesh material={m.lacquer} position={[0, 2.1, -1.98]}>
          <boxGeometry args={[9.8, 3.2, 0.12]} />
        </mesh>
        <RoundedBox args={[0.7, 1.0, 0.7]} radius={0.03} position={[0, 0.8, 0.6]} material={m.lacquer} castShadow receiveShadow />
        <mesh geometry={resources.cup} material={resources.gold} position={[0, 1.3, 0.6]} castShadow />
        {[-1, 1].map((side) => (
          <mesh key={side} material={resources.gold} position={[side * 0.3, 2.0, 0.6]} rotation-z={side * 0.3}>
            <torusGeometry args={[0.1, 0.018, 12, 32, Math.PI]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/*
 * Fireworks over the stands, computed entirely on the GPU: each particle knows
 * its burst slot and direction, and the shader works out where it is.
 */
export function Fireworks({ quality }: { quality: QualitySettings }) {
  const resources = useMemo(() => {
    const rand = seeded(1177);
    const slots = quality.tier === "low" ? 4 : 8;
    const perBurst = quality.tier === "low" ? 90 : 180;
    const count = slots * perBurst;
    const directions = new Float32Array(count * 3);
    const slot = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const speed = 0.75 + rand() * 0.25;
      directions.set([r * Math.cos(a) * speed, u * speed, r * Math.sin(a) * speed], i * 3);
      slot[i] = Math.floor(i / perBurst);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("aDir", new BufferAttribute(directions, 3));
    geometry.setAttribute("aSlot", new BufferAttribute(slot, 1));
    const material = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uActive: { value: 0 }, uSlots: { value: slots }, uScale: { value: 800 } },
      vertexShader: /* glsl */ `
        attribute vec3 aDir;
        attribute float aSlot;
        uniform float uTime;
        uniform float uActive;
        uniform float uSlots;
        uniform float uScale;
        varying vec3 vColour;
        varying float vAlpha;
        float hash(float n) { return fract(sin(n) * 43758.5453); }
        void main() {
          float period = 3.4;
          float local = uTime + aSlot * period / uSlots;
          float cycle = floor(local / period);
          float t = mod(local, period);
          float seed = cycle * 7.13 + aSlot * 3.71;
          float angle = -1.5708 + (hash(seed) - 0.5) * 3.4;
          vec3 centre = vec3(cos(angle) * (100.0 + hash(seed + 1.0) * 30.0), 58.0 + hash(seed + 2.0) * 30.0, sin(angle) * (112.0 + hash(seed + 3.0) * 30.0));
          float radius = 16.0 + hash(seed + 4.0) * 12.0;
          float spread = (1.0 - exp(-t * 2.2)) * radius;
          vec3 p = centre + aDir * spread;
          p.y -= 3.2 * t * t;
          float pick = hash(seed + 5.0);
          vColour = pick < 0.35 ? vec3(1.0, 0.78, 0.25) : pick < 0.6 ? vec3(0.9, 0.95, 1.0) : pick < 0.82 ? vec3(0.35, 0.7, 1.0) : vec3(1.0, 0.35, 0.3);
          float sparkle = 0.75 + 0.25 * sin(uTime * 30.0 + aDir.x * 40.0);
          vAlpha = uActive * (1.0 - smoothstep(0.4, 2.4, t)) * step(0.05, t) * sparkle;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(uScale * 2.6 / -mv.z, 2.5, 12.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColour;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColour * 4.5 * a * a * vAlpha, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    return { geometry, material, points };
  }, [quality.tier]);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.material.dispose();
    },
    [resources],
  );

  const state = useRef({ active: 0, introAt: -1 });
  useFrame((frame, delta) => {
    const { activeStation, introDone } = ui.get();
    const s = state.current;
    const t = frame.clock.elapsedTime;
    if (introDone && s.introAt < 0) s.introAt = t;
    const celebrating = activeStation === "contact" || (activeStation === "home" && s.introAt > 0 && t - s.introAt < 9);
    const target = rig.reducedMotion ? 0 : celebrating ? 1 : 0;
    s.active += (target - s.active) * Math.min(1, delta * 2);
    resources.material.uniforms.uActive.value = rig.capture ? (activeStation === "contact" ? 1 : 0) : s.active;
    resources.material.uniforms.uTime.value = rig.capture ? 1.3 : t;
    resources.material.uniforms.uScale.value = frame.size.height;
    resources.points.visible = resources.material.uniforms.uActive.value > 0.01;
  });
  return <primitive object={resources.points} />;
}
