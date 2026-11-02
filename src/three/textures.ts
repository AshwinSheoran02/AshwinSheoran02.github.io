import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/*
 * Every texture in the scene is painted procedurally at startup, so the site
 * downloads no image files for the 3D world.
 */

export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

interface TextureOptions {
  srgb?: boolean;
  repeat?: [number, number];
  clamp?: boolean;
  anisotropy?: number;
}

export function paintTexture(
  width: number,
  height: number,
  paint: Painter,
  { srgb = true, repeat, clamp = false, anisotropy = 8 }: TextureOptions = {},
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(4, Math.round(width));
  canvas.height = Math.max(4, Math.round(height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas unavailable");
  paint(context, canvas.width, canvas.height);
  const texture = new CanvasTexture(canvas);
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.minFilter = LinearMipmapLinearFilter;
  if (clamp) {
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  } else {
    texture.wrapS = texture.wrapT = RepeatWrapping;
  }
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  return texture;
}

function speckle(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
  count: number,
  colors: readonly string[],
  minSize: number,
  maxSize: number,
) {
  for (let i = 0; i < count; i += 1) {
    g.fillStyle = colors[Math.floor(rand() * colors.length)];
    const size = minSize + rand() * (maxSize - minSize);
    g.beginPath();
    g.ellipse(rand() * w, rand() * h, size, size * (0.6 + rand() * 0.6), rand() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
}

function grain(g: CanvasRenderingContext2D, w: number, h: number, rand: () => number, amount: number) {
  const image = g.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  g.putImageData(image, 0, 0);
}

function clouds(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
  count: number,
  color: string,
  alpha: number,
  radius: number,
) {
  g.save();
  for (let i = 0; i < count; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const r = radius * (0.4 + rand());
    const gradient = g.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = alpha * (0.4 + rand() * 0.6);
    g.fillStyle = gradient;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.restore();
}

export function plasterTexture(scale: number): Texture {
  const rand = seeded(11);
  const size = 512 * scale;
  return paintTexture(size, size, (g, w, h) => {
    g.fillStyle = "#ebe4d8";
    g.fillRect(0, 0, w, h);
    clouds(g, w, h, rand, 40, "#e2d9cb", 0.12, w * 0.3);
    clouds(g, w, h, rand, 30, "#f3eee6", 0.12, w * 0.25);
    grain(g, w, h, rand, 7);
  });
}

/** A roughness map with soft mottling so reflections break up like real polished concrete. */
export function floorRoughnessTexture(scale: number): Texture {
  const rand = seeded(23);
  const size = 512 * scale;
  return paintTexture(
    size,
    size,
    (g, w, h) => {
      g.fillStyle = "rgb(120,120,120)";
      g.fillRect(0, 0, w, h);
      clouds(g, w, h, rand, 90, "rgb(210,210,210)", 0.45, w * 0.16);
      clouds(g, w, h, rand, 60, "rgb(40,40,40)", 0.35, w * 0.12);
      grain(g, w, h, rand, 18);
    },
    { srgb: false },
  );
}

export function floorColorTexture(scale: number): Texture {
  const rand = seeded(29);
  const size = 1024 * scale;
  return paintTexture(size, size, (g, w, h) => {
    g.fillStyle = "#b9b0a3";
    g.fillRect(0, 0, w, h);
    clouds(g, w, h, rand, 60, "#a59b8d", 0.4, w * 0.14);
    speckle(g, w, h, rand, 2600 * scale, ["#8d8478", "#d6cec2", "#7a7064", "#c9bfae"], 0.6, 2.2);
    speckle(g, w, h, rand, 140 * scale, ["#6f665b", "#e2dacd", "#9a8f80"], 2, 5);
    grain(g, w, h, rand, 8);
  });
}

export function travertineTexture(scale: number): Texture {
  const rand = seeded(31);
  return paintTexture(1024 * scale, 512 * scale, (g, w, h) => {
    g.fillStyle = "#e9dfcc";
    g.fillRect(0, 0, w, h);
    // Long, soft bedding planes.
    for (let i = 0; i < 46; i += 1) {
      const y = rand() * h;
      const thickness = (2 + rand() * 16) * scale;
      g.fillStyle = rand() < 0.55 ? "rgba(205,188,158,0.22)" : "rgba(248,242,230,0.35)";
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.003 + i) * 5 * scale);
      g.lineTo(w, y + thickness);
      for (let x = w; x >= 0; x -= 32) g.lineTo(x, y + thickness + Math.sin(x * 0.003 + i) * 5 * scale);
      g.closePath();
      g.fill();
    }
    // Small elongated pores, aligned with the bedding.
    for (let i = 0; i < 160 * scale; i += 1) {
      const rx = (1 + rand() * 3.2) * scale;
      g.fillStyle = `rgba(160,140,108,${0.18 + rand() * 0.22})`;
      g.beginPath();
      g.ellipse(rand() * w, rand() * h, rx * 2.8, rx * 0.45, 0, 0, Math.PI * 2);
      g.fill();
    }
    grain(g, w, h, rand, 6);
  });
}

export function walnutTexture(scale: number): Texture {
  const rand = seeded(41);
  return paintTexture(1024 * scale, 256 * scale, (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#4a2614");
    gradient.addColorStop(0.5, "#5a2f18");
    gradient.addColorStop(1, "#43210f");
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 170; i += 1) {
      const y0 = rand() * h;
      const amplitude = (2 + rand() * 7) * scale;
      const frequency = 0.002 + rand() * 0.01;
      const phase = rand() * 6;
      g.strokeStyle =
        rand() < 0.6
          ? `rgba(20,8,3,${0.15 + rand() * 0.3})`
          : `rgba(150,85,45,${0.08 + rand() * 0.15})`;
      g.lineWidth = (0.6 + rand() * 1.8) * scale;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * frequency + phase) * amplitude + Math.sin(x * frequency * 3.1) * amplitude * 0.3;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

export function feltTexture(scale: number): Texture {
  const rand = seeded(53);
  const size = 512 * scale;
  return paintTexture(size, size, (g, w, h) => {
    const image = g.createImageData(w, h);
    for (let i = 0; i < w * h; i += 1) {
      const v = 200 + (rand() - 0.5) * 26;
      image.data[i * 4] = v;
      image.data[i * 4 + 1] = v;
      image.data[i * 4 + 2] = v;
      image.data[i * 4 + 3] = 255;
    }
    g.putImageData(image, 0, 0);
    g.globalAlpha = 0.05;
    for (let i = 0; i < 2600 * scale; i += 1) {
      g.strokeStyle = rand() < 0.5 ? "#fff" : "#000";
      g.beginPath();
      const x = rand() * w;
      const y = rand() * h;
      const a = rand() * Math.PI;
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6);
      g.stroke();
    }
  });
}

/** Fine noise used as a bump map for leather and painted surfaces. */
export function noiseTexture(seed: number, size = 256): Texture {
  const rand = seeded(seed);
  return paintTexture(
    size,
    size,
    (g, w, h) => {
      const image = g.createImageData(w, h);
      for (let i = 0; i < w * h; i += 1) {
        const v = 128 + (rand() - 0.5) * 120;
        image.data[i * 4] = v;
        image.data[i * 4 + 1] = v;
        image.data[i * 4 + 2] = v;
        image.data[i * 4 + 3] = 255;
      }
      g.putImageData(image, 0, 0);
    },
    { srgb: false },
  );
}

/** The bright late-afternoon garden seen through the windows. */
export function skyTexture(): Texture {
  const rand = seeded(61);
  return paintTexture(
    1024,
    256,
    (g, w, h) => {
      const gradient = g.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#fff6e8");
      gradient.addColorStop(0.55, "#ffe9c9");
      gradient.addColorStop(1, "#f3d3a6");
      g.fillStyle = gradient;
      g.fillRect(0, 0, w, h);
      // Soft, defocused foliage low in the frame.
      clouds(g, w, h * 1.6, rand, 90, "rgba(196,160,104,1)", 0.28, h * 0.32);
      clouds(g, w, h * 1.5, rand, 50, "rgba(150,140,96,1)", 0.18, h * 0.22);
    },
    { clamp: false },
  );
}

const POOL_BALL_COLORS: Record<number, string> = {
  1: "#f3b61b",
  2: "#1f4fb8",
  3: "#d4291f",
  4: "#5b2d91",
  5: "#f2701c",
  6: "#16804a",
  7: "#8f2420",
  8: "#141414",
};

export function poolBallTexture(id: number): Texture {
  return paintTexture(
    512,
    256,
    (g, w, h) => {
      const ivory = "#f5f1e6";
      if (id === 0) {
        g.fillStyle = ivory;
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#c4231c";
        for (const x of [64, 192, 320, 448]) {
          g.beginPath();
          g.arc(x, h / 2, 8, 0, Math.PI * 2);
          g.fill();
        }
        return;
      }
      const color = POOL_BALL_COLORS[id > 8 ? id - 8 : id];
      if (id > 8) {
        g.fillStyle = ivory;
        g.fillRect(0, 0, w, h);
        g.fillStyle = color;
        g.fillRect(0, h * 0.27, w, h * 0.46);
      } else {
        g.fillStyle = color;
        g.fillRect(0, 0, w, h);
      }
      for (const cx of [w * 0.25, w * 0.75]) {
        g.fillStyle = ivory;
        g.beginPath();
        g.ellipse(cx, h / 2, 36, 34, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#16120f";
        g.font = `700 ${id > 9 ? 40 : 46}px "Bricolage Grotesque Variable", Arial, sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(String(id), cx, h / 2 + 2);
        if (id === 6 || id === 9) g.fillRect(cx - 9, h / 2 + 22, 18, 3);
      }
    },
    { clamp: false },
  );
}

export function keycapTexture(legend: string, base: string, ink: string): Texture {
  return paintTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      g.fillStyle = ink;
      g.textAlign = "center";
      g.textBaseline = "middle";
      const size = legend.length > 2 ? 80 : 150;
      g.font = `800 ${size}px "Bricolage Grotesque Variable", Arial, sans-serif`;
      g.fillText(legend, w / 2, h / 2 + 4);
    },
    { clamp: true },
  );
}

export function codeScreenTexture(): Texture {
  const rand = seeded(71);
  return paintTexture(
    512,
    320,
    (g, w, h) => {
      g.fillStyle = "#16130f";
      g.fillRect(0, 0, w, h);
      const palette = ["#e9b872", "#c9d3c0", "#d98a6c", "#8fb3a6", "#f0e6d2"];
      let y = 22;
      while (y < h - 10) {
        let x = 20 + Math.floor(rand() * 4) * 18;
        const tokens = 2 + Math.floor(rand() * 5);
        for (let i = 0; i < tokens && x < w - 30; i += 1) {
          const width = 18 + rand() * 70;
          g.fillStyle = palette[Math.floor(rand() * palette.length)];
          g.globalAlpha = 0.85;
          g.fillRect(x, y, width, 7);
          x += width + 9;
        }
        y += 17;
      }
      g.globalAlpha = 1;
    },
    { clamp: true },
  );
}

/** Crack network for the kintsugi vessel: the colour, metalness and roughness all come from one drawing. */
export function kintsugiTextures(scale: number) {
  const rand = seeded(83);
  const width = 1024 * scale;
  const height = 512 * scale;
  const paths: [number, number][][] = [];
  for (let i = 0; i < 7; i += 1) {
    let x = rand() * width;
    let y = rand() < 0.5 ? 0 : rand() * height;
    const path: [number, number][] = [[x, y]];
    const steps = 18 + Math.floor(rand() * 16);
    let angle = Math.PI / 2 + (rand() - 0.5) * 0.9;
    for (let s = 0; s < steps; s += 1) {
      angle += (rand() - 0.5) * 0.9;
      x += Math.cos(angle) * 22 * scale;
      y += Math.sin(angle) * 22 * scale;
      path.push([x, y]);
      if (rand() < 0.12) {
        paths.push([
          [x, y],
          [x + (rand() - 0.5) * 120 * scale, y + rand() * 90 * scale],
        ]);
      }
    }
    paths.push(path);
  }
  const drawCracks = (g: CanvasRenderingContext2D, lineWidth: number, color: string) => {
    g.strokeStyle = color;
    g.lineWidth = lineWidth;
    g.lineJoin = "round";
    g.lineCap = "round";
    for (const path of paths) {
      g.beginPath();
      path.forEach(([px, py], index) => {
        const wrapped = ((px % width) + width) % width;
        if (index === 0) g.moveTo(wrapped, py);
        else g.lineTo(wrapped, py);
      });
      g.stroke();
    }
  };
  const map = paintTexture(width, height, (g, w, h) => {
    const gradient = g.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#1c1b1a");
    gradient.addColorStop(1, "#2a2724");
    g.fillStyle = gradient;
    g.fillRect(0, 0, w, h);
    clouds(g, w, h, rand, 40, "#3a3631", 0.35, w * 0.08);
    drawCracks(g, 5 * scale, "#d6a84f");
  });
  const metalness = paintTexture(
    width,
    height,
    (g, w, h) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, w, h);
      drawCracks(g, 5 * scale, "#fff");
    },
    { srgb: false },
  );
  const roughness = paintTexture(
    width,
    height,
    (g, w, h) => {
      g.fillStyle = "rgb(70,70,70)";
      g.fillRect(0, 0, w, h);
      drawCracks(g, 5 * scale, "rgb(40,40,40)");
    },
    { srgb: false },
  );
  return { map, metalness, roughness };
}

/** Small scoreboard face for the Sports Council artifact. */
export function scoreboardTexture(): Texture {
  return paintTexture(
    256,
    160,
    (g, w, h) => {
      g.fillStyle = "#121a14";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#f2d58a";
      g.font = `700 92px "Bricolage Grotesque Variable", Arial, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("XI", w / 2, h / 2 + 6);
      g.fillStyle = "rgba(242,213,138,0.6)";
      g.font = `500 18px "IBM Plex Mono", monospace`;
      g.fillText("FIXTURES", w / 2, 18);
    },
    { clamp: true },
  );
}
