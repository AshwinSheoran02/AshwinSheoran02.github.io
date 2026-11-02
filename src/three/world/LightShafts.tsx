import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { HALL, SUN_DIRECTION } from "../layout";
import { focus } from "../rigState";
import { seeded } from "../textures";
import { windowCentres } from "./Hall";

const travel = new Vector3(...SUN_DIRECTION).negate();

/** Window panes (3 columns by 2 rows), as [yBottom, yTop, zStart, zEnd]. */
function panes(): [number, number, number, number][] {
  const result: [number, number, number, number][] = [];
  const half = HALL.windowWidth / 2;
  const columns = [-half + 0.08, -half / 3 + 0.035, half / 3 + 0.035, half - 0.08];
  const columnStarts = [columns[0], -half / 3 + 0.035, half / 3 + 0.035];
  const columnEnds = [-half / 3 - 0.035, half / 3 - 0.035, columns[3]];
  const rows: [number, number][] = [
    [HALL.windowBottom + 0.08, 4.91],
    [4.99, HALL.windowTop - 0.08],
  ];
  for (const zc of windowCentres) {
    for (let c = 0; c < 3; c += 1) {
      for (const [y0, y1] of rows) {
        result.push([y0, y1, zc + columnStarts[c], zc + columnEnds[c]]);
      }
    }
  }
  return result;
}

function shaftGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const x = -HALL.halfWidth - 0.2;
  for (const [y0, y1, z0, z1] of panes()) {
    const length = (y1 + 0.2) / -travel.y;
    const near = [
      [x, y0, z0],
      [x, y1, z0],
      [x, y1, z1],
      [x, y0, z1],
    ];
    const far = near.map(([px, py, pz]) => [
      px + travel.x * length,
      py + travel.y * length,
      pz + travel.z * length,
    ]);
    // Four sides of the swept pane; u runs along the beam, v across each face.
    for (let edge = 0; edge < 4; edge += 1) {
      const a = edge;
      const b = (edge + 1) % 4;
      const quad = [near[a], near[b], far[b], far[a]];
      const quadUv = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
      ];
      for (const index of [0, 1, 2, 0, 2, 3]) {
        positions.push(...quad[index]);
        uvs.push(...quadUv[index]);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const shaftVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 view = viewMatrix * world;
    vViewPosition = view.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * view;
  }
`;

const shaftFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    float across = sin(3.14159 * vUv.y);
    float along = smoothstep(0.0, 0.06, vUv.x) * pow(1.0 - vUv.x, 1.35);
    float facing = abs(dot(normalize(vViewNormal), normalize(-vViewPosition)));
    float near = smoothstep(1.2, 4.5, -vViewPosition.z);
    float shimmer = 0.82 + 0.18 * sin(vWorld.y * 2.3 + vWorld.z * 1.7 + uTime * 0.35);
    float alpha = uIntensity * across * along * pow(facing, 0.7) * near * shimmer;
    gl_FragColor = vec4(uColor * alpha, 1.0);
  }
`;

export function LightShafts({ intensity }: { intensity: { current: number } }) {
  const geometry = useMemo(() => shaftGeometry(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color("#ffd9a6") },
          uIntensity: { value: 0.085 },
          uTime: { value: 0 },
        },
        vertexShader: shaftVertex,
        fragmentShader: shaftFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        fog: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uIntensity.value = 0.085 * intensity.current;
  });
  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCenter;
  uniform vec3 uSize;
  uniform vec3 uTravel;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vLit;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.11 + aSeed * 6.0) * 0.35;
    p.y += sin(uTime * 0.07 + aSeed * 11.0) * 0.25 + uTime * 0.015;
    p.z += cos(uTime * 0.09 + aSeed * 4.0) * 0.35;
    p = mod(p - uCenter + uSize * 0.5, uSize) - uSize * 0.5 + uCenter;
    p.x = clamp(p.x, -7.8, 7.8);
    // Trace back towards the sun to see whether this mote sits inside a window's beam.
    float s = (p.x + ${HALL.halfWidth.toFixed(1)}) / uTravel.x;
    vec3 w = p - uTravel * s;
    float bay = mod(${(HALL.zStart - HALL.bay / 2).toFixed(2)} - w.z + ${(HALL.bay / 2).toFixed(2)}, ${HALL.bay.toFixed(1)}) - ${(HALL.bay / 2).toFixed(2)};
    float inside = step(abs(bay), ${(HALL.windowWidth / 2).toFixed(2)})
      * step(${HALL.windowBottom.toFixed(2)}, w.y) * step(w.y, ${HALL.windowTop.toFixed(2)});
    vLit = mix(0.06, 1.0, inside);
    vec4 view = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (1.6 + aSeed * 2.2) * uPixelRatio * (6.0 / max(1.0, -view.z));
  }
`;

const dustFragment = /* glsl */ `
  varying float vLit;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vLit * 0.55;
    gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * a, 1.0);
  }
`;

export function Dust({ count = 900 }: { count?: number }) {
  const points = useMemo(() => {
    const rand = seeded(97);
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (rand() - 0.5) * 16;
      positions[i * 3 + 1] = rand() * 7;
      positions[i * 3 + 2] = (rand() - 0.5) * 36;
      seeds[i] = rand();
    }
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    const material = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new Vector3() },
        uSize: { value: new Vector3(16, 7, 36) },
        uTravel: { value: travel.clone() },
        uPixelRatio: { value: 1 },
      },
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const object = new Points(geometry, material);
    object.frustumCulled = false;
    return object;
  }, [count]);

  useEffect(
    () => () => {
      points.geometry.dispose();
      (points.material as ShaderMaterial).dispose();
    },
    [points],
  );

  useFrame((state) => {
    const material = points.material as ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uCenter.value.set(0, 3.5, focus.z + 4);
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return <primitive object={points} renderOrder={6} />;
}
