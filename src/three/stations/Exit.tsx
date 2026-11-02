import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { MeshPhysicalMaterial, CylinderGeometry } from "three";
import { InstancedBoxes, type BoxSpec } from "../helpers";
import { Label, letteringGeometry, Station } from "../common";
import { Z_END } from "../layout";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";

/* The end of the hall: a door out into the daylight, a gift shop counter and a guestbook. */
export function Exit({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const resources = useMemo(() => {
    const exitLetters = letteringGeometry("EXIT", { size: 0.32, depth: 0.04, tracking: 0.12, bevel: 0.004, curveSegments: 6 });
    const paper = new MeshPhysicalMaterial({ color: "#f6f1e6", roughness: 0.8, sheen: 0.3 });
    const page = new CylinderGeometry(0.6, 0.6, 0.36, 24, 1, true, -0.55, 1.1);
    return { exitLetters, paper, page };
  }, []);
  useEffect(
    () => () => {
      resources.exitLetters.dispose();
      resources.paper.dispose();
      resources.page.dispose();
    },
    [resources],
  );
  const frame = useMemo<BoxSpec[]>(
    () => [
      { p: [-1.94, 2.8, Z_END + 0.02], s: [0.1, 5.6, 0.16] },
      { p: [1.94, 2.8, Z_END + 0.02], s: [0.1, 5.6, 0.16] },
      { p: [0, 5.62, Z_END + 0.02], s: [3.98, 0.1, 0.16] },
    ],
    [],
  );
  const leaflets = useMemo<BoxSpec[]>(
    () => Array.from({ length: 9 }, (_, i) => ({ p: [-0.25 + (i % 3) * 0.002, 1.0 + i * 0.006, (i % 2) * 0.004], s: [0.21, 0.004, 0.297], r: (i % 3) * 0.04 })),
    [],
  );
  const counterZ = Z_END + 5.5;
  return (
    <Station z={Z_END + 6} reach={quality.drawDistance + 6}>
      <InstancedBoxes boxes={frame} material={m.bronze} castShadow />
      {/* Exit sign: brass letters on black lacquer, not neon. */}
      <group position={[0, 6.55, Z_END + 0.08]}>
        <RoundedBox args={[1.9, 0.62, 0.08]} radius={0.02} material={m.lacquer} />
        <mesh geometry={resources.exitLetters} material={m.brassPolished} position={[0, -0.16, 0.05]} />
      </group>

      {/* Gift shop counter, stocked with the traditional CV. */}
      <group position={[-3.6, 0, counterZ]} rotation-y={0.35}>
        <RoundedBox args={[2.2, 0.95, 0.7]} radius={0.02} position={[0, 0.475, 0]} material={m.walnutMatte} castShadow receiveShadow />
        <RoundedBox args={[2.26, 0.04, 0.76]} radius={0.01} position={[0, 0.97, 0]} material={m.travertine} castShadow receiveShadow />
        <group position={[0, 0, 0]}>
          <InstancedBoxes boxes={leaflets} material={resources.paper} castShadow receiveShadow />
        </group>
        <Label size={0.05} position={[0, 0.62, 0.356]} color="#efe6d6" letterSpacing={0.22}>
          GIFT SHOP · CV, FREE
        </Label>
      </group>

      {/* Guestbook lectern. */}
      <group position={[3.4, 0, counterZ]} rotation-y={-0.45}>
        <mesh position={[0, 0.55, 0]} material={m.lacquer} castShadow>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
        </mesh>
        <RoundedBox args={[0.7, 0.04, 0.5]} radius={0.01} position={[0, 0.02, 0]} material={m.lacquer} castShadow receiveShadow />
        <group position={[0, 1.14, 0]} rotation-x={0.32}>
          <RoundedBox args={[0.72, 0.05, 0.52]} radius={0.01} material={m.walnut} castShadow receiveShadow />
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={resources.page}
              material={resources.paper}
              position={[side * 0.17, -0.565, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[0.3, 0.7, 1]}
              castShadow
              receiveShadow
            />
          ))}
          <mesh position={[0.22, 0.05, 0.08]} rotation={[Math.PI / 2, 0, 0.6]} material={m.brassPolished} castShadow>
            <cylinderGeometry args={[0.006, 0.004, 0.16, 12]} />
          </mesh>
        </group>
        <Label size={0.045} position={[0, 0.78, 0.065]} color="#efe6d6" letterSpacing={0.2}>
          GUESTBOOK
        </Label>
      </group>
    </Station>
  );
}
