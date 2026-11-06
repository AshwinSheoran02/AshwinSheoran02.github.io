import { fieldPositions } from "../data/field";
import { interests, journey, projects, type InterestId } from "../data/profile";
import { stationOrder } from "../data/stations";

/*
 * World layout. A cricket stadium at night, in metres. The pitch runs along z:
 * the striker's end is at +z (south), the bowler's end and the giant screen at -z.
 * For a right-handed batter the off side is +x.
 */
export const GROUND = {
  /** Boundary rope semi-axes. */
  bx: 62,
  bz: 68,
  /** Advertising boards sit this far outside the rope. */
  boards: 3.6,
  /** Perimeter wall in front of the first row. */
  wall: 6.2,
} as const;

export const PITCH = {
  /** Half the distance between the two sets of stumps. */
  half: 10.06,
  width: 3.05,
  length: 24,
} as const;

/** A point on an ellipse offset outwards from the boundary rope by `offset` metres. */
export function ringPoint(theta: number, offset: number): [number, number] {
  return [(GROUND.bx + offset) * Math.cos(theta), (GROUND.bz + offset) * Math.sin(theta)];
}

/*
 * Stand cross-section, as (distance beyond the boundary, height) pairs.
 * Lower tier, a fascia, the upper tier, the back wall and the roof.
 */
export const STANDS = {
  lower: { from: [GROUND.wall + 1, 1.4], to: [GROUND.wall + 27, 13.5] },
  fascia: { from: [GROUND.wall + 27, 13.5], to: [GROUND.wall + 28, 17.5] },
  /** The LED ribbon set into the fascia. */
  ribbon: { from: [GROUND.wall + 26.75, 14.6], to: [GROUND.wall + 26.95, 16.4] },
  upper: { from: [GROUND.wall + 28, 17.5], to: [GROUND.wall + 51, 35] },
  back: { from: [GROUND.wall + 51, 35], to: [GROUND.wall + 51, 41] },
  roof: { inner: [GROUND.wall + 25, 45.5], outer: [GROUND.wall + 54, 49] },
} as const;

/** The upper tier and roof leave a gap at the north end, where the giant screen stands. */
export const SCREEN_GAP = { centre: -Math.PI / 2, half: 0.36 } as const;

export const SCREEN = {
  width: 44,
  height: 19,
  position: [0, 30.5, -(GROUND.bz + GROUND.wall + 33)] as [number, number, number],
} as const;

/** Floodlight towers, by angle around the ground. */
/** Floodlight towers, by angle around the ground. The two at the north end frame the screen. */
export const TOWERS = [-1.18, -1.96, 1.08, 2.06].map((theta) => {
  const [x, z] = ringPoint(theta, GROUND.wall + 58);
  return { theta, x, z, height: 62 };
});

/** Fielding positions used for the interests, with the field label painted next to each. */
const FIELD_SPOTS: Record<InterestId, [number, number]> = {
  cricket: [2.4, 14.2],
  markets: [27, 3],
  gaming: [-27, 5],
  "vibe-coding": [16, -46],
  photography: [-25, 41],
};
export const FIELD_POSITIONS = Object.fromEntries(
  (Object.keys(FIELD_SPOTS) as InterestId[]).map((id) => [
    id,
    { name: fieldPositions[id].toUpperCase(), x: FIELD_SPOTS[id][0], z: FIELD_SPOTS[id][1] },
  ]),
) as Record<InterestId, { name: string; x: number; z: number }>;

/** Journey bars (a broadcast "Manhattan") stand in a row on the off side. */
export const MANHATTAN = {
  x: 38,
  z: (index: number) => -22 + index * 11,
  height: (index: number) => [3.2, 6.4, 5.2, 9.4, 12.8][index] ?? 6,
  size: 4.2,
} as const;

/** The home dugout sits on the outfield just inside the rope on the leg side, facing the square. */
export const DUGOUT = (() => {
  const [x, z] = ringPoint(Math.PI + 0.2, -3.6);
  return { x, z, rotationY: Math.atan2(-x, -z) };
})();

