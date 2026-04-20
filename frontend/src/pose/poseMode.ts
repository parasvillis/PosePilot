import { Pose, KP } from './keypoints';
import { MIN_KP_CONF } from './matcher';

export type PoseMode =
  | 'full_body'   // head + shoulders + hips + knees + ankles all visible
  | 'half_body'   // head + shoulders + hips, legs out of frame
  | 'selfie'      // head dominates, arm close to camera
  | 'seated'      // knees bent tight, torso compressed
  | 'unknown';

/** Tight visibility check: keypoint is considered present + in-frame. */
function present(p: Pose, idx: number): boolean {
  const k = p.keypoints[idx];
  return (
    k.score >= MIN_KP_CONF &&
    k.x > 0.03 && k.x < 0.97 &&
    k.y > 0.03 && k.y < 0.97
  );
}

/** Yes/no on a cluster of keypoints (all must be present). */
function cluster(p: Pose, ids: number[]): boolean {
  return ids.every(i => present(p, i));
}

/**
 * Infer what KIND of shot the user is framing. The coach uses this to
 * decide what kinds of tips are relevant.
 */
export function detectPoseMode(p: Pose): PoseMode {
  const hasHead = present(p, KP.NOSE);
  const hasShoulders = cluster(p, [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER]);
  const hasHips = cluster(p, [KP.LEFT_HIP, KP.RIGHT_HIP]);
  const hasKnees = cluster(p, [KP.LEFT_KNEE, KP.RIGHT_KNEE]);
  const hasAnkles = cluster(p, [KP.LEFT_ANKLE, KP.RIGHT_ANKLE]);

  if (!hasHead || !hasShoulders) return 'unknown';

  // Selfie: face takes > ~30 % of frame height, hips not visible
  const eyeL = p.keypoints[KP.LEFT_EYE];
  const eyeR = p.keypoints[KP.RIGHT_EYE];
  const nose = p.keypoints[KP.NOSE];
  const leftSh = p.keypoints[KP.LEFT_SHOULDER];
  const rightSh = p.keypoints[KP.RIGHT_SHOULDER];
  const eyeDist = Math.hypot(eyeL.x - eyeR.x, eyeL.y - eyeR.y);
  const shY = (leftSh.y + rightSh.y) / 2;
  const faceBig = eyeDist > 0.08; // eyes > 8 % of frame apart = head is huge
  const shouldersLow = shY > 0.45;
  if (faceBig || (!hasHips && shouldersLow)) return 'selfie';

  if (hasHead && hasShoulders && hasHips && hasKnees && hasAnkles) {
    // Seated check: knees close to hips vertically + ankles only slightly below knees
    const hipY = (p.keypoints[KP.LEFT_HIP].y + p.keypoints[KP.RIGHT_HIP].y) / 2;
    const kneeY = (p.keypoints[KP.LEFT_KNEE].y + p.keypoints[KP.RIGHT_KNEE].y) / 2;
    const ankleY = (p.keypoints[KP.LEFT_ANKLE].y + p.keypoints[KP.RIGHT_ANKLE].y) / 2;
    const thigh = kneeY - hipY;
    const shin = ankleY - kneeY;
    if (thigh < 0.15 && shin < 0.2) return 'seated';
    return 'full_body';
  }

  if (hasHead && hasShoulders && hasHips) return 'half_body';

  return 'unknown';
}

/** Friendly label for the HUD. */
export function poseModeLabel(m: PoseMode): string {
  switch (m) {
    case 'full_body': return 'FULL BODY';
    case 'half_body': return 'HALF BODY';
    case 'selfie': return 'SELFIE';
    case 'seated': return 'SEATED';
    default: return 'FRAMING';
  }
}
