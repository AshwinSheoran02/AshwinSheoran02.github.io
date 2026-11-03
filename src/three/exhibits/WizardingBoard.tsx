import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  Euler,
  InstancedMesh,
  LatheGeometry,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  TorusGeometry,
  Vector2,
  Vector3,
  type Group,
  type Texture,
} from "three";
import graph from "../data/hp-board-graph.json";
import { rig, ui } from "../../lib/store";
import { clamp01, easeInOut } from "../helpers";
import { useMaterials } from "../materials";
import { focus } from "../rigState";
import { paintTexture, seeded } from "../textures";
import { Die, pawnGeometry } from "../sets/gamePieces";

/*
 * The board is rebuilt from the game's own board graph (91 spaces, 116 paths),
 * so the exhibit matches the playable game space for space.
 */
interface Node {
  id: number;
  x: number;
  y: number;
  type: string;
}
const nodes = graph.nodes as Node[];
const edges = graph.edges as [number, number][];
const BOARD_W = 1.7;
const BOARD_H = (BOARD_W * graph.imageH) / graph.imageW;
const TABLE_TOP = 0.77;
const SURFACE = TABLE_TOP + 0.0135;
const RING = graph.nodeRadius * BOARD_W;
const WAND_NODE = nodes.find((node) => node.type === "wand")?.id ?? 90;
const HARRY_START = nodes.find((node) => node.type === "start" && (node as Node & { start?: string }).start === "H")?.id ?? 66;
const VOLDEMORT_START = nodes.find((node) => node.type === "start" && (node as Node & { start?: string }).start === "V")?.id ?? 6;

const adjacency: number[][] = nodes.map(() => []);
edges.forEach(([a, b]) => {
  adjacency[a].push(b);
  adjacency[b].push(a);
});

function shortestPath(from: number, to: number): number[] {
  const previous = new Map<number, number>([[from, -1]]);
  const queue = [from];
  while (queue.length) {
    const current = queue.shift()!;
    if (current === to) break;
    for (const next of adjacency[current]) {
      if (!previous.has(next)) {
        previous.set(next, current);
        queue.push(next);
      }
    }
  }
  const path: number[] = [];
  for (let at: number | undefined = to; at !== undefined && at !== -1; at = previous.get(at)) path.unshift(at);
  return path[0] === from ? path : [from];
}

const toBoard = (node: Node): [number, number] => [(node.x - 0.5) * BOARD_W, (node.y - 0.5) * BOARD_H];

const REGIONS: [string, number, number, number][] = [
  ["Forbidden Forest", 0.2, 0.075, 0.034],
  ["School Grounds", 0.31, 0.262, 0.03],
  ["Great Hall", 0.82, 0.29, 0.03],
  ["Quidditch Pitch", 0.835, 0.5, 0.028],
  ["Hogsmeade", 0.83, 0.84, 0.034],
  ["Gryffindor common room", 0.18, 0.945, 0.024],
];

