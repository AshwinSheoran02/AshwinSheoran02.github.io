import type { QualityTier } from "../lib/store";

export interface QualitySettings {
  readonly tier: QualityTier;
  readonly dpr: [number, number];
  readonly shadowMapSize: number;
  /** Shadows from both floodlight keys (the double shadows of a night match), or just one. */
  readonly doubleShadows: boolean;
  readonly postprocessing: boolean;
  readonly bloom: boolean;
  /** Volumetric cones under the floodlights. Fill-rate heavy, so desktop GPUs only. */
  readonly beams: boolean;
  readonly environmentResolution: number;
  readonly textureScale: number;
  /** Spacing of the crowd, in metres between seats and between rows. */
  readonly crowd: { seat: number; row: number; occupancy: number; scale: number };
}

export const qualityPresets: Record<QualityTier, QualitySettings> = {
  high: {
    tier: "high",
    dpr: [1, 1.5],
    shadowMapSize: 2048,
    doubleShadows: true,
    postprocessing: true,
    bloom: true,
    beams: true,
    environmentResolution: 256,
    textureScale: 1,
    crowd: { seat: 0.62, row: 0.9, occupancy: 0.84, scale: 1 },
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.25],
    shadowMapSize: 1024,
    doubleShadows: false,
    postprocessing: true,
    bloom: true,
    beams: false,
    environmentResolution: 128,
    textureScale: 1,
    crowd: { seat: 0.78, row: 1.1, occupancy: 0.88, scale: 1.15 },
  },
  low: {
    tier: "low",
    dpr: [1, 1.25],
    shadowMapSize: 1024,
    doubleShadows: false,
    postprocessing: false,
    bloom: false,
    beams: false,
    environmentResolution: 128,
    textureScale: 0.5,
    crowd: { seat: 1.05, row: 1.5, occupancy: 0.92, scale: 1.65 },
  },
};

interface NavigatorHints extends Navigator {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
}

function rendererName(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name.toLowerCase();
  } catch {
    return "";
  }
}

/** Picks a starting tier from cheap device signals; the runtime monitor can still step down. */
export function detectInitialTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("quality");
  if (forced === "high" || forced === "medium" || forced === "low") return forced;

  const nav = navigator as NavigatorHints;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (coarse || small || nav.connection?.saveData) return "low";

  const renderer = rendererName();
  if (/swiftshader|llvmpipe|software|basic render/.test(renderer)) return "low";

  // Only discrete desktop GPUs get the full treatment. Integrated graphics, Apple
  // silicon included, start on medium; the runtime monitor can still step down.
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const discrete = /nvidia|geforce|rtx|quadro|radeon rx|radeon pro w|arc a\d/.test(renderer);
  if (discrete && memory >= 8 && cores >= 8) return "high";
  return "medium";
}

export function stepDown(tier: QualityTier): QualityTier {
  return tier === "high" ? "medium" : "low";
}
