import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  type Texture,
} from "three";
import { hero, interests, knownIssues } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { InstancedBoxes, type BoxSpec } from "../helpers";
import { GROUND, SCREEN_GAP, STANDS } from "../layout";
import type { QualitySettings } from "../quality";
import { crowdTexture, ribbonTexture, terraceTexture } from "../stadiumTextures";
import { seeded } from "../textures";
import { ellipseBand, ringLength } from "./geometry";
import { lights } from "./lightState";

const TAU = Math.PI * 2;
const GREY = new Color("#6b7080");
const GAP_START = SCREEN_GAP.centre + SCREEN_GAP.half;
const GAP_LENGTH = TAU - SCREEN_GAP.half * 2;

/** Shirt colours, weighted towards the home side's blue. */
const SHIRTS: [string, number][] = [
  ["#1d5bd6", 0.3],
  ["#3f8cff", 0.12],
  ["#ff7a1a", 0.1],
  ["#eef1f6", 0.14],
  ["#ffd23f", 0.08],
  ["#d63a2f", 0.07],
  ["#262b36", 0.12],
  ["#2fa35a", 0.07],
];

function pickShirt(value: number) {
  let total = 0;
  for (const [colour, weight] of SHIRTS) {
    total += weight;
    if (value <= total) return colour;
  }
  return SHIRTS[0][0];
}

interface Seat {
  x: number;
  y: number;
  z: number;
  theta: number;
}

/** Seats on one tier: rows up the rake, seats around the ring, with aisles every twenty. */
function tierSeats(
  from: readonly number[],
  to: readonly number[],
  thetaStart: number,
  thetaLength: number,
  rowSpacing: number,
  seatSpacing: number,
): Seat[] {
  const seats: Seat[] = [];
  const slope = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const rows = Math.floor(slope / rowSpacing);
  for (let r = 0; r < rows; r += 1) {
    const t = (r + 0.5) / rows;
    const d = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    const count = Math.floor(ringLength(d, thetaLength, 256) / seatSpacing);
    for (let k = 0; k < count; k += 1) {
      if (k % 22 >= 20) continue; // aisle
      const theta = thetaStart + (thetaLength * (k + 0.5)) / count;
      seats.push({ x: (GROUND.bx + d) * Math.cos(theta), y, z: (GROUND.bz + d) * Math.sin(theta), theta });
    }
  }
  return seats;
}

