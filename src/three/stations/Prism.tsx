import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  MathUtils,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Mesh,
  PlaneGeometry,
  Quaternion,
  Shape,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";
import { about } from "../../data/profile";
import { rig } from "../../lib/store";
import { Label, Plinth, Station } from "../common";
import { damp } from "../helpers";
import { HALL, Z } from "../layout";
import { focus } from "../rigState";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";
import { paintTexture } from "../textures";

const SPECTRUM = ["#ff4d3d", "#ff8a2a", "#ffd23f", "#7fd65a", "#38c3d8", "#4a6cff", "#9b5cff"];
const PRISM_HEIGHT = 1.12;
const FACING = MathUtils.degToRad(-34);
const VIEW_RIGHT = new Vector3(Math.cos(MathUtils.degToRad(34)), 0, Math.sin(MathUtils.degToRad(34)));
const ORIGIN = new Vector3(1, PRISM_HEIGHT + 0.2, Z.about);
const BEAM_START = ORIGIN.clone().addScaledVector(VIEW_RIGHT, -2.5).add(new Vector3(0, 1.05, 0));
const WALL_X = HALL.halfWidth - 0.01;

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFadeStart;
  uniform float uFadeEnd;
  varying vec2 vUv;
  void main() {
    float along = smoothstep(uFadeStart, uFadeStart + 0.08, vUv.y) * (1.0 - smoothstep(uFadeEnd - 0.12, uFadeEnd, vUv.y));
    gl_FragColor = vec4(uColor * uOpacity * along, 1.0);
  }
