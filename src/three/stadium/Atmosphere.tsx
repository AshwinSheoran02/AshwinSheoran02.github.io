import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  FogExp2,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PMREMGenerator,
  PlaneGeometry,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type DirectionalLight,
} from "three";
import { GROUND, SCREEN, TOWERS } from "../layout";
import type { QualitySettings } from "../quality";
import { focus } from "../rigState";
import { seeded } from "../textures";
import { lights } from "./lightState";

/* ---------- Sky: deep blue night with a warm city glow on the horizon and the stadium's own light dome ---------- */

const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
    gl_Position.z = gl_Position.w;
  }
`;
const skyFragment = /* glsl */ `
  uniform float uGlow;
  varying vec3 vDirection;
  void main() {
    float y = vDirection.y;
    vec3 zenith = vec3(0.004, 0.007, 0.018);
    vec3 mid = vec3(0.016, 0.026, 0.06);
    vec3 horizon = vec3(0.07, 0.07, 0.1);
    vec3 colour = mix(horizon, mid, smoothstep(0.0, 0.25, y));
    colour = mix(colour, zenith, smoothstep(0.25, 0.85, y));
    // Sodium glow of the city low on the horizon.
    float city = exp(-max(y, 0.0) * 28.0);
    colour += vec3(0.16, 0.085, 0.04) * city * 0.9;
    // Haze lit by the floodlights hangs over the bowl.
    colour += vec3(0.05, 0.06, 0.08) * exp(-max(y - 0.05, 0.0) * 4.0) * uGlow;
    if (y < 0.0) colour = mix(colour, vec3(0.01, 0.012, 0.02), smoothstep(0.0, -0.08, y));
    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }
