import { Pose, Keypoint, KP, ANGLE_JOINTS } from './keypoints';

/** Minimum confidence to consider a keypoint "visible". */
export const MIN_KP_CONF = 0.3;
/** Margin from frame edge (normalized). A point closer than this is "clipped". */
const FRAME_MARGIN = 0.04;

/**
 * Critical keypoints that MUST be detected + in-frame for a valid match.
 * Head, both shoulders, both hips, both knees, both ankles for standing/full-body shots.
 */
const CRITICAL_KPS = [
  { idx: KP.NOSE, name: 'head' },
  { idx: KP.LEFT_SHOULDER, name: 'left shoulder' },
  { idx: KP.RIGHT_SHOULDER, name: 'right shoulder' },
  { idx: KP.LEFT_HIP, name: 'hips' },
  { idx: KP.RIGHT_HIP, name: 'hips' },
  { idx: KP.LEFT_KNEE, name: 'left knee' },
  { idx: KP.RIGHT_KNEE, name: 'right knee' },
  { idx: KP.LEFT_ANKLE, name: 'feet' },
  { idx: KP.RIGHT_ANKLE, name: 'feet' },
];

/** Per-pose additional required keypoints (e.g., wrists for Arms Wide). */
const POSE_REQUIRED_KPS: Record<string, number[]> = {
  arms_wide: [KP.LEFT_ELBOW, KP.RIGHT_ELBOW, KP.LEFT_WRIST, KP.RIGHT_WRIST],
  hand_on_chin: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  hand_through_hair: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  power_pose: [KP.LEFT_ELBOW, KP.RIGHT_ELBOW, KP.LEFT_WRIST, KP.RIGHT_WRIST],
  walking_shot: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  hands_in_pockets: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  leaning: [KP.LEFT_ELBOW, KP.RIGHT_ELBOW],
  casual_stand: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  sitting_cafe: [KP.LEFT_WRIST, KP.RIGHT_WRIST],
  back_shot: [],
};

export type Readiness =
  | 'ok'
  | 'no_body'
  | 'head_out'
  | 'feet_out'
  | 'side_out'
  | 'low_confidence'
  | 'missing_required';

export type JointDiff = { name: string; diff: number; weight: number };
export type MatchResult = {
  /** 0..100, already gated by visibility + framing. This is what UI shows. */
  score: number;
  /** Raw angle-only score, for debugging. */
  rawAngleScore: number;
  /** 0..1 — fraction of critical keypoints visible. */
  visibility: number;
  /** 0..1 — how well the body is contained inside the frame. */
  framing: number;
  /** Per-joint differences in radians (among joints where points were visible). */
  jointDiffs: JointDiff[];
  /** Most misaligned joint (for visual highlight). */
  worstJoint: JointDiff | null;
  /** Why the user isn't "ready" — drives the hint and auto-capture gate. */
  readiness: Readiness;
  /** True iff this pose is good enough to fire the shutter. */
  canCapture: boolean;
  /** Human-facing description of what's missing (null if ok). */
  missingDescription: string | null;
};

function kpOk(k: Keypoint): boolean {
  return (
    k.score >= MIN_KP_CONF &&
    k.x > FRAME_MARGIN &&
    k.x < 1 - FRAME_MARGIN &&
    k.y > FRAME_MARGIN &&
    k.y < 1 - FRAME_MARGIN
  );
}

function angleAt(p: Pose, joint: number, p1: number, p2: number): number {
  const j = p.keypoints[joint];
  const a = p.keypoints[p1];
  const b = p.keypoints[p2];
  const v1x = a.x - j.x, v1y = a.y - j.y;
  const v2x = b.x - j.x, v2y = b.y - j.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 < 1e-6 || m2 < 1e-6) return 0;
  const c = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(c);
}

/**
 * Confidence + framing + angle-based pose match.
 */
