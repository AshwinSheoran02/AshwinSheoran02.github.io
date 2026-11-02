import type { QualityTier } from "../lib/store";

export interface QualitySettings {
  readonly tier: QualityTier;
  readonly dpr: [number, number];
  /** Planar floor reflections (an extra scene render), or false for env-only reflections. */
  readonly reflector: false | { resolution: number; blur: [number, number] };
  readonly shadowMapSize: number;
  readonly postprocessing: boolean;
  readonly ambientOcclusion: boolean;
  readonly bloom: boolean;
  /** Real refraction for glass. Off means glass falls back to a cheaper transparent shader. */
  readonly transmission: boolean;
  readonly lightShafts: boolean;
  readonly dust: boolean;
  readonly environmentResolution: number;
  readonly textureScale: number;
  /** How far ahead and behind the camera exhibits stay mounted in the render list. */
  readonly drawDistance: number;
}

export const qualityPresets: Record<QualityTier, QualitySettings> = {
  high: {
    tier: "high",
    dpr: [1, 1.75],
    reflector: { resolution: 1024, blur: [400, 120] },
    shadowMapSize: 2048,
    postprocessing: true,
    ambientOcclusion: true,
    bloom: true,
    transmission: true,
    lightShafts: true,
    dust: true,
    environmentResolution: 256,
    textureScale: 1,
    drawDistance: 46,
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.35],
    reflector: { resolution: 512, blur: [300, 90] },
    shadowMapSize: 1024,
    postprocessing: true,
    ambientOcclusion: false,
    bloom: true,
    transmission: true,
    lightShafts: true,
    dust: true,
    environmentResolution: 256,
    textureScale: 1,
    drawDistance: 40,
  },
  low: {
    tier: "low",
    dpr: [1, 1.5],
    reflector: false,
    shadowMapSize: 1024,
    postprocessing: false,
    ambientOcclusion: false,
    bloom: false,
    transmission: false,
    lightShafts: true,
    dust: false,
    environmentResolution: 128,
    textureScale: 0.5,
    drawDistance: 34,
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

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (memory <= 4 || cores <= 4) return "medium";
  if (/intel/.test(renderer) && !/arc|iris xe/.test(renderer)) return "medium";
  return "high";
}

export function stepDown(tier: QualityTier): QualityTier {
  return tier === "high" ? "medium" : "low";
}
