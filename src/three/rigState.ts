import { Vector3 } from "three";

/** Point the camera is currently looking at; the sun's shadow frustum follows it. */
export const focus = new Vector3(0, 1.5, 0);

/** Live camera position, shared with effects that fade by distance. */
export const eye = new Vector3(0, 1.6, 10);

/** Continuous station value after smoothing; exhibits use it to wake up and settle. */
export const smoothed = { station: 0 };
