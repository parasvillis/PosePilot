/**
 * PoseDetector
 * -------------
 * Abstract detector interface. In production (dev-client/EAS build) this is
 * backed by TensorFlow.js MoveNet via `@tensorflow-models/pose-detection` and
 * `@tensorflow/tfjs-react-native`. In Expo Go (and web preview) the native
 * TFJS kernels cannot be loaded, so we ship a high-quality simulated detector
 * that drives the full UX end-to-end and produces convincing match scores.
 *
 * Swap `createSimulatedDetector` for `createMoveNetDetector` when native ML
 * modules are available — the rest of the app uses only the `PoseDetector`
 * interface, so no other code needs to change.
 */

import { Pose } from './keypoints';
import { POSE_TEMPLATES } from './templates';

export interface PoseDetector {
  /** Current estimated user pose (normalized 0..1 coords). */
  currentPose(): Pose;
  /** Tell the detector which target we're trying to match (affects simulation). */
  setTarget(targetId: string): void;
  /** Reset convergence — used when user picks a new pose or restarts. */
  reset(): void;
  /** Nudge convergence forward by dt seconds (called on an RAF-like tick). */
  tick(dt: number): void;
  /** For display/debug. */
  confidence(): number;
}

function clonePose(p: Pose): Pose {
  return { keypoints: p.keypoints.map(k => ({ ...k })) };
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    keypoints: a.keypoints.map((ka, i) => {
      const kb = b.keypoints[i];
      return {
        x: ka.x + (kb.x - ka.x) * t,
        y: ka.y + (kb.y - ka.y) * t,
        score: Math.max(ka.score, kb.score) * 0.95 + 0.05,
      };
    }),
  };
}

function jitterPose(p: Pose, amount: number): Pose {
  return {
    keypoints: p.keypoints.map(k => ({
      x: k.x + (Math.random() - 0.5) * amount,
      y: k.y + (Math.random() - 0.5) * amount,
      score: k.score,
    })),
  };
}

/**
 * Simulated detector: starts from a "random-ish" pose and drifts toward the
 * target over ~4-6 seconds, with noise, so the score climbs realistically
 * from ~30 to ~90+.
 */
export function createSimulatedDetector(): PoseDetector {
  let targetId = POSE_TEMPLATES[0].id;
  let convergence = 0.0; // 0..1
  let jitter = 0.02;
  let basePose: Pose = clonePose(POSE_TEMPLATES[0].pose);
  let startPose: Pose = shiftedInitialPose();

  function target(): Pose {
    const t = POSE_TEMPLATES.find(p => p.id === targetId) ?? POSE_TEMPLATES[0];
    return t.pose;
  }

  function shiftedInitialPose(): Pose {
    // An "offset" version of casual_stand as the baseline "detected user"
    const base = POSE_TEMPLATES[0].pose;
    return {
      keypoints: base.keypoints.map(k => ({
        x: k.x + 0.05,
        y: k.y - 0.03,
        score: 0.8,
      })),
    };
  }

  function reset() {
    convergence = 0.0;
    startPose = shiftedInitialPose();
    basePose = clonePose(startPose);
  }

  function setTarget(id: string) {
    targetId = id;
    reset();
  }

  function tick(dt: number) {
    // Converge ~0.18/sec so it reaches ~90% in ~5s
    convergence = Math.min(1, convergence + dt * 0.2);
    // Shrink jitter as we converge
    jitter = 0.025 * (1 - convergence) + 0.005;
    basePose = lerpPose(startPose, target(), easeInOut(convergence));
  }

  function currentPose(): Pose {
    return jitterPose(basePose, jitter);
  }

  function confidence(): number {
    return 0.6 + 0.4 * convergence;
  }

  return { currentPose, setTarget, reset, tick, confidence };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
