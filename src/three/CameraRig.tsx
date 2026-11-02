import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, Vector3, type PerspectiveCamera } from "three";
import { interests } from "../data/profile";
import { stationIndex } from "../data/stations";
import { rig, ui } from "../lib/store";
import { clamp01, damp, easeInOut, easeOutCubic } from "./helpers";
import { interestFrame, keyframes, type Keyframe } from "./layout";
import { eye, focus, smoothed } from "./rigState";

interface Pose {
  position: Vector3;
  target: Vector3;
  fov: number;
  shiftX: number;
  shiftY: number;
}

const INTEREST_STATION = stationIndex("interests");
const interestIds = interests.items.map((item) => item.id);

function lerpFrames(a: Keyframe, b: Keyframe, t: number): Keyframe {
  const mix = (x: number, y: number) => x + (y - x) * t;
  const pair = (x?: [number, number], y?: [number, number]): [number, number] | undefined =>
    x && y ? [mix(x[0], y[0]), mix(x[1], y[1])] : (x ?? y);
  return {
    target: [mix(a.target[0], b.target[0]), mix(a.target[1], b.target[1]), mix(a.target[2], b.target[2])],
    yaw: mix(a.yaw, b.yaw),
    pitch: mix(a.pitch, b.pitch),
    dist: mix(a.dist, b.dist),
    fov: mix(a.fov, b.fov),
    fit: a.fit !== undefined && b.fit !== undefined ? mix(a.fit, b.fit) : (a.fit ?? b.fit),
    shift: pair(a.shift, b.shift),
    shiftPortrait: pair(a.shiftPortrait, b.shiftPortrait),
  };
}

function solvePose(frame: Keyframe, aspect: number, out: Pose) {
  const portrait = aspect < 0.9;
  const fov = portrait ? Math.min(frame.fov * 1.32, 58) : frame.fov;
  const shift = portrait ? (frame.shiftPortrait ?? [0, 0.18]) : (frame.shift ?? [0, 0]);
  const yaw = MathUtils.degToRad(frame.yaw);
  const pitch = MathUtils.degToRad(frame.pitch);
  const direction = new Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
  const halfHorizontal = Math.tan(MathUtils.degToRad(fov) / 2) * aspect;
  const needed = frame.fit ? (frame.fit / 2 / halfHorizontal) * (1 + Math.abs(shift[0]) * 1.7) : 0;
  const distance = Math.max(frame.dist, needed);
  out.target.set(frame.target[0], frame.target[1], frame.target[2]);
  out.position.copy(out.target).addScaledVector(direction, -distance);
  out.fov = fov;
  out.shiftX = shift[0];
  out.shiftY = shift[1];
}

export function CameraRig({ introSeconds = 3.4 }: { introSeconds?: number }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const size = useThree((state) => state.size);
  const poses = useMemo<Pose[]>(
    () =>
      keyframes.map(() => ({ position: new Vector3(), target: new Vector3(), fov: 34, shiftX: 0, shiftY: 0 })),
    [],
  );
  const curves = useMemo(
    () => ({
      position: new CatmullRomCurve3(poses.map((pose) => pose.position), false, "centripetal"),
      target: new CatmullRomCurve3(poses.map((pose) => pose.target), false, "centripetal"),
    }),
    [poses],
  );
  const state = useRef({
    initialised: false,
    interest: 0,
    parallaxX: 0,
    parallaxY: 0,
    introStart: -1,
  });
  const temp = useMemo(
    () => ({ position: new Vector3(), target: new Vector3(), right: new Vector3(), up: new Vector3() }),
    [],
  );

  useFrame((frameState, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = state.current;
    const aspect = size.width / Math.max(1, size.height);
    const reduced = rig.reducedMotion;
    const { interest, sceneReady } = ui.get();

    const selected = Math.max(0, interestIds.indexOf(interest));
    s.interest = reduced || rig.capture || !s.initialised ? selected : damp(s.interest, selected, 4, dt);
    const low = Math.floor(s.interest);
    const high = Math.min(interestIds.length - 1, low + 1);
    const interestKeyframe = lerpFrames(interestFrame(low), interestFrame(high), s.interest - low);

    keyframes.forEach((frame, index) => {
      solvePose(index === INTEREST_STATION ? interestKeyframe : frame, aspect, poses[index]);
    });

    const goal = rig.station;
    if (!s.initialised || reduced || rig.capture) {
      smoothed.station = reduced ? Math.round(goal) : goal;
    } else {
      smoothed.station = damp(smoothed.station, goal, 3.4, dt);
    }
    s.initialised = true;

    const last = poses.length - 1;
    const t = MathUtils.clamp(smoothed.station, 0, last);
    const u = last > 0 ? t / last : 0;
    curves.position.getPoint(u, temp.position);
    curves.target.getPoint(u, temp.target);

    const i = Math.min(last, Math.floor(t));
    const j = Math.min(last, i + 1);
    const f = easeInOut(t - i);
    const a = poses[i];
    const b = poses[j];
    const fov = a.fov + (b.fov - a.fov) * f;
    const shiftX = a.shiftX + (b.shiftX - a.shiftX) * f;
    const shiftY = a.shiftY + (b.shiftY - a.shiftY) * f;

    // Opening shot: the camera settles from high in the hall as the lights come up.
    if (sceneReady && s.introStart < 0) s.introStart = frameState.clock.elapsedTime;
    const skipIntro = reduced || rig.capture;
    const intro = skipIntro
      ? 1
      : s.introStart < 0
        ? 0
        : clamp01((frameState.clock.elapsedTime - s.introStart) / introSeconds);
    if (intro < 1) {
      const k = 1 - easeOutCubic(intro);
      temp.position.x -= 1.5 * k;
      temp.position.y += 4.2 * k;
      temp.position.z += 10 * k;
      temp.target.y += 1.4 * k;
    }

    // Subtle pointer parallax, only for fine pointers and full motion.
    const px = reduced || rig.capture ? 0 : rig.pointerX;
    const py = reduced || rig.capture ? 0 : rig.pointerY;
    s.parallaxX = damp(s.parallaxX, px, 2.5, dt);
    s.parallaxY = damp(s.parallaxY, py, 2.5, dt);
    temp.right.subVectors(temp.target, temp.position).normalize().cross(camera.up).normalize();
    temp.position.addScaledVector(temp.right, s.parallaxX * 0.32);
    temp.position.y += s.parallaxY * 0.16;

    camera.position.copy(temp.position);
    camera.lookAt(temp.target);
    camera.fov = fov;
    camera.near = 0.08;
    camera.far = 150;
    const w = size.width;
    const h = size.height;
    camera.setViewOffset(w, h, -shiftX * w, shiftY * h, w, h);
    camera.updateProjectionMatrix();

    focus.copy(temp.target);
    eye.copy(temp.position);
  }, -1);

  return null;
}
