import {
  about,
  closing,
  facts,
  hero,
  interests,
  journey,
  knownIssues,
  projects,
  sideQuests,
  site,
  statement,
  strengths,
  type InterestId,
} from "../../data/profile";
import { oversFor } from "../../data/stations";
import { FIELD_POSITIONS } from "../layout";

/*
 * What the giant screen shows at each stop of the tour. Drawn on a canvas in
 * broadcast-graphics style; the LED shader adds the pixel grid on top.
 */
export const SCREEN_PX = { width: 2048, height: 884 } as const;

const YELLOW = "#ffd400";
const RED = "#ff3b30";
const CYAN = "#5ad1ff";
const WHITE = "#ffffff";
const DIM = "#9fb0d6";
const FONT = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';

type G = CanvasRenderingContext2D;

function text(
  g: G,
  value: string,
  x: number,
  y: number,
  size: number,
  {
    colour = WHITE,
    weight = 800,
    align = "left",
    italic = false,
    max,
    spacing = 0,
  }: { colour?: string; weight?: number; align?: CanvasTextAlign; italic?: boolean; max?: number; spacing?: number } = {},
) {
  let px = size;
  const font = () => `${italic ? "italic " : ""}${weight} ${px}px ${FONT}`;
  g.font = font();
  if (max) {
    while (g.measureText(value).width > max && px > 12) {
      px -= 2;
      g.font = font();
    }
  }
  g.fillStyle = colour;
  g.textAlign = align;
  g.textBaseline = "alphabetic";
  if (spacing) (g as G & { letterSpacing?: string }).letterSpacing = `${spacing}px`;
  g.fillText(value, x, y);
  if (spacing) (g as G & { letterSpacing?: string }).letterSpacing = "0px";
  return px;
}

/** A slanted broadcast tag: coloured block, dark text. */
function tag(g: G, value: string, x: number, y: number, size = 44, fill = YELLOW, ink = "#05070d") {
  g.font = `800 ${size}px ${FONT}`;
  const width = g.measureText(value).width + size * 1.1;
  const height = size * 1.3;
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + width, y);
  g.lineTo(x + width - size * 0.35, y + height);
  g.lineTo(x, y + height);
  g.closePath();
  g.fill();
  text(g, value, x + size * 0.4, y + height * 0.76, size, { colour: ink });
  return width;
}

function frame(g: G, station: string, crawl: string) {
  const { width: w, height: h } = SCREEN_PX;
  const background = g.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, "#06102c");
  background.addColorStop(0.55, "#0a1f55");
  background.addColorStop(1, "#071334");
  g.fillStyle = background;
  g.fillRect(0, 0, w, h);
  // Diagonal speed lines.
  g.save();
  g.globalAlpha = 0.07;
  g.fillStyle = WHITE;
  for (let x = -h; x < w; x += 120) {
    g.beginPath();
    g.moveTo(x, h);
    g.lineTo(x + 40, h);
    g.lineTo(x + 40 + h * 0.6, 0);
    g.lineTo(x + h * 0.6, 0);
    g.fill();
  }
  g.restore();

  // Top bar.
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillRect(0, 0, w, 104);
  text(g, site.brand, 56, 76, 62, { spacing: 4 });
  g.fillStyle = RED;
  g.fillRect(392, 26, 150, 54);
  g.fillStyle = WHITE;
  g.beginPath();
  g.arc(424, 53, 11, 0, Math.PI * 2);
  g.fill();
  text(g, "LIVE", 446, 72, 44);
  text(g, `OV ${oversFor(station)}`, w - 56, 76, 58, { align: "right", colour: YELLOW });
  text(g, "DAY / NIGHT", w - 300, 74, 40, { align: "right", colour: DIM, weight: 600 });

  // Bottom crawl.
  g.fillStyle = YELLOW;
  g.fillRect(0, h - 92, w, 92);
  g.fillStyle = "#05070d";
  g.fillRect(0, h - 92, 230, 92);
  text(g, "ASHWIN.TOP", 28, h - 30, 46, { colour: YELLOW });
  text(g, crawl.toUpperCase(), 262, h - 28, 50, { colour: "#05070d", max: w - 300 });
}

function title(g: G, label: string, headline: string, colour = WHITE) {
  tag(g, label.toUpperCase(), 56, 138);
  text(g, headline.toUpperCase(), 56, 330, 150, { italic: true, colour, max: SCREEN_PX.width - 112 });
}

function list(g: G, lines: readonly string[], x: number, y: number, size: number, gap: number, colour = WHITE) {
  lines.forEach((line, index) => {
    g.fillStyle = YELLOW;
    g.fillRect(x, y + index * gap - size * 0.62, 10, size * 0.66);
    text(g, line.toUpperCase(), x + 30, y + index * gap, size, { colour, weight: 700, max: 900 });
  });
}

