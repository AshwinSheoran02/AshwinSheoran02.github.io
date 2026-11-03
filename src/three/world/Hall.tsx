import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { CircleGeometry, PlaneGeometry, type BufferGeometry, type Texture } from "three";
import { HALL, Z_END } from "../layout";
import { useMaterials, VISTA_HORIZON } from "../materials";
import type { QualitySettings } from "../quality";
import { InstancedBoxes, type BoxSpec } from "../helpers";
import { floorColorTexture, floorRoughnessTexture } from "../textures";

const LENGTH = HALL.zStart - Z_END;
const Z_MID = (HALL.zStart + Z_END) / 2;

/*
 * The painted garden behind the exit. Its horizon is placed at the eye height of the
 * closing camera (about 2.4 m), so the view through the door reads as level ground.
 */
const VISTA = (() => {
  const size = 9;
  const eye = 2.4;
  const top = eye + VISTA_HORIZON * size;
  const centreY = top - size / 2;
  const sun: [number, number] = [(0.54 - 0.5) * size, top - (VISTA_HORIZON - 0.085) * size];
  return { size, centreY, sun, z: Z_END - 4 };
})();

function scaledPlane(width: number, height: number, tile: number): PlaneGeometry {
  const geometry = new PlaneGeometry(width, height);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) * width) / tile, (uv.getY(i) * height) / tile);
  }
  uv.needsUpdate = true;
  return geometry;
}

function useGeometry<T extends BufferGeometry>(factory: () => T): T {
  const [geometry] = useState(factory);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** Window bay centres along the left wall. */
export const windowCentres: readonly number[] = (() => {
  const centres: number[] = [];
  for (let z = HALL.zStart - HALL.bay / 2; z - HALL.windowWidth / 2 > Z_END + 1.5; z -= HALL.bay) {
    centres.push(z);
  }
  return centres;
})();

function leftWallBoxes() {
  const plaster: BoxSpec[] = [];
  const bronze: BoxSpec[] = [];
  const x = -HALL.halfWidth - 0.3;
  const half = HALL.windowWidth / 2;
  let previousEdge = HALL.zStart;
  for (const zc of windowCentres) {
    const pierStart = previousEdge;
    const pierEnd = zc + half;
    plaster.push({
      p: [x, HALL.height / 2, (pierStart + pierEnd) / 2],
      s: [0.6, HALL.height, pierStart - pierEnd],
    });
    plaster.push({ p: [x, HALL.windowBottom / 2, zc], s: [0.6, HALL.windowBottom, HALL.windowWidth] });
    const lintel = HALL.height - HALL.windowTop;
    plaster.push({ p: [x, HALL.windowTop + lintel / 2, zc], s: [0.6, lintel, HALL.windowWidth] });
    const frameX = -HALL.halfWidth - 0.22;
    const span = HALL.windowTop - HALL.windowBottom;
    const yMid = (HALL.windowTop + HALL.windowBottom) / 2;
    for (const offset of [-half + 0.045, -half / 3, half / 3, half - 0.045]) {
      bronze.push({ p: [frameX, yMid, zc + offset], s: [0.14, span, 0.07] });
    }
    for (const y of [HALL.windowBottom + 0.04, 4.95, HALL.windowTop - 0.04]) {
      bronze.push({ p: [frameX, y, zc], s: [0.14, 0.07, HALL.windowWidth] });
    }
    // Deep sill that catches the sun.
    plaster.push({ p: [-HALL.halfWidth + 0.05, HALL.windowBottom - 0.03, zc], s: [0.3, 0.06, HALL.windowWidth + 0.2] });
    previousEdge = zc - half;
  }
  plaster.push({
    p: [x, HALL.height / 2, (previousEdge + Z_END) / 2],
    s: [0.6, HALL.height, previousEdge - Z_END],
  });
  return { plaster, bronze };
}

function rightWallBoxes(): BoxSpec[] {
  const boxes: BoxSpec[] = [];
  for (let z = HALL.zStart - HALL.bay; z > Z_END + 1; z -= HALL.bay) {
    boxes.push({ p: [HALL.halfWidth - 0.12, HALL.height / 2, z], s: [0.24, HALL.height, 0.8] });
  }
  return boxes;
}

function ceilingBoxes() {
  const beams: BoxSpec[] = [];
  const skylights: BoxSpec[] = [];
  for (let z = HALL.zStart - HALL.bay; z > Z_END; z -= HALL.bay) {
    beams.push({ p: [0, HALL.height - 0.24, z], s: [HALL.halfWidth * 2, 0.48, 0.56] });
  }
  for (let z = HALL.zStart - HALL.bay / 2; z > Z_END + 2; z -= HALL.bay) {
    skylights.push({ p: [0, HALL.height - 0.02, z], s: [2.6, 0.02, HALL.bay - 0.62] });
  }
  return { beams, skylights };
}

function endWallBoxes(): BoxSpec[] {
  const doorHalf = 1.9;
  const doorHeight = 5.6;
  const z = Z_END - 0.3;
  const side = HALL.halfWidth - doorHalf;
  return [
    { p: [-(doorHalf + side / 2), HALL.height / 2, z], s: [side, HALL.height, 0.6] },
    { p: [doorHalf + side / 2, HALL.height / 2, z], s: [side, HALL.height, 0.6] },
    { p: [0, doorHeight + (HALL.height - doorHeight) / 2, z], s: [doorHalf * 2, HALL.height - doorHeight, 0.6] },
  ];
}

function Floor({ quality }: { quality: QualitySettings }) {
  const geometry = useGeometry(() => scaledPlane(HALL.halfWidth * 2, LENGTH, 5));
  const { color, roughness } = useMemo(() => {
    const s = quality.textureScale;
    return { color: floorColorTexture(s), roughness: floorRoughnessTexture(s) };
  }, [quality.textureScale]);
  useEffect(
    () => () => {
      color.dispose();
      roughness.dispose();
    },
    [color, roughness],
  );

  return (
    <mesh
      geometry={geometry}
      rotation-x={-Math.PI / 2}
      position={[0, 0, Z_MID]}
      receiveShadow
    >
      {quality.reflector ? (
        <MeshReflectorMaterial
          resolution={quality.reflector.resolution}
          blur={quality.reflector.blur}
          mixBlur={1}
          mixStrength={1.6}
          mixContrast={1}
          mirror={0}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.3}
          depthToBlurRatioBias={0.25}
          map={color as Texture}
          roughnessMap={roughness as Texture}
          roughness={0.9}
          metalness={0.15}
          color="#a99f93"
          envMapIntensity={0.5}
        />
      ) : (
        <meshPhysicalMaterial
          map={color}
          roughnessMap={roughness}
          roughness={0.55}
          metalness={0.05}
          color="#a99f93"
          clearcoat={0.6}
          clearcoatRoughness={0.18}
          envMapIntensity={0.8}
        />
      )}
    </mesh>
  );
}

