import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  LinearFilter,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
} from "three";
import { rig, ui } from "../../lib/store";
import { InstancedBoxes, type BoxSpec } from "../helpers";
import { SCREEN } from "../layout";
import { lights } from "./lightState";
import { drawScreen, SCREEN_PX } from "./screenContent";

const ledVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* Two canvases cross-wipe when the content changes; a fine LED grid sits over them up close. */
const ledFragment = /* glsl */ `
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform float uMix;
  uniform float uLevel;
  uniform float uTime;
  uniform vec2 uGrid;
  varying vec2 vUv;
  void main() {
    float edge = vUv.x * 0.85 + (1.0 - vUv.y) * 0.15;
    float sweep = uMix * 1.25 - 0.12;
    float w = smoothstep(sweep + 0.02, sweep - 0.02, edge);
    vec3 a = texture2D(uA, vUv).rgb;
    vec3 b = texture2D(uB, vUv).rgb;
    vec3 colour = mix(a, b, w);
    // Bright leading edge of the wipe.
    float line = smoothstep(0.03, 0.0, abs(edge - sweep)) * step(0.001, uMix) * step(uMix, 0.999);
    colour += vec3(1.0, 0.85, 0.2) * line * 1.5;
    // LED pixels: only resolved when the camera is close enough to see them.
    vec2 cells = vUv * uGrid;
    vec2 cell = fract(cells) - 0.5;
    float lamp = smoothstep(0.5, 0.28, length(cell));
    float resolve = 1.0 - smoothstep(0.35, 0.9, fwidth(cells.x));
    colour *= mix(1.0, 0.25 + lamp * 1.1, resolve);
    // A faint refresh shimmer.
    colour *= 0.97 + 0.03 * sin(vUv.y * 900.0 + uTime * 12.0);
    gl_FragColor = vec4(colour * (0.05 + 1.85 * uLevel), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = SCREEN_PX.width;
  canvas.height = SCREEN_PX.height;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 8;
  return { canvas, texture, context: canvas.getContext("2d")! };
}

export function Scoreboard() {
  const resources = useMemo(() => {
    const a = makeCanvas();
    const b = makeCanvas();
    const material = new ShaderMaterial({
      vertexShader: ledVertex,
      fragmentShader: ledFragment,
      uniforms: {
        uA: { value: a.texture },
        uB: { value: b.texture },
        uMix: { value: 1 },
        uLevel: { value: 0 },
        uTime: { value: 0 },
        uGrid: { value: [SCREEN_PX.width / 4.6, SCREEN_PX.height / 4.6] },
      },
      toneMapped: true,
    });
    const geometry = new PlaneGeometry(SCREEN.width, SCREEN.height);
    const housing = new MeshStandardMaterial({ color: "#11141b", roughness: 0.5, metalness: 0.6 });
    return { a, b, material, geometry, housing };
  }, []);
  useEffect(
    () => () => {
      resources.a.texture.dispose();
      resources.b.texture.dispose();
      resources.material.dispose();
      resources.geometry.dispose();
      resources.housing.dispose();
    },
    [resources],
  );

  const state = useRef({ shown: "", front: "b" as "a" | "b", mix: 1, patched: 0 });

  useFrame((frame, delta) => {
    const s = state.current;
    const { activeStation, patchAt } = ui.get();
    const key = `${activeStation}|${patchAt > 0 ? "p" : ""}`;
    if (key !== s.shown) {
      // Draw the new content into the hidden canvas, then wipe it in.
      const next = s.front === "a" ? resources.b : resources.a;
      drawScreen(next.context, activeStation, { patched: patchAt > 0 && activeStation === "known-issues" });
      next.texture.needsUpdate = true;
      const uniforms = resources.material.uniforms;
      uniforms.uA.value = s.front === "a" ? resources.a.texture : resources.b.texture;
      uniforms.uB.value = next.texture;
      s.front = s.front === "a" ? "b" : "a";
      s.mix = s.shown === "" || rig.reducedMotion || rig.capture ? 1 : 0;
      s.shown = key;
    }
    s.mix = Math.min(1, s.mix + delta / 0.7);
    resources.material.uniforms.uMix.value = s.mix;
    resources.material.uniforms.uLevel.value = Math.min(1, lights.level * 1.2) * (1 + lights.show * 0.3);
    resources.material.uniforms.uTime.value = frame.clock.elapsedTime;
  });

  const [x, y, z] = SCREEN.position;
  const truss = useMemo<BoxSpec[]>(() => {
    const boxes: BoxSpec[] = [];
    const bottom = y - SCREEN.height / 2;
    for (const side of [-1, 1]) {
      boxes.push({ p: [x + side * (SCREEN.width / 2 - 4), bottom / 2, z - 2.4], s: [1.6, bottom, 1.6] });
      boxes.push({ p: [x + side * (SCREEN.width / 2 - 14), bottom / 2, z - 2.4], s: [1.2, bottom, 1.2] });
    }
    boxes.push({ p: [x, bottom - 1.2, z - 1.6], s: [SCREEN.width, 1.2, 2] });
    return boxes;
  }, [x, y, z]);

  return (
    <group>
      <mesh geometry={resources.geometry} material={resources.material} position={[x, y, z + 0.62]} />
      <mesh material={resources.housing} position={[x, y, z]}>
        <boxGeometry args={[SCREEN.width + 1.6, SCREEN.height + 1.6, 1.2]} />
      </mesh>
      <InstancedBoxes boxes={truss} material={resources.housing} />
    </group>
  );
}
