import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HTMLAttributes, ReactNode } from "react";
import { createElement, forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { setMediaQueryMatches } from "./test/setup";

const scrollMotionValue = vi.hoisted(() => {
  let current = 0;
  let unsubscribeCount = 0;
  const listeners = new Set<(value: number) => void>();

  return {
    value: {
      get: () => current,
      on: (_event: "change", listener: (value: number) => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
          unsubscribeCount += 1;
        };
      },
    },
    emit(nextValue: number) {
      current = nextValue;
      listeners.forEach((listener) => listener(nextValue));
    },
    reset() {
      current = 0;
      unsubscribeCount = 0;
      listeners.clear();
    },
    listenerCount: () => listeners.size,
    unsubscribeCount: () => unsubscribeCount,
  };
});

vi.mock("motion/react", () => {
  const motionOnlyProps = new Set([
    "animate",
    "exit",
    "initial",
    "layout",
    "transition",
    "viewport",
    "whileInView",
  ]);
  const createMotionElement = (tag: string) => {
    const MotionElement = forwardRef<
      HTMLElement,
      HTMLAttributes<HTMLElement> & Record<string, unknown>
    >((props, ref) => {
          const domProps = Object.fromEntries(
            Object.entries(props).filter(([key]) => !motionOnlyProps.has(key)),
          );

          return createElement(tag, { ...domProps, ref });
    });
    MotionElement.displayName = `TestMotion(${tag})`;
    return MotionElement;
  };
  const componentCache = new Map<
    string,
    ReturnType<typeof createMotionElement>
  >();

  const motion = new Proxy(
    {},
    {
      get(_target, tag: string) {
        const cached = componentCache.get(tag);
        if (cached) return cached;

        const MotionElement = createMotionElement(tag);
        componentCache.set(tag, MotionElement);
        return MotionElement;
      },
    },
  );

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
    MotionConfig: ({ children }: { children: ReactNode }) => children,
    motion,
    useInView: () => false,
    useMotionValue: (initialValue: number) => {
      let value = initialValue;
      return {
        get: () => value,
        set: (nextValue: number) => {
          value = nextValue;
        },
      };
    },
    useScroll: () => ({ scrollYProgress: scrollMotionValue.value }),
    useSpring: <Value,>(value: Value) => value,
  };
});

