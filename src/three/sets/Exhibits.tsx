import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Color, MeshBasicMaterial, RingGeometry } from "three";
import { projects, type Project } from "../../data/profile";
import { ui } from "../../lib/store";
import { Label, Near } from "../common";
import { PoolTable } from "../exhibits/PoolTable";
import { WizardingBoard } from "../exhibits/WizardingBoard";
import { projectPosition } from "../layout";
import { useMaterials } from "../materials";
import { posterTexture } from "./posters";

/** A big LED screen on a stand, showing the project's title screen. */
function PosterScreen({ project }: { project: Project }) {
  const m = useMaterials();
  const resources = useMemo(() => {
    const map = posterTexture(project);
    return { map, material: new MeshBasicMaterial({ map, color: new Color(1.08, 1.08, 1.08) }) };
  }, [project]);
  useEffect(
    () => () => {
      resources.map.dispose();
      resources.material.dispose();
    },
    [resources],
  );
  // Faces the field (north), where the camera arrives from.
  return (
    <group rotation-y={Math.PI}>
      <mesh material={resources.material} position={[0, 1.85, 0.07]}>
        <planeGeometry args={[3.6, 2.025]} />
      </mesh>
      <RoundedBox args={[3.8, 2.2, 0.12]} radius={0.03} position={[0, 1.85, 0]} material={m.lacquer} castShadow />
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} material={m.steel} position={[x, 0.42, -0.05]} castShadow>
          <boxGeometry args={[0.1, 0.84, 0.1]} />
        </mesh>
      ))}
      <RoundedBox args={[3, 0.08, 0.7]} radius={0.02} position={[0, 0.04, -0.05]} material={m.lacquer} receiveShadow />
    </group>
  );
}

/** Generic stand for future projects: a lit totem carrying the title. */
function Totem({ project }: { project: Project }) {
  const m = useMaterials();
  return (
    <group>
      <RoundedBox args={[1.6, 2.4, 0.4]} radius={0.04} position={[0, 1.2, 0]} material={m.lacquer} castShadow receiveShadow />
      <Label size={0.2} italic color="#ffd400" position={[0, 1.6, 0.21]} maxWidth={1.3}>
        {project.title.toUpperCase()}
      </Label>
      <Label size={0.11} color="#ffffff" position={[0, 1.05, 0.21]} maxWidth={1.3}>
        {project.medium.toUpperCase()}
      </Label>
    </group>
  );
}

/* Each project sits on its own lit stage on the outfield, in front of the south stand. */
export function Exhibits() {
  const m = useMaterials();
  const parts = useMemo(
    () => ({
      edge: new MeshBasicMaterial({ color: new Color(0.6, 1.9, 2.6) }),
      ring: new RingGeometry(3.15, 3.25, 96),
    }),
    [],
  );
  useEffect(
    () => () => {
      parts.edge.dispose();
      parts.ring.dispose();
    },
    [parts],
  );
  return (
    <>
      {projects.map((project, index) => {
        const p = projectPosition(index);
        return (
          <Near key={project.id} x={p.x} z={p.z} reach={34}>
            <group
              position={[p.x, 0, p.z]}
              onClick={(event) => {
                event.stopPropagation();
                if (project.exhibit === "pool-table") ui.set({ breakShotAt: performance.now() });
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
              <mesh material={m.lacquer} position={[0, 0.05, 0]} receiveShadow>
                <cylinderGeometry args={[3.2, 3.3, 0.1, 96]} />
              </mesh>
              <mesh geometry={parts.ring} material={parts.edge} position={[0, 0.105, 0]} rotation-x={-Math.PI / 2} />
              <group position={[0, 0.1, 0]}>
                {project.exhibit === "pool-table" ? (
                  <>
                    <PoolTable exhibitId={project.id} x={p.x} z={p.z} />
                    {/* A light gantry over the table carries the billiard lamp. */}
                    {[-1.9, 1.9].map((x) => (
                      <mesh key={x} material={m.steel} position={[x, 1.78, 0]} castShadow>
                        <boxGeometry args={[0.08, 3.56, 0.08]} />
                      </mesh>
                    ))}
                    <mesh material={m.steel} position={[0, 3.56, 0]} castShadow>
                      <boxGeometry args={[3.88, 0.08, 0.08]} />
                    </mesh>
                  </>
                ) : project.exhibit === "wizarding-board" ? (
                  <WizardingBoard x={p.x} z={p.z} />
                ) : project.exhibit === "screen" ? (
                  <PosterScreen project={project} />
                ) : (
                  <Totem project={project} />
                )}
              </group>
              <group position={[0, 0.112, -3.0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
                <Label size={0.28} italic color="#ffd400" anchorY="top">
                  {`${project.kind === "game" ? "GAME" : "APP"} ${String(index + 1).padStart(2, "0")} · ${project.navLabel.toUpperCase()}`}
                </Label>
              </group>
            </group>
          </Near>
        );
      })}
    </>
  );
}
