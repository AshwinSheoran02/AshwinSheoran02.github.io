import type { InterestId } from "./profile";

/** Where each interest is fielding in the field placement (shared by the page and the 3D scene). */
export const fieldPositions: Record<InterestId, string> = {
  cricket: "Slip",
  markets: "Cover",
  gaming: "Mid-wicket",
  "vibe-coding": "Long-off",
  photography: "Fine leg",
};
