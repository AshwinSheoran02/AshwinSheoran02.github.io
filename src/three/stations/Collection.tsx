import { RoundedBox, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import { SRGBColorSpace } from "three";
import { projects, type Project } from "../../data/profile";
import { publicAsset } from "../../lib/publicAsset";
import { ui } from "../../lib/store";
import { Label, Station } from "../common";
import { projectPosition } from "../layout";
import { useMaterials } from "../materials";
import type { QualitySettings } from "../quality";
import { PoolTable } from "../exhibits/PoolTable";
import { WizardingBoard } from "../exhibits/WizardingBoard";

function CoverImage({ src }: { src: string }) {
  const texture = useTexture(publicAsset(src));
  texture.colorSpace = SRGBColorSpace;
  return (
    <mesh position={[0, 0, 0.031]}>
      <planeGeometry args={[1.5, 0.94]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

/** Generic exhibit for future projects: a lightbox showing the project's cover, or its title. */
function DisplayCase({ project }: { project: Project }) {
  const m = useMaterials();
  return (
    <group>
      <RoundedBox args={[1.9, 0.9, 0.9]} radius={0.02} position={[0, 0.45, 0]} material={m.travertine} castShadow receiveShadow />
      <group position={[0, 1.75, 0]} rotation-x={-0.08}>
        <RoundedBox args={[1.66, 1.1, 0.06]} radius={0.015} material={m.walnut} castShadow />
        {project.cover ? (
          <Suspense fallback={null}>
            <CoverImage src={project.cover} />
          </Suspense>
        ) : (
          <Label size={0.09} color="#efe6d6" position={[0, 0, 0.035]} maxWidth={1.3}>
            {project.title.toUpperCase()}
          </Label>
        )}
      </group>
    </group>
  );
}

function Exhibit({ project, index }: { project: Project; index: number }) {
  const p = projectPosition(index);
  const open = () => {
    const element = document.querySelector(`[data-station="project:${project.id}"]`);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <group
      position={[p.x, 0, p.z]}
      onClick={(event) => {
        event.stopPropagation();
        if (project.exhibit === "pool-table") ui.set({ breakShotAt: performance.now() });
        open();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
        ui.set({ hoveredExhibit: project.id });
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        ui.set({ hoveredExhibit: null });
      }}
    >
      {project.exhibit === "pool-table" ? (
        <PoolTable exhibitId={project.id} z={p.z} />
      ) : project.exhibit === "wizarding-board" ? (
        <WizardingBoard z={p.z} />
      ) : (
        <DisplayCase project={project} />
      )}
    </group>
  );
}

export function Collection({ quality }: { quality: QualitySettings }) {
  return (
    <>
      {projects.map((project, index) => (
        <Station key={project.id} z={projectPosition(index).z} reach={quality.drawDistance}>
          <Exhibit project={project} index={index} />
        </Station>
      ))}
    </>
  );
}
