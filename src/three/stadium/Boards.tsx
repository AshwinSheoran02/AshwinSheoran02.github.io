import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { BufferAttribute, Color, DoubleSide, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { facts, hero, interests, projects } from "../../data/profile";
import { rig, ui } from "../../lib/store";
import { GROUND } from "../layout";
import { ribbonTexture } from "../stadiumTextures";
import { ellipseBand, ringLength } from "./geometry";
import { lights } from "./lightState";

const HEIGHT = 0.95;

/** The messages on the LED boards around the rope. All of it is content from the site. */
function boardMessages(station: string): string[] {
  const base = [
    "ASHWIN.TOP",
    ...hero.ticker,
    ...projects.map((project) => `PLAY: ${project.navLabel}`),
    interests.items.find((item) => item.id === "vibe-coding")?.note ?? "",
  ];
  if (station === "facts") {
    return facts.items.map((item) => `${item.label}: ${item.value.replace(/[“”]/g, '"')}`.toUpperCase());
  }
  return base.filter(Boolean).map((message) => message.toUpperCase());
}

/* Perimeter advertising boards: a continuous LED ribbon just outside the rope, scrolling slowly. */
export function Boards() {
  const geometry = useMemo(() => {
    const band = ellipseBand({ from: [GROUND.boards, 0.05], to: [GROUND.boards + 0.18, HEIGHT], tileU: 1, segments: 360 });
    const length = ringLength(GROUND.boards);
    const uv = band.attributes.uv as BufferAttribute;
    for (let i = 0; i < uv.count; i += 1) uv.setX(i, uv.getX(i) / length);
    return { band, length };
  }, []);
  const backing = useMemo(() => {
    const band = ellipseBand({ from: [GROUND.boards + 0.4, 0], to: [GROUND.boards + 0.4, HEIGHT + 0.05], segments: 180 });
    const material = new MeshStandardMaterial({ color: "#0b0e14", roughness: 0.7, side: DoubleSide });
    return { band, material };
  }, []);

  const textures = useMemo(() => ({ general: ribbonTexture(boardMessages("home")), facts: ribbonTexture(boardMessages("facts")) }), []);
  const material = useMemo(() => new MeshBasicMaterial({ map: textures.general, side: DoubleSide, color: new Color(1.4, 1.4, 1.4) }), [textures]);

  useEffect(() => {
    // One texture repeat should keep the text at its drawn proportions on a board of this height.
    Object.values(textures).forEach((texture) => {
      const aspect = (texture.image as HTMLCanvasElement).width / (texture.image as HTMLCanvasElement).height;
      texture.repeat.set(Math.max(1, Math.round(geometry.length / (aspect * HEIGHT))), 1);
    });
  }, [textures, geometry.length]);

  useEffect(
    () => () => {
      geometry.band.dispose();
      backing.band.dispose();
      backing.material.dispose();
      material.dispose();
      Object.values(textures).forEach((texture) => texture.dispose());
    },
    [geometry, backing, material, textures],
  );

  useFrame((_, delta) => {
    const wanted = ui.get().activeStation === "facts" ? textures.facts : textures.general;
    if (material.map !== wanted) {
      material.map = wanted;
      material.needsUpdate = true;
    }
    if (!rig.reducedMotion) wanted.offset.x = (wanted.offset.x - delta * 0.0025) % 1;
    const level = 0.05 + 1.4 * lights.level + lights.show;
    material.color.setScalar(level);
  });

  return (
    <group>
      <mesh geometry={geometry.band} material={material} />
      <mesh geometry={backing.band} material={backing.material} />
    </group>
  );
}
