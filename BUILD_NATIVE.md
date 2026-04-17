# PosePilot — Enable real on-device pose detection (EAS dev-build)

> This is **Option B** from the spec. It replaces the "Manual align" fallback
> with real-time MediaPipe pose detection running at 30 FPS locally on your
> phone. **You cannot test this in Expo Go** — you need a custom dev-build.

## What you get
- Real MoveNet / MediaPipe pose estimation on-device (no cloud)
- True auto-capture at ≥ 85 % match, held 1 s
- Works offline
- iOS and Android

## What you need
- A Mac (for iOS) or any OS (for Android)
- An [Expo account](https://expo.dev) (free)
- EAS CLI: `npm i -g eas-cli`
- An Apple Developer account (for iOS device builds) **or** an Android phone with USB-debugging

## One-time setup (from the `/app/frontend` directory)

```bash
# 1. Install the native plugins
yarn add react-native-vision-camera vision-camera-plugin-pose

# 2. Log in to Expo
eas login

# 3. Configure EAS
eas build:configure

# 4. Generate native iOS/Android projects (if not already prebuilt)
npx expo prebuild --clean
```

Make sure `app.json` still contains the camera usage strings and
`react-native-vision-camera` is listed as an Expo plugin:

```jsonc
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-splash-screen",
      [
        "react-native-vision-camera",
        { "cameraPermissionText": "PosePilot needs the camera to detect your pose" }
      ]
    ]
  }
}
```

## Build + install the dev-client

### iOS (device)
```bash
eas build --profile development --platform ios
```
- EAS will email you a QR code / link. Open it on your iPhone and install.
- On first launch, trust the developer profile under Settings → General → VPN & Device Management.

### Android (device)
```bash
eas build --profile development --platform android
```
- Download the APK from the EAS dashboard and sideload it.

## Run with the dev-client

```bash
npx expo start --dev-client
```
Scan the QR from your dev-build app (not Expo Go). The detector factory will
automatically pick up `react-native-vision-camera` and switch PosePilot out of
manual mode — you'll see a "MediaPipe" backend label inside the Settings sheet.

## Wiring up the frame processor

The stub is in `/app/frontend/src/pose/nativeDetector.ts`. Once
`react-native-vision-camera` and `vision-camera-plugin-pose` load, replace the
stub's "not wired up" branch with:

```ts
import { Camera, useFrameProcessor } from 'react-native-vision-camera';
import { detectPoses } from 'vision-camera-plugin-pose';

// …inside a Camera component:
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const poses = detectPoses(frame);
  runOnJS(setLatestPose)(toNormalized(poses[0]));
}, []);
```

Keep the 17-keypoint MoveNet ordering from `src/pose/keypoints.ts` when
normalizing — every UI component already assumes that layout.

## Troubleshooting
- **"Native pose plugin detected but frame processor is not yet wired up."** —
  Finish the step above.
- **Black camera on iOS** — verify `NSCameraUsageDescription` in `app.json`
  (already included) and rebuild.
- **EAS build fails on `pod install`** — run `npx expo prebuild --clean` and
  retry. Apple sometimes requires `xcode-select --install`.
- **Still seeing "Manual align mode"** — `eas build` cached old JS; force a
  new build or run `eas build --profile development --platform ios --clear-cache`.

## Reverting
Prefer to stay in Expo Go for now? Just skip all the above. The web preview
and Expo Go both work — the app simply shows "Manual align mode" and skips
scoring/auto-capture.
