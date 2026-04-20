# PosePilot — Product Requirements Document (v2.0 — Scene-Aware)

## Vision
Huawei Pura-style AI Posture Recommendation on Expo React Native. On-device scene detection continuously classifies the camera feed and surfaces a ranked set of pose templates in a bottom drawer. Each selection draws a full-body silhouette overlay; MoveNet-based matching + auto-capture stays gated on readiness.

## v2.0 shipped
- **Pose library × 28** — tagged by `scene` / `subjects` / `mood`, grouped into 10 scenes (outdoor, indoor, cafe, street, beach, mountain, graduation, party, fitness, travel).
- **Silhouette overlay** — replaced the stick-figure ghost with a traced full-body contour (oval head, neck trapezoid, torso polygon, thick rounded limb capsules, hand/foot markers). Keypoint data unchanged; matching engine untouched.
- **Pose Drawer** — new bottom UI: scene pill (`CAFE · WINDOW`, `GRADUATION`, etc.) + confidence bar + ALL POSES count + horizontal recommendation cards with silhouette thumbnails. Replaces the old carousel.
- **On-device scene detection (C1)** — TensorFlow.js MobileNet V2 α=0.5 (~5 MB) classifies the live `<video>` every 2 s. A compact rule table maps ImageNet classes → 10 scene tags (e.g., `mortarboard → graduation`, `seashore → beach`, `barbell → fitness`). Zero API cost, runs locally, web-only (native path flips on in the EAS dev-build).
- **Deep Pose button (C2)** — wired into the drawer, gated by a settings flag. Currently emits a friendly "lights up in final testing" toast so no LLM credits are spent during iteration. Behind the toast is a drop-in call site for Gemini Vision + Gemini text via the Emergent universal key, ready for Phase C2.
- **Scene recommender** — `recommendPoses(scene, limit)` ranks templates by `scene` match; falls back to generic poses if nothing fits.

## Runtime matrix
| Runtime | Pose detection | Scene detection | Drawer recommendations |
|---|---|---|---|
| Web preview | ✅ Real MoveNet | ✅ Real MobileNet every 2 s | ✅ Live |
| Expo Go | ❌ (manual) | ❌ | Static (generic poses) |
| EAS dev-build | ✅ (when plugin wired) | ⏳ native port pending | ✅ |

## Deferred (v3 roadmap)
- **Deep Pose real calls** — flip Gemini Vision + Gemini Flash on behind a settings toggle.
- **Nano Banana reference photos** — swap the SVG silhouette thumbnails for AI-generated editorial photos.
- **Recreate this photo** — import from library → MoveNet extracts target → added as one-off template.
- **Native scene detector** — mirror MobileNet behaviour via vision-camera frame processor in the dev-build.

## File map (v2.0 changes)
- `src/pose/scenes.ts` (new) — scene catalog + ImageNet→scene classifier
- `src/pose/sceneDetector.ts` (new) — MobileNet loop, web-only
- `src/pose/templates.ts` — expanded to 28 poses with scene tags + `recommendPoses()`
- `src/components/PoseSilhouette.tsx` (new) — Huawei-style traced body outline
- `src/components/PoseDrawer.tsx` (new) — bottom recommendation drawer + SVG thumbs
- `app/camera.tsx` — wired scene detector, swapped ghost overlay to silhouette, swapped carousel for drawer, added Deep Pose button handler

## How to test
Open `https://align-pose.preview.emergentagent.com` in a browser with a webcam, grant permission. After ~3 s you'll see the MoveNet skeleton track your body. After ~5 s MobileNet kicks in and the scene pill updates based on what your camera sees. Point at a cafe → `CAFE · WINDOW`, coffee shot. Point at outdoor trail → `MOUNTAIN · TRAIL`, summit poses. Tap cards to pick a target.