function boardTexture(scale: number): Texture {
  const rand = seeded(131);
  const width = 2048 * scale;
  const height = (width * graph.imageH) / graph.imageW;
  return paintTexture(width, height, (g, w, h) => {
    g.fillStyle = "#ecdcaa";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i += 1) {
      const x = rand() * w;
      const y = rand() * h;
      const r = (20 + rand() * 120) * scale;
      const gradient = g.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, rand() < 0.5 ? "rgba(170,128,70,0.16)" : "rgba(255,246,220,0.22)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gradient;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 1800 * scale; i += 1) {
      g.fillStyle = `rgba(110,70,30,${0.08 + rand() * 0.25})`;
      const r = (0.6 + rand() * 2.6) * scale;
      g.beginPath();
      g.arc(rand() * w, rand() * h, r, 0, Math.PI * 2);
      g.fill();
    }
    const vignette = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.7);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(120,70,20,0.35)");
    g.fillStyle = vignette;
    g.fillRect(0, 0, w, h);

    const brown = "#7f2b0a";
    const ring = graph.nodeRadius * w;
    g.strokeStyle = brown;
    g.lineWidth = 5 * scale;
    edges.forEach(([a, b]) => {
      const p = nodes[a];
      const q = nodes[b];
      const ax = p.x * w;
      const ay = p.y * h;
      const bx = q.x * w;
      const by = q.y * h;
      const length = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / length;
      const uy = (by - ay) / length;
      g.beginPath();
      g.moveTo(ax + ux * ring, ay + uy * ring);
      g.lineTo(bx - ux * ring, by - uy * ring);
      g.stroke();
      for (const [cx, cy] of [
        [ax + ux * (ring + 9 * scale), ay + uy * (ring + 9 * scale)],
        [bx - ux * (ring + 9 * scale), by - uy * (ring + 9 * scale)],
      ]) {
        g.fillStyle = "#ecdcaa";
        g.beginPath();
        g.arc(cx, cy, 7 * scale, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    });
    nodes.forEach((node) => {
      g.fillStyle = "rgba(127,43,10,0.08)";
      g.beginPath();
      g.arc(node.x * w, node.y * h, ring * 0.8, 0, Math.PI * 2);
      g.fill();
    });

    g.fillStyle = brown;
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (const [label, x, y, size] of REGIONS) {
      g.font = `600 ${size * w}px Georgia, "Times New Roman", serif`;
      g.fillText(label, x * w, y * h);
    }
    // Title cartouche in the centre of the board.
    const cx = 0.515 * w;
    const cy = 0.515 * h;
    g.fillStyle = "rgba(127,43,10,0.92)";
    g.fillRect(cx - 0.065 * w, cy - 0.06 * h, 0.13 * w, 0.12 * h);
    g.strokeStyle = "#ecdcaa";
    g.lineWidth = 3 * scale;
    g.strokeRect(cx - 0.058 * w, cy - 0.05 * h, 0.116 * w, 0.1 * h);
    g.fillStyle = "#f3e4b8";
    g.font = `600 ${0.0115 * w}px Georgia, "Times New Roman", serif`;
    ["THE BATTLE", "FOR THE", "WIZARDING", "WORLD"].forEach((line, index) => {
      g.fillText(line, cx, cy - 0.03 * h + index * 0.021 * h);
    });
  });
}

/** Rotation that brings each die face to the top, following the pip layout in <Die>. */
const FACE_UP: Record<number, Euler> = {
  1: new Euler(-Math.PI / 2, 0, 0),
  2: new Euler(0, 0, Math.PI / 2),
  3: new Euler(0, 0, 0),
  4: new Euler(Math.PI, 0, 0),
  5: new Euler(0, 0, -Math.PI / 2),
  6: new Euler(Math.PI / 2, 0, 0),
};

type Phase = "roll" | "move" | "pause" | "won" | "reset";
const UP = new Vector3(0, 1, 0);
const spinAroundY = new Quaternion();

