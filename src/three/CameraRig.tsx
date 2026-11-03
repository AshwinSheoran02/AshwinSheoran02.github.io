import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, Vector3, type PerspectiveCamera } from "three";
import { scrollOffset } from "../lib/scroller";
import { rig, ui } from "../lib/store";
import { clamp01, damp, easeInOut, easeOutCubic } from "./helpers";
import { INTRO_FROM, keyframes, type Keyframe } from "./layout";
import { eye, focus, smoothed } from "./rigState";

interface Pose {
  position: Vector3;
  target: Vector3;
  fov: number;
  shiftX: number;
  shiftY: number;
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

export function CameraRig({ introSeconds = 5.2 }: { introSeconds?: number }) {
  const introHurry = useRef(false);
  useEffect(() => {
    const hurry = () => {
      introHurry.current = true;
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((name) => window.addEventListener(name, hurry, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, hurry));
  }, []);
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
    parallaxX: 0,
    parallaxY: 0,
    introStart: -1,
    introSkipped: false,
    introProgress: 0,
  });
  const temp = useMemo(
    () => ({ position: new Vector3(), target: new Vector3(), right: new Vector3(), up: new Vector3() }),
    [],
  );
  // The opening flight: from high outside the bowl, sweeping in over the crowd to the screen.
  const intro = useMemo(
    () => ({
      from: new Vector3(...INTRO_FROM.position),
      via: new Vector3(...INTRO_FROM.via),
      lookFrom: new Vector3(...INTRO_FROM.target),
      curve: new CatmullRomCurve3([new Vector3(), new Vector3(), new Vector3()], false, "centripetal"),
      point: new Vector3(),
      look: new Vector3(),
    }),
    [],
  );

  useFrame((frameState, delta) => {
    // Smoothing works in real time even on a slow machine, so the camera never lags far behind the scroll.
    const dt = Math.min(delta, 0.3);
    const s = state.current;
    const aspect = size.width / Math.max(1, size.height);
    const reduced = rig.reducedMotion;
    const { sceneReady } = ui.get();

    keyframes.forEach((frame, index) => {
      solvePose(frame, aspect, poses[index]);
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

    // Opening shot: the lights come on while the camera holds high above the ground,
    // then it sweeps down over the crowd and into the giant screen.
    if (sceneReady && s.introStart < 0) {
      s.introStart = frameState.clock.elapsedTime;
      // Arriving mid-page (a restored scroll position or a deep link) skips the opening flight.
      s.introSkipped = scrollOffset() > 40;
    }
    const skipIntro = reduced || rig.capture || s.introSkipped;
    if (!skipIntro && s.introStart >= 0 && frameState.clock.elapsedTime - s.introStart > 1.2) {
      // Any scroll, key or tap during the flight fast-forwards it rather than cutting.
      // Wall-clock time, so the flight takes the same few seconds however slow the frames are.
      const wall = Math.min(delta, 0.5);
      s.introProgress = Math.min(1, s.introProgress + (wall / introSeconds) * (introHurry.current ? 5 : 1));
    }
    const progress = skipIntro ? 1 : s.introProgress;
    if (progress < 1) {
      const k = easeInOut(progress);
      intro.curve.points[0].copy(intro.from);
      intro.curve.points[1].copy(intro.via);
      intro.curve.points[2].copy(temp.position);
      intro.curve.getPoint(easeOutCubic(k * 0.5 + progress * 0.5), intro.point);
      intro.look.copy(intro.lookFrom).lerp(temp.target, easeInOut(clamp01(progress * 1.25)));
      temp.position.copy(intro.point);
      temp.target.copy(intro.look);
    }
    // The lower third comes in for the last part of the flight, not after it.
    if (progress >= 0.7 && !ui.get().introDone) ui.set({ introDone: true });
    // Never let the spidercam dip into the turf between stations.
    temp.position.y = Math.max(temp.position.y, 0.45);

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
    camera.far = 2400;
    const w = size.width;
    const h = size.height;
    camera.setViewOffset(w, h, -shiftX * w, shiftY * h, w, h);
    camera.updateProjectionMatrix();

    focus.copy(temp.target);
    eye.copy(temp.position);
  }, -1);

  return null;
}
