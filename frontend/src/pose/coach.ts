import { Pose } from './keypoints';
import { PoseMode, detectPoseMode, poseModeLabel } from './poseMode';
import { analyzeComposition, Composition } from './composition';
import { SceneId } from './scenes';

/**
 * Rule-based photographer coach.
 *
 * Inputs: the user's live keypoints, detected scene, optional target template.
 * Output: one primary tip + a readiness flag + a quality score (0..100).
 *
 * The tips are scoped by pose mode — we don't tell someone taking a selfie to
 * "step to the right", we tell them to "turn your chin" or "raise your wrist".
 */

export type CoachAdvice = {
  mode: PoseMode;
  modeLabel: string;
  tip: string | null;
  /** Optional secondary tip, shown only when very confident. */
  subTip: string | null;
  /** 0..100 — overall "how good does this shot look right now". */
  quality: number;
  /** True = composition + pose stable enough to fire the shutter. */
  canCapture: boolean;
  /** For UI highlight — list of joints the coach is focused on. */
  focus: string[];
};

type CoachInputs = {
  user: Pose;
  scene: SceneId;
  /** Whether the user is currently "aiming" at a template from the library. */
  targetPoseId?: string | null;
};

export function coach(inputs: CoachInputs): CoachAdvice {
  const { user } = inputs;
  const mode = detectPoseMode(user);
  const composition = analyzeComposition(user);
  const modeLabel = poseModeLabel(mode);

  // No body detected at all
  if (mode === 'unknown') {
    return {
      mode, modeLabel,
      tip: 'Step into frame — I can\'t see you yet',
      subTip: null,
      quality: 0,
      canCapture: false,
      focus: [],
    };
  }

  // Route to mode-specific rule sets
  let advice: { tip: string | null; subTip: string | null; quality: number; focus: string[] } = {
    tip: null, subTip: null, quality: 50, focus: [],
  };

  if (mode === 'selfie') advice = coachSelfie(composition, user);
  else if (mode === 'seated') advice = coachSeated(composition, user);
  else if (mode === 'half_body') advice = coachHalfBody(composition, user);
  else if (mode === 'full_body') advice = coachFullBody(composition, user);

  // Scene nudge — append a scene-specific flourish when quality is decent
  if (advice.quality >= 75) {
    const s = sceneFlourish(inputs.scene, mode);
    if (s && !advice.subTip) advice.subTip = s;
  }

  const canCapture = advice.quality >= 82;

  return {
    mode,
    modeLabel,
    tip: advice.tip,
    subTip: advice.subTip,
    quality: advice.quality,
    canCapture,
    focus: advice.focus,
  };
}

// ============================================================
// MODE-SPECIFIC RULE SETS
// ============================================================

function coachSelfie(c: Composition, _user: Pose) {
  const tips: string[] = [];
  const focus: string[] = [];
  let q = 78;

  // Chin
  if (c.chin === 'up') { tips.push('Tuck your chin down a touch'); focus.push('neck'); q -= 10; }
  else if (c.chin === 'down') { tips.push('Lift your chin just slightly'); focus.push('neck'); q -= 6; }

  // Face direction — 3/4 angle reads better than flat-on
  if (c.faceDir === 'front') { tips.push('Turn 15° to your right for dimension'); focus.push('neck'); q -= 5; }

  // Head room for a selfie — too tight is worse than too loose
  if (c.headRoom < 0.05) { tips.push('Drop the phone a little — give your hair some room'); q -= 8; }
  else if (c.headRoom > 0.22) { tips.push('Lift the phone a touch — less space above you'); q -= 4; }

  // Shoulder tilt — dramatic angles read better than flat
  if (Math.abs(c.shoulderTilt) < 0.08) { tips.push('Drop one shoulder for a softer line'); focus.push('left_shoulder', 'right_shoulder'); q -= 6; }

  return pickBest(tips, focus, q);
}

