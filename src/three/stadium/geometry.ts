import { BufferAttribute, BufferGeometry } from "three";
import { GROUND } from "../layout";

/*
 * Surfaces of the bowl. Every ring follows the boundary ellipse pushed outwards
 * by a distance, so stands, walls and boards stay parallel to the rope.
 */

export interface BandOptions {
  /** [distance beyond the rope, height] at the inner edge. */
  from: readonly [number, number] | readonly number[];
  /** [distance beyond the rope, height] at the outer edge. */
  to: readonly [number, number] | readonly number[];
  thetaStart?: number;
  thetaLength?: number;
  segments?: number;
  /** Metres of arc per texture repeat along the ring. */
  tileU?: number;
  /** Texture repeats across the band. */
  tileV?: number;
  /** Flip the facing (normals point the other way). */
  flip?: boolean;
}

export function ellipseBand({
  from,
  to,
  thetaStart = 0,
  thetaLength = Math.PI * 2,
  segments = 256,
  tileU = 10,
  tileV = 1,
  flip = false,
}: BandOptions): BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let arc = 0;
  let previous: [number, number] | null = null;
  const midD = (from[0] + to[0]) / 2;
  for (let i = 0; i <= segments; i += 1) {
    const theta = thetaStart + (thetaLength * i) / segments;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const mid: [number, number] = [(GROUND.bx + midD) * c, (GROUND.bz + midD) * s];
    if (previous) arc += Math.hypot(mid[0] - previous[0], mid[1] - previous[1]);
    previous = mid;
    positions.push((GROUND.bx + from[0]) * c, from[1], (GROUND.bz + from[0]) * s);
    positions.push((GROUND.bx + to[0]) * c, to[1], (GROUND.bz + to[0]) * s);
    uvs.push(arc / tileU, 0, arc / tileU, tileV);
  }
  for (let i = 0; i < segments; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    if (flip) indices.push(a, c, b, b, c, d);
    else indices.push(a, b, c, b, d, c);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Arc length of the ellipse ring at a given offset, used to size repeating textures. */
export function ringLength(offset: number, thetaLength = Math.PI * 2, steps = 512): number {
  let length = 0;
  let px = GROUND.bx + offset;
  let pz = 0;
  for (let i = 1; i <= steps; i += 1) {
    const theta = (thetaLength * i) / steps;
    const x = (GROUND.bx + offset) * Math.cos(theta);
    const z = (GROUND.bz + offset) * Math.sin(theta);
    length += Math.hypot(x - px, z - pz);
    px = x;
    pz = z;
  }
  return length;
}

/** Angle on the boundary ellipse for a world point. */
export function ellipseAngle(x: number, z: number): number {
  return Math.atan2(z / GROUND.bz, x / GROUND.bx);
}
