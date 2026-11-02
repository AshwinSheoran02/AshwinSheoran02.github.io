import { useSyncExternalStore } from "react";
import type { InterestId } from "../data/profile";

type Listener = () => void;

export interface Store<T> {
  get: () => T;
  set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set: (partial) => {
      const next = typeof partial === "function" ? partial(state) : partial;
      let changed = false;
      for (const key of Object.keys(next) as (keyof T)[]) {
        if (!Object.is(state[key], next[key])) changed = true;
      }
      if (!changed) return;
      state = { ...state, ...next };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T extends object, S>(
  store: Store<T>,
  selector: (state: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

export type RenderMode = "pending" | "webgl" | "static";
export type QualityTier = "high" | "medium" | "low";

export interface UiState {
  activeStation: string;
  interest: InterestId;
  sideQuest: string | null;
  hoveredExhibit: string | null;
  renderMode: RenderMode;
  tier: QualityTier;
  sceneReady: boolean;
  introDone: boolean;
  /** Timestamps (performance.now) that trigger one-off scene reactions. */
  alarmAt: number;
  patchAt: number;
  breakShotAt: number;
}

export const ui = createStore<UiState>({
  activeStation: "home",
  interest: "cricket",
  sideQuest: null,
  hoveredExhibit: null,
  renderMode: "pending",
  tier: "high",
  sceneReady: false,
  introDone: false,
  alarmAt: 0,
  patchAt: 0,
  breakShotAt: 0,
});

export const useUi = <S,>(selector: (state: UiState) => S) =>
  useStore(ui, selector);

/*
 * Values that change every frame are kept outside React entirely and read
 * by the render loop, so scrolling never re-renders components.
 */
export const rig = {
  /** Continuous station position: 2.5 means halfway between stations 2 and 3. */
  station: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
  /** Set by ?capture: the camera cuts straight to stations and the intro is skipped (used to render stills). */
  capture: typeof window !== "undefined" && new URLSearchParams(window.location.search).has("capture"),
};
