import { Pose, ANGLE_JOINTS } from './keypoints';

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
  return Math.acos(c); // radians
}

/**
 * Compare user pose vs target pose using weighted joint-angle similarity.
 * Returns a list of per-joint diffs (radians) and an overall score 0..100.
 * Scale/position invariant because it uses angles only.
 */
export type JointDiff = { name: string; diff: number; weight: number };
export type MatchResult = {
  score: number; // 0..100
  jointDiffs: JointDiff[];
  worstJoint: JointDiff | null;
};

export function matchPoses(user: Pose, target: Pose): MatchResult {
  const diffs: JointDiff[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const j of ANGLE_JOINTS) {
    const ua = angleAt(user, j.joint, j.p1, j.p2);
    const ta = angleAt(target, j.joint, j.p1, j.p2);
    const d = Math.abs(ua - ta); // radians, 0..pi
    diffs.push({ name: j.name, diff: d, weight: j.weight });
    // Convert to similarity: 1 when diff=0, 0 when diff >= pi/2 (90deg off)
    const sim = Math.max(0, 1 - d / (Math.PI / 2));
    weightedSum += sim * j.weight;
    weightTotal += j.weight;
  }

  const score = Math.round((weightedSum / weightTotal) * 100);
  const worst = diffs.reduce<JointDiff | null>((w, c) => {
    const cScore = c.diff * c.weight;
    const wScore = w ? w.diff * w.weight : -1;
    return cScore > wScore ? c : w;
  }, null);

  return { score, jointDiffs: diffs, worstJoint: worst };
}
