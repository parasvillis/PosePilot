# PosePilot — Product Requirements Document (v3.0 — AI Photographer Coach)

## Shift in philosophy
v1/v2 said "pick a template and match it". v3 says "I see what you're trying to shoot — here's how to make it better". The app reads YOUR current pose + scene + composition and gives specific photographer-style advice instead of asking you to chase a silhouette.

## v3.0 shipped
- **Elegant curved line overlay** (`src/components/PoseCurveOverlay.tsx`) — Catmull-Rom splines through keypoints. No capsules, no straight lines. Head: clean ellipse with head-tilt awareness. Arms: one continuous flowing curve through wrists-elbows-shoulders. Torso: smoothed closed curve. Legs: individual flowing curves. Thin single-weight stroke (2.4 px). Extremity dots at wrists and ankles for punctuation. Low-confidence keypoints skipped.
- **Pose-mode detection** (`src/pose/poseMode.ts`) — classifies every frame into `full_body` / `half_body` / `selfie` / `seated` / `unknown` based on which keypoints are visible + geometry (face size, knee–hip angle, shoulder position). The HUD pill shows the detected mode so you know what the coach is reasoning about.
- **Composition analyser** (`src/pose/composition.ts`) — subject bbox, centroid, rule-of-thirds distance (vertical), head-room, shoulder tilt, hip tilt, face direction (left / right / front from eye-nose-ear geometry), arm asymmetry, chin up/down.
- **Rule-based photographer coach** (`src/pose/coach.ts`) — mode-specific rule sets, one primary tip + optional scene flourish:
  - **Selfie**: chin tilt, face 3/4 angle, head-room fit, shoulder line softness. *"Tuck your chin down a touch"*, *"Turn 15° to your right for dimension"*, *"Drop one shoulder for a softer line"*.
  - **Seated**: posture, hand placement, ankle crossing, rule-of-thirds. *"Rest one elbow on the table, one hand in your lap"*, *"Cross your ankles and lean slightly forward"*.
  - **Half-body**: torso turn, shoulder drop, hand placement, framing. *"Turn your torso 30° to your left"*, *"Tuck one hand in a pocket"*.
  - **Full-body**: weight shift, symmetry break, chin + gaze, proximity, head-room, thirds. *"Shift weight onto one leg — kill the symmetry"*, *"You're small in the frame — step closer"*.
  - **Scene flourish** (only when quality ≥ 75): *"Leave room on the horizon side"* (mountain), *"Frame with the window, not the door"* (cafe), *"Hold the scroll at chest — not belly"* (graduation).
- **Auto-capture re-gated** — fires when the coach's `canCapture` flips true (quality ≥ 82, advice exhausted), held 0.9 s, after a 2.5 s mount grace. Template matching is still available when the user picks one from the drawer but is no longer required for capture.

## File map (v3.0 changes)
- `src/pose/poseMode.ts` (new)
- `src/pose/composition.ts` (new)
- `src/pose/coach.ts` (new)
- `src/components/PoseCurveOverlay.tsx` (new — replaces PoseSilhouette for both target and user pose)
- `app/camera.tsx` — coach-first tick loop; curved overlays; mode pill; sub-hint line under main toast

## Carried forward from v2
- 28-pose library with scene tags, `recommendPoses()` recommender
- Drawer with scene pill + recommendation cards
- On-device MobileNet scene detection every 2 s
- Real MoveNet pose detection (web)
- Gallery + before/after preview + AsyncStorage persistence
- Manual-mode fallback for Expo Go

## Still deferred (v4 roadmap)
- **Pro Coach** (Gemini Vision on ✨ Deep Pose button) — lights up on user's approval to spend credits
- **Nano Banana editorial thumbnails** replacing the SVG silhouette cards
- **Recreate this photo** — import from library, MoveNet extracts target
- **Native scene detector** in the EAS dev-build
- Composition meter overlay (rule-of-thirds grid alignment indicator)

## How to test
Open `https://align-pose.preview.emergentagent.com` in a browser with a webcam, grant permission. ~3 s: MoveNet tracks you → elegant curved outline follows your body. ~5 s: MobileNet classifies the scene. Coach tip appears at the bottom ("Tuck your chin down a touch", "Step closer", "Shift weight to your right leg"). Follow the tip and the coach updates in real time. When composition is good and you're stable, the shutter fires.
