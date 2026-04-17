/**
 * PoseDetector
 * ------------
 * Honest interface for pose detection. Three real implementations (or null):
 *
 *   1. Web (any browser, including the Expo web preview):
 *        TensorFlow.js MoveNet fed from a <video> element opened with
 *        navigator.mediaDevices.getUserMedia. Returns real keypoints.
 *
 *   2. Native dev-client (EAS build) with vision-camera + a pose plugin:
 *        Dynamic require of `react-native-vision-camera` and a frame-processor
 *        pose plugin. Returns real keypoints. In Expo Go the require fails
 *        gracefully and we return `null`.
 *
 *   3. No detector available (Expo Go, no camera permission, or any failure):
 *        Factory returns null. The UI hides the score meter + auto-capture
 *        and shows only the ghost outline so the user can manually align.
 *
 * There is NO simulated/animated detector anywhere. If we can't run real ML,
 * we say so — we don't fake a score.
 */

import { Pose } from './keypoints';

export interface PoseDetector {
  /** Whether this detector is ready to produce poses. */
  isReady(): boolean;
  /** Latest detected pose, or null if nothing detected this frame. */
  currentPose(): Pose | null;
  /** Start detection loop. */
  start(): Promise<void>;
  /** Stop loop and release GPU/stream resources. */
  stop(): Promise<void>;
  /** A human-facing label: "WebGL MoveNet", "VisionCamera MediaPipe", etc. */
  backendLabel(): string;
}

export type CreateDetectorResult =
  | { ok: true; detector: PoseDetector }
  | { ok: false; reason: string };
