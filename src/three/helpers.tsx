import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
  type Material,
} from "three";

export interface BoxSpec {
  /** Centre position. */
  p: [number, number, number];
  /** Size. */
  s: [number, number, number];
  /** Optional rotation around Y in radians. */
  r?: number;
}

/** One draw call for many boxes that share a material. */
export function InstancedBoxes({
  boxes,
  material,
  castShadow = false,
  receiveShadow = false,
}: {
  boxes: readonly BoxSpec[];
  material: Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const mesh = useMemo(() => {
    const geometry = new BoxGeometry(1, 1, 1);
    const instanced = new InstancedMesh(geometry, material, boxes.length);
    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const up = new Vector3(0, 1, 0);
    boxes.forEach((box, index) => {
      quaternion.setFromAxisAngle(up, box.r ?? 0);
      matrix.compose(new Vector3(...box.p), quaternion, new Vector3(...box.s));
      instanced.setMatrixAt(index, matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    instanced.castShadow = castShadow;
    instanced.receiveShadow = receiveShadow;
    return instanced;
  }, [boxes, material, castShadow, receiveShadow]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      mesh.dispose();
    },
    [mesh],
  );

  return <primitive object={mesh} />;
}

export const easeInOut = (t: number) => t * t * (3 - 2 * t);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