`;

export function NightSky({ quality }: { quality: QualitySettings }) {
  const sky = useMemo(() => {
    const geometry = new SphereGeometry(1, 32, 16);
    const material = new ShaderMaterial({
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      uniforms: { uGlow: { value: 1 } },
      side: BackSide,
      depthWrite: false,
      fog: false,
    });
    return { geometry, material };
  }, []);

  const stars = useMemo(() => {
    const rand = seeded(8);
    const count = quality.tier === "low" ? 600 : 1400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const u = rand();
      const v = 0.12 + rand() * 0.88;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(v);
      positions.set([Math.sin(phi) * Math.cos(theta) * 1100, Math.cos(phi) * 1100, Math.sin(phi) * Math.sin(theta) * 1100], i * 3);
      sizes[i] = rand() < 0.06 ? 3.2 : 1 + rand() * 1.2;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("size", new BufferAttribute(sizes, 1));
    const material = new ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float size;
        uniform float uTime;
        varying float vTwinkle;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_Position.z = gl_Position.w * 0.9999;
          vTwinkle = 0.65 + 0.35 * sin(uTime * (1.0 + fract(position.x) * 2.0) + position.z);
          gl_PointSize = size;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.75, 0.8, 1.0) * vTwinkle, a * 0.75);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    return { geometry, material, points: new Points(geometry, material) };
  }, [quality.tier]);

  useEffect(
    () => () => {
      sky.geometry.dispose();
      sky.material.dispose();
    },
    [sky],
  );
  useEffect(
    () => () => {
      stars.geometry.dispose();
      stars.material.dispose();
    },
    [stars],
  );

  const skyMesh = useRef<Mesh>(null);
  const camera = useThree((state) => state.camera);
  useFrame((state) => {
    skyMesh.current?.position.copy(camera.position);
    stars.points.position.copy(camera.position);
    stars.material.uniforms.uTime.value = state.clock.elapsedTime;
    sky.material.uniforms.uGlow.value = 0.25 + 0.75 * lights.level;
  });

  return (
    <>
      <mesh ref={skyMesh} geometry={sky.geometry} material={sky.material} scale={1200} renderOrder={-10} frustumCulled={false} />
      <primitive object={stars.points} frustumCulled={false} />
    </>
  );
}

export function NightFog() {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    scene.fog = new FogExp2(new Color("#0b1120"), 0.0011);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}

/* ---------- Floodlight lighting: two shadow-casting keys from opposite towers, plus fills ---------- */

const SHADOW_HALF = 18;

function towerDirection(index: number) {
  const tower = TOWERS[index];
  return new Vector3(tower.x, tower.height, tower.z).normalize();
}

function ShadowKey({
  index,
  intensity,
  quality,
  castShadow,
}: {
  index: number;
  intensity: number;
  quality: QualitySettings;
  castShadow: boolean;
}) {
  const light = useRef<DirectionalLight>(null);
  const target = useMemo(() => new Object3D(), []);
  const direction = useMemo(() => towerDirection(index), [index]);
  const basis = useMemo(() => {
    const forward = direction.clone().negate();
    const right = new Vector3(0, 1, 0).cross(forward).normalize();
    const up = forward.clone().cross(right).normalize();
    return { forward, right, up };
  }, [direction]);
  const snapped = useMemo(() => new Vector3(), []);
  const texel = (SHADOW_HALF * 2) / quality.shadowMapSize;

  useEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);

  useFrame(() => {
    const current = light.current;
    if (!current) return;
    // Follow the camera's focus, snapped to whole shadow texels so edges do not crawl.
    const a = Math.round(focus.dot(basis.right) / texel) * texel;
    const b = Math.round(focus.dot(basis.up) / texel) * texel;
    const c = focus.dot(basis.forward);
    snapped.set(0, 0, 0).addScaledVector(basis.right, a).addScaledVector(basis.up, b).addScaledVector(basis.forward, c);
    target.position.copy(snapped);
    target.updateMatrixWorld();
    current.position.copy(snapped).addScaledVector(direction, 60);
    current.intensity = intensity * lights.towers[index];
  });

  return (
    <directionalLight
      ref={light}
      color="#f1f4ff"
      intensity={intensity}
      castShadow={castShadow}
      shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
      shadow-bias={-0.0002}
      shadow-normalBias={0.03}
      shadow-radius={3}
      shadow-camera-left={-SHADOW_HALF}
      shadow-camera-right={SHADOW_HALF}
      shadow-camera-top={SHADOW_HALF}
      shadow-camera-bottom={-SHADOW_HALF}
      shadow-camera-near={10}
      shadow-camera-far={120}
    />
  );
}

function Fill({ index, intensity }: { index: number; intensity: number }) {
  const light = useRef<DirectionalLight>(null);
  const position = useMemo(() => towerDirection(index).multiplyScalar(100), [index]);
  useFrame(() => {
    if (light.current) light.current.intensity = intensity * lights.towers[index];
  });
  return <directionalLight ref={light} color="#e9eeff" intensity={intensity} position={position} />;
}

export function FloodLighting({ quality }: { quality: QualitySettings }) {
  const hemisphere = useRef<{ intensity: number }>(null);
  useFrame(() => {
    if (hemisphere.current) hemisphere.current.intensity = 0.18 + 0.5 * lights.level;
  });
  return (
    <>
      <ShadowKey index={0} intensity={3.3} quality={quality} castShadow />
      <ShadowKey index={3} intensity={2.4} quality={quality} castShadow={quality.doubleShadows} />
      <Fill index={1} intensity={1.6} />
      <Fill index={2} intensity={1.6} />
      <hemisphereLight ref={hemisphere} args={["#3a4a78", "#24481f", 0.6]} />
    </>
  );
}

/*
 * The reflection environment: a dark bowl ringed by bright floodlight banks,
 * the roof's light ring, the glowing screen and a green floor. Baked once to a
 * prefiltered cube map, so the ball, chrome and lacquer pick up real-looking highlights.
 */
export function StadiumEnvironment({ quality }: { quality: QualitySettings }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const room = new Scene();
    room.background = new Color("#05070d");
    const disposables: { dispose: () => void }[] = [];
    const add = (mesh: Mesh) => {
      room.add(mesh);
      disposables.push(mesh.geometry, mesh.material as MeshBasicMaterial);
    };
    const basic = (colour: string, intensity: number) =>
      new MeshBasicMaterial({ color: new Color(colour).multiplyScalar(intensity), side: DoubleSide });

    // Everything is scaled down by 10 so the cube camera sits inside a compact bowl.
    const s = 0.1;
    const floor = new Mesh(new RingGeometry(0, (GROUND.bz + 8) * s, 48), basic("#1f4d1d", 0.6));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    add(floor);
    // Stands: a dim ring of terraces with the crowd's colour in it.
    const stands = new Mesh(new SphereGeometry(13, 48, 12, 0, Math.PI * 2, Math.PI * 0.28, Math.PI * 0.24), basic("#2a3348", 0.35));
    stands.material.side = BackSide;
    add(stands);
    // Roof light ring.
    const ring = new Mesh(new RingGeometry(9.6, 10.4, 96), basic("#f4f6ff", 3.2));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 4.4;
    add(ring);
    // Floodlight banks.
    TOWERS.forEach((tower) => {
      const bank = new Mesh(new PlaneGeometry(1.6, 1.0), basic("#ffffff", 22));
      bank.position.set(tower.x * s, tower.height * s, tower.z * s);
      bank.lookAt(0, 0, 0);
      add(bank);
    });
    // The giant screen.
    const screen = new Mesh(new PlaneGeometry(SCREEN.width * s, SCREEN.height * s), basic("#7aa8ff", 1.6));
    screen.position.set(SCREEN.position[0] * s, SCREEN.position[1] * s, SCREEN.position[2] * s);
    screen.lookAt(0, SCREEN.position[1] * s, 0);
    add(screen);

    const generator = new PMREMGenerator(gl);
    const target = generator.fromScene(room, 0.02, 0.1, 100, { size: quality.environmentResolution });
    scene.environment = target.texture;
    scene.environmentIntensity = 0.85;

    return () => {
      if (scene.environment === target.texture) scene.environment = null;
      target.dispose();
      generator.dispose();
      disposables.forEach((item) => item.dispose());
    };
  }, [gl, scene, quality.environmentResolution]);

  return null;
}
