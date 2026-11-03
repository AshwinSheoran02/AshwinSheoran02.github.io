import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  type Texture,
} from "three";
import type { QualitySettings } from "./quality";
import { feltTexture, walnutTexture } from "./textures";

/*
 * Shared physically based materials for the set-pieces and the game exhibits.
 * Created once per quality tier and disposed with their textures when the scene unmounts.
 */
function createMaterials(quality: QualitySettings) {
  const s = quality.textureScale;
  const textures: Texture[] = [];
  const keep = <T extends Texture>(texture: T) => {
    textures.push(texture);
    return texture;
  };

  const walnutMap = keep(walnutTexture(s));
  walnutMap.repeat.set(1, 1);
  const feltMap = keep(feltTexture(s));
  feltMap.repeat.set(4, 4);

  const materials = {
    bronze: new MeshStandardMaterial({ color: "#4a3a2a", metalness: 0.85, roughness: 0.42 }),
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
    // Broadcast black: glossy, so the floodlights streak across it.
    lacquer: new MeshPhysicalMaterial({
      color: "#0e1118",
      roughness: 0.34,
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
    glass: new MeshPhysicalMaterial({
      color: "#dfe8e4",
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      envMapIntensity: 1.8,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    }),
  };

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