function useCrowd(quality: QualitySettings, map: Texture) {
  return useMemo(() => {
    const rand = seeded(2024);
    const sparse = quality.tier === "low";
    const { seat: seatSpacing, row: rowSpacing, occupancy, scale: personScale } = quality.crowd;
    const seats = [
      ...tierSeats(STANDS.lower.from, STANDS.lower.to, 0, TAU, rowSpacing, seatSpacing),
      ...tierSeats(STANDS.upper.from, STANDS.upper.to, GAP_START, GAP_LENGTH, rowSpacing, seatSpacing),
    ].filter(() => rand() < occupancy);

    // Fewer people on lighter tiers, each drawn a little larger so the stands still look full.
    const width = 0.56 * personScale;
    const height = 0.72 * Math.min(personScale, 1.5);
    const geometry = new PlaneGeometry(width, height);
    geometry.translate(0, height / 2 - 0.12, 0);
    const material = new MeshLambertMaterial({ map, alphaTest: 0.5, side: DoubleSide });
    const uniforms = { uTime: { value: 0 }, uWave: { value: 0 }, uWaveAmp: { value: 0 }, uSelf: { value: 0.3 } };
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           attribute float aVariant;
           uniform float uTime;
           uniform float uWave;
           uniform float uWaveAmp;`,
        )
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
           #ifdef USE_MAP
             vMapUv.x = (vMapUv.x + aVariant) * 0.25;
           #endif`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec3 seat = instanceMatrix[3].xyz;
           float seed = fract(sin(dot(seat.xz, vec2(12.9898, 78.233))) * 43758.5453);
           float fidget = step(0.82, seed) * max(0.0, sin(uTime * (2.5 + seed * 3.0) + seed * 40.0));
           transformed.y += fidget * 0.12;
           float angle = atan(seat.z / ${GROUND.bz.toFixed(1)}, seat.x / ${GROUND.bx.toFixed(1)});
           float gap = mod(angle - uWave + 3.14159265, 6.2831853) - 3.14159265;
           transformed.y += uWaveAmp * exp(-gap * gap * 60.0) * 0.75;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uSelf;")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uSelf;");
    };

    const mesh = new InstancedMesh(geometry, material, seats.length);
    const dummy = new Object3D();
    const colour = new Color();
    const variants = new Float32Array(seats.length);
    seats.forEach((seat, index) => {
      dummy.position.set(seat.x, seat.y, seat.z);
      dummy.rotation.set(0, Math.atan2(-seat.x, -seat.z), 0);
      const scale = 0.9 + rand() * 0.2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      // Darker and less saturated further up and further back, as the light falls off.
      const height = seat.y / STANDS.upper.to[1];
      colour.set(pickShirt(rand())).lerp(GREY, 0.3).multiplyScalar((0.32 + rand() * 0.3) * (1 - height * 0.5));
      mesh.setColorAt(index, colour);
      variants[index] = Math.floor(rand() * 4);
    });
    geometry.setAttribute("aVariant", new InstancedBufferAttribute(variants, 1));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.frustumCulled = false;

    // Phone torches: a scatter of tiny, twinkling lights among the crowd.
    const torchCount = Math.min(seats.length, sparse ? 500 : 1800);
    const torchPositions = new Float32Array(torchCount * 3);
    const torchSeeds = new Float32Array(torchCount);
    for (let i = 0; i < torchCount; i += 1) {
      const seat = seats[Math.floor(rand() * seats.length)];
      torchPositions.set([seat.x * 0.996, seat.y + 0.9, seat.z * 0.996], i * 3);
      torchSeeds[i] = rand();
    }
    const torchGeometry = new BufferGeometry();
    torchGeometry.setAttribute("position", new BufferAttribute(torchPositions, 3));
    torchGeometry.setAttribute("seed", new BufferAttribute(torchSeeds, 1));
    const torchMaterial = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAmount: { value: 0.4 }, uScale: { value: 300 } },
      vertexShader: /* glsl */ `
        attribute float seed;
        uniform float uTime;
        uniform float uAmount;
        uniform float uScale;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float on = step(1.0 - uAmount, seed);
          float flicker = 0.6 + 0.4 * sin(uTime * (3.0 + seed * 9.0) + seed * 50.0);
          vAlpha = on * flicker;
          gl_PointSize = clamp(uScale * 0.5 / -mv.z, 1.0, 9.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.6, 1.6, 1.8) * vAlpha * a, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const torches = new Points(torchGeometry, torchMaterial);
    torches.frustumCulled = false;

    return { mesh, geometry, material, uniforms, torches, torchGeometry, torchMaterial };
  }, [quality.tier, quality.crowd, map]);
}

export function Stands({ quality }: { quality: QualitySettings }) {
  const textures = useMemo(() => {
    const terrace = terraceTexture();
    const people = crowdTexture();
    const fascia = ribbonTexture(
      [
        "ASHWIN.TOP",
        ...hero.ticker,
        "BUILD FIRST. OVERTHINK IMMEDIATELY AFTER.",
        interests.items[1].note ?? "",
        `KNOWN ISSUE: ${knownIssues.items[0].title.toUpperCase()}`,
      ].filter(Boolean).map((message) => message.toUpperCase()),
      128,
    );
    return { terrace, people, fascia };
  }, []);
  useEffect(
    () => () => {
      Object.values(textures).forEach((texture) => texture.dispose());
    },
    [textures],
  );

  const surfaces = useMemo(() => {
    const terraceMap = textures.terrace;
    const seats = new MeshStandardMaterial({ map: terraceMap, color: "#8a90a0", roughness: 0.85, side: DoubleSide });
    const concrete = new MeshStandardMaterial({ color: "#2b303b", roughness: 0.9, side: DoubleSide });
    const roof = new MeshStandardMaterial({ color: "#161a22", roughness: 0.55, metalness: 0.6, side: DoubleSide });
    const ledRing = new MeshBasicMaterial({ color: new Color(5.5, 5.6, 6.2), side: DoubleSide, fog: false });
    const fasciaLength = ringLength(STANDS.ribbon.from[0]);
    textures.fascia.repeat.set(fasciaLength / (((textures.fascia.image as HTMLCanvasElement).width / 128) * 1.8), 1);
    const fascia = new MeshBasicMaterial({ map: textures.fascia, color: new Color(1.6, 1.6, 1.6), side: DoubleSide, toneMapped: true });

    const lower = ellipseBand({ from: STANDS.lower.from, to: STANDS.lower.to, tileU: 19.2, tileV: 2.1 });
    const fasciaWall = ellipseBand({ from: STANDS.fascia.from, to: STANDS.fascia.to });
    const fasciaBand = ellipseBand({ from: STANDS.ribbon.from, to: STANDS.ribbon.to, tileU: 1 });
    // Give the fascia ribbon its own continuous uv so the messages wrap around the whole ground.
    const fasciaUv = fasciaBand.attributes.uv as BufferAttribute;
    for (let i = 0; i < fasciaUv.count; i += 1) fasciaUv.setX(i, fasciaUv.getX(i) / fasciaLength);
    const upper = ellipseBand({
      from: STANDS.upper.from,
      to: STANDS.upper.to,
      thetaStart: GAP_START,
      thetaLength: GAP_LENGTH,
      tileU: 19.2,
      tileV: 2.1,
    });
    const back = ellipseBand({ from: STANDS.back.from, to: STANDS.back.to, thetaStart: GAP_START, thetaLength: GAP_LENGTH });
    const behindLower = ellipseBand({ from: STANDS.lower.to, to: [STANDS.lower.to[0] + 6, STANDS.lower.to[1]], thetaStart: SCREEN_GAP.centre - SCREEN_GAP.half, thetaLength: SCREEN_GAP.half * 2, segments: 32 });
    const roofBand = ellipseBand({
      from: STANDS.roof.inner,
      to: STANDS.roof.outer,
      thetaStart: GAP_START,
      thetaLength: GAP_LENGTH,
    });
    const roofEdge = ellipseBand({
      from: [STANDS.roof.inner[0], STANDS.roof.inner[1] - 1.1],
      to: [STANDS.roof.inner[0], STANDS.roof.inner[1]],
      thetaStart: GAP_START,
      thetaLength: GAP_LENGTH,
    });
    const roofLight = ellipseBand({
      from: [STANDS.roof.inner[0] + 0.4, STANDS.roof.inner[1] - 1.15],
      to: [STANDS.roof.inner[0] + 3.2, STANDS.roof.inner[1] - 0.8],
      thetaStart: GAP_START + 0.02,
      thetaLength: GAP_LENGTH - 0.04,
    });
    // Supporting columns behind the upper tier, holding up the roof.
    const columns: BoxSpec[] = [];
    for (let k = 0; k < 40; k += 1) {
      const theta = GAP_START + (GAP_LENGTH * (k + 0.5)) / 40;
      const d = STANDS.back.from[0] + 1.5;
      columns.push({
        p: [(GROUND.bx + d) * Math.cos(theta), STANDS.roof.outer[1] / 2, (GROUND.bz + d) * Math.sin(theta)],
        s: [0.9, STANDS.roof.outer[1], 0.9],
      });
    }
    return { seats, concrete, roof, ledRing, fascia, lower, fasciaWall, fasciaBand, upper, back, behindLower, roofBand, roofEdge, roofLight, columns };
  }, [textures]);
  useEffect(
    () => () => {
      Object.values(surfaces).forEach((value) => (value as { dispose?: () => void }).dispose?.());
    },
    [surfaces],
  );

  const crowd = useCrowd(quality, textures.people);
  useEffect(
    () => () => {
      crowd.geometry.dispose();
      crowd.material.dispose();
      crowd.mesh.dispose();
      crowd.torchGeometry.dispose();
      crowd.torchMaterial.dispose();
    },
    [crowd],
  );

  const wave = useMemo(() => ({ start: -100, lastAlarm: 0 }), []);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    crowd.uniforms.uTime.value = rig.reducedMotion ? 0 : t;
    crowd.uniforms.uSelf.value = 0.03 + 0.11 * lights.level + lights.show * 0.4;
    // A Mexican wave goes round the ground when the visitor presses DO NOT CLICK.
    const alarm = ui.get().alarmAt;
    if (alarm !== wave.lastAlarm) {
      wave.lastAlarm = alarm;
      wave.start = t;
    }
    const elapsed = t - wave.start;
    const running = !rig.reducedMotion && elapsed >= 0 && elapsed < 7;
    crowd.uniforms.uWave.value = running ? -Math.PI / 2 + elapsed * 1.15 : 0;
    crowd.uniforms.uWaveAmp.value = running ? Math.sin(Math.min(1, elapsed / 0.5) * Math.PI * 0.5) * (1 - Math.max(0, elapsed - 6)) : 0;
    const active = ui.get().activeStation;
    const torchTarget = active === "home" || active === "contact" ? 0.85 : 0.25;
    const torch = crowd.torchMaterial.uniforms;
    torch.uTime.value = t;
    torch.uAmount.value += (torchTarget * lights.level - torch.uAmount.value) * Math.min(1, delta * 1.5);
    torch.uScale.value = state.size.height;
    if (!rig.reducedMotion) textures.fascia.offset.x = (textures.fascia.offset.x + delta * 0.006) % 1;
  });

  return (
    <group>
      <mesh geometry={surfaces.lower} material={surfaces.seats} receiveShadow />
      <mesh geometry={surfaces.fasciaWall} material={surfaces.concrete} />
      <mesh geometry={surfaces.fasciaBand} material={surfaces.fascia} />
      <mesh geometry={surfaces.upper} material={surfaces.seats} />
      <mesh geometry={surfaces.back} material={surfaces.concrete} />
      <mesh geometry={surfaces.behindLower} material={surfaces.concrete} />
      <mesh geometry={surfaces.roofBand} material={surfaces.roof} />
      <mesh geometry={surfaces.roofEdge} material={surfaces.roof} />
      <mesh geometry={surfaces.roofLight} material={surfaces.ledRing} />
      <InstancedBoxes boxes={surfaces.columns} material={surfaces.roof} />
      <primitive object={crowd.mesh} />
      <primitive object={crowd.torches} />
    </group>
  );
}
