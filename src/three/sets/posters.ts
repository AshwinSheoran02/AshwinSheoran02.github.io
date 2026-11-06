import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import type { Project } from "../../data/profile";
import { seeded } from "../textures";

/*
 * Title screens for projects shown on an LED screen. Ridgeline gets its own
 * art, drawn from the game's loading screen: a pale Himalayan sky, snow on the
 * ridges, strings of prayer flags and Tirthkot's houses stacked up the hill.
 */
const FONT = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
const FLAGS = ["#f4f1e6", "#d8312a", "#2f8f4a", "#e9b62e", "#2c58b8"];

function ridgeline(g: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seeded(73);
  const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, "#5f86c4");
  sky.addColorStop(1, "#c9d8ec");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  // Soft clouds.
  for (let i = 0; i < 38; i += 1) {
    g.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.35})`;
    g.beginPath();
    g.ellipse(rand() * w, rand() * h * 0.35, 40 + rand() * 120, 14 + rand() * 30, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Ridges, back to front, the far ones capped with snow.
  const ridge = (base: number, amp: number, colour: string, snow: boolean, seed: number) => {
    const r = seeded(seed);
    const phase = r() * 6;
    const points: [number, number][] = [];
    for (let x = 0; x <= w; x += 8) points.push([x, base - amp * (0.6 * Math.sin(x / w * 5 + phase) + 0.4 * Math.sin(x / w * 13 + phase * 2))]);
    g.fillStyle = colour;
    g.beginPath();
    g.moveTo(0, h);
    points.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(w, h);
    g.fill();
    if (snow) {
      g.fillStyle = "rgba(250,252,255,0.92)";
      g.beginPath();
      points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      for (let i = points.length - 1; i >= 0; i -= 1) g.lineTo(points[i][0], points[i][1] + 16 + Math.sin(i) * 6);
      g.fill();
    }
  };
  ridge(h * 0.42, h * 0.08, "#8796b8", true, 1);
  ridge(h * 0.52, h * 0.06, "#6e7f9f", true, 2);
  ridge(h * 0.66, h * 0.05, "#3e5a45", false, 3);
  // Pines on the near slope.
  for (let i = 0; i < 70; i += 1) {
    const x = rand() * w;
    const y = h * (0.6 + rand() * 0.1);
    const s = 10 + rand() * 16;
    g.fillStyle = rand() > 0.5 ? "#2c4535" : "#35523c";
    g.beginPath();
    g.moveTo(x, y - s * 2);
    g.lineTo(x + s * 0.6, y);
    g.lineTo(x - s * 0.6, y);
    g.fill();
  }
  // The town: rows of small houses climbing the hill.
  const houses = ["#b8584a", "#c9a24b", "#8aa36a", "#a67a9f", "#6f8fb5", "#d9d1c0", "#9a6b45"];
  for (let row = 0; row < 6; row += 1) {
    const y = h * (0.66 + row * 0.055);
    for (let x = w * 0.1 - row * 20; x < w * 0.92; x += 34 + rand() * 18) {
      const hw = 26 + rand() * 12;
      const hh = 18 + rand() * 8;
      g.fillStyle = houses[Math.floor(rand() * houses.length)];
      g.fillRect(x, y - hh, hw, hh);
      g.fillStyle = "#5b3a30";
      g.fillRect(x - 2, y - hh - 4, hw + 4, 5);
      g.fillStyle = "rgba(30,30,40,0.55)";
      g.fillRect(x + hw * 0.2, y - hh * 0.65, hw * 0.22, hh * 0.35);
      g.fillRect(x + hw * 0.58, y - hh * 0.65, hw * 0.22, hh * 0.35);
    }
  }
  // Prayer flags strung across the sky.
  const string = (x0: number, y0: number, x1: number, y1: number, sag: number) => {
    g.strokeStyle = "rgba(40,40,40,0.6)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
    g.stroke();
    for (let t = 0.02, i = 0; t < 0.98; t += 0.028, i += 1) {
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;
      g.fillStyle = FLAGS[i % FLAGS.length];
      g.fillRect(x - 8, y, 16, 20);
    }
  };
  string(-20, h * 0.12, w * 0.62, h * 0.2, h * 0.05);
  string(w * 0.38, h * 0.05, w + 20, h * 0.15, h * 0.06);
  // Title block.
  const shade = g.createLinearGradient(0, h * 0.55, 0, h);
  shade.addColorStop(0, "rgba(10,14,20,0)");
  shade.addColorStop(1, "rgba(10,14,20,0.85)");
  g.fillStyle = shade;
  g.fillRect(0, h * 0.55, w, h * 0.45);
  g.fillStyle = "#e9b62e";
  g.fillRect(48, h * 0.7, 40, 5);
  g.font = `700 ${h * 0.045}px ${FONT}`;
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "6px";
  g.fillText("RIDGELINE · TEAM DEATHMATCH", 102, h * 0.718);
  (g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  g.fillStyle = "#f6f0e2";
  g.font = `800 ${h * 0.2}px ${FONT}`;
  g.fillText("Tirthkot", 44, h * 0.9);
  g.font = `500 ${h * 0.04}px ${FONT}`;
  g.fillStyle = "#e6e0d2";
  g.fillText("A hill town stacked above the river ghats", 50, h * 0.96);
}

function generic(g: CanvasRenderingContext2D, w: number, h: number, project: Project) {
  const background = g.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, "#06102c");
  background.addColorStop(1, "#0a1f55");
  g.fillStyle = background;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#ffd400";
  g.font = `italic 900 ${h * 0.16}px ${FONT}`;
  g.fillText(project.title.toUpperCase(), 48, h * 0.5, w - 96);
  g.fillStyle = "#ffffff";
  g.font = `700 ${h * 0.06}px ${FONT}`;
  g.fillText(project.medium.toUpperCase(), 52, h * 0.62, w - 96);
}

export function posterTexture(project: Project): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const g = canvas.getContext("2d")!;
  if (project.id === "ridgeline") ridgeline(g, canvas.width, canvas.height);
  else generic(g, canvas.width, canvas.height, project);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 8;
  return texture;
}
