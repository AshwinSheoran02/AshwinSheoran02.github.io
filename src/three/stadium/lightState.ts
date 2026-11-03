/*
 * Shared, per-frame lighting state, kept outside React. The switch-on sequence
 * writes it; lights, lamps, beams, screen and sky read it.
 */
export const lights = {
  /** Overall level, 0 (dark) to 1 (match lighting). */
  level: 0,
  /** Each floodlight tower's level, so they can come on one after another. */
  towers: [0, 0, 0, 0],
  /** Light-show flash: 0 normally, pulses when the DO NOT CLICK button is pressed. */
  show: 0,
};
