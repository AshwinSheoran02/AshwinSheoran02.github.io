import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import broadcastUrl from "@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff?url";
import broadcastItalicUrl from "@fontsource/barlow-condensed/files/barlow-condensed-latin-800-italic.woff?url";
import { focus } from "./rigState";

export const labelFont = broadcastUrl;
export const italicFont = broadcastItalicUrl;

export function Label({
  children,
  size = 0.06,
  color = "#ffffff",
  anchorX = "center",
  anchorY = "middle",
  maxWidth,
  letterSpacing = 0.04,
  italic = false,
  fillOpacity = 1,
  ...props
}: {
  children: string;
  size?: number;
  color?: string;
  anchorX?: "left" | "center" | "right";
  anchorY?: "top" | "middle" | "bottom";
  maxWidth?: number;
  letterSpacing?: number;
  italic?: boolean;
  fillOpacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  renderOrder?: number;
}) {
  return (
    <Text
      font={italic ? italicFont : labelFont}
      fontSize={size}
      color={color}
      anchorX={anchorX}
      anchorY={anchorY}
      maxWidth={maxWidth}
      letterSpacing={letterSpacing}
      lineHeight={1.1}
      fillOpacity={fillOpacity}
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Hides a set-piece while the camera's focus is far away, so only the things
 * near the visitor cost anything to draw.
 */
export function Near({
  x,
  z,
  reach,
  children,
}: {
  x: number;
  z: number;
  reach: number;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = Math.hypot(focus.x - x, focus.z - z) < reach;
  });
  return <group ref={group}>{children}</group>;
}
