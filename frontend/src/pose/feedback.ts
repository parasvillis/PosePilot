import { Pose, KP } from './keypoints';
import { MatchResult, MIN_KP_CONF } from './matcher';

/**
 * Generates at most one short hint based on readiness + worst joint.
 * Prioritizes framing/visibility issues over fine joint tuning.
 */
export function generateHint(user: Pose, target: Pose, match: MatchResult): string | null {
  // Framing/visibility issues win — user can't improve joint angles
  // until they're fully in frame.
  if (match.missingDescription) return match.missingDescription;

  if (match.score >= 85) return null;

  // Torso/camera position nudge
  const uL = user.keypoints[KP.LEFT_SHOULDER];
  const uR = user.keypoints[KP.RIGHT_SHOULDER];
  const tL = target.keypoints[KP.LEFT_SHOULDER];
  const tR = target.keypoints[KP.RIGHT_SHOULDER];
  if (uL.score >= MIN_KP_CONF && uR.score >= MIN_KP_CONF) {
    const uMid = { x: (uL.x + uR.x) / 2, y: (uL.y + uR.y) / 2 };
    const tMid = { x: (tL.x + tR.x) / 2, y: (tL.y + tR.y) / 2 };
    const dx = tMid.x - uMid.x;
    const dy = tMid.y - uMid.y;
    if (Math.abs(dx) > 0.08) return dx > 0 ? 'Step slightly right' : 'Step slightly left';
    if (Math.abs(dy) > 0.08) return dy > 0 ? 'Move camera up a bit' : 'Move camera down a bit';
  }

  const w = match.worstJoint;
  if (!w) return 'Match the outline';
  switch (w.name) {
    case 'left_elbow':
    case 'right_elbow':
      return 'Adjust your elbow angle';
    case 'left_shoulder':
    case 'right_shoulder':
      return 'Relax your shoulders';
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
