import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

const mediaQueryMatches = new Map<string, boolean>();

export function setMediaQueryMatches(query: string, matches: boolean) {
  mediaQueryMatches.set(query, matches);
}

function createMediaQueryList(query: string): MediaQueryList {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const legacyListeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList = {
    matches: mediaQueryMatches.get(query) ?? false,
    media: query,
    onchange: null,
    addListener(listener: (event: MediaQueryListEvent) => void) {
      legacyListeners.add(listener);
    },
    removeListener(listener: (event: MediaQueryListEvent) => void) {
      legacyListeners.delete(listener);
    },
    addEventListener(
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      listeners.add(listener);
    },
    removeEventListener(
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) {
      listeners.delete(listener);
    },
    dispatchEvent(event: Event) {
      listeners.forEach((listener) => {
        if (typeof listener === "function") {
          listener(event);
        } else {
          listener.handleEvent(event);
        }
      });
      legacyListeners.forEach((listener) => {
        listener(event as MediaQueryListEvent);
      });
      return !event.defaultPrevented;
    },
  };

  return mediaQueryList as MediaQueryList;
}

class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];

  constructor(
    _callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
  }

  disconnect() {}

  observe(target: Element) {
    void target;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(target: Element) {
    void target;
  }
}

class TestResizeObserver implements ResizeObserver {
  disconnect() {}

  observe(target: Element) {
    void target;
  }

  unobserve(target: Element) {
    void target;
  }
}

let animationFrameId = 0;

beforeEach(() => {
  mediaQueryMatches.clear();

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => createMediaQueryList(query)),
  });

  vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  vi.stubGlobal("ResizeObserver", TestResizeObserver);

  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  // jsdom has no WebGL (or 2D canvas): the app must fall back to the still gallery.
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: vi.fn(() => null),
  });

  animationFrameId = 0;
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      void callback;
      animationFrameId += 1;
      return animationFrameId;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