export function matchPoses(user: Pose, target: Pose, poseId: string): MatchResult {
  // -------- 1. Visibility check on critical keypoints --------
  const missing: string[] = [];
  let visibleCritical = 0;
  let headOut = false;
  let feetOut = false;
  let sideOut = false;

  for (const { idx, name } of CRITICAL_KPS) {
    const k = user.keypoints[idx];
    if (!kpOk(k)) {
      if (!missing.includes(name)) missing.push(name);
      if (idx === KP.NOSE) headOut = true;
      if (idx === KP.LEFT_ANKLE || idx === KP.RIGHT_ANKLE) feetOut = true;
      if (
        idx === KP.LEFT_SHOULDER ||
        idx === KP.RIGHT_SHOULDER ||
        idx === KP.LEFT_HIP ||
        idx === KP.RIGHT_HIP
      ) {
        // if left-side shoulder AND left-side hip both fail -> user body is half out laterally
        sideOut = true;
      }
    } else {
      visibleCritical++;
    }
  }
  const visibility = visibleCritical / CRITICAL_KPS.length;

  // Pose-specific required keypoints (e.g., wrists for Arms Wide)
  const extraReq = POSE_REQUIRED_KPS[poseId] ?? [];
  const extraMissing: number[] = [];
  for (const idx of extraReq) {
    if (!kpOk(user.keypoints[idx])) extraMissing.push(idx);
  }

  // Average overall confidence across all 17 points (for signal quality)
  const avgConf =
    user.keypoints.reduce((a, k) => a + (k.score ?? 0), 0) / user.keypoints.length;

  // -------- 2. Body detection gate --------
  if (avgConf < 0.2 || visibility < 0.35) {
    return {
      score: 0,
      rawAngleScore: 0,
      visibility,
      framing: 0,
      jointDiffs: [],
      worstJoint: null,
      readiness: 'no_body',
      canCapture: false,
      missingDescription: 'Step into frame',
    };
  }

  // -------- 3. Framing: every critical must be inside the frame --------
  // framing = 1 - fraction of critical kps clipped
  const framing = visibility;

  // -------- 4. Angle-based matching --------
  const diffs: JointDiff[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const j of ANGLE_JOINTS) {
    const uJ = user.keypoints[j.joint];
    const uP1 = user.keypoints[j.p1];
    const uP2 = user.keypoints[j.p2];
    // Skip joints where any participating keypoint is low-confidence/clipped.
    if (!kpOk(uJ) || !kpOk(uP1) || !kpOk(uP2)) continue;

    const ua = angleAt(user, j.joint, j.p1, j.p2);
    const ta = angleAt(target, j.joint, j.p1, j.p2);
    const d = Math.abs(ua - ta);
    diffs.push({ name: j.name, diff: d, weight: j.weight });
    const sim = Math.max(0, 1 - d / (Math.PI / 2));
    weightedSum += sim * j.weight;
    weightTotal += j.weight;
  }

  // If we couldn't compute enough joints, penalize heavily.
  const coverage = weightTotal / ANGLE_JOINTS.reduce((a, j) => a + j.weight, 0);
  const rawAngleScore =
    weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;

  // -------- 5. Final gated score --------
  // score = rawAngleScore × visibility × coverage, so missing body parts
  //         always cost you points, no matter how well the visible bits align.
  const finalScore = Math.round(rawAngleScore * visibility * coverage);

  const worst = diffs.reduce<JointDiff | null>((w, c) => {
    const cScore = c.diff * c.weight;
    const wScore = w ? w.diff * w.weight : -1;
    return cScore > wScore ? c : w;
  }, null);

  // -------- 6. Readiness decision --------
  let readiness: Readiness = 'ok';
  let missingDescription: string | null = null;

  if (headOut) {
    readiness = 'head_out';
    missingDescription = 'Your head is cut off — step back';
  } else if (feetOut) {
    readiness = 'feet_out';
    missingDescription = 'Your feet are cut off — step back';
  } else if (sideOut) {
    readiness = 'side_out';
    missingDescription = 'Full body not in frame';
  } else if (visibility < 0.85) {
    readiness = 'low_confidence';
    missingDescription = missing.length
      ? `Can't see your ${missing[0]} clearly`
      : 'Pose partially detected';
  } else if (extraMissing.length > 0) {
    readiness = 'missing_required';
    const names: Record<number, string> = {
      [KP.LEFT_WRIST]: 'left hand',
      [KP.RIGHT_WRIST]: 'right hand',
      [KP.LEFT_ELBOW]: 'left elbow',
      [KP.RIGHT_ELBOW]: 'right elbow',
    };
    const missName = names[extraMissing[0]] ?? 'arm';
    missingDescription = `Bring your ${missName} into frame`;
  }

  const canCapture = readiness === 'ok' && finalScore >= 85 && coverage >= 0.8;

  return {
    score: finalScore,
    rawAngleScore: Math.round(rawAngleScore),
    visibility,
    framing,
    jointDiffs: diffs,
    worstJoint: worst,
    readiness,
    canCapture,
    missingDescription,
  };
}