function coachSeated(c: Composition, _user: Pose) {
  const tips: string[] = [];
  const focus: string[] = [];
  let q = 72;

  if (c.chin === 'down') { tips.push('Lift your chin — pretend someone just called your name'); focus.push('neck'); q -= 8; }
  if (c.faceDir === 'front') { tips.push('Look past the camera to the right'); focus.push('neck'); q -= 5; }
  if (c.armAsymmetry < 0.15) { tips.push('Rest one elbow on the table, one hand in your lap'); focus.push('left_elbow'); q -= 8; }
  if (Math.abs(c.hipTilt) < 0.05) { tips.push('Cross your ankles and lean slightly forward'); q -= 6; }
  if (c.rotV > 0.15) { tips.push('Shift right so you\'re on the rule-of-thirds line'); q -= 6; }

  return pickBest(tips, focus, q);
}

function coachHalfBody(c: Composition, _user: Pose) {
  const tips: string[] = [];
  const focus: string[] = [];
  let q = 74;

  if (c.chin === 'up') { tips.push('Tuck chin down a touch for a softer jawline'); focus.push('neck'); q -= 8; }
  if (c.faceDir === 'front') { tips.push('Turn your torso 30° to your left'); focus.push('left_shoulder','right_shoulder'); q -= 6; }
  if (Math.abs(c.shoulderTilt) < 0.06) { tips.push('Drop your right shoulder, relax'); focus.push('right_shoulder'); q -= 6; }
  if (c.armAsymmetry < 0.12) { tips.push('Tuck one hand in a pocket — let the other hang loose'); focus.push('left_wrist','right_wrist'); q -= 6; }
  if (c.rotV > 0.18) { tips.push('Step half a foot to your right'); q -= 5; }
  if (c.headRoom < 0.06) { tips.push('A hair more head-room please — tilt camera up'); q -= 6; }

  return pickBest(tips, focus, q);
}

function coachFullBody(c: Composition, _user: Pose) {
  const tips: string[] = [];
  const focus: string[] = [];
  let q = 70;

  // Weight + balance
  if (Math.abs(c.hipTilt) < 0.05 && Math.abs(c.shoulderTilt) < 0.05) {
    tips.push('Shift weight onto one leg — kill the symmetry');
    focus.push('left_hip','right_hip');
    q -= 8;
  }
  if (c.chin === 'down') { tips.push('Chin up — eyes to the horizon'); focus.push('neck'); q -= 6; }
  if (c.faceDir === 'front') { tips.push('Turn 20° to your left, look past the camera'); focus.push('neck'); q -= 5; }
  if (c.armAsymmetry < 0.1) { tips.push('One hand in pocket, the other relaxed at your side'); focus.push('left_wrist','right_wrist'); q -= 6; }

  // Framing
  if (c.headRoom < 0.04) { tips.push('Tilt the camera up — your head is kissing the frame'); q -= 8; }
  if (c.headRoom > 0.22) { tips.push('Too much sky above — step closer or tilt down'); q -= 6; }
  if (c.rotV > 0.18) { tips.push('Compose on thirds — step a touch right'); q -= 5; }
  if (c.bbox.h < 0.55) { tips.push('You\'re small in the frame — step closer'); q -= 10; }

  return pickBest(tips, focus, q);
}

function sceneFlourish(scene: SceneId, mode: PoseMode): string | null {
  if (mode === 'selfie') {
    if (scene === 'beach') return 'Catch the sun in your eyes, not your lens';
    if (scene === 'cafe') return 'Lean a hand on the cup for depth';
    if (scene === 'party') return 'Soft laugh — mouth slightly open';
    return null;
  }
  if (scene === 'beach') return 'Let the wave edge lead into you';
  if (scene === 'mountain') return 'Leave room on the horizon side';
  if (scene === 'cafe') return 'Frame with the window, not the door';
  if (scene === 'street') return 'Let a leading line run behind you';
  if (scene === 'graduation') return 'Hold the scroll at chest — not belly';
  if (scene === 'fitness') return 'Squared shoulders, chest proud';
  return null;
}

function pickBest(tips: string[], focus: string[], baseQ: number) {
  // Keep only the first 2 tips — Hick's law.
  const primary = tips[0] ?? null;
  const secondary = tips[1] ?? null;
  const q = Math.max(0, Math.min(100, baseQ + (tips.length === 0 ? 15 : 0)));
  return { tip: primary, subTip: secondary, quality: q, focus };
}
