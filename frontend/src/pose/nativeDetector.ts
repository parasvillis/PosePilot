/**
 * Native pose detector — real on-device ML via react-native-vision-camera
 * and a MediaPipe pose plugin, available only in EAS dev-builds (not Expo Go).
 *
 * Expo Go cannot load native ML modules, so we ship this file as a *stub*.
 * To enable real native pose detection, follow /app/BUILD_NATIVE.md:
 *
 *   1. yarn add react-native-vision-camera vision-camera-plugin-pose
 *   2. Replace the stub below with a real frame-processor implementation
 *      (example in BUILD_NATIVE.md).
 *   3. npx expo prebuild && eas build --profile development --platform ios
 *
 * Until those steps are done, this factory intentionally returns an
 * "unavailable" result so the UI falls back to honest manual-align mode.
 */

import { CreateDetectorResult } from './detector';

export async function createNativeDetector(): Promise<CreateDetectorResult> {
  return {
    ok: false,
    reason:
      'On-device pose detection requires an EAS dev-build with react-native-vision-camera. Expo Go cannot run native ML modules. See BUILD_NATIVE.md for step-by-step instructions.',
  };
}
