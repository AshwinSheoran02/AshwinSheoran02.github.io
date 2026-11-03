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
        g.font = `700 ${id > 9 ? 40 : 46}px "Barlow Condensed", Arial, sans-serif`;
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
      g.font = `800 ${size}px "Barlow Condensed", Arial, sans-serif`;
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

/** Small scoreboard face for the Sports Council artifact. */
export function scoreboardTexture(): Texture {
  return paintTexture(
    256,
    160,
    (g, w, h) => {
      g.fillStyle = "#121a14";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#f2d58a";
      g.font = `700 92px "Barlow Condensed", Arial, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("XI", w / 2, h / 2 + 6);
      g.fillStyle = "rgba(242,213,138,0.6)";
      g.font = `600 20px "Barlow Condensed", sans-serif`;
      g.fillText("FIXTURES", w / 2, 18);
    },
    { clamp: true },
  );
}
