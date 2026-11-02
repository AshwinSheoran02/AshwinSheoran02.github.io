import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  Color,
  LineBasicMaterial,
  DoubleSide,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Material,
  type Texture,
} from "three";
import type { QualitySettings } from "./quality";
import {
  feltTexture,
  noiseTexture,
  plasterTexture,
  skyTexture,
  travertineTexture,
  walnutTexture,
} from "./textures";

/*
 * Shared physically based materials. Created once per quality tier and
 * disposed with their textures when the scene unmounts.
 */
function createMaterials(quality: QualitySettings) {
  const s = quality.textureScale;
  const textures: Texture[] = [];
  const keep = <T extends Texture>(texture: T) => {
    textures.push(texture);
    return texture;
  };

  const plasterMap = keep(plasterTexture(s));
  plasterMap.repeat.set(1, 1);
  const travertineMap = keep(travertineTexture(s));
  const walnutMap = keep(walnutTexture(s));
  walnutMap.repeat.set(1, 1);
  const feltMap = keep(feltTexture(s));
  feltMap.repeat.set(4, 4);
  const fineNoise = keep(noiseTexture(5, 256));
  fineNoise.repeat.set(6, 6);
  const sky = keep(skyTexture());

  const glass = (options: {
    color?: string;
    attenuation?: string;
    thickness?: number;
    roughness?: number;
    dispersion?: number;
  }) => {
    if (quality.transmission) {
      return new MeshPhysicalMaterial({
        color: options.color ?? "#ffffff",
        metalness: 0,
        roughness: options.roughness ?? 0.03,
        transmission: 1,
        thickness: options.thickness ?? 0.4,
        ior: 1.52,
        attenuationColor: new Color(options.attenuation ?? "#e8f2ee"),
        attenuationDistance: 1.6,
        dispersion: options.dispersion ?? 0,
        specularIntensity: 1,
        envMapIntensity: 1.2,
        clearcoat: 0.2,
      });
    }
    // Without refraction, tinted glass is drawn as dense translucent resin so it keeps its presence.
    const tinted = (options.thickness ?? 0.4) > 0.8;
    return new MeshPhysicalMaterial({
      color: tinted ? "#3a403e" : (options.attenuation ?? "#dfe8e4"),
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: tinted ? 0.86 : 0.28,
      depthWrite: false,
      envMapIntensity: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    });
  };

  const materials = {
    plaster: new MeshStandardMaterial({ color: "#efe8dc", map: plasterMap, roughness: 0.93 }),
    plasterShade: new MeshStandardMaterial({ color: "#d9cfbf", map: plasterMap, roughness: 0.95 }),
    ceiling: new MeshStandardMaterial({ color: "#f3eee6", roughness: 0.97 }),
    timber: new MeshPhysicalMaterial({ map: walnutMap, color: "#d9b48c", roughness: 0.6, clearcoat: 0.2 }),
    bronze: new MeshStandardMaterial({ color: "#4a3a2a", metalness: 0.85, roughness: 0.42 }),
    travertine: new MeshPhysicalMaterial({
      color: "#f2e8d6",
      map: travertineMap,
      roughness: 0.62,
      bumpMap: fineNoise,
      bumpScale: 0.6,
      clearcoat: 0.12,
      clearcoatRoughness: 0.5,
    }),
    brass: new MeshPhysicalMaterial({
      color: "#d0a65a",
      metalness: 1,
      roughness: 0.24,
      anisotropy: 0.65,
      anisotropyRotation: Math.PI / 2,
    }),
    brassPolished: new MeshPhysicalMaterial({ color: "#e2b866", metalness: 1, roughness: 0.12 }),
    chrome: new MeshPhysicalMaterial({ color: "#eceef0", metalness: 1, roughness: 0.05 }),
    steel: new MeshPhysicalMaterial({
      color: "#b9bcc0",
      metalness: 1,
      roughness: 0.32,
      anisotropy: 0.8,
      anisotropyRotation: 0,
    }),
    lacquer: new MeshPhysicalMaterial({
      color: "#151413",
      roughness: 0.38,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    ink: new MeshStandardMaterial({ color: "#2b2723", roughness: 0.55 }),
    terracotta: new MeshPhysicalMaterial({
      color: "#b9532f",
      roughness: 0.5,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    }),
    ceramic: new MeshPhysicalMaterial({
      color: "#f1ece2",
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    walnut: new MeshPhysicalMaterial({
      map: walnutMap,
      roughness: 0.36,
      clearcoat: 0.85,
      clearcoatRoughness: 0.22,
    }),
    walnutMatte: new MeshPhysicalMaterial({
      map: walnutMap,
      color: "#9a877b",
      roughness: 0.48,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
    }),
    felt: new MeshStandardMaterial({ color: "#1f5480", map: feltMap, roughness: 0.96 }),
    leatherBlack: new MeshStandardMaterial({ color: "#0d0b0a", roughness: 0.75 }),
    glass: glass({}),
    smokedGlass: glass({ color: "#7c8481", attenuation: "#2e3533", thickness: 1.4 }),
    prismGlass: glass({ roughness: 0.0, thickness: 1.2, dispersion: 5 }),
    // Thin sheet glass for cases and tubes: reflective, barely there, never refractive.
    caseGlass: new MeshPhysicalMaterial({
      color: "#eef4f1",
      metalness: 0,
      roughness: 0.02,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: DoubleSide,
      envMapIntensity: 1.1,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
    sky: new MeshBasicMaterial({ map: sky, color: new Color(1.9, 1.75, 1.5), fog: false }),
    daylight: new MeshBasicMaterial({ color: new Color(2.6, 2.35, 2.0), fog: false }),
    skylight: new MeshBasicMaterial({ color: new Color(1.25, 1.22, 1.17), side: DoubleSide, fog: false }),
    shadowCatcher: new MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0 }),
    brassLine: new LineBasicMaterial({ color: "#c9a04f" }),
  };

  // Anisotropic brushing reads best with a gentle tangent-space direction.
  materials.brass.anisotropyMap = null;
  materials.travertine.normalScale = new Vector2(1, 1);

  const dispose = () => {
    Object.values(materials).forEach((material: Material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
  };

  return { materials, dispose };
}

export type MaterialLibrary = ReturnType<typeof createMaterials>["materials"];

const MaterialContext = createContext<MaterialLibrary | null>(null);

export function MaterialProvider({
  quality,
  children,
}: {
  quality: QualitySettings;
  children: ReactNode;
}) {
  const library = useMemo(() => createMaterials(quality), [quality]);
  useEffect(() => () => library.dispose(), [library]);
  return (
    <MaterialContext.Provider value={library.materials}>{children}</MaterialContext.Provider>
  );
}

export function useMaterials(): MaterialLibrary {
  const value = useContext(MaterialContext);
  if (!value) throw new Error("useMaterials must be used inside MaterialProvider");
  return value;
}
