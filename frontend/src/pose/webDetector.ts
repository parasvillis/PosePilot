/**
 * Web pose detector — real TensorFlow.js MoveNet against a <video> element.
 *
 * We manage the webcam stream ourselves (not via expo-camera on web) because
 * we need direct access to the HTMLVideoElement frames to feed the model, and
 * spawning two concurrent getUserMedia consumers on the same device is
 * unreliable across browsers.
 *
 * The video element is exposed via `getVideoElement()` so the camera screen
 * can render it full-bleed and capture still frames for the gallery.
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { Pose } from './keypoints';
import { PoseDetector, CreateDetectorResult } from './detector';

class WebMoveNetDetector implements PoseDetector {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private detector: poseDetection.PoseDetector | null = null;
  private raf: number | null = null;
  private latest: Pose | null = null;
  private ready = false;
  private facing: 'user' | 'environment' = 'environment';

  constructor(facing: 'user' | 'environment' = 'environment') {
    this.facing = facing;
  }

  isReady() {
    return this.ready;
  }

  currentPose() {
    return this.latest;
  }

  backendLabel() {
    return 'MoveNet · WebGL';
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  /** Attach the managed <video> into a React-owned DOM container. */
  mountInto(container: HTMLElement) {
    if (this.video && this.video.parentElement !== container) {
      container.appendChild(this.video);
    }
  }

  /** Capture a still frame as a JPEG data URL. */
  captureFrameDataURL(quality = 0.85): string | null {
    if (!this.video || this.video.readyState < 2) return null;
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (this.facing === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  }

  async start() {
    // 1. Request webcam
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: this.facing, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });

    // 2. Attach to hidden video
    const v = document.createElement('video');
    v.autoplay = true;
    v.muted = true;
    v.playsInline = true;
    v.style.position = 'absolute';
    v.style.width = '100%';
    v.style.height = '100%';
    v.style.objectFit = 'cover';
    (v as any).srcObject = this.stream;
    this.video = v;
    await new Promise<void>(res => {
      v.onloadedmetadata = () => {
        v.play().then(() => res()).catch(() => res());
      };
    });

    // 3. Init TFJS + MoveNet
    await tf.setBackend('webgl');
    await tf.ready();
    this.detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      },
    );
    this.ready = true;

    // 4. Detection loop
    const loop = async () => {
      if (!this.video || !this.detector) return;
      try {
        if (this.video.readyState >= 2) {
          const poses = await this.detector.estimatePoses(this.video, {
            flipHorizontal: this.facing === 'user',
          });
          if (poses.length > 0) {
            this.latest = toNormalizedPose(poses[0], this.video.videoWidth, this.video.videoHeight);
          } else {
            this.latest = null;
          }
        }
      } catch (e) {
        // swallow — keep the loop alive
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  async stop() {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
    try {
      this.detector?.dispose();
    } catch {}
    this.detector = null;
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.video = null;
    this.ready = false;
  }
}

function toNormalizedPose(
  p: poseDetection.Pose,
  w: number,
  h: number,
): Pose {
  // MoveNet keypoint order matches ours (17 keypoints, same index layout).
  return {
    keypoints: p.keypoints.slice(0, 17).map(k => ({
      x: (k.x ?? 0) / w,
      y: (k.y ?? 0) / h,
      score: k.score ?? 0,
    })),
  };
}

export async function createWebDetector(
  facing: 'user' | 'environment' = 'environment',
): Promise<CreateDetectorResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'Camera API not available in this browser.' };
  }
  try {
    const d = new WebMoveNetDetector(facing);
    await d.start();
    return { ok: true, detector: d };
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'Failed to start MoveNet.' };
  }
}

export type { WebMoveNetDetector };
