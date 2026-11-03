import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { GROUND, PITCH } from "./layout";
import { paintTexture, seeded } from "./textures";

/*
 * Painted textures for the stadium. Like the rest of the scene, nothing is
 * downloaded: every surface is drawn on a canvas at startup.
 */

/** World half-extent covered by the outfield texture. */
export const FIELD_EXTENT = 76;

/**
 * The whole playing area in one texture: mowing stripes, the square with its
 * neighbouring strips, worn patches where the bowlers run in.
 */
export function outfieldTexture(scale: number): Texture {
  const size = Math.round(2048 * Math.max(0.5, scale));
  const rand = seeded(404);
  return paintTexture(
    size,
    size,
    (g, w, h) => {
      const toPx = (metres: number) => ((metres + FIELD_EXTENT) / (FIELD_EXTENT * 2)) * w;
      const m = w / (FIELD_EXTENT * 2);
      g.fillStyle = "#24701f";
      g.fillRect(0, 0, w, h);
      // Mowing stripes run along the pitch, alternating light and dark.
      const stripe = 5.6;
      for (let x = -FIELD_EXTENT, i = 0; x < FIELD_EXTENT; x += stripe, i += 1) {
        g.fillStyle = i % 2 ? "#2f8a28" : "#1d5e1a";
        g.fillRect(toPx(x), 0, stripe * m + 1, h);
      }
      // Soft mottling.
      for (let i = 0; i < 2600; i += 1) {
        const r = (0.6 + rand() * 3) * m;
        g.fillStyle = rand() > 0.5 ? "rgba(80,140,50,0.06)" : "rgba(10,40,10,0.07)";
        g.beginPath();
        g.ellipse(rand() * w, rand() * h, r, r * (0.5 + rand()), rand() * 3, 0, Math.PI * 2);
        g.fill();
      }
      // The square: a lighter, tighter-cut rectangle holding several strips.
      const sqW = 22;
      const sqL = 30;
      g.fillStyle = "#3b8a2c";
      g.fillRect(toPx(-sqW / 2), toPx(-sqL / 2), sqW * m, sqL * m);
      for (let k = -3; k <= 3; k += 1) {
        if (k === 0) continue;
        const x = k * 3.05;
        g.fillStyle = Math.abs(k) % 2 ? "rgba(140,150,90,0.35)" : "rgba(120,140,80,0.25)";
        g.fillRect(toPx(x - 1.4), toPx(-12), 2.8 * m, 24 * m);
      }
      // Bowlers' run-ups: worn, sandier grass beyond each end of the pitch.
      for (const end of [-1, 1]) {
        const gradient = g.createLinearGradient(0, toPx(end * 12), 0, toPx(end * 34));
        gradient.addColorStop(0, "rgba(150,140,90,0.55)");
        gradient.addColorStop(1, "rgba(150,140,90,0)");
        g.fillStyle = gradient;
        g.beginPath();
        g.ellipse(toPx(0), toPx(end * 20), 2.2 * m, 12 * m, 0, 0, Math.PI * 2);
        g.fill();
      }
      // 30-yard circle: white discs, like the real thing.
      g.fillStyle = "rgba(245,245,240,0.92)";
      const ring = 27.4;
      for (let a = 0; a < Math.PI * 2; a += 0.052) {
        const cx = Math.cos(a) * ring;
        const cz = Math.sin(a) * ring * 1.05;
        g.beginPath();
        g.arc(toPx(cx), toPx(cz), 0.28 * m, 0, Math.PI * 2);
        g.fill();
      }
      // Beyond the boundary the grass is darker and unmown.
      g.save();
      g.beginPath();
      g.rect(0, 0, w, h);
      g.ellipse(toPx(0), toPx(0), GROUND.bx * m, GROUND.bz * m, 0, 0, Math.PI * 2);
      g.fillStyle = "rgba(10,30,12,0.55)";
      g.fill("evenodd");
      g.restore();
    },
    { anisotropy: 16 },
  );
}

