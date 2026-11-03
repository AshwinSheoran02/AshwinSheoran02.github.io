import { useEffect, useMemo } from "react";
import {
  BufferAttribute,
  CatmullRomCurve3,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { GROUND, PITCH } from "../layout";
import type { QualitySettings } from "../quality";
import { FIELD_EXTENT, grassDetailTexture, outfieldTexture, pitchTexture } from "../stadiumTextures";
import { noiseTexture, paintTexture } from "../textures";
import { ellipseBand, ringLength } from "./geometry";

/* The playing surface: outfield, square and pitch, the boundary rope and the perimeter wall. */
export function Ground({ quality }: { quality: QualitySettings }) {
  const resources = useMemo(() => {
    const field = outfieldTexture(quality.textureScale);
    const detail = grassDetailTexture();
    // A standard material: the grass covers most of the screen, so it has to be cheap.
    const grass = new MeshStandardMaterial({
      map: field,
      roughness: 0.88,
      bumpMap: detail,
      bumpScale: 1.1,
      envMapIntensity: 0.4,
    });
    const fieldGeometry = new PlaneGeometry(FIELD_EXTENT * 2, FIELD_EXTENT * 2, 1, 1);

    const strip = pitchTexture();
    const pitchBump = noiseTexture(41, 256);
    pitchBump.repeat.set(4, 26);
    const pitch = new MeshStandardMaterial({ map: strip, roughness: 0.82, bumpMap: pitchBump, bumpScale: 0.6, envMapIntensity: 0.4 });
    const pitchGeometry = new PlaneGeometry(3.6, PITCH.length + 2);

    // Boundary rope: a padded cushion in two colours, laid along the ellipse.
    const ropePoints: Vector3[] = [];
    for (let i = 0; i < 360; i += 1) {
      const theta = (i / 360) * Math.PI * 2;
      ropePoints.push(new Vector3(GROUND.bx * Math.cos(theta), 0.09, GROUND.bz * Math.sin(theta)));
    }
    const ropeGeometry = new TubeGeometry(new CatmullRomCurve3(ropePoints, true), 720, 0.11, 10, true);
    ropeGeometry.scale(1, 0.75, 1);
    const ropeLength = ringLength(0);
    const ropeUv = ropeGeometry.attributes.uv as BufferAttribute;
    for (let i = 0; i < ropeUv.count; i += 1) ropeUv.setX(i, (ropeUv.getX(i) * ropeLength) / 4);
    const ropeMap = paintTexture(
      128,
      16,
      (g, w, h) => {
        g.fillStyle = "#ffd400";
        g.fillRect(0, 0, w / 2, h);
        g.fillStyle = "#1238a8";
        g.fillRect(w / 2, 0, w / 2, h);
      },
      { repeat: [1, 1] },
    );
    const rope = new MeshPhysicalMaterial({ map: ropeMap, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4 });

    // Perimeter wall: painted concrete with a blue band.
    const wallMap = paintTexture(
      256,
      64,
      (g, w, h) => {
        g.fillStyle = "#11203f";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#1b3570";
        g.fillRect(0, h * 0.15, w, h * 0.5);
        g.fillStyle = "rgba(255,255,255,0.05)";
        for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 1, h);
      },
      { repeat: [1, 1] },
    );
    const wall = new MeshStandardMaterial({ map: wallMap, roughness: 0.75, side: DoubleSide });
    const wallGeometry = ellipseBand({ from: [GROUND.wall, 0], to: [GROUND.wall, 1.4], tileU: 6 });
    const apron = new MeshStandardMaterial({ color: "#1b3a1a", roughness: 0.95, side: DoubleSide });
    const apronGeometry = ellipseBand({ from: [GROUND.wall, 1.4], to: [GROUND.wall + 1.2, 1.4], tileU: 6 });

    return { field, detail, grass, fieldGeometry, strip, pitchBump, pitch, pitchGeometry, ropeGeometry, ropeMap, rope, wallMap, wall, wallGeometry, apron, apronGeometry };
  }, [quality.textureScale]);

  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => (value as { dispose?: () => void }).dispose?.());
    },
    [resources],
  );

  return (
    <group>
      <mesh geometry={resources.fieldGeometry} material={resources.grass} rotation-x={-Math.PI / 2} receiveShadow />
      <mesh geometry={resources.pitchGeometry} material={resources.pitch} rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow />
      <mesh geometry={resources.ropeGeometry} material={resources.rope} castShadow receiveShadow />
      <mesh geometry={resources.wallGeometry} material={resources.wall} receiveShadow />
      <mesh geometry={resources.apronGeometry} material={resources.apron} />
      <Sightscreens />
    </group>
  );
}

/* Black sightscreens at both ends, behind the bowler's arm. */
function Sightscreens() {
  const material = useMemo(() => new MeshStandardMaterial({ color: "#07080b", roughness: 0.6 }), []);
  const frame = useMemo(() => new MeshStandardMaterial({ color: "#2a2e36", metalness: 0.7, roughness: 0.4 }), []);
  useEffect(
    () => () => {
      material.dispose();
      frame.dispose();
    },
    [material, frame],
  );
  return (
    <>
      {[1].map((end) => (
        <group key={end} position={[0, 0, end * (GROUND.bz + 4.9)]}>
          <mesh material={material} position={[0, 4.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[20, 7.6, 0.3]} />
          </mesh>
          {[-9, -3, 3, 9].map((x) => (
            <mesh key={x} material={frame} position={[x, 0.4, end * 0.4]}>
              <boxGeometry args={[0.25, 0.8, 0.9]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
