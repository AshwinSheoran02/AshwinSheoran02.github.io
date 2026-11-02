import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, Object3D, type SpotLight } from "three";
import { interests, projects } from "../../data/profile";
import { stationOrder } from "../../data/stations";
import { ui } from "../../lib/store";
import { easeInOut } from "../helpers";
import { interestPedestal, monolith, projectPosition, Z, Z_END } from "../layout";
import type { QualitySettings } from "../quality";
import { smoothed } from "../rigState";

export interface SpotSpec {
  position: [number, number, number];
  target: [number, number, number];
  angle: number;
  penumbra: number;
  /** Illuminance wanted at the target, in lux-like units; converted to candela by distance. */
  lux: number;
  color: string;
}

function candela(spec: SpotSpec) {
  const [ax, ay, az] = spec.position;
  const [bx, by, bz] = spec.target;
  return spec.lux * ((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
}

const warm = "#ffe6c7";

function specFor(id: string): SpotSpec | null {
  if (id === "home") {
    return { position: [2, 7.4, 7], target: [0, 1.4, 0], angle: 0.62, penumbra: 1, lux: 3.2, color: "#fff0dc" };
  }
  if (id === "about") {
    return { position: [0.2, 6.5, Z.about + 1.6], target: [1, 1.2, Z.about], angle: 0.32, penumbra: 0.9, lux: 3.0, color: warm };
  }
  if (id === "interests") {
    const index = Math.max(0, interests.items.findIndex((item) => item.id === ui.get().interest));
    const p = interestPedestal(index);
    return { position: [p.x * 0.6, 6.4, p.z + 2.6], target: [p.x, p.height, p.z], angle: 0.24, penumbra: 0.85, lux: 4.0, color: warm };
  }
  if (id === "statement") {
    return { position: [3.6, 7.6, Z.statement - 1], target: [8, 3.4, Z.statement], angle: 0.62, penumbra: 1, lux: 5.0, color: "#ffe9cc" };
  }
  if (id === "facts") {
    return { position: [0.8, 6.4, Z.facts + 2.4], target: [-1.6, 1.4, Z.facts], angle: 0.36, penumbra: 0.9, lux: 3.0, color: warm };
  }
  if (id.startsWith("journey-")) {
    const m = monolith(Number(id.slice(8)));
    return { position: [m.x - 2.6, 7.2, m.z + 2.8], target: [m.x, m.height * 0.6, m.z], angle: 0.36, penumbra: 0.95, lux: 3.0, color: warm };
  }
  if (id === "side-quests") {
    return { position: [1.2, 6.8, Z.sideQuests + 2.4], target: [1.2, 0.9, Z.sideQuests], angle: 0.5, penumbra: 0.9, lux: 3.2, color: warm };
  }
  if (id === "strengths") {
    return { position: [1.4, 7, Z.strengths + 3], target: [2.9, 1.2, Z.strengths], angle: 0.45, penumbra: 0.9, lux: 3.0, color: warm };
  }
  if (id === "known-issues") {
    return { position: [0.9, 5.6, Z.issues + 1.4], target: [2.1, 1.2, Z.issues], angle: 0.2, penumbra: 0.7, lux: 5.5, color: "#fff1dd" };
  }
  if (id.startsWith("project:")) {
    const index = projects.findIndex((project) => `project:${project.id}` === id);
    const p = projectPosition(Math.max(0, index));
    if (projects[index]?.exhibit === "pool-table") {
      // The billiard lamp over the table.
      return { position: [p.x, 1.88, p.z], target: [p.x, 0.78, p.z], angle: 1.0, penumbra: 0.8, lux: 3.6, color: "#fff2dc" };
    }
    return { position: [p.x - 1.2, 6.6, p.z + 2.2], target: [p.x, 0.8, p.z], angle: 0.32, penumbra: 0.85, lux: 3.6, color: warm };
  }
  if (id === "contact") {
    return { position: [0, 4.6, Z_END - 1.5], target: [0, 0, Z_END + 14], angle: 0.7, penumbra: 1, lux: 2.6, color: "#fff4e4" };
  }
  return null;
}

/*
 * Two spotlights are re-aimed as the visitor walks between stations instead
 * of giving every exhibit its own lamp. The light count stays constant, so
 * shaders never recompile mid-tour.
 */
export function SpotRig({ quality }: { quality: QualitySettings }) {
  const a = useRef<SpotLight>(null);
  const b = useRef<SpotLight>(null);
  const targets = useMemo(() => [new Object3D(), new Object3D()], []);
  const color = useMemo(() => new Color(), []);

  useEffect(() => {
    if (a.current) a.current.target = targets[0];
    if (b.current) b.current.target = targets[1];
  }, [targets]);

  useFrame(() => {
    const t = Math.max(0, Math.min(stationOrder.length - 1, smoothed.station));
    const i = Math.floor(t);
    const f = easeInOut(t - i);
    const pairs: [SpotLight | null, string | undefined, number, Object3D][] = [
      [a.current, stationOrder[i], 1 - f, targets[0]],
      [b.current, stationOrder[i + 1], f, targets[1]],
    ];
    for (const [light, id, weight, target] of pairs) {
      if (!light) continue;
      const spec = id ? specFor(id) : null;
      if (!spec || weight <= 0.001) {
        light.intensity = 0;
        continue;
      }
      light.position.set(...spec.position);
      target.position.set(...spec.target);
      target.updateMatrixWorld();
      light.angle = spec.angle;
      light.penumbra = spec.penumbra;
      light.intensity = candela(spec) * weight;
      light.color.copy(color.set(spec.color));
    }
  });

  const shadows = quality.tier !== "low";
  const size = quality.tier === "high" ? 1024 : 512;
  const shadowProps = {
    intensity: 0,
    distance: 0,
    decay: 2,
    castShadow: shadows,
    "shadow-mapSize": [size, size] as [number, number],
    "shadow-bias": -0.0004,
    "shadow-normalBias": 0.02,
    "shadow-radius": 5,
    "shadow-camera-near": 0.3,
    "shadow-camera-far": 30,
  };
  return (
    <>
      <spotLight ref={a} {...shadowProps} />
      <spotLight ref={b} {...shadowProps} />
    </>
  );
}
