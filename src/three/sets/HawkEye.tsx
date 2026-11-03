import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Group,
} from "three";
import { knownIssues } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { Label } from "../common";
import { damp } from "../helpers";
import { PITCH } from "../layout";
import { AR } from "./FieldGraphics";

/*
 * The known issues as a third-umpire review: three ball-tracking paths, one per
 * bug, pitching at different lengths and heading for the stumps.
 */
const PATHS = [
  { pitch: 5.2, line: 0.08, end: [0.05, 0.42], colour: AR.red },
  { pitch: 3.6, line: -0.14, end: [-0.12, 0.3], colour: AR.yellow },
  { pitch: 7.3, line: 0.26, end: [0.3, 0.86], colour: AR.green },
] as const;

function trajectory(path: (typeof PATHS)[number]) {
  const release = new Vector3(0.35, 2.15, -PITCH.half + 1.2);
  const bounce = new Vector3(path.line, 0.04, PITCH.half - path.pitch);
  const end = new Vector3(path.end[0], path.end[1], PITCH.half + 0.1);
  const points: Vector3[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const u = i / 24;
    points.push(new Vector3().lerpVectors(release, bounce, u).setY(release.y + (bounce.y - release.y) * Math.pow(u, 1.6)));
  }
  for (let i = 1; i <= 16; i += 1) {
    const u = i / 16;
    points.push(new Vector3().lerpVectors(bounce, end, u).setY(bounce.y + (end.y - bounce.y) * Math.sqrt(u)));
  }
  return { curve: new CatmullRomCurve3(points), bounce, end };
}

const tubeVertex = /* glsl */ `varying float vAlong; void main() { vAlong = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const tubeFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uReveal;
  uniform float uOpacity;
  varying float vAlong;
  void main() {
    if (vAlong > uReveal) discard;
    float head = smoothstep(uReveal - 0.04, uReveal, vAlong);
    gl_FragColor = vec4(uColour * (1.6 + head * 2.0), uOpacity * (0.75 + 0.25 * head));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function HawkEye() {
  const group = useRef<Group>(null);
  const resources = useMemo(() => {
    const paths = PATHS.map((path) => {
      const t = trajectory(path);
      return {
        ...t,
        tube: new TubeGeometry(t.curve, 160, 0.036, 10, false),
        material: new ShaderMaterial({
          vertexShader: tubeVertex,
          fragmentShader: tubeFragment,
          uniforms: { uColour: { value: new Color(path.colour) }, uReveal: { value: 0 }, uOpacity: { value: 1 } },
          transparent: true,
          depthWrite: false,
        }),
        marker: new MeshBasicMaterial({ color: new Color(path.colour).multiplyScalar(2), transparent: true, depthWrite: false, side: DoubleSide }),
      };
    });
    const zone = new MeshBasicMaterial({ color: new Color("#4f7dff").multiplyScalar(1.2), transparent: true, opacity: 0.22, depthWrite: false, side: DoubleSide });
    const zoneEdge = new MeshBasicMaterial({ color: new Color("#9fb8ff").multiplyScalar(1.6), transparent: true, opacity: 0.8, depthWrite: false });
    return {
      paths,
      zone,
      zoneEdge,
      ring: new CircleGeometry(0.11, 32),
      ball: new SphereGeometry(0.036, 20, 12),
      lane: new PlaneGeometry(0.23, PITCH.half * 2),
      wicket: new BoxGeometry(0.23, 0.72, 0.02),
    };
  }, []);
  useEffect(
    () => () => {
      resources.paths.forEach((path) => {
        path.tube.dispose();
        path.material.dispose();
        path.marker.dispose();
      });
      resources.zone.dispose();
      resources.zoneEdge.dispose();
      resources.ring.dispose();
      resources.ball.dispose();
      resources.lane.dispose();
      resources.wicket.dispose();
    },
    [resources],
  );

  const state = useRef({ opacity: 0, start: -1 });
  useFrame((frame, delta) => {
    const showing = ui.get().activeStation === "known-issues";
    const s = state.current;
    const instant = rig.capture || rig.reducedMotion;
    s.opacity = instant ? (showing ? 1 : 0) : damp(s.opacity, showing ? 1 : 0, 3, Math.min(delta, 0.1));
    if (group.current) group.current.visible = s.opacity > 0.01;
    if (showing && s.start < 0) s.start = frame.clock.elapsedTime;
    if (!showing) s.start = -1;
    const elapsed = s.start < 0 ? 0 : frame.clock.elapsedTime - s.start;
    resources.paths.forEach((path, index) => {
      // Each delivery is drawn on in turn, as the review replays them.
      const reveal = instant ? 1 : Math.min(1, Math.max(0, (elapsed - 0.4 - index * 0.7) / 0.9));
      path.material.uniforms.uReveal.value = reveal;
      path.material.uniforms.uOpacity.value = s.opacity;
      path.marker.opacity = s.opacity * (reveal > 0.6 ? 1 : 0);
    });
    resources.zone.opacity = 0.22 * s.opacity;
    resources.zoneEdge.opacity = 0.8 * s.opacity;
  });

  return (
    <group ref={group}>
      {/* The "in line" lane between the stumps, and the wicket zone at the striker's end. */}
      <mesh geometry={resources.lane} material={resources.zone} position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} renderOrder={3} />
      <mesh geometry={resources.wicket} material={resources.zone} position={[0, 0.36, PITCH.half + 0.12]} renderOrder={3} />
      <mesh material={resources.zoneEdge} position={[0, 0.72, PITCH.half + 0.12]}>
        <boxGeometry args={[0.25, 0.012, 0.03]} />
      </mesh>
      {resources.paths.map((path, index) => {
        const issue = knownIssues.items[index];
        return (
          <group key={issue.id}>
            <mesh geometry={path.tube} material={path.material} renderOrder={4} />
            <mesh geometry={resources.ring} material={path.marker} position={[path.bounce.x, 0.045, path.bounce.z]} rotation-x={-Math.PI / 2} renderOrder={5} />
            <mesh geometry={resources.ball} material={path.marker} position={[path.end.x, path.end.y, path.end.z]} />
            <group position={[path.bounce.x + (index - 1) * 0.15 + 0.9, 0.05, path.bounce.z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <Label size={0.3} italic color={PATHS[index].colour} anchorX="center" anchorY="bottom">
                {`BUG_${issue.number}`}
              </Label>
              <Label size={0.17} color="#ffffff" anchorX="center" anchorY="top" position={[0, -0.04, 0]}>
                {issue.title.toUpperCase()}
              </Label>
            </group>
          </group>
        );
      })}
    </group>
  );
}
