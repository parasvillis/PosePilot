import { Pose, KP } from './keypoints';
import { MIN_KP_CONF } from './matcher';

/** Geometric read of how the subject sits inside the frame. */
export type Composition = {
  /** Subject bounding box (min/max across all confident keypoints). */
  bbox: { x: number; y: number; w: number; h: number };
  /** Centroid of shoulders + hips, the subject's "visual weight". */
  center: { x: number; y: number };
  /** Distance from the nearest rule-of-thirds vertical line (0..0.5). */
  rotV: number;
  /** Head-room: space above the top of the head (0..1). */
  headRoom: number;
  /** Shoulder tilt in radians (positive = right shoulder lower). */
  shoulderTilt: number;
  /** Hip tilt in radians. */
  hipTilt: number;
  /** Face direction from eye-nose-ear geometry. */
  faceDir: 'left' | 'right' | 'front';
  /** Arm symmetry — 0 = symmetric, 1 = very asymmetric. */
  armAsymmetry: number;
  /** Is the head looking up / down / level. */
  chin: 'up' | 'down' | 'level';
};

function present(p: Pose, idx: number): boolean {
  const k = p.keypoints[idx];
  return k.score >= MIN_KP_CONF && k.x > 0 && k.x < 1 && k.y > 0 && k.y < 1;
}

export function analyzeComposition(p: Pose): Composition {
  const visible = p.keypoints.filter(k => k.score >= MIN_KP_CONF);
  const xs = visible.map(k => k.x);
  const ys = visible.map(k => k.y);
  const minX = xs.length ? Math.min(...xs) : 0.5;
  const maxX = xs.length ? Math.max(...xs) : 0.5;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 1;

  const lSh = p.keypoints[KP.LEFT_SHOULDER];
  const rSh = p.keypoints[KP.RIGHT_SHOULDER];
  const lHip = p.keypoints[KP.LEFT_HIP];
  const rHip = p.keypoints[KP.RIGHT_HIP];
  const nose = p.keypoints[KP.NOSE];
  const lEye = p.keypoints[KP.LEFT_EYE];
  const rEye = p.keypoints[KP.RIGHT_EYE];
  const lEar = p.keypoints[KP.LEFT_EAR];
  const rEar = p.keypoints[KP.RIGHT_EAR];

  const centerX = ((present(p, KP.LEFT_SHOULDER) ? lSh.x : 0.5) +
                   (present(p, KP.RIGHT_SHOULDER) ? rSh.x : 0.5) +
                   (present(p, KP.LEFT_HIP) ? lHip.x : 0.5) +
                   (present(p, KP.RIGHT_HIP) ? rHip.x : 0.5)) / 4;
  const centerY = ((present(p, KP.LEFT_SHOULDER) ? lSh.y : 0.5) +
                   (present(p, KP.RIGHT_SHOULDER) ? rSh.y : 0.5)) / 2;

  // Rule of thirds: vertical lines at x=1/3 and 2/3
  const rotV = Math.min(Math.abs(centerX - 1 / 3), Math.abs(centerX - 2 / 3));

  const headRoom = Math.max(0, Math.min(1, present(p, KP.NOSE) ? nose.y : 0));

  const shoulderTilt = present(p, KP.LEFT_SHOULDER) && present(p, KP.RIGHT_SHOULDER)
    ? Math.atan2(lSh.y - rSh.y, lSh.x - rSh.x)
    : 0;
  const hipTilt = present(p, KP.LEFT_HIP) && present(p, KP.RIGHT_HIP)
    ? Math.atan2(lHip.y - rHip.y, lHip.x - rHip.x)
    : 0;

  // Face direction: left ear should be visible when looking left, right ear when looking right
  let faceDir: 'left' | 'right' | 'front' = 'front';
  if (present(p, KP.NOSE) && present(p, KP.LEFT_EYE) && present(p, KP.RIGHT_EYE)) {
    const eyeMid = (lEye.x + rEye.x) / 2;
    const d = nose.x - eyeMid;
    if (d < -0.01) faceDir = 'left';
    else if (d > 0.01) faceDir = 'right';
    // If only one ear visible, override
    const lv = present(p, KP.LEFT_EAR);
    const rv = present(p, KP.RIGHT_EAR);
    if (lv && !rv) faceDir = 'right';
    if (rv && !lv) faceDir = 'left';
  }

  // Chin tilt — compare ear height to nose height
  let chin: 'up' | 'down' | 'level' = 'level';
  if (present(p, KP.NOSE) && (present(p, KP.LEFT_EAR) || present(p, KP.RIGHT_EAR))) {
    const ear = present(p, KP.LEFT_EAR) ? lEar : rEar;
    const dy = ear.y - nose.y;
    if (dy > 0.02) chin = 'up';
    else if (dy < -0.02) chin = 'down';
  }

  // Arm asymmetry — height difference of wrists relative to shoulders
  let armAsymmetry = 0;
  if (present(p, KP.LEFT_WRIST) && present(p, KP.RIGHT_WRIST)) {
    const lw = p.keypoints[KP.LEFT_WRIST];
    const rw = p.keypoints[KP.RIGHT_WRIST];
    armAsymmetry = Math.min(1, Math.abs(lw.y - rw.y) / 0.3);
  }

  return {
    bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    center: { x: centerX, y: centerY },
    rotV,
    headRoom,
    shoulderTilt,
    hipTilt,
    faceDir,
    armAsymmetry,
    chin,
  };
}
