# PosePilot — Product Requirements Document

## Vision
Real-time AI posing assistant: overlays a "ghost pose" on the live camera, detects the user's body on-device, compares to a target pose (angle-based matching), provides minimal textual hints, and auto-captures at ≥ 85 % match held 1 s.

Tagline: **Never look awkward in photos again.**

## Current build — what is real, what is not

| Runtime | Detector | Score | Auto-capture | User-pose overlay |
|---|---|---|---|---|
| **Web preview** (any modern browser) | ✅ **Real** — TensorFlow.js MoveNet SinglePose Lightning over webcam via `getUserMedia` | Real, scale/position invariant (angle-based) | Real, at 85 % for 1 s | Real accent-colored skeleton |
| **Expo Go** (iOS/Android) | ❌ Not available — Expo Go can't load native ML | N/A — "MANUAL" chip shown | Hidden | Not drawn |
| **EAS dev-build** (iOS/Android) | ✅ Available when `react-native-vision-camera` + a pose plugin are installed per `/app/BUILD_NATIVE.md` | Real | Real | Real |

There is **no simulated "converging animation" detector** anywhere in the code. If real ML isn't running, the UI honestly says so and falls back to manual-align mode (ghost outline + manual shutter).

## v1 Scope (delivered)
1. **Onboarding (3 screens)** — Point / Align / Capture with dashed pose illustrations. Persists via AsyncStorage.
2. **Camera** — Full-bleed preview (webcam on web via managed `<video>`; `expo-camera` on native), ghost target outline, live user-pose overlay (when ML active), pose name pill, front/rear toggle, timer (off/3s/5s), auto-capture toggle (only visible when ML active), opacity slider, settings sheet, haptics, grid.
3. **Pose library** — 10 templates (Casual Stand, Hands in Pockets, Arms Wide, Leaning, Walking Shot, Sitting Cafe, Back Shot, Hand on Chin, Hand Through Hair, Power Pose) as MoveNet-format 17-keypoint JSON.
4. **Matching engine** — Weighted joint-angle comparison (elbows, shoulders, hips, knees, neck). 0–100 score + per-joint diffs.
5. **Feedback engine** — Max one hint per tick ("Step slightly right", "Raise your chin", etc.). Red highlights on misaligned joints.
6. **Auto-capture** — 3-second grace on mount, score ≥ 85 held 1 s → shutter + haptic + gallery save.
7. **Gallery** — AsyncStorage-backed, 3-col grid, score badge.
8. **Before/After preview** — Toggle between final photo and overlaid skeletons (user vs target). Share + delete.
9. **Settings** — Auto-capture (when ML), haptics, grid, overlay opacity, timer.

## Architecture
- `/src/pose/detector.ts` — `PoseDetector` interface + `CreateDetectorResult` factory result.
- `/src/pose/factory.ts` — Platform-aware factory (dynamic imports).
- `/src/pose/webDetector.ts` — Real TFJS MoveNet + getUserMedia + captureFrameDataURL.
- `/src/pose/nativeDetector.ts` — Stub; replace with vision-camera frame processor (see BUILD_NATIVE.md).
- `/src/pose/templates.ts` — 10 poses in 17-keypoint JSON.
- `/src/pose/matcher.ts` — Angle-based weighted matching.
- `/src/pose/feedback.ts` — Hint generation.
- `/src/components/*` — PoseOverlay, ScoreMeter, PoseCarousel, FeedbackToast, CaptureButton.
- `/src/storage/gallery.ts` — AsyncStorage for captures, onboarding flag, settings.

## How to test

### A. Web preview (real ML)
1. Open `https://align-pose.preview.emergentagent.com` in a browser on a laptop/phone.
2. **Grant camera permission** when prompted.
3. You should see your webcam feed + the dashed ghost outline.
4. Within ~2–4 s the "Loading pose model…" banner disappears and an accent-yellow skeleton appears over you (that's the real MoveNet output).
5. Pick a pose from the bottom carousel. The score at the bottom-right shows the real match.
6. Mirror the outline — score climbs; at ≥ 85 held 1 s the app auto-shoots.

### B. Expo Go (manual align)
Open the QR code from `expo start` in Expo Go → grant camera → you'll see the real camera feed + ghost outline + a **"Manual align mode"** banner. No fake score, no auto-capture. Press the shutter when you're happy; photo saves to gallery.

### C. EAS dev-build (full native ML)
Follow `/app/BUILD_NATIVE.md` — exact commands for `eas build --profile development` with `react-native-vision-camera` + a MediaPipe pose plugin.

## Not in v1 (Roadmap)
- Scene detection (beach, cafe, street, mountain)
- "Recreate this photo" (upload → extract keypoints → match)
- Personalization (height, proportions)
- Instagram / Pinterest deep-pose agent

## Tech stack
Expo SDK 54 · Expo Router 6 · React 19 · react-native-svg · react-native-reanimated · @react-native-community/slider · expo-camera · expo-haptics · AsyncStorage · @tensorflow/tfjs · @tensorflow-models/pose-detection (MoveNet).
