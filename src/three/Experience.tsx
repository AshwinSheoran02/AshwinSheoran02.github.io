import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, events as createPointerEvents } from "@react-three/fiber";
import { Component, useEffect, useState, type ReactNode } from "react";
import { PCFShadowMap } from "three";
import { rig, ui, type QualityTier } from "../lib/store";
import { qualityPresets, stepDown } from "./quality";
import { World } from "./World";

class SceneBoundary extends Component<{ onError: (reason: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : "scene error");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const loads = [
    document.fonts.load('600 40px "Bricolage Grotesque Variable"'),
    document.fonts.load('600 40px "Newsreader Variable"'),
    document.fonts.load('500 20px "IBM Plex Mono"'),
  ];
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 2500));
  return Promise.race([Promise.all(loads).then(() => undefined), timeout]).catch(() => undefined);
}

/** Only interactions that start on empty parts of the page reach the 3D exhibits. */
function eventsReachScene(target: EventTarget | null) {
  return !(target instanceof Element && target.closest("[data-ui]"));
}

/*
 * The canvas sits behind the page, so pointer events are read from the body.
 * Anything over text, buttons or the navigation is kept away from the scene.
 */
function filteredEvents(store: Parameters<typeof createPointerEvents>[0]) {
  const manager = createPointerEvents(store);
  const handlers = manager.handlers as unknown as Record<string, (event: Event) => void>;
  const wrapped: Record<string, (event: Event) => void> = {};
  for (const [name, handler] of Object.entries(handlers)) {
    wrapped[name] = (event: Event) => {
      if (eventsReachScene(event.target)) {
        handler(event);
      } else if (name === "onPointerMove") {
        handlers.onPointerLeave?.(event);
      }
    };
  }
  return { ...manager, handlers: wrapped as unknown as typeof manager.handlers };
}

export default function Experience({
  initialTier,
  onFailure,
}: {
  initialTier: QualityTier;
  onFailure: (reason: string) => void;
}) {
  const [tier, setTier] = useState<QualityTier>(initialTier);
  const [fontsReady, setFontsReady] = useState(false);
  const quality = qualityPresets[tier];
  const antialiased = !qualityPresets[initialTier].postprocessing;

  useEffect(() => {
    let alive = true;
    waitForFonts().then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    ui.set({ tier });
  }, [tier]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const move = (event: PointerEvent) => {
      if (!fine.matches) return;
      rig.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      rig.pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  if (!fontsReady) return null;

  return (
    <SceneBoundary onError={onFailure}>
      <Canvas
        className="stage-canvas"
        shadows={{ type: PCFShadowMap }}
        dpr={quality.dpr}
        gl={{
          antialias: antialiased,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 34, near: 0.08, far: 150, position: [0, 6, 22] }}
        eventSource={document.body}
        eventPrefix="client"
        events={filteredEvents}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.setAttribute("aria-hidden", "true");
          canvas.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            onFailure("context lost");
          });
        }}
        onPointerMissed={() => {
          document.body.style.cursor = "";
        }}
      >
        <PerformanceMonitor
          bounds={() => [42, 120]}
          flipflops={3}
          onDecline={() => setTier((current) => (current === "low" ? current : stepDown(current)))}
        />
        <World
          quality={quality}
          antialiased={antialiased}
          onReady={() => ui.set({ sceneReady: true })}
        />
      </Canvas>
    </SceneBoundary>
  );
}