export function Hall({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const left = useMemo(() => leftWallBoxes(), []);
  const pilasters = useMemo(() => rightWallBoxes(), []);
  const ceiling = useMemo(() => ceilingBoxes(), []);
  const endWall = useMemo(() => endWallBoxes(), []);
  const rightWall = useGeometry(() => scaledPlane(LENGTH, HALL.height, 4));
  const ceilingPlane = useGeometry(() => scaledPlane(HALL.halfWidth * 2, LENGTH, 4));
  const entrance = useGeometry(() => scaledPlane(HALL.halfWidth * 2, HALL.height, 4));
  const sky = useGeometry(() => new PlaneGeometry(LENGTH + 40, 16));
  const daylight = useGeometry(() => new PlaneGeometry(40, 20));
  const vista = useGeometry(() => new PlaneGeometry(VISTA.size, VISTA.size));
  const sunDisc = useGeometry(() => new CircleGeometry(0.11, 40));
  const baseboards = useMemo<BoxSpec[]>(
    () => [
      { p: [HALL.halfWidth - 0.03, 0.07, Z_MID], s: [0.06, 0.14, LENGTH] },
      { p: [-HALL.halfWidth + 0.03, 0.07, Z_MID], s: [0.06, 0.14, LENGTH] },
    ],
    [],
  );

  return (
    <group>
      <Floor quality={quality} />

      <InstancedBoxes boxes={left.plaster} material={m.plaster} castShadow receiveShadow />
      <InstancedBoxes boxes={left.bronze} material={m.bronze} castShadow />
      <InstancedBoxes boxes={pilasters} material={m.plaster} castShadow receiveShadow />
      <InstancedBoxes boxes={endWall} material={m.plaster} receiveShadow />
      <InstancedBoxes boxes={ceiling.beams} material={m.timber} />
      <InstancedBoxes boxes={ceiling.skylights} material={m.skylight} />
      <InstancedBoxes boxes={baseboards} material={m.ink} />

      <mesh
        geometry={rightWall}
        material={m.plaster}
        position={[HALL.halfWidth, HALL.height / 2, Z_MID]}
        rotation-y={-Math.PI / 2}
        receiveShadow
      />
      <mesh
        geometry={ceilingPlane}
        material={m.ceiling}
        position={[0, HALL.height, Z_MID]}
        rotation-x={Math.PI / 2}
      />
      <mesh
        geometry={entrance}
        material={m.plaster}
        position={[0, HALL.height / 2, HALL.zStart]}
        rotation-y={Math.PI}
        receiveShadow
      />
      <mesh
        geometry={sky}
        material={m.sky}
        position={[-HALL.halfWidth - 5, 5, Z_MID]}
        rotation-y={Math.PI / 2}
      />
      <mesh geometry={daylight} material={m.daylight} position={[0, 6, Z_END - 6]} />
      {/* The garden beyond the exit, with the sun low over it. */}
      <mesh geometry={vista} material={m.vista} position={[0, VISTA.centreY, VISTA.z]} />
      <mesh geometry={sunDisc} material={m.sunDisc} position={[VISTA.sun[0], VISTA.sun[1], VISTA.z + 0.01]} />
    </group>
  );
}
