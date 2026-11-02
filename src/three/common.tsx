import { RoundedBox, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { BufferGeometry, type Group, type Material } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import plexMonoUrl from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff?url";
import displayFontData from "./fonts/bricolage-800.typeface.json";
import { focus } from "./rigState";

export const monoFont = plexMonoUrl;
export const displayFont = new FontLoader().parse(displayFontData as never);

interface TextGeometryOptions {
  size: number;
  depth: number;
  tracking?: number;
  bevel?: number;
  curveSegments?: number;
  align?: "center" | "left";
}

/** Builds extruded lettering with custom tracking, centred on x and sitting on y = 0. */
export function letteringGeometry(text: string, options: TextGeometryOptions): BufferGeometry {
  const { size, depth, tracking = 0, bevel = 0, curveSegments = 8, align = "center" } = options;
  const parts: BufferGeometry[] = [];
  let cursor = 0;
  for (const character of text) {
    const glyph = displayFont.data.glyphs[character];
    const advance = ((glyph?.ha ?? 500) / displayFont.data.resolution) * size;
    if (character !== " " && glyph) {
      const geometry = new TextGeometry(character, {
        font: displayFont,
        size,
        depth,
        curveSegments,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel * 0.7,
        bevelSegments: 3,
      });
      geometry.translate(cursor, 0, 0);
      parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
    }
    cursor += advance + tracking * size;
  }
  const merged = mergeGeometries(parts, false) ?? new BufferGeometry();
  parts.forEach((part) => part.dispose());
  merged.computeBoundingBox();
  const box = merged.boundingBox;
  if (box) {
    const offsetX = align === "center" ? -(box.min.x + box.max.x) / 2 : -box.min.x;
    merged.translate(offsetX, -box.min.y, -(box.min.z + box.max.z) / 2);
  }
  merged.computeVertexNormals();
  return merged;
}

export function Plinth({
  size,
  position,
  material,
  radius = 0.03,
  rotationY = 0,
  children,
}: {
  size: [number, number, number];
  position: [number, number, number];
  material: Material;
  radius?: number;
  rotationY?: number;
  children?: ReactNode;
}) {
  return (
    <group position={position} rotation-y={rotationY}>
      <RoundedBox
        args={size}
        radius={radius}
        smoothness={3}
        position={[0, size[1] / 2, 0]}
        material={material}
        castShadow
        receiveShadow
      />
      <group position={[0, size[1], 0]}>{children}</group>
    </group>
  );
}

export function Label({
  children,
  size = 0.06,
  color = "#2b2723",
  anchorX = "center",
  anchorY = "middle",
  maxWidth,
  letterSpacing = 0.08,
  ...props
}: {
  children: string;
  size?: number;
  color?: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  maxWidth?: number;
  letterSpacing?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <Text
      font={monoFont}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY={anchorY}
      maxWidth={maxWidth}
      letterSpacing={letterSpacing}
      lineHeight={1.35}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Hides a station's objects while the camera is far away, so only the
 * exhibits near the visitor cost anything to draw.
 */
export function Station({
  z,
  reach,
  children,
}: {
  z: number;
  reach: number;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = Math.abs(focus.z - z) < reach;
  });
  return <group ref={group}>{children}</group>;
}