/** Close-up detail: individual blades and soil showing through, tiled many times. */
export function grassDetailTexture(): Texture {
  const rand = seeded(77);
  return paintTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2400; i += 1) {
        const x = rand() * w;
        const y = rand() * h;
        const length = 3 + rand() * 7;
        const angle = -Math.PI / 2 + (rand() - 0.5) * 0.9;
        const shade = 70 + rand() * 120;
        g.strokeStyle = `rgb(${shade},${shade},${shade})`;
        g.lineWidth = 0.6 + rand() * 0.8;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        g.stroke();
      }
    },
    { srgb: false, repeat: [260, 260] },
  );
}

/** The pitch itself: rolled, dry and cracked, with the creases painted in. Long axis is v. */
export function pitchTexture(): Texture {
  const rand = seeded(21);
  const width = 3.6;
  const length = PITCH.length + 2;
  return paintTexture(
    512,
    2048,
    (g, w, h) => {
      const mx = w / width;
      const mz = h / length;
      const X = (metres: number) => (metres + width / 2) * mx;
      const Z = (metres: number) => (metres + length / 2) * mz;
      const base = g.createLinearGradient(0, 0, w, 0);
      base.addColorStop(0, "#9d8f62");
      base.addColorStop(0.18, "#c5b386");
      base.addColorStop(0.5, "#cdbb8f");
      base.addColorStop(0.82, "#c5b386");
      base.addColorStop(1, "#9d8f62");
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      // Grass creeping in at the edges.
      for (let i = 0; i < 1400; i += 1) {
        const side = rand() > 0.5 ? 1 : -1;
        const x = X(side * (1.35 + rand() * 0.45));
        g.fillStyle = `rgba(${70 + rand() * 30},${110 + rand() * 30},${50 + rand() * 20},${0.25 + rand() * 0.4})`;
        g.fillRect(x, rand() * h, 1 + rand() * 3, 2 + rand() * 5);
      }
      // Fine speckle and roller marks.
      for (let i = 0; i < 9000; i += 1) {
        const shade = rand() > 0.5 ? "rgba(255,245,215,0.12)" : "rgba(90,70,40,0.12)";
        g.fillStyle = shade;
        g.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
      }
      // Cracks: short, branching hairlines.
      g.strokeStyle = "rgba(80,62,36,0.55)";
      for (let i = 0; i < 70; i += 1) {
        let x = X((rand() - 0.5) * 2.4);
        let y = rand() * h;
        g.lineWidth = 0.6 + rand() * 0.9;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 6; k += 1) {
          x += (rand() - 0.5) * 22;
          y += (rand() - 0.5) * 30;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      // Footmarks and the scuffed area where the bowlers land, at each end.
      for (const end of [-1, 1]) {
        for (let i = 0; i < 70; i += 1) {
          g.fillStyle = `rgba(110,88,52,${0.15 + rand() * 0.25})`;
          g.beginPath();
          g.ellipse(X((rand() - 0.5) * 1.6), Z(end * (PITCH.half - 1.2 - rand() * 1.8)), 6 + rand() * 8, 10 + rand() * 10, rand() * 3, 0, Math.PI * 2);
          g.fill();
        }
      }
      // Creases.
      g.fillStyle = "rgba(250,250,245,0.96)";
      const line = (x0: number, z0: number, x1: number, z1: number, thickness = 0.05) => {
        const px0 = X(Math.min(x0, x1));
        const pz0 = Z(Math.min(z0, z1));
        const pw = Math.max(thickness * mx, (Math.abs(x1 - x0)) * mx);
        const ph = Math.max(thickness * mz, (Math.abs(z1 - z0)) * mz);
        g.fillRect(px0 - (x0 === x1 ? (thickness * mx) / 2 : 0), pz0 - (z0 === z1 ? (thickness * mz) / 2 : 0), pw, ph);
      };
      for (const end of [-1, 1]) {
        const stumps = end * PITCH.half;
        const popping = stumps - end * 1.22;
        line(-1.32, stumps, 1.32, stumps);
        line(-1.8, popping, 1.8, popping);
        for (const side of [-1, 1]) line(side * 1.32, popping, side * 1.32, stumps + end * 1.0);
      }
    },
    { anisotropy: 16 },
  );
}

/** Four people seen from the field at night: head, shoulders and a shirt, in white so instances can tint them. */
export function crowdTexture(): Texture {
  const texture = paintTexture(
    256,
    96,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      const cell = w / 4;
      for (let i = 0; i < 4; i += 1) {
        const cx = cell * i + cell / 2;
        const shoulders = 20 + i * 2;
        // Body
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.moveTo(cx - shoulders, h);
        g.quadraticCurveTo(cx - shoulders, h * 0.45, cx - shoulders * 0.4, h * 0.42);
        g.lineTo(cx + shoulders * 0.4, h * 0.42);
        g.quadraticCurveTo(cx + shoulders, h * 0.45, cx + shoulders, h);
        g.closePath();
        g.fill();
        // Raised arm on one of them.
        if (i === 2) {
          g.fillRect(cx + shoulders * 0.55, h * 0.05, 7, h * 0.45);
        }
        // Head, a little darker so faces read as skin and hair rather than shirt colour.
        g.fillStyle = "#b9a089";
        g.beginPath();
        g.ellipse(cx, h * 0.3, 10, 12, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#3a2e26";
        g.beginPath();
        g.ellipse(cx, h * 0.23, 10.5, 7, 0, Math.PI, Math.PI * 2);
        g.fill();
      }
    },
    { clamp: true },
  );
  return texture;
}

/** Stepped concrete terraces with seat rows, tiled around each tier. */
export function terraceTexture(): Texture {
  const rand = seeded(9);
  return paintTexture(
    512,
    512,
    (g, w, h) => {
      g.fillStyle = "#2a2f3a";
      g.fillRect(0, 0, w, h);
      const rows = 16;
      const rowH = h / rows;
      for (let r = 0; r < rows; r += 1) {
        const y = r * rowH;
        g.fillStyle = "#3b4352";
        g.fillRect(0, y, w, rowH * 0.18);
        g.fillStyle = "#1a1e26";
        g.fillRect(0, y + rowH * 0.18, w, rowH * 0.1);
        // Seats: blue with the odd orange block.
        for (let s = 0; s < 32; s += 1) {
          const x = s * (w / 32);
          g.fillStyle = (s + r * 3) % 23 === 0 ? "#b5522a" : rand() > 0.96 ? "#1d3d8f" : "#24479e";
          g.fillRect(x + 2, y + rowH * 0.36, w / 32 - 4, rowH * 0.5);
        }
      }
    },
    { repeat: [1, 1] },
  );
}

/** Repeating ribbon of perimeter-board messages. Drawn wide so it can scroll around the ground. */
export function ribbonTexture(messages: readonly string[], height = 128, accent = "#ffd400"): CanvasTexture {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas unavailable");
  // Shrink the type if the whole ribbon would not fit in one canvas.
  let size = Math.round(height * 0.62);
  let gap = height * 1.6;
  let font = "";
  let widths: number[] = [];
  let total = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    font = `800 ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    context.font = font;
    widths = messages.map((message) => context.measureText(message).width + gap);
    total = Math.ceil(widths.reduce((sum, width) => sum + width, 0));
    if (total <= 8192) break;
    const scale = 8192 / total;
    size = Math.floor(size * scale);
    gap *= scale;
  }
  canvas.width = Math.min(8192, Math.max(1024, total));
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#05070d";
  g.fillRect(0, 0, canvas.width, height);
  g.font = font;
  g.textBaseline = "middle";
  let x = gap / 2;
  messages.forEach((message, index) => {
    const colour = index % 3 === 0 ? accent : index % 3 === 1 ? "#ffffff" : "#5ad1ff";
    g.fillStyle = colour;
    g.fillText(message, x, height * 0.54);
    x += widths[index];
    // Separator dot
    g.fillStyle = "#ff3b30";
    g.beginPath();
    g.arc(x - gap / 2, height / 2, height * 0.08, 0, Math.PI * 2);
    g.fill();
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 8;
  return texture;
}

/** Netting for the dugout canopy and practice areas: a fine diamond mesh with alpha. */
export function meshTexture(): Texture {
  return paintTexture(
    128,
    128,
    (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = "rgba(255,255,255,0.9)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(w, h);
      g.moveTo(w, 0);
      g.lineTo(0, h);
      g.stroke();
    },
    { repeat: [40, 10] },
  );
}
