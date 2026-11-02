import { interests, journey, projects } from "../data/profile";
import { stationOrder } from "../data/stations";

/*
 * World layout. The gallery is one long daylit hall running down the -Z axis.
 * Windows are on the left wall (x = -8); the sun comes in through them.
 * Units are metres.
 */
export const HALL = {
  halfWidth: 8,
  height: 8,
  bay: 7,
  zStart: 16,
  windowBottom: 0.7,
  windowTop: 6.6,
  windowWidth: 4.2,
} as const;

/** Direction pointing towards the sun (late afternoon, low and from the left). */
export const SUN_DIRECTION: [number, number, number] = (() => {
  const v = [-1, 0.37, 0.24];
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length] as [number, number, number];
})();

export const Z = {
  home: 0,
  about: -18,
  interests: -36,
  statement: -50,
  facts: -61,
  journey: (index: number) => -73 - index * 6.5,
  sideQuests: -111,
  strengths: -123,
  issues: -134,
  project: (index: number) => -148 - index * 15,
};

export const Z_CONTACT = Z.project(projects.length - 1) - 20;
export const Z_END = Z_CONTACT - 9;

export const interestCount = interests.items.length;

export function interestPedestal(index: number) {
  const offset = index - (interestCount - 1) / 2;
  const x = offset * 1.9;
  const z = Z.interests - 1.4 + 0.42 * offset * offset;
  const rotationY = Math.atan2(-x, Z.interests + 6 - z) * 0.85;
  return { x, z, rotationY, height: 1.05 };
}

export const MONOLITH_HEIGHTS = [1.35, 1.85, 2.35, 2.85, 3.35];

export function monolith(index: number) {
  return {
    x: 3.1,
    z: Z.journey(index),
    height: MONOLITH_HEIGHTS[index] ?? 2,
    rotationY: -0.38,
  };
}

export function projectPosition(index: number) {
  return { x: 1.4, z: Z.project(index) };
}

export interface Keyframe {
  /** Point the camera looks at. */
  target: [number, number, number];
  /** Degrees. 0 looks down -Z, positive turns towards +X. */
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

function journeyFrame(index: number): Keyframe {
  const m = monolith(index);
  return {
    target: [m.x - 0.2, m.height * 0.55, m.z],
    yaw: 26,
    pitch: -2,
    dist: 6.6 + m.height * 0.7,
    fov: 34,
    fit: 3.2,
    shift: PANEL_SHIFT,
    shiftPortrait: [0.05, 0.27],
  };
}

function projectFrame(index: number): Keyframe {
  const project = projects[index];
  const p = projectPosition(index);
  if (project?.exhibit === "wizarding-board") {
    return {
      target: [p.x, 0.86, p.z],
      yaw: -8,
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
      yaw: 24,
      pitch: -30,
      dist: 4.4,
      fov: 34,
      fit: 3.4,
      shift: [0.2, 0.03],
      shiftPortrait: [0, 0.27],
    };
  }
  return {
    target: [p.x, 1.5, p.z],
    yaw: 0,
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
    target: [0, 1.25, Z.home],
    yaw: 0,
    pitch: -1,
    dist: 12,
    fov: 30,
    fit: 11.6,
    shift: [0, 0.2],
    shiftPortrait: [0, 0.27],
  },
  about: {
    target: [2.6, 1.45, Z.about - 0.8],
    yaw: 34,
    pitch: -2,
    dist: 8.2,
    fov: 34,
    fit: 6,
    shift: [0.17, 0.02],
    shiftPortrait: [0, 0.27],
  },
  interests: {
    target: [0, 1.05, Z.interests - 1],
    yaw: 0,
    pitch: -9,
    dist: 7.6,
    fov: 34,
    fit: 9.2,
    shift: [0.17, 0.04],
    shiftPortrait: [0, 0.27],
  },
  statement: {
    target: [7.9, 3.3, Z.statement - 0.5],
    yaw: 66,
    pitch: 3,
    dist: 10,
    fov: 34,
    fit: 9,
    shift: [0.16, 0],
    shiftPortrait: [0, 0.26],
  },
  facts: {
    target: [-1.6, 1.7, Z.facts],
    yaw: -16,
    pitch: -1,
    dist: 6.6,
    fov: 36,
    fit: 3,
    shift: [0.2, 0.02],
    shiftPortrait: [0, 0.27],
  },
  "side-quests": {
    target: [1.2, 1.05, Z.sideQuests],
    yaw: 8,
    pitch: -14,
    dist: 4.6,
    fov: 34,
    fit: 5.4,
    shift: [0.16, 0.05],
    shiftPortrait: [0, 0.28],
  },
  strengths: {
    target: [2.8, 1.45, Z.strengths],
    yaw: 14,
    pitch: -3,
    dist: 6.8,
    fov: 34,
    fit: 4.4,
    shift: PANEL_SHIFT,
    shiftPortrait: PORTRAIT_SHIFT,
  },
  "known-issues": {
    target: [2.1, 1.38, Z.issues],
    yaw: 10,
    pitch: -6,
    dist: 4.1,
    fov: 32,
    fit: 1.8,
    shift: PANEL_SHIFT,
    shiftPortrait: PORTRAIT_SHIFT,
  },
  contact: {
    target: [0, 2.9, Z_END],
    yaw: 0,
    pitch: 2,
    dist: 15,
    fov: 36,
    fit: 10.5,
    shift: [0, 0.24],
    shiftPortrait: [0, 0.3],
  },
};

export function interestFrame(index: number): Keyframe {
  const p = interestPedestal(index);
  return {
    target: [p.x, p.height + 0.2, p.z],
    // Look across the arc, so the other pedestals form the background.
    yaw: -p.x * 3.2,
    pitch: -13,
    dist: 3.9,
    fov: 32,
    fit: 1.6,
    shift: [0.19, 0.02],
    shiftPortrait: [0, 0.28],
  };
}

export function keyframeFor(id: string): Keyframe {
  if (id.startsWith("journey-")) return journeyFrame(Number(id.slice(8)));
  if (id.startsWith("project:")) {
    const index = projects.findIndex((project) => `project:${project.id}` === id);
    return projectFrame(Math.max(0, index));
  }
  return staticFrames[id] ?? staticFrames.home;
}

export const keyframes: readonly Keyframe[] = stationOrder.map(keyframeFor);

/** Rough z of each station, used to decide which exhibits are close enough to draw. */
export const stationZ: readonly number[] = keyframes.map((frame) => frame.target[2]);

export const journeyCount = journey.entries.length;