export function WizardingBoard({ x, z }: { x: number; z: number }) {
  const m = useMaterials();
  const harry = useRef<Group>(null);
  const voldemort = useRef<Group>(null);
  const wand = useRef<Group>(null);
  const die = useRef<Group>(null);

  const resources = useMemo(() => {
    const scale = ui.get().tier === "low" ? 0.5 : 1;
    const board = boardTexture(scale);
    const paper = new MeshStandardMaterial({ map: board, roughness: 0.82 });
    const glaze = new MeshPhysicalMaterial({ color: "#7f2b0a", roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const gold = new MeshPhysicalMaterial({ color: "#e9c35c", roughness: 0.35, clearcoat: 0.8 });
    const cyan = new MeshPhysicalMaterial({ color: "#59d2df", roughness: 0.35, clearcoat: 0.8 });
    const startDisc = new MeshPhysicalMaterial({ color: "#5c1c06", roughness: 0.4, clearcoat: 0.6 });
    const ivory = new MeshPhysicalMaterial({ color: "#f6f0e0", roughness: 0.5 });
    const harryMaterial = new MeshPhysicalMaterial({ color: "#b3261e", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 });
    const voldemortMaterial = new MeshPhysicalMaterial({
      color: "#0f3a22",
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      emissive: new Color("#45d07a"),
      emissiveIntensity: 0.12,
    });
    const wandWood = new MeshPhysicalMaterial({ color: "#3a2416", roughness: 0.45, clearcoat: 0.6 });
    const glow = new MeshBasicMaterial({ color: new Color(1.6, 1.3, 0.7), transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
    const pip = new MeshStandardMaterial({ color: "#7f2b0a", roughness: 0.5 });

    const torus = new TorusGeometry(RING * 0.86, RING * 0.14, 10, 40);
    torus.rotateX(Math.PI / 2);
    const disc = new CylinderGeometry(RING * 0.78, RING * 0.78, 0.004, 32);
    const coin = new CylinderGeometry(RING * 0.45, RING * 0.45, 0.0045, 24);
    const card = new CylinderGeometry(1, 1, 1, 4);

    const dummy = new Object3D();
    const rings = new InstancedMesh(torus, glaze, nodes.length);
    nodes.forEach((node, index) => {
      const [x, y] = toBoard(node);
      dummy.position.set(x, SURFACE + RING * 0.14, y);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rings.setMatrixAt(index, dummy.matrix);
    });
    const typed = (type: string) => nodes.filter((node) => node.type === type);
    const discs = (list: Node[], material: MeshPhysicalMaterial) => {
      const mesh = new InstancedMesh(disc, material, Math.max(1, list.length));
      list.forEach((node, index) => {
        const [x, y] = toBoard(node);
        dummy.position.set(x, SURFACE + 0.002, y);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.count = list.length;
      return mesh;
    };
    const moneyNodes = typed("money");
    const coins = new InstancedMesh(coin, m.brassPolished, moneyNodes.length * 3);
    const rand = seeded(7);
    moneyNodes.forEach((node, index) => {
      const [x, y] = toBoard(node);
      for (let k = 0; k < 3; k += 1) {
        dummy.position.set(x + (rand() - 0.5) * 0.008, SURFACE + 0.0065 + k * 0.0046, y + (rand() - 0.5) * 0.008);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        coins.setMatrixAt(index * 3 + k, dummy.matrix);
      }
    });
    const cardNodes = typed("card");
    const cards = new InstancedMesh(card, ivory, cardNodes.length * 2);
    cardNodes.forEach((node, index) => {
      const [x, y] = toBoard(node);
      for (let k = 0; k < 2; k += 1) {
        dummy.position.set(x + (k - 0.5) * 0.008, SURFACE + 0.006 + k * 0.0022, y + (k - 0.5) * 0.004);
        dummy.rotation.set(0, Math.PI / 4 + (k - 0.5) * 0.5, 0);
        dummy.scale.set(RING * 0.48, 0.0018, RING * 0.66);
        dummy.updateMatrix();
        cards.setMatrixAt(index * 2 + k, dummy.matrix);
      }
    });
    [rings, coins, cards].forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    const golds = discs(moneyNodes, gold);
    const cyans = discs(cardNodes, cyan);
    const starts = discs(typed("start"), startDisc);
    const wandDisc = discs(typed("wand"), ivory);

    const pawn = pawnGeometry(0.085);
    const wandGeometry = new LatheGeometry(
      [
        [0, 0],
        [0.0042, 0],
        [0.0048, 0.01],
        [0.0036, 0.016],
        [0.0046, 0.024],
        [0.0034, 0.034],
        [0.0026, 0.1],
        [0.0016, 0.16],
        [0, 0.162],
      ].map(([x, y]) => new Vector2(x, y)),
      14,
    );
    wandGeometry.rotateZ(Math.PI / 2);
    wandGeometry.translate(0.08, 0, 0);

    return {
      board, paper, glaze, gold, cyan, startDisc, ivory, harryMaterial, voldemortMaterial, wandWood, glow, pip,
      torus, disc, coin, card, rings, coins, cards, golds, cyans, starts, wandDisc, pawn, wandGeometry,
    };
  }, [m.brassPolished]);

  useEffect(
    () => () => {
      Object.values(resources).forEach((value) => (value as { dispose: () => void }).dispose());
    },
    [resources],
  );

  const game = useRef({
    phase: "pause" as Phase,
    time: 0,
    turn: "H" as "H" | "V",
    harry: HARRY_START,
    voldemort: VOLDEMORT_START,
    wandHeld: false,
    path: [] as number[],
    step: 0,
    roll: 1,
    turns: 0,
    fromRotation: new Quaternion(),
    toRotation: new Quaternion(),
  });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const g = game.current;
    const active = Math.hypot(focus.x - x, focus.z - z) < 9 && !rig.reducedMotion;
    const place = (piece: Group | null, nodeId: number, hop = 0, from?: number, k = 1) => {
      if (!piece) return;
      const [tx, ty] = toBoard(nodes[nodeId]);
      if (from === undefined) {
        piece.position.set(tx, SURFACE + 0.003, ty);
        return;
      }
      const [fx, fy] = toBoard(nodes[from]);
      piece.position.set(fx + (tx - fx) * k, SURFACE + 0.003 + hop, fy + (ty - fy) * k);
    };

    if (active) {
      g.time += dt;
      if (g.phase === "pause" && g.time > 0.55) {
        g.phase = "roll";
        g.time = 0;
        g.roll = g.turn === "H" ? 1 + Math.floor(Math.random() * 6) : 1 + Math.floor(Math.random() * 3);
        if (die.current) g.fromRotation.copy(die.current.quaternion);
        g.toRotation.setFromEuler(FACE_UP[g.roll]).premultiply(spinAroundY.setFromAxisAngle(UP, Math.random() * Math.PI * 2));
      } else if (g.phase === "roll" && g.time > 0.85) {
        const from = g.turn === "H" ? g.harry : g.voldemort;
        const goal = g.turn === "H" ? (g.wandHeld ? g.voldemort : WAND_NODE) : g.harry;
        g.path = shortestPath(from, goal).slice(0, g.roll + 1);
        g.step = 1;
        g.phase = g.path.length > 1 ? "move" : "pause";
        g.time = 0;
      } else if (g.phase === "move") {
        const hopTime = 0.3;
        if (g.time >= hopTime) {
          const arrived = g.path[g.step];
          if (g.turn === "H") g.harry = arrived;
          else g.voldemort = arrived;
          g.time = 0;
          g.step += 1;
          if (g.turn === "H" && arrived === WAND_NODE) g.wandHeld = true;
          const caught = g.harry === g.voldemort;
          if (caught) {
            g.phase = "won";
          } else if (g.step >= g.path.length) {
            g.phase = "pause";
            g.turn = g.turn === "H" ? "V" : "H";
            g.turns += 1;
            if (g.turns > 36) g.phase = "won";
          }
        }
      } else if (g.phase === "won" && g.time > 2.4) {
        g.phase = "reset";
        g.time = 0;
      } else if (g.phase === "reset" && g.time > 0.9) {
        g.harry = HARRY_START;
        g.voldemort = VOLDEMORT_START;
        g.wandHeld = false;
        g.turn = "H";
        g.turns = 0;
        g.phase = "pause";
        g.time = 0;
      }
    }

    const moving = g.phase === "move" ? g.turn : null;
    const k = clamp01(g.time / 0.3);
    const hop = Math.sin(Math.PI * k) * 0.05;
    if (moving === "H") place(harry.current, g.path[g.step], hop, g.path[g.step - 1], easeInOut(k));
    else place(harry.current, g.harry);
    if (moving === "V") place(voldemort.current, g.path[g.step], hop, g.path[g.step - 1], easeInOut(k));
    else place(voldemort.current, g.voldemort);

    if (die.current) {
      const r = g.phase === "roll" ? clamp01(g.time / 0.85) : 1;
      die.current.quaternion.slerpQuaternions(g.fromRotation, g.toRotation, easeInOut(r));
      if (g.phase === "roll") {
        die.current.rotateX((1 - r) * 9 * dt * 60 * 0.02);
        die.current.rotateZ((1 - r) * 7 * dt * 60 * 0.02);
      }
      die.current.position.y = SURFACE + 0.022 + Math.sin(Math.PI * r) * (g.phase === "roll" ? 0.09 : 0);
    }

    if (wand.current) {
      const t = state.clock.elapsedTime;
      const bob = rig.reducedMotion ? 0 : Math.sin(t * 1.6) * 0.008;
      if (g.wandHeld && harry.current) {
        wand.current.position.set(harry.current.position.x + 0.02, harry.current.position.y + 0.1, harry.current.position.z);
        wand.current.rotation.set(0, 0.4, 0.9);
      } else {
        const [wx, wy] = toBoard(nodes[WAND_NODE]);
        wand.current.position.set(wx, SURFACE + 0.05 + bob, wy);
        wand.current.rotation.set(0, (rig.reducedMotion ? 0 : t * 0.4) + 0.6, 0.08);
      }
    }
  });

  return (
    <group>
      {/* Walnut games table */}
      <RoundedBox args={[2.1, 0.06, 1.66]} radius={0.015} position={[0, TABLE_TOP - 0.03, 0]} material={m.walnut} castShadow receiveShadow />
      <RoundedBox args={[1.96, 0.14, 1.52]} radius={0.01} position={[0, TABLE_TOP - 0.13, 0]} material={m.walnutMatte} castShadow />
      {[-0.9, 0.9].flatMap((x) =>
        [-0.68, 0.68].map((y) => (
          <mesh key={`${x}${y}`} position={[x, (TABLE_TOP - 0.06) / 2, y]} material={m.walnut} castShadow>
            <boxGeometry args={[0.08, TABLE_TOP - 0.06, 0.08]} />
          </mesh>
        )),
      )}
      {/* The board itself: card stock edge and printed parchment face */}
      <mesh position={[0, TABLE_TOP + 0.006, 0]} material={m.ink} castShadow receiveShadow>
        <boxGeometry args={[BOARD_W + 0.02, 0.012, BOARD_H + 0.02]} />
      </mesh>
      <mesh position={[0, SURFACE - 0.0005, 0]} rotation-x={-Math.PI / 2} material={resources.paper} receiveShadow>
        <planeGeometry args={[BOARD_W, BOARD_H]} />
      </mesh>
      <primitive object={resources.rings} />
      <primitive object={resources.golds} />
      <primitive object={resources.cyans} />
      <primitive object={resources.starts} />
      <primitive object={resources.wandDisc} />
      <primitive object={resources.coins} />
      <primitive object={resources.cards} />

      <group ref={harry}>
        <mesh geometry={resources.pawn} material={resources.harryMaterial} castShadow />
        <mesh position={[0, 0.05, 0]} material={m.brassPolished}>
          <torusGeometry args={[0.0125, 0.003, 8, 24]} />
        </mesh>
      </group>
      <group ref={voldemort}>
        <mesh geometry={resources.pawn} material={resources.voldemortMaterial} castShadow />
      </group>
      <group ref={wand}>
        <mesh geometry={resources.wandGeometry} material={resources.wandWood} castShadow />
        <mesh position={[0.08, -0.03, 0]} rotation-x={-Math.PI / 2} material={resources.glow}>
          <circleGeometry args={[0.07, 32]} />
        </mesh>
      </group>
      <group ref={die} position={[BOARD_W / 2 + 0.11, SURFACE + 0.022, 0.45]}>
        <Die size={0.045} body={resources.ivory} pip={resources.pip} />
      </group>
    </group>
  );
}

export const boardSize = { width: BOARD_W, height: BOARD_H, table: TABLE_TOP };