function interestScreen(g: G, id: InterestId) {
  const item = interests.items.find((entry) => entry.id === id)!;
  const position = FIELD_POSITIONS[id];
  if (id === "cricket") {
    tag(g, "FIELD PLACEMENT · OPEN TABS", 56, 138);
    text(g, interests.headline[0].toUpperCase(), 56, 300, 110, { italic: true, max: 1100 });
    text(g, interests.headline[1].toUpperCase(), 56, 410, 84, { italic: true, colour: YELLOW, max: 1100 });
    // Mini field: the five positions on an oval.
    const cx = 1620;
    const cy = 450;
    g.strokeStyle = "rgba(255,255,255,0.7)";
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(cx, cy, 300, 320, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#c9b98c";
    g.fillRect(cx - 14, cy - 60, 28, 120);
    interests.items.forEach((entry) => {
      const p = FIELD_POSITIONS[entry.id];
      const x = cx + (p.x / 62) * 290;
      const y = cy + (p.z / 68) * 300;
      g.fillStyle = entry.id === "cricket" ? YELLOW : CYAN;
      g.beginPath();
      g.arc(x, y, 18, 0, Math.PI * 2);
      g.fill();
      text(g, entry.label.toUpperCase(), x + 28, y + 14, 38, { weight: 700 });
    });
    return;
  }
  tag(g, `AT ${position.name}`, 56, 138, 44, CYAN);
  text(g, `${item.number} · ${item.label}`.toUpperCase(), 56, 360, 190, { italic: true, max: 1300 });
  const note = "note" in item && item.note ? item.note : "callout" in item && item.callout ? item.callout[0] : item.object;
  text(g, note.toUpperCase(), 56, 470, 70, { colour: YELLOW, max: 1500, weight: 700 });
  text(g, position.name, SCREEN_PX.width - 70, 640, 150, { align: "right", colour: "rgba(255,255,255,0.16)", italic: true });
}

function journeyScreen(g: G, index: number) {
  const entry = journey.entries[index];
  tag(g, "INNINGS PROGRESSION", 56, 138);
  text(g, entry.period, 56, 360, 200, { italic: true, colour: YELLOW });
  text(g, entry.title.toUpperCase(), 56, 470, 92, { max: 1000 });
  if (entry.subtitle) text(g, entry.subtitle.toUpperCase(), 56, 548, 54, { colour: DIM, weight: 600, max: 1000 });
  // The Manhattan, in miniature.
  const heights = [0.25, 0.5, 0.41, 0.73, 1];
  const baseY = 720;
  heights.forEach((value, i) => {
    const x = 1220 + i * 150;
    const barH = value * 480;
    g.fillStyle = i === index ? YELLOW : i < index ? "rgba(90,209,255,0.85)" : "rgba(255,255,255,0.18)";
    g.fillRect(x, baseY - barH, 110, barH);
    text(g, journey.entries[i].period.slice(0, 4), x + 55, baseY + 50, 34, { align: "center", colour: i === index ? YELLOW : DIM, weight: 700 });
  });
  const status = entry.status === "SHIPPED" ? "SHIPPED" : "INSTALLING";
  tag(g, status, 56, 590, 40, entry.status === "SHIPPED" ? "#3ddc84" : RED, entry.status === "SHIPPED" ? "#05070d" : WHITE);
}

export function drawScreen(g: G, station: string, extra: { patched?: boolean } = {}) {
  const { width: w } = SCREEN_PX;
  g.clearRect(0, 0, w, SCREEN_PX.height);

  if (station === "home") {
    frame(g, station, hero.roles.join("  ·  "));
    tag(g, "NOW BATTING", 56, 138);
    text(g, "ASHWIN", 48, 430, 300, { italic: true, weight: 900 });
    text(g, "SHEORAN", 48, 690, 300, { italic: true, weight: 900, colour: YELLOW });
    hero.metadata.slice(0, 3).forEach((item, index) => {
      const y = 330 + index * 140;
      text(g, item.label.toUpperCase(), w - 70, y, 44, { align: "right", colour: DIM, weight: 600 });
      text(g, item.value.toUpperCase(), w - 70, y + 70, 74, { align: "right" });
    });
    return;
  }
  if (station === "about") {
    frame(g, station, about.status.join("  ·  "));
    title(g, "PLAYER PROFILE", about.headline[0]);
    list(g, ["IIIT Delhi · CSAM", "Jio · Internship", "NAB · 22 months", "XLRI Delhi-NCR · now"], 56, 470, 66, 84);
    text(g, "STILL SHIPPING", w - 70, 720, 120, { align: "right", italic: true, colour: YELLOW });
    return;
  }
  if (station.startsWith("interest:")) {
    const id = station.slice(9) as InterestId;
    frame(g, station, interests.items.map((item) => `${FIELD_POSITIONS[item.id].name}: ${item.label}`).join("  ·  "));
    interestScreen(g, id);
    return;
  }
  if (station === "statement") {
    frame(g, station, statement.product.principles.join("  ·  "));
    tag(g, "PITCH MAP · GOOD LENGTH", 56, 138);
    text(g, statement.beauty.headline[0].toUpperCase(), 56, 330, 130, { italic: true, max: w - 112 });
    text(g, statement.beauty.headline[1].toUpperCase(), 56, 470, 130, { italic: true, colour: YELLOW, max: w - 112 });
    list(g, statement.product.principles, 56, 610, 60, 74);
    return;
  }
  if (station === "facts") {
    frame(g, station, facts.items.slice(9).map((item) => `${item.label}: ${item.value}`).join("  ·  "));
    tag(g, "UNSOLICITED INFORMATION", 56, 138);
    facts.items.slice(0, 8).forEach((item, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 56 + column * 980;
      const y = 300 + row * 120;
      text(g, item.label.toUpperCase(), x, y, 40, { colour: DIM, weight: 600 });
      text(g, item.value.toUpperCase(), x, y + 58, 62, { max: 900 });
    });
    return;
  }
  if (station.startsWith("journey-")) {
    const index = Number(station.slice(8));
    frame(g, station, journey.headline.join("  "));
    journeyScreen(g, index);
    return;
  }
  if (station === "side-quests") {
    frame(g, station, sideQuests.headline);
    tag(g, "IN THE DUGOUT · SIDE QUESTS", 56, 138);
    sideQuests.entries.forEach((quest, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 56 + column * 980;
      const y = 320 + row * 150;
      text(g, String(index + 1).padStart(2, "0"), x, y, 70, { colour: YELLOW, italic: true });
      text(g, quest.title.toUpperCase(), x + 100, y, 66, { max: 820 });
      if ("subtitle" in quest && quest.subtitle) text(g, quest.subtitle.toUpperCase(), x + 100, y + 54, 40, { colour: DIM, weight: 600, max: 820 });
    });
    return;
  }
  if (station === "strengths") {
    frame(g, station, strengths.note.join(" "));
    tag(g, "PLAYER RATINGS", 56, 138);
    strengths.items.forEach((item, index) => {
      const y = 290 + index * 132;
      text(g, item.meterLabel.toUpperCase(), 56, y, 56, { weight: 700, max: 820 });
      g.fillStyle = "rgba(255,255,255,0.14)";
      g.fillRect(900, y - 44, 900, 48);
      g.fillStyle = index % 2 ? CYAN : YELLOW;
      g.fillRect(900, y - 44, 9 * item.value, 48);
      text(g, String(item.value), w - 70, y, 84, { align: "right", italic: true });
    });
    return;
  }
  if (station === "known-issues") {
    frame(g, station, knownIssues.items.map((issue) => `${issue.title}: ${issue.severity}`).join("  ·  "));
    tag(g, "DRS · THIRD UMPIRE REVIEW", 56, 138, 44, RED, WHITE);
    text(g, "DECISION", 56, 300, 80, { colour: DIM, weight: 700 });
    text(g, "NOT OUT", 56, 520, 260, { italic: true, weight: 900 });
    text(g, extra.patched ? "PATCH QUEUED. ETA: OPTIMISTIC." : "STABLE. NOT BUG-FREE.", 56, 640, 84, { colour: YELLOW, italic: true, max: 1300 });
    const verdicts = ["PITCHING: IN LINE", "IMPACT: UMPIRE'S CALL", "WICKETS: MISSING"];
    verdicts.forEach((line, index) => text(g, line, w - 70, 330 + index * 110, 64, { align: "right", weight: 700, colour: index === 2 ? "#3ddc84" : WHITE }));
    return;
  }
  if (station.startsWith("project:")) {
    const project = projects.find((entry) => `project:${entry.id}` === station) ?? projects[0];
    frame(g, station, `${project.medium}  ·  ${project.url.replace(/^https?:\/\//, "")}`);
    tag(g, project.kind === "game" ? "NOW SHOWING · GAME" : "NOW SHOWING · APP", 56, 138, 44, CYAN);
    text(g, project.title.toUpperCase(), 56, 360, 170, { italic: true, max: w - 112 });
    text(g, project.kind === "game" ? "PRESS PLAY. IT OPENS ON ITS OWN PAGE." : "OPENS ON ITS OWN PAGE.", 56, 470, 70, { colour: YELLOW, weight: 700 });
    text(g, project.url.replace(/^https?:\/\//, "").toUpperCase(), 56, 640, 96, { italic: true });
    return;
  }
  // contact
  frame(g, station, closing.systemLine.join("  "));
  tag(g, "POST-MATCH", 56, 138);
  text(g, "THANKS FOR", 48, 400, 230, { italic: true, weight: 900 });
  text(g, "WATCHING", 48, 640, 230, { italic: true, weight: 900, colour: YELLOW });
  text(g, "ASHWIN SHEORAN", w - 70, 520, 96, { align: "right", italic: true });
  text(g, "NOT OUT", w - 70, 640, 120, { align: "right", italic: true, colour: YELLOW });
}