describe("creative CV application", () => {
  beforeEach(() => {
    scrollMotionValue.reset();
  });

  it("renders the complete one-page profile", () => {
    setMediaQueryMatches("(hover: hover) and (pointer: fine)", true);
    const { container } = render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /10tabsopen\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Profile sections" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".section-shell")).toHaveLength(10);

    [
      "hero",
      "about",
      "interests",
      "side-quests",
      "strengths",
      "bugs",
      "beauty",
      "product-philosophy",
      "rapid-fire",
      "closing",
    ].forEach((sectionId) => {
      expect(container.querySelector(`#${sectionId}`)).toBeInTheDocument();
    });
    expect(container.querySelector("#production")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /production/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /the next tab is already loading/i,
      }),
    ).toBeInTheDocument();
    const video = container.querySelector("#hero video");
    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).not.toHaveAttribute("loop");
    expect((video as HTMLVideoElement).muted).toBe(true);
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "auto");
    expect(container.querySelector(".custom-cursor")).not.toBeInTheDocument();
    expect(container.querySelector("[data-cursor]")).not.toBeInTheDocument();
  });

  it("implements the ARIA tabs keyboard interaction including wrapping", async () => {
    const user = userEvent.setup();
    render(<App />);

    const tablist = screen.getByRole("tablist", { name: "Open interests" });
    const tabs = within(tablist).getAllByRole("tab");

    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    tabs[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: /markets/i }),
    ).toBeInTheDocument();

    await user.keyboard("{End}");
    expect(tabs[4]).toHaveFocus();
    expect(tabs[4]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");
    expect(tabs[4]).toHaveFocus();
    expect(tabs[4]).toHaveAttribute("aria-selected", "true");
  });

  it("announces each bug-control response through the live region", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const bugsSection = container.querySelector("#bugs");

    expect(bugsSection).not.toBeNull();
    const bugUi = within(bugsSection as HTMLElement);
    const liveRegion = bugUi.getByRole("status");

    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(liveRegion).toHaveTextContent("AWAITING USER INPUT_");

    const controls = [
      ["ACKNOWLEDGE", "BUG ACKNOWLEDGED. STILL REPRODUCIBLE."],
      ["PATCH IN PROGRESS", "PATCH QUEUED. ETA: OPTIMISTIC."],
      ["DO NOT ASK FOR ETA", "ETA REMOVED FROM ROADMAP."],
    ] as const;

    for (const [buttonName, response] of controls) {
      await user.click(
        bugUi.getByRole("button", {
          name: new RegExp(buttonName, "i"),
        }),
      );
      expect(liveRegion).toHaveTextContent(response);
    }
  });

  it("shows the scorecard after a case-insensitive CRICKET key sequence", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard("cRiCkEt");

    const scorecard = screen.getByRole("status", {
      name: "Cricket scorecard easter egg",
    });
    expect(scorecard).toHaveTextContent("10 / 0");
    expect(scorecard).toHaveTextContent("CURIOSITY CONFIRMED");

    await user.click(
      within(scorecard).getByRole("button", { name: "Close scorecard" }),
    );
    expect(
      screen.queryByRole("status", {
        name: "Cricket scorecard easter egg",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the CV and LinkedIn actions without an email control", () => {
    render(<App />);

    const linkedInLink = screen.getByRole("link", { name: /linkedin/i });

    expect(linkedInLink).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ashwin-sheoran/",
    );
    expect(linkedInLink).toHaveAttribute("target", "_blank");
    expect(document.querySelector('a[href^="mailto:"]')).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /email/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /view traditional cv/i }),
    ).toHaveAttribute("href", "/Ashwin-Sheoran-CV.pdf");
  });

  it("renders only the hero poster when reduced motion is requested", () => {
    setMediaQueryMatches("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<App />);
    const heroMedia = container.querySelector("#hero .hero-media");

    expect(heroMedia).not.toBeNull();
    expect(heroMedia?.querySelector("video")).not.toBeInTheDocument();
    expect(heroMedia?.querySelector("img")).toHaveAttribute(
      "src",
      "/hero-poster.webp",
    );
    expect(container.querySelector("#hero")).toHaveClass(
      "hero-scroll-container--static",
    );
  });

  it("uses the normal-height poster fallback for narrow layouts", () => {
    setMediaQueryMatches("(hover: hover) and (pointer: fine)", true);
    setMediaQueryMatches("(max-width: 900px)", true);
    const { container } = render(<App />);
    const hero = container.querySelector("#hero");

    expect(hero).toHaveClass("hero-scroll-container--static");
    expect(hero?.querySelector("video")).not.toBeInTheDocument();
    expect(hero?.querySelector("img")).toHaveAttribute(
      "src",
      "/hero-poster.webp",
    );
  });

  it("replaces the scrubber with the poster when video metadata is invalid", () => {
    setMediaQueryMatches("(hover: hover) and (pointer: fine)", true);
    const { container } = render(<App />);
    const video = container.querySelector<HTMLVideoElement>("#hero video");
    expect(video).not.toBeNull();

    Object.defineProperties(video!, {
      duration: { configurable: true, value: Number.NaN },
      readyState: {
        configurable: true,
        value: HTMLMediaElement.HAVE_METADATA,
      },
    });
    fireEvent.loadedMetadata(video!);

    const hero = container.querySelector("#hero");
    expect(hero).toHaveClass("hero-scroll-container--static");
    expect(hero?.querySelector("video")).not.toBeInTheDocument();
    expect(hero?.querySelector("img")).toHaveAttribute(
      "src",
      "/hero-poster.webp",
    );
  });

  it("restores metadata progress, clamps seeks, and cancels queued work on cleanup", () => {
    setMediaQueryMatches("(hover: hover) and (pointer: fine)", true);
    const queuedFrames = new Map<number, FrameRequestCallback>();
    let nextFrameId = 0;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      nextFrameId += 1;
      queuedFrames.set(nextFrameId, callback);
      return nextFrameId;
    });
    const cancelFrame = vi.fn((id: number) => {
      queuedFrames.delete(id);
    });
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);

    const flushFrame = () => {
      const queued = [...queuedFrames.entries()];
      queuedFrames.clear();
      queued.forEach(([, callback]) => callback(performance.now()));
    };

    const { container, unmount } = render(<App />);
    const video = container.querySelector<HTMLVideoElement>("#hero video");
    expect(video).not.toBeNull();

    let currentTime = 0;
    let readyState: number = HTMLMediaElement.HAVE_NOTHING;
    Object.defineProperties(video!, {
      duration: { configurable: true, value: 10 },
      readyState: {
        configurable: true,
        get: () => readyState,
      },
      currentTime: {
        configurable: true,
        get: () => currentTime,
        set: (nextTime: number) => {
          currentTime = nextTime;
        },
      },
    });

    scrollMotionValue.emit(0.6);
    expect(currentTime).toBe(0);

    readyState = HTMLMediaElement.HAVE_METADATA;
    video!.dispatchEvent(new Event("loadedmetadata"));
    flushFrame();
    expect(currentTime).toBeCloseTo(6, 5);

    scrollMotionValue.emit(-1);
    flushFrame();
    expect(currentTime).toBe(0);

    scrollMotionValue.emit(2);
    flushFrame();
    expect(currentTime).toBeCloseTo(10 - 1 / 24, 5);

    scrollMotionValue.emit(0.8);
    expect(queuedFrames.size).toBe(1);
    unmount();

    expect(cancelFrame).toHaveBeenCalledTimes(1);
    expect(scrollMotionValue.listenerCount()).toBe(0);
    expect(scrollMotionValue.unsubscribeCount()).toBeGreaterThanOrEqual(1);
    expect(queuedFrames.size).toBe(0);
  });
});
