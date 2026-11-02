import { useEffect } from "react";
import { rig, ui } from "../lib/store";

/*
 * Maps the page's scroll position onto the tour. Each [data-station] element
 * is an anchor; when its centre is at the centre of the viewport the camera
 * sits exactly at that station. Between anchors the value eases, holding
 * still while the visitor reads and moving during the gaps.
 */
const HOLD = 0.16;

function ease(fraction: number) {
  const t = Math.min(1, Math.max(0, (fraction - HOLD) / (1 - HOLD * 2)));
  return t * t * (3 - 2 * t);
}

export function useStationTracking() {
  useEffect(() => {
    let anchors: number[] = [];
    let ids: string[] = [];
    let frame = 0;
    let locked = false;

    const measure = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-station]"));
      const viewport = window.innerHeight;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
      ids = elements.map((element) => element.dataset.station ?? "");
      anchors = elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const centre = top + Math.min(rect.height, viewport * 1.4) / 2 - viewport / 2;
        return Math.min(maxScroll, Math.max(0, centre));
      });
      // Keep anchors strictly increasing so every station gets a share of the scroll.
      for (let i = 1; i < anchors.length; i += 1) {
        if (anchors[i] <= anchors[i - 1]) anchors[i] = anchors[i - 1] + 1;
      }
      update();
    };

    const update = () => {
      frame = 0;
      if (!anchors.length || locked) return;
      const y = window.scrollY;
      let station = 0;
      if (y >= anchors[anchors.length - 1]) {
        station = anchors.length - 1;
      } else if (y > anchors[0]) {
        for (let i = 0; i < anchors.length - 1; i += 1) {
          if (y < anchors[i + 1]) {
            station = i + ease((y - anchors[i]) / (anchors[i + 1] - anchors[i]));
            break;
          }
        }
      }
      rig.station = station;
      const active = ids[Math.round(station)] ?? ids[0];
      if (active) ui.set({ activeStation: active });
    };

    const onScroll = () => {
      if (rig.capture) return;
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    measure();
    if (rig.capture) {
      // Lets the still renderer jump straight to a station without scrolling.
      (window as Window & { __gallery?: unknown }).__gallery = {
        stations: () => [...ids],
        go: (id: string) => {
          const index = ids.indexOf(id);
          if (index < 0) return false;
          locked = true;
          rig.station = index;
          document.querySelector(`[data-station="${id}"]`)?.scrollIntoView({ block: "center", behavior: "instant" });
          ui.set({ activeStation: id });
          return true;
        },
      };
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}