`;

function beamMaterial(color: string, opacity: number, fadeStart = 0, fadeEnd = 1) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
      uFadeStart: { value: fadeStart },
      uFadeEnd: { value: fadeEnd },
    },
    vertexShader: beamVertex,
    fragmentShader: beamFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
}

const up = new Vector3(0, 1, 0);
function placeBetween(mesh: Mesh, from: Vector3, to: Vector3) {
  const direction = new Vector3().subVectors(to, from);
  const length = direction.length();
  mesh.position.copy(from).addScaledVector(direction, 0.5);
  mesh.quaternion.copy(new Quaternion().setFromUnitVectors(up, direction.normalize()));
  mesh.scale.set(1, length, 1);
}

/** An equilateral prism standing on one edge, triangular faces towards the viewer. */
function prismGeometry() {
  const side = 0.56;
  const height = (side * Math.sqrt(3)) / 2;
  const shape = new Shape();
  shape.moveTo(-side / 2, 0);
  shape.lineTo(side / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const depth = 0.34;
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 4,
  });
  geometry.translate(0, 0.01, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}


export function Prism({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const prism = useRef<Mesh>(null);
  const rays = useRef<(Mesh | null)[]>([]);
  const incoming = useRef<Mesh>(null);
  const spectrum = useRef<Group>(null);
  const motion = useRef({ hover: false, turn: 0 });

  const resources = useMemo(() => {
    const rod = new CylinderGeometry(1, 1, 1, 10, 1, true);
    const prismGeo = prismGeometry();
    const white = beamMaterial("#fff3dc", 1.5, 0, 0.94);
    const colours = SPECTRUM.map((c) => beamMaterial(c, 0.9, 0.04, 1));
    const band = paintTexture(
      512,
      128,
      (g, w, h) => {
        const gradient = g.createLinearGradient(0, 0, w, 0);
        SPECTRUM.forEach((c, i) => gradient.addColorStop(i / (SPECTRUM.length - 1), c));
        g.fillStyle = gradient;
        g.fillRect(0, 0, w, h);
        const mask = g.createLinearGradient(0, 0, 0, h);
        mask.addColorStop(0, "rgba(0,0,0,1)");
        mask.addColorStop(0.35, "rgba(0,0,0,0)");
        mask.addColorStop(0.65, "rgba(0,0,0,0)");
        mask.addColorStop(1, "rgba(0,0,0,1)");
        g.fillStyle = mask;
        g.fillRect(0, 0, w, h);
        const sides = g.createLinearGradient(0, 0, w, 0);
        sides.addColorStop(0, "rgba(0,0,0,1)");
        sides.addColorStop(0.1, "rgba(0,0,0,0)");
        sides.addColorStop(0.9, "rgba(0,0,0,0)");
        sides.addColorStop(1, "rgba(0,0,0,1)");
        g.fillStyle = sides;
        g.fillRect(0, 0, w, h);
      },
      { clamp: true },
    );
    const bandMaterial = new ShaderMaterial({
      uniforms: { uMap: { value: band }, uOpacity: { value: 1.1 } },
      vertexShader: beamVertex,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() { gl_FragColor = vec4(texture2D(uMap, vUv).rgb * uOpacity, 1.0); }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    });
    const bandGeometry = new PlaneGeometry(3.4, 0.8);
    return { rod, prismGeo, white, colours, band, bandMaterial, bandGeometry };
  }, []);

  useEffect(
    () => () => {
      resources.rod.dispose();
      resources.prismGeo.dispose();
      resources.white.dispose();
      resources.colours.forEach((material) => material.dispose());
      resources.band.dispose();
      resources.bandMaterial.dispose();
      resources.bandGeometry.dispose();
    },
    [resources],
  );

  const temp = useMemo(() => ({ end: new Vector3() }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const mo = motion.current;
    const pointer = rig.reducedMotion ? 0 : rig.pointerX;
    mo.turn = damp(mo.turn, (mo.hover ? 0.22 : 0) + pointer * 0.12, 3, dt);
    const time = rig.reducedMotion ? 0 : state.clock.elapsedTime;
    if (prism.current) prism.current.rotation.y = FACING + mo.turn * 0.6 + Math.sin(time * 0.25) * 0.02;

    // Beams only exist while the visitor is in this gallery.
    const presence = 1 - MathUtils.smoothstep(Math.abs(focus.z - Z.about), 5, 13);
    resources.white.uniforms.uOpacity.value = 1.5 * presence;
    resources.colours.forEach((material) => {
      material.uniforms.uOpacity.value = 1.05 * presence;
    });
    resources.bandMaterial.uniforms.uOpacity.value = 1.15 * presence;

    if (incoming.current) {
      placeBetween(incoming.current, BEAM_START, ORIGIN);
      incoming.current.scale.x = incoming.current.scale.z = 0.022;
    }
    const swing = mo.turn * 3.2;
    rays.current.forEach((ray, index) => {
      if (!ray) return;
      const spread = (index - (SPECTRUM.length - 1) / 2) * 0.27;
      temp.end.set(WALL_X, 1.62 - spread * 0.32, Z.about - 3.6 + spread + swing);
      placeBetween(ray, ORIGIN, temp.end);
      ray.scale.x = ray.scale.z = 0.016;
    });
    if (spectrum.current) spectrum.current.position.z = Z.about - 3.6 + swing;
  });

  return (
    <Station z={Z.about} reach={quality.drawDistance}>
      <Plinth size={[0.78, PRISM_HEIGHT, 0.78]} position={[ORIGIN.x, 0, Z.about]} material={m.travertine}>
        <mesh
          ref={prism}
          geometry={resources.prismGeo}
          material={m.prismGlass}
          rotation-y={FACING}
          castShadow
          onPointerOver={(event) => {
            event.stopPropagation();
            motion.current.hover = true;
            document.body.style.cursor = "grab";
          }}
          onPointerOut={() => {
            motion.current.hover = false;
            document.body.style.cursor = "";
          }}
        />
        <Label size={0.03} position={[0, -0.13, 0.395]}>
          EXHIBIT 01
        </Label>
        <Label size={0.026} position={[0, -0.185, 0.395]}>
          {`${about.prism.input} IN, CURIOSITY OUT`}
        </Label>
      </Plinth>

      <mesh ref={incoming} geometry={resources.rod} material={resources.white} renderOrder={4} />
      <group position={BEAM_START.clone().lerp(ORIGIN, 0.3).add(new Vector3(0, 0.2, 0))} rotation-y={FACING}>
        <Label size={0.1} color="#3a2f26" letterSpacing={0.3}>
          {about.prism.input}
        </Label>
      </group>
      {resources.colours.map((material, index) => (
        <mesh
          key={SPECTRUM[index]}
          ref={(mesh) => {
            rays.current[index] = mesh;
          }}
          geometry={resources.rod}
          material={material}
          renderOrder={4}
        />
      ))}

      <group ref={spectrum} position={[WALL_X, 1.55, Z.about - 3.6]} rotation-y={-Math.PI / 2}>
        <mesh geometry={resources.bandGeometry} material={resources.bandMaterial} renderOrder={4} />
        {about.prism.outputs.map((label, index) => (
          <Label
            key={label}
            size={0.085}
            position={[(index - 1) * 1.13, -0.62, 0.01]}
            color="#3a2f26"
            letterSpacing={0.12}
            maxWidth={1}
            anchorY="top"
          >
            {label}
          </Label>
        ))}
      </group>
    </Station>
  );
}
