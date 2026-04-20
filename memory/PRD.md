# PosePilot — Product Requirements Document

## Vision
Real-time AI posing assistant with honest gating. The shutter only fires when MoveNet actually sees a full, in-frame body matching the target pose.

## Scoring model (v1.1 — capture-gate fix)

`finalScore = rawAngleScore × visibility × coverage`, with:

- **Per-keypoint check:** confidence ≥ 0.3 AND x∈[0.04, 0.96] AND y∈[0.04, 0.96]. Any keypoint that fails is considered "missing". Skeleton lines are not drawn through missing keypoints.
- **Critical keypoints** (must all pass to allow capture): head (nose), both shoulders, both hips, both knees, both ankles. If head is missing → `head_out`, feet missing → `feet_out`, shoulder/hip side missing → `side_out`.
- **Per-pose extras** (e.g. Arms Wide needs both wrists + both elbows; Power Pose needs elbows + wrists). Configured in `matcher.ts:POSE_REQUIRED_KPS`.
- **Angle coverage:** only joints where all three contributing keypoints pass participate in the angle score.
- **Auto-capture gate:** `readiness === 'ok' && score ≥ 85 && coverage ≥ 0.8` (plus 1 s stability + 3 s mount grace). If any critical or pose-required keypoint is missing, `canCapture` is false and the stability timer resets.

## Runtime matrix

| Runtime | Detector | Score | Auto-capture |
|---|---|---|---|
| Web preview | Real MoveNet (TFJS) | Gated | Gated |
| Expo Go | None | Hidden, shown as "MANUAL" | Hidden |
| EAS dev-build | Real (when native plugin is wired) | Gated | Gated |

Expo Go ≠ Web. Only the EAS dev/production build gives the same experience on a phone.

## Screens (unchanged from v1)
Splash → Onboarding (3) → Camera (ghost outline + real skeleton + framing-aware hints) → Pose Library → Gallery → Before/After Preview → Settings sheet.

## Files touched for v1.1
- `src/pose/matcher.ts` — new readiness + framing + coverage model
- `src/pose/feedback.ts` — framing-aware hints
- `src/components/PoseOverlay.tsx` — `minConfidence` prop; skips missing bones/points
- `app/camera.tsx` — `ready`/`canCapture` gate, stale-score bug fix, low-confidence skeleton hidden

## How to test
1. Open `https://align-pose.preview.emergentagent.com` in a browser with webcam.
2. Grant camera.
3. Step partially out of frame → banner reads "Your head is cut off — step back" / "Your feet are cut off — step back" and the shutter does NOT fire.
4. Pick Arms Wide and keep one hand down → banner reads "Bring your right hand into frame" and the shutter does NOT fire.
5. Get fully in-frame matching the outline → shutter fires after ~1 s, saved score reflects the actual match.

## Roadmap
- Scene detection, "Recreate this photo", personalization, Instagram deep-pose agent.
