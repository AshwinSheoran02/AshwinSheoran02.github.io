import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { BufferGeometry, Group, Material } from "three";
import { rig } from "../../lib/store";
import { letteringGeometry, Plinth, Station } from "../common";
import { clamp01, damp, easeInOut } from "../helpers";
import { Z } from "../layout";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";

const LETTERS = ["A", "S", "H", "W", "I", "N"];
const LETTER_SIZE = 1.62;
const LETTER_DEPTH = 0.34;
const TRACKING = 0.06;

interface LetterProps {
  geometry: BufferGeometry;
  material: Material;
  x: number;
  index: number;
}

/** One sculpted letter. Leans towards the pointer and does a full turn when clicked. */
function Letter({ geometry, material, x, index }: LetterProps) {
  const group = useRef<Group>(null);
  const motion = useRef({ hover: false, tiltX: 0, tiltY: 0, targetX: 0, targetY: 0, lift: 0, spinStart: -10 });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const m = motion.current;
    const dt = Math.min(delta, 0.1);
    const now = state.clock.elapsedTime;
    const idle = rig.reducedMotion ? 0 : Math.sin(now * 0.6 + index * 0.9) * 0.012;
    m.tiltX = damp(m.tiltX, m.hover ? m.targetX : 0, 7, dt);
    m.tiltY = damp(m.tiltY, m.hover ? m.targetY : 0, 7, dt);
    m.lift = damp(m.lift, m.hover ? 0.06 : 0, 8, dt);
    const spin = clamp01((now - m.spinStart) / 1.25);
    g.rotation.set(m.tiltX, m.tiltY + idle + easeInOut(spin) * Math.PI * 2 * (spin < 1 ? 1 : 0), 0);
    g.position.y = m.lift;
  });

  const onMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const g = group.current;
    if (!g) return;
    const local = g.worldToLocal(event.point.clone());
    motion.current.targetY = Math.max(-0.35, Math.min(0.35, local.x * 0.45));
    motion.current.targetX = Math.max(-0.12, Math.min(0.12, (0.8 - local.y) * 0.1));
  };

  return (
    <group position={[x, 0, 0]}>
      <group ref={group}>
        <mesh
          geometry={geometry}
          material={material}
          castShadow
          receiveShadow
          onPointerOver={(event) => {
            event.stopPropagation();
            motion.current.hover = true;
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            motion.current.hover = false;
            document.body.style.cursor = "";
          }}
          onPointerMove={onMove}
          onClick={(event) => {
            event.stopPropagation();
            if (rig.reducedMotion) return;
            spinRequests.add(motion.current);
          }}
        />
      </group>
    </group>
  );
}

// Clicks arrive outside the render loop; the next frame stamps them with the scene clock.
const spinRequests = new Set<{ spinStart: number }>();
function SpinClock() {
  useFrame((state) => {
    spinRequests.forEach((request) => {
      request.spinStart = state.clock.elapsedTime;
    });
    spinRequests.clear();
  });
  return null;
}

export function Foyer({ quality }: { quality: QualitySettings }) {
  const m = useMaterials();
  const curveSegments = quality.tier === "low" ? 5 : 10;

  const { letters, surname, width } = useMemo(() => {
    const built = LETTERS.map((character) =>
      letteringGeometry(character, { size: LETTER_SIZE, depth: LETTER_DEPTH, bevel: 0.022, curveSegments }),
    );
    const widths = built.map((geometry) => {
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      return box.max.x - box.min.x;
    });
    const gap = TRACKING * LETTER_SIZE + 0.08;
    const total = widths.reduce((sum, w) => sum + w, 0) + gap * (widths.length - 1);
    let cursor = -total / 2;
    const positions = widths.map((w) => {
      const centre = cursor + w / 2;
      cursor += w + gap;
      return centre;
    });
    const surnameGeometry = letteringGeometry("SHEORAN", {
      size: 0.2,
      depth: 0.012,
      tracking: 0.55,
      bevel: 0.002,
      curveSegments: 6,
    });
    return {
      letters: built.map((geometry, index) => ({ geometry, x: positions[index] })),
      surname: surnameGeometry,
      width: total,
    };
  }, [curveSegments]);

  useEffect(
    () => () => {
      letters.forEach((letter) => letter.geometry.dispose());
      surname.dispose();
    },
    [letters, surname],
  );

  const letterMaterials = [m.brassPolished, m.smokedGlass, m.travertine, m.chrome, m.terracotta, m.lacquer];
  const plinthWidth = width + 1.3;
  const plinthHeight = 0.5;

  return (
    <Station z={Z.home} reach={quality.drawDistance}>
      <SpinClock />
      <Plinth size={[plinthWidth, plinthHeight, 1.5]} position={[0, 0, Z.home]} material={m.travertine} radius={0.025}>
        {letters.map((letter, index) => (
          <Letter
            key={LETTERS[index]}
            index={index}
            geometry={letter.geometry}
            material={letterMaterials[index]}
            x={letter.x}
          />
        ))}
      </Plinth>
      {/* Surname set in brass into the front face of the plinth. */}
      <mesh
        geometry={surname}
        material={m.brass}
        position={[0, 0.15, Z.home + 0.756]}
        castShadow
      />
    </Station>
  );
}