export const PRESENTATION = { x: 0, z: 30 } as const;

export function projectPosition(index: number) {
  const offset = index - (projects.length - 1) / 2;
  return { x: offset * 15, z: 50 + Math.abs(offset) * 1.5 };
}

export interface Keyframe {
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Degrees. 0 looks down -Z (towards the screen), positive turns towards +X. */
  yaw: number;
  /** Degrees. Negative looks down. */
  pitch: number;
  /** Preferred distance from the target in metres. */
  dist: number;
  /** Vertical field of view in degrees. */
  fov: number;
  /** Width in metres that must stay visible around the target on narrow screens. */
  fit?: number;
  /** Screen-space shift of the target on wide screens [x, y], as a fraction of the viewport. */
  shift?: [number, number];
  /** Shift on portrait screens, where text sits at the bottom. */
  shiftPortrait?: [number, number];
}

const PANEL_SHIFT: [number, number] = [0.19, 0.02];
const PORTRAIT_SHIFT: [number, number] = [0, 0.27];

/** Yaw (degrees) for a camera standing at `from` and looking at `to`. */
function yawBetween(from: [number, number], to: [number, number]) {
  return (Math.atan2(to[0] - from[0], -(to[1] - from[1])) * 180) / Math.PI;
}

function interestFrame(id: InterestId): Keyframe {
  if (id === "cricket") {
    // Spidercam, straight over the square: the whole field placement at once.
    return {
      target: [0, 0, 2],
      yaw: 0,
      pitch: -64,
      dist: 96,
      fov: 38,
      fit: 120,
      shift: [0.16, 0.02],
      shiftPortrait: [0, 0.22],
    };
  }
  const p = FIELD_POSITIONS[id];
  const framing: Partial<Record<InterestId, { dist: number; fit: number; height: number; pitch: number }>> = {
    markets: { dist: 7.6, fit: 5.4, height: 1.5, pitch: -7 },
    gaming: { dist: 7, fit: 4.4, height: 1.2, pitch: -7 },
    "vibe-coding": { dist: 6.6, fit: 6.2, height: 0.5, pitch: -22 },
    photography: { dist: 5.6, fit: 3.8, height: 1.75, pitch: -6 },
  };
  const f = framing[id] ?? { dist: 7.4, fit: 4.2, height: 1.35, pitch: -7 };
  // Stand outside the fielder and look back across the field, slightly off the radial line.
  const outward = Math.atan2(p.z, p.x) + 0.32;
  const camera: [number, number] = [p.x + Math.cos(outward) * 7, p.z + Math.sin(outward) * 7];
  return {
    target: [p.x, f.height, p.z],
    yaw: yawBetween(camera, [p.x, p.z]),
    pitch: f.pitch,
    dist: f.dist,
    fov: 36,
    fit: f.fit,
    shift: PANEL_SHIFT,
    shiftPortrait: [0, 0.26],
  };
}

function journeyFrame(index: number): Keyframe {
  const height = MANHATTAN.height(index);
  return {
    target: [MANHATTAN.x, Math.min(height * 0.55, 6), MANHATTAN.z(index)],
    yaw: 72,
    pitch: 3,
    dist: 15 + height * 0.9,
    fov: 36,
    fit: 9,
    shift: [0.2, 0.02],
    shiftPortrait: [0, 0.27],
  };
}

function projectFrame(index: number): Keyframe {
  const project = projects[index];
  const p = projectPosition(index);
  if (project?.exhibit === "wizarding-board") {
    return {
      target: [p.x, 0.86, p.z],
      yaw: 172,
      pitch: -42,
      dist: 3.7,
      fov: 34,
      fit: 2.3,
      shift: [0.2, 0.03],
      shiftPortrait: [0, 0.27],
    };
  }
  if (project?.exhibit === "pool-table") {
    return {
      target: [p.x, 0.82, p.z],
      yaw: 156,
      pitch: -30,
      dist: 4.4,
      fov: 34,
      fit: 3.4,
      shift: [0.2, 0.03],
      shiftPortrait: [0, 0.27],
    };
  }
  if (project?.exhibit === "screen") {
    return {
      target: [p.x, 1.55, p.z],
      yaw: 168,
      pitch: -4,
      dist: 8.2,
      fov: 34,
      fit: 5.6,
      shift: [0.2, 0.02],
      shiftPortrait: [0, 0.27],
    };
  }
  return {
    target: [p.x, 1.5, p.z],
    yaw: 180,
    pitch: -4,
    dist: 4.6,
    fov: 34,
    fit: 2.6,
    shift: PANEL_SHIFT,
    shiftPortrait: PORTRAIT_SHIFT,
  };
}

