/**
 * MobileNet-backed scene detector (web only, uses the same <video> element
 * that the MoveNet detector is already streaming from).
 *
 * Classifies every `intervalMs` (default 2000) and emits the best-fitting
 * scene tag via the subscriber callback. Costs zero API calls; runs locally
 * on WebGL. On native this is a no-op stub — we'll swap it for a vision-camera
 * frame processor when the dev-build path lights up.
 */

import { SceneId, classifyScene } from './scenes';

export interface SceneDetector {
  start(): Promise<void>;
  stop(): Promise<void>;
  onScene(cb: (s: { scene: SceneId; confidence: number }) => void): void;
}

export async function createWebSceneDetector(
  getVideo: () => HTMLVideoElement | null,
  intervalMs = 2000,
): Promise<SceneDetector> {
  let cb: ((s: { scene: SceneId; confidence: number }) => void) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let model: any = null;
  let running = false;

  const start = async () => {
    if (running) return;
    running = true;
    try {
      const mobilenet = await import('@tensorflow-models/mobilenet');
      // v2, alpha 0.5 = smallest model (~5MB), fast on any device.
      model = await mobilenet.load({ version: 2, alpha: 0.5 });
    } catch (e) {
      // If the model fails to load we silently stay in "generic" mode.
      return;
    }
    timer = setInterval(async () => {
      const v = getVideo();
      if (!v || v.readyState < 2 || !model) return;
      try {
        const preds = await model.classify(v, 5);
        const result = classifyScene(preds);
        cb?.(result);
      } catch {}
    }, intervalMs);
  };

  const stop = async () => {
    running = false;
    if (timer) clearInterval(timer);
    timer = null;
    try {
      model?.dispose?.();
    } catch {}
    model = null;
  };

  const onScene = (fn: (s: { scene: SceneId; confidence: number }) => void) => {
    cb = fn;
  };

  return { start, stop, onScene };
}
