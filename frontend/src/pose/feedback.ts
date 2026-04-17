import { Pose, KP } from './keypoints';
import { JointDiff, MatchResult } from './matcher';

/**
 * Generates at most 1 short textual hint based on the worst-misaligned joint
 * and positional deltas between user and target. Kept intentionally simple —
 * the design guideline is "max 1-2 hints at a time".
 */
export function generateHint(user: Pose, target: Pose, match: MatchResult): string | null {
  if (!match.worstJoint) return null;
  if (match.score >= 85) return null;

  // Broad directional nudges on torso alignment first
  const uShoulderMid = midpoint(user.keypoints[KP.LEFT_SHOULDER], user.keypoints[KP.RIGHT_SHOULDER]);
  const tShoulderMid = midpoint(target.keypoints[KP.LEFT_SHOULDER], target.keypoints[KP.RIGHT_SHOULDER]);
  const dx = tShoulderMid.x - uShoulderMid.x;
  const dy = tShoulderMid.y - uShoulderMid.y;

  if (Math.abs(dx) > 0.08) {
    return dx > 0 ? 'Step slightly right' : 'Step slightly left';
  }
  if (Math.abs(dy) > 0.08) {
    return dy > 0 ? 'Move camera up a bit' : 'Move camera down a bit';
  }

  const w = match.worstJoint;
  switch (w.name) {
    case 'left_elbow':
    case 'right_elbow':
      return 'Adjust your elbow angle';
    case 'left_shoulder':
    case 'right_shoulder':
      return 'Relax your shoulder';
    case 'left_hip':
    case 'right_hip':
      return 'Shift your hips';
    case 'left_knee':
    case 'right_knee':
      return 'Soften your knee';
    case 'neck':
      return 'Raise your chin';
    default:
      return 'Match the outline';
  }
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Perfect';
  if (score >= 85) return 'Locked in';
  if (score >= 70) return 'Close';
  if (score >= 50) return 'Aligning';
  return 'Frame yourself';
}

export function scoreColor(score: number, accent: string, success: string, muted: string): string {
  if (score >= 85) return success;
  if (score >= 50) return accent;
  return muted;
}

export function joinsOutOfLine(match: MatchResult, threshold = 0.25): string[] {
  // diff is in radians; 0.25 rad ~ 14deg
  return match.jointDiffs.filter(d => d.diff > threshold).map(d => d.name);
}
