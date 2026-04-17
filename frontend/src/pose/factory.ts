/**
 * Platform-aware factory for PoseDetector. Returns null if no real detector
 * can be started on this runtime (Expo Go, no permission, etc.).
 *
 * The concrete web module is loaded via a dynamic import so Metro doesn't
 * pull TensorFlow.js into native bundles.
 */

import { Platform } from 'react-native';
import { CreateDetectorResult } from './detector';

export async function createPoseDetector(
  facing: 'front' | 'back' = 'back',
): Promise<CreateDetectorResult> {
  if (Platform.OS === 'web') {
    try {
      const mod = await import('./webDetector');
      const webFacing = facing === 'front' ? 'user' : 'environment';
      return await mod.createWebDetector(webFacing);
    } catch (e: any) {
      return {
        ok: false,
        reason: e?.message || 'Failed to load web detector module.',
      };
    }
  }
  try {
    const mod = await import('./nativeDetector');
    return await mod.createNativeDetector();
  } catch (e: any) {
    return {
      ok: false,
      reason: e?.message || 'Failed to load native detector module.',
    };
  }
}