const staticFrames: Record<string, Keyframe> = {
  home: {
    target: [0, SCREEN.position[1] - 3, SCREEN.position[2]],
    yaw: 0,
    pitch: 13,
    dist: 96,
    fov: 40,
    fit: 64,
    shift: [0, 0.15],
    shiftPortrait: [0, 0.24],
  },
  about: {
    target: [-0.4, 0.62, PITCH.half - 0.9],
    yaw: 14,
    pitch: -5,
    dist: 5.4,
    fov: 38,
    fit: 2.6,
    shift: [0.2, 0.04],
    shiftPortrait: [0, 0.27],
  },
  statement: {
    target: [0, 0, 4.4],
    yaw: 180,
    pitch: -34,
    dist: 24,
    fov: 30,
    fit: 9,
    shift: [0.16, 0.02],
    shiftPortrait: [0, 0.26],
  },
  facts: {
    target: [-(GROUND.bx + GROUND.boards) + 1.5, 1.2, 10],
    yaw: -150,
    pitch: -1,
    dist: 15,
    fov: 36,
    fit: 9,
    shift: [0.18, 0.02],
    shiftPortrait: [0, 0.27],
  },
  "side-quests": {
    target: [DUGOUT.x + Math.sin(DUGOUT.rotationY) * -0.6, 0.95, DUGOUT.z + Math.cos(DUGOUT.rotationY) * -0.6],
    yaw: (-DUGOUT.rotationY * 180) / Math.PI + 16,
    pitch: -8,
    dist: 6.2,
    fov: 36,
    fit: 6.4,
    shift: [0.16, 0.04],
    shiftPortrait: [0, 0.28],
  },
  strengths: {
    target: [-4, SCREEN.position[1] - 2, SCREEN.position[2]],
    yaw: -12,
    pitch: 10,
    dist: 70,
    fov: 34,
    fit: 50,
    shift: [0.18, 0.04],
    shiftPortrait: [0, 0.26],
  },
  "known-issues": {
    // Hawk-Eye's classic angle: from behind the bowler, down the pitch to the striker's stumps.
    target: [0, 0.55, 4.5],
    yaw: 180,
    pitch: -9,
    dist: 17,
    fov: 30,
    fit: 6,
    shift: [0.16, 0.03],
    shiftPortrait: [0, 0.26],
  },
  contact: {
    target: [0, 22, -30],
    yaw: 0,
    pitch: -4,
    dist: 96,
    fov: 42,
    fit: 110,
    shift: [0, 0.16],
    shiftPortrait: [0, 0.3],
  },
};

export function keyframeFor(id: string): Keyframe {
  if (id.startsWith("interest:")) return interestFrame(id.slice(9) as InterestId);
  if (id.startsWith("journey-")) return journeyFrame(Number(id.slice(8)));
  if (id.startsWith("project:")) {
    const index = projects.findIndex((project) => `project:${project.id}` === id);
    return projectFrame(Math.max(0, index));
  }
  return staticFrames[id] ?? staticFrames.home;
}

export const keyframes: readonly Keyframe[] = stationOrder.map(keyframeFor);

/** Where the opening shot starts: high above the south-west corner, outside the bowl. */
export const INTRO_FROM = {
  position: [-170, 210, 300] as [number, number, number],
  target: [0, 0, -10] as [number, number, number],
  /** A waypoint over the ground, so the camera sweeps in over the crowd. */
  via: [-30, 62, 95] as [number, number, number],
};

export const interestCount = interests.items.length;
export const journeyCount = journey.entries.length;
