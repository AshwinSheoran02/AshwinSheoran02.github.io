import { useRef } from "react";
import { PITCH } from "../layout";
import type { QualitySettings } from "../quality";
import { Dugout } from "./Dugout";
import { Exhibits } from "./Exhibits";
import { FieldPlacement, PitchMap } from "./FieldGraphics";
import { HawkEye } from "./HawkEye";
import { InterestPieces } from "./InterestPieces";
import { Bat, Delivery, Stumps } from "./Kit";
import { Manhattan } from "./Manhattan";
import { Fireworks, PresentationStage } from "./Presentation";

/** Station set-pieces: everything on the field that belongs to one part of the story. */
export function SetPieces({ quality }: { quality: QualitySettings }) {
  const flashAt = useRef(-100);
  return (
    <>
      {/* The pitch: both sets of stumps, a bat resting against the striker's, and a delivery on a loop. */}
      <Stumps end={1} flashAt={flashAt} />
      <Stumps end={-1} />
      <Bat position={[-0.42, 0.02, PITCH.half + 0.12]} rotation={[0.05, -0.25, -0.38]} />
      <Delivery flashAt={flashAt} />

      <FieldPlacement />
      <InterestPieces />
      <PitchMap />
      <Manhattan />
      <Dugout />
      <HawkEye />
      <Exhibits />
      <PresentationStage />
      <Fireworks quality={quality} />
    </>
  );
}
