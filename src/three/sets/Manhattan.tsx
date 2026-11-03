import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { journey } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { Label, Near } from "../common";
import { damp } from "../helpers";
import { MANHATTAN } from "../layout";

/*
 * The journey as a broadcast "Manhattan": one bar per release, rising out of the
 * outfield in augmented-reality style, joined by a worm line along their tops.
 */
const barVertex = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  void main() {
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mv.xyz;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }
`;
const barFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uLoading;
  varying vec3 vLocal;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  void main() {
    // Box spans -0.5..0.5 on every axis.
    vec3 p = vLocal + 0.5;
    float edgeX = min(p.x, 1.0 - p.x);
    float edgeY = min(p.y, 1.0 - p.y);
    float edgeZ = min(p.z, 1.0 - p.z);
    float e = min(min(max(edgeX, edgeZ), max(edgeX, edgeY)), max(edgeY, edgeZ));
    float edge = smoothstep(0.035, 0.0, e);
    float rim = 1.0 - abs(dot(normalize(vNormalView), normalize(vViewPosition)));
    float body = 0.12 + 0.35 * p.y + rim * 0.25;
    // Scan bands rising through the bar.
    float bands = smoothstep(0.9, 1.0, fract(p.y * 7.0 - uTime * 0.35)) * 0.25;
    // The current release is still loading: its top segment blinks.
    float loading = uLoading * step(0.82, p.y) * (0.5 + 0.5 * sin(uTime * 6.0));
    float top = step(0.995, p.y);
    float alpha = (body + bands + edge * 1.2 + top * 0.8 + loading) * uOpacity;
    gl_FragColor = vec4(uColour * (1.0 + edge * 1.6 + top), clamp(alpha, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const COLOURS = { shipped: new Color("#5ad1ff"), current: new Color("#ffd400"), installing: new Color("#ff4d3d") };

export function Manhattan() {
  const bars = useRef<(Mesh | null)[]>([]);
  const labels = useRef<(Group | null)[]>([]);
  const group = useRef<Group>(null);
  const resources = useMemo(() => {
    const geometry = new BoxGeometry(1, 1, 1);
    const materials = journey.entries.map(
      (entry) =>
        new ShaderMaterial({
          vertexShader: barVertex,
          fragmentShader: barFragment,
          uniforms: {
            uColour: { value: (entry.status === "INSTALLING" ? COLOURS.installing : COLOURS.shipped).clone() },
            uOpacity: { value: 0 },
            uTime: { value: 0 },
            uLoading: { value: entry.status === "INSTALLING" ? 1 : 0 },
          },
          transparent: true,
          depthWrite: false,
          side: DoubleSide,
          blending: AdditiveBlending,
        }),
    );
    const tops = journey.entries.map((_, index) => new Vector3(MANHATTAN.x, MANHATTAN.height(index) + 0.2, MANHATTAN.z(index)));
    const worm = new TubeGeometry(new CatmullRomCurve3(tops, false, "centripetal"), 120, 0.09, 8, false);
    const wormMaterial = new ShaderMaterial({
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uReveal;
        varying vec2 vUv;
        void main() {
          float on = step(vUv.x, uReveal);
          gl_FragColor = vec4(vec3(2.4, 2.1, 0.4) * on, on);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      uniforms: { uReveal: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });
    return { geometry, materials, worm, wormMaterial };
  }, []);
  useEffect(
    () => () => {
      resources.geometry.dispose();
      resources.materials.forEach((material) => material.dispose());
      resources.worm.dispose();
      resources.wormMaterial.dispose();
    },
    [resources],
  );

  const state = useRef({ grow: journey.entries.map(() => 0), opacity: 0, reveal: 0 });
  useFrame((frame, delta) => {
    const dt = Math.min(delta, 0.1);
    const active = ui.get().activeStation;
    const index = active.startsWith("journey-") ? Number(active.slice(8)) : -1;
    const showing = index >= 0 || active === "facts" || active === "side-quests";
    const s = state.current;
    const instant = rig.capture || rig.reducedMotion;
    s.opacity = instant ? (showing ? 1 : 0) : damp(s.opacity, showing ? 1 : 0, 3, dt);
    if (group.current) group.current.visible = s.opacity > 0.01;
    journey.entries.forEach((entry, i) => {
      // Bars up to the current release are standing; later ones wait below the turf.
      const target = index >= i ? 1 : index >= 0 ? 0.04 : 0;
      s.grow[i] = instant ? target : damp(s.grow[i], target, 2.6, dt);
      const label = labels.current[i];
      if (label) label.visible = s.grow[i] > 0.6;
      const bar = bars.current[i];
      const height = MANHATTAN.height(i) * Math.max(0.001, s.grow[i]);
      if (bar) {
        bar.scale.set(MANHATTAN.size, height, MANHATTAN.size);
        bar.position.y = height / 2;
      }
      const uniforms = resources.materials[i].uniforms;
      uniforms.uOpacity.value = s.opacity * (i === index ? 1 : 0.55);
      uniforms.uTime.value = frame.clock.elapsedTime;
      const colour = entry.status === "INSTALLING" ? COLOURS.installing : i === index ? COLOURS.current : COLOURS.shipped;
      (uniforms.uColour.value as Color).lerp(colour, instant ? 1 : Math.min(1, dt * 4));
    });
    const reveal = index < 0 ? 0 : index / Math.max(1, journey.entries.length - 1);
    s.reveal = instant ? reveal : damp(s.reveal, reveal, 2, dt);
    resources.wormMaterial.uniforms.uReveal.value = s.reveal;
  });

  return (
    <Near x={MANHATTAN.x} z={0} reach={60}>
      <group ref={group}>
        {journey.entries.map((entry, index) => (
          <group key={entry.period} position={[MANHATTAN.x, 0, MANHATTAN.z(index)]}>
            <mesh
              ref={(mesh) => {
                bars.current[index] = mesh;
              }}
              geometry={resources.geometry}
              material={resources.materials[index]}
              renderOrder={6}
            />
            <group
              ref={(element) => {
                labels.current[index] = element;
              }}
              rotation-y={-Math.PI / 2}
              position={[-MANHATTAN.size / 2 - 0.05, 0, 0]}
            >
              <Label size={1.05} italic color="#ffffff" anchorY="bottom" position={[0, MANHATTAN.height(index) + 0.6, 0]}>
                {entry.period}
              </Label>
              <Label size={0.5} color={entry.status === "INSTALLING" ? "#ff8a80" : "#ffd400"} anchorY="top" position={[0, MANHATTAN.height(index) + 0.5, 0]} maxWidth={5}>
                {entry.title.toUpperCase()}
              </Label>
            </group>
          </group>
        ))}
        <mesh geometry={resources.worm} material={resources.wormMaterial} renderOrder={7} />
      </group>
    </Near>
  );
}
