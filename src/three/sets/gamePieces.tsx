import { useEffect, useMemo } from "react";
import {
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  SphereGeometry,
  Vector2,
  Vector3,
  type Material,
} from "three";
import { RoundedBox } from "@react-three/drei";

/* Dice and pawns, shared by the board-game exhibit and the gaming fielder. */
export const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
export function Die({ size, body, pip }: { size: number; body: Material; pip: Material }) {
  const pips = useMemo(() => {
    const geometry = new SphereGeometry(size * 0.085, 12, 8);
    const faces: [Vector3, Vector3, Vector3, number][] = [
      [new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(0, 1, 0), 1],
      [new Vector3(0, 0, -1), new Vector3(-1, 0, 0), new Vector3(0, 1, 0), 6],
      [new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 2],
      [new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 0), 5],
      [new Vector3(0, 1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1), 3],
      [new Vector3(0, -1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1), 4],
    ];
    const total = faces.reduce((sum, face) => sum + PIPS[face[3]].length, 0);
    const mesh = new InstancedMesh(geometry, pip, total);
    const matrix = new Matrix4();
    let index = 0;
    for (const [normal, u, v, value] of faces) {
      for (const [a, b] of PIPS[value]) {
        const position = normal
          .clone()
          .multiplyScalar(size / 2 - size * 0.035)
          .addScaledVector(u, a * size * 0.25)
          .addScaledVector(v, b * size * 0.25);
        matrix.makeScale(1, 1, 1).setPosition(position);
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [size, pip]);
  useEffect(
    () => () => {
      pips.geometry.dispose();
      pips.dispose();
    },
    [pips],
  );
  return (
    <group>
      <RoundedBox args={[size, size, size]} radius={size * 0.16} smoothness={4} material={body} castShadow receiveShadow />
      <primitive object={pips} />
    </group>
  );
}

export function pawnGeometry(height: number) {
  const points = [
    [0, 0],
    [0.42, 0],
    [0.44, 0.06],
    [0.36, 0.12],
    [0.22, 0.22],
    [0.16, 0.5],
    [0.24, 0.56],
    [0.16, 0.6],
    [0.2, 0.72],
    [0.22, 0.84],
    [0.16, 0.96],
    [0.06, 1.0],
    [0, 1.0],
  ].map(([x, y]) => new Vector2(x * height * 0.62, y * height));
  return new LatheGeometry(points, 40);
}

