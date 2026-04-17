# PosePilot — Product Requirements Document

## Vision
Real-time AI posing assistant that overlays a "ghost pose" over the live camera preview, detects the user's body, compares to a target pose, and auto-captures when alignment exceeds 85%. Built on Expo React Native (iOS + Android). Fully offline/local v1.

Tagline: "Never look awkward in photos again."

## v1 Scope (delivered)
1. **Onboarding (3 screens)** — Point / Align / Capture, with dashed pose illustrations and Optic Yellow accent. Persists "seen" flag via AsyncStorage.
2. **Camera screen** — Full-bleed `expo-camera` CameraView (falls back to cinematic FauxPreview on web/no-permission). Pose ghost overlay (SVG), detected user pose overlay (accent → green on lock), floating HUD with front/rear switch, timer (off/3s/5s), auto-capture toggle, overlay-opacity slider, settings sheet.
3. **Pose library** (10 templates) — Casual Stand, Hands in Pockets, Arms Wide, Leaning, Walking Shot, Sitting Cafe, Back Shot, Hand on Chin, Hand Through Hair, Power Pose. Stored as normalized MoveNet 17-keypoint JSON.
4. **Pose matching engine** — Weighted joint-angle comparison (elbows, shoulders, hips, knees, neck). Scale/position invariant. Returns 0–100 score + per-joint diffs + worst joint.
5. **Feedback engine** — Generates max one hint per tick ("Step slightly right", "Adjust your elbow angle", "Raise your chin"). Red highlights on misaligned joints.
6. **Auto-capture** — When score ≥ 85 for 1s of stability, auto shutter fires with haptic confirmation.
7. **Capture gallery** — AsyncStorage-backed, 3-col grid, score badge per shot.
8. **Before/After preview** — Toggle between final photo and pose-overlay comparison. Share + delete actions.
9. **Settings** — Auto-capture, haptics, composition grid, overlay opacity, timer — persisted.

## Architecture
- **Pose detector interface** (`/src/pose/detector.ts`) — currently a high-fidelity simulated detector that converges to the target over ~5 s with jitter. Drop-in replaceable by a TensorFlow.js MoveNet implementation once a dev-client (EAS build) is produced (required — TFJS native kernels don't load in Expo Go).
- **Matcher** (`/src/pose/matcher.ts`) — angle-based, weighted. Plug in alternative matchers without UI changes.
- **Templates** (`/src/pose/templates.ts`) — 17-keypoint JSON per pose.
- **Storage** (`/src/storage/gallery.ts`) — AsyncStorage for captures, onboarding flag, settings.
- **Theme** (`/src/theme.ts`) — tokens from design_guidelines.json.

## Not in v1 (Roadmap)
- Real MoveNet inference via dev-client
- Scene detection (beach, cafe, street, mountain)
- "Recreate this photo" (upload → extract keypoints)
- Personalization (user height, proportions)
- Social integrations (Instagram, Pinterest) → Deep Pose agent

## Success criteria
- Camera + overlay renders on launch ≤ 1 s after permission
- Match score updates every 50 ms
- Auto-capture fires within 10 s of user adopting target pose

## Tech stack
Expo SDK 54 · Expo Router 6 · React 19 · react-native-svg · react-native-reanimated · @react-native-community/slider · expo-camera · expo-haptics · AsyncStorage.
