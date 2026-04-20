import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { colors } from '../theme';
import { Pose, KP } from '../pose/keypoints';
import { MIN_KP_CONF } from '../pose/matcher';

/**
 * Elegant line-diagram overlay of a pose.
 *
 * Replaces the thick silhouette with a minimal, photography-studio-chalk
 * aesthetic: smooth Catmull-Rom curves (no visible straight lines, no
 * capsules), thin single-weight stroke, tiny punctuation dots at the
 * extremities (wrists + ankles), a delicate head ellipse and a softly
 * curved jaw-hint arc.
 *
 * Accepts the standard 17-keypoint normalized Pose. Low-confidence
 * keypoints are skipped so we don't draw lines into empty space.
 */

type P = { x: number; y: number };

type Props = {
  pose: Pose;
  width: number;
  height: number;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  /** Minimum keypoint confidence to render. */
  minConfidence?: number;
  /** Whether to dash the lines. */
  dashed?: boolean;
};

export default function PoseCurveOverlay({
  pose,
  width,
  height,
  opacity = 0.85,
  stroke = colors.textPrimary,
  strokeWidth = 2.4,
  minConfidence = MIN_KP_CONF,
  dashed = false,
}: Props) {
  const ok = (i: number) => (pose.keypoints[i]?.score ?? 0) >= minConfidence;
  const xy = (i: number): P => ({
    x: pose.keypoints[i].x * width,
    y: pose.keypoints[i].y * height,
  });

  const leftArm = gatherChain([KP.LEFT_WRIST, KP.LEFT_ELBOW, KP.LEFT_SHOULDER], ok, xy);
  const rightArm = gatherChain([KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW, KP.RIGHT_WRIST], ok, xy);
  const leftLeg = gatherChain([KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE], ok, xy);
  const rightLeg = gatherChain([KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE], ok, xy);

  // Arm arc — if both arms visible, draw one continuous flowing curve across the shoulder line
  let armPath = '';
  const fullArmChain: P[] = [];
  if (ok(KP.LEFT_WRIST)) fullArmChain.push(xy(KP.LEFT_WRIST));
  if (ok(KP.LEFT_ELBOW)) fullArmChain.push(xy(KP.LEFT_ELBOW));
  if (ok(KP.LEFT_SHOULDER)) fullArmChain.push(xy(KP.LEFT_SHOULDER));
  if (ok(KP.RIGHT_SHOULDER)) fullArmChain.push(xy(KP.RIGHT_SHOULDER));
  if (ok(KP.RIGHT_ELBOW)) fullArmChain.push(xy(KP.RIGHT_ELBOW));
  if (ok(KP.RIGHT_WRIST)) fullArmChain.push(xy(KP.RIGHT_WRIST));
  if (fullArmChain.length >= 2) armPath = catmullRomPath(fullArmChain);

  // Torso — closed quadrilateral with rounded corners via Catmull-Rom
  let torsoPath = '';
  const torsoPts: P[] = [];
  if (ok(KP.LEFT_SHOULDER)) torsoPts.push(xy(KP.LEFT_SHOULDER));
  if (ok(KP.RIGHT_SHOULDER)) torsoPts.push(xy(KP.RIGHT_SHOULDER));
  if (ok(KP.RIGHT_HIP)) torsoPts.push(xy(KP.RIGHT_HIP));
  if (ok(KP.LEFT_HIP)) torsoPts.push(xy(KP.LEFT_HIP));
  if (torsoPts.length === 4) torsoPath = catmullRomClosedPath(torsoPts);
  else if (torsoPts.length >= 2) torsoPath = catmullRomPath(torsoPts);

  // Legs — thin flowing curve per side
  const leftLegPath = leftLeg.length >= 2 ? catmullRomPath(leftLeg) : '';
  const rightLegPath = rightLeg.length >= 2 ? catmullRomPath(rightLeg) : '';

  // Separate arm sides path if both arms aren't available
  const leftArmPath = fullArmChain.length < 2 && leftArm.length >= 2 ? catmullRomPath(leftArm) : '';
  const rightArmPath = fullArmChain.length < 2 && rightArm.length >= 2 ? catmullRomPath(rightArm) : '';

  // Head: elegant ellipse, skewed slightly forward to feel like a portrait outline.
  const headVisible = ok(KP.LEFT_EAR) && ok(KP.RIGHT_EAR);
  const eyeVisible = ok(KP.LEFT_EYE) && ok(KP.RIGHT_EYE);
  const nose = ok(KP.NOSE) ? xy(KP.NOSE) : null;
  const lEar = ok(KP.LEFT_EAR) ? xy(KP.LEFT_EAR) : null;
  const rEar = ok(KP.RIGHT_EAR) ? xy(KP.RIGHT_EAR) : null;

  let headEl: React.ReactNode = null;
  let neckPath = '';
  if (headVisible && lEar && rEar) {
    const cx = (lEar.x + rEar.x) / 2;
    const cy = (lEar.y + rEar.y) / 2;
    const earDist = Math.hypot(lEar.x - rEar.x, lEar.y - rEar.y);
    const rx = Math.max(14, earDist * 0.75);
    const ry = rx * 1.35;
    // Tilt the ellipse to match head tilt between the ears
    const rot = (Math.atan2(lEar.y - rEar.y, lEar.x - rEar.x) * 180) / Math.PI;
    headEl = (
      <Ellipse
        cx={cx}
        cy={cy - ry * 0.15}
        rx={rx}
        ry={ry}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        transform={`rotate(${rot} ${cx} ${cy - ry * 0.15})`}
      />
    );

    // Neck arc — curve from chin-line down to shoulder midpoint
    if (torsoPts.length >= 2 && nose) {
      const shMid = {
        x: (torsoPts[0].x + (torsoPts[1]?.x ?? torsoPts[0].x)) / 2,
        y: (torsoPts[0].y + (torsoPts[1]?.y ?? torsoPts[0].y)) / 2,
      };
      const chin = { x: cx, y: cy + ry * 0.8 };
      const cp1 = { x: chin.x + (shMid.x - chin.x) * 0.3, y: chin.y + (shMid.y - chin.y) * 0.35 };
      const cp2 = { x: shMid.x - (shMid.x - chin.x) * 0.15, y: shMid.y - (shMid.y - chin.y) * 0.25 };
      neckPath = `M ${chin.x},${chin.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${shMid.x},${shMid.y}`;
    }
  } else if (eyeVisible && nose) {
    // Fallback: draw a smaller ellipse around the face cluster
    const lE = xy(KP.LEFT_EYE); const rE = xy(KP.RIGHT_EYE);
    const cx = (lE.x + rE.x) / 2;
    const cy = (lE.y + rE.y) / 2;
    const w = Math.hypot(lE.x - rE.x, lE.y - rE.y);
    const rx = Math.max(14, w * 1.6);
    const ry = rx * 1.25;
    headEl = <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={stroke} strokeWidth={strokeWidth} fill="none" />;
  }

  const dashArr = dashed ? '8,6' : undefined;

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <G opacity={opacity}>
        {headEl}
        {!!neckPath && <Path d={neckPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}
        {!!armPath && <Path d={armPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}
        {!!leftArmPath && <Path d={leftArmPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}
        {!!rightArmPath && <Path d={rightArmPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}
        {!!torsoPath && <Path d={torsoPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeDasharray={dashArr} />}
        {!!leftLegPath && <Path d={leftLegPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}
        {!!rightLegPath && <Path d={rightLegPath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={dashArr} />}

        {/* Extremity punctuation */}
        {ok(KP.LEFT_WRIST) && <Circle cx={xy(KP.LEFT_WRIST).x} cy={xy(KP.LEFT_WRIST).y} r={3.2} fill={stroke} />}
        {ok(KP.RIGHT_WRIST) && <Circle cx={xy(KP.RIGHT_WRIST).x} cy={xy(KP.RIGHT_WRIST).y} r={3.2} fill={stroke} />}
        {ok(KP.LEFT_ANKLE) && <Circle cx={xy(KP.LEFT_ANKLE).x} cy={xy(KP.LEFT_ANKLE).y} r={3.2} fill={stroke} />}
        {ok(KP.RIGHT_ANKLE) && <Circle cx={xy(KP.RIGHT_ANKLE).x} cy={xy(KP.RIGHT_ANKLE).y} r={3.2} fill={stroke} />}
      </G>
    </Svg>
  );
}

// ---------- helpers ----------

function gatherChain(ids: number[], ok: (i: number) => boolean, xy: (i: number) => P): P[] {
  const arr: P[] = [];
  for (const i of ids) if (ok(i)) arr.push(xy(i));
  return arr;
}

/** Catmull-Rom through points → cubic bezier SVG path. Open chain. */
function catmullRomPath(points: P[], tension = 0.5): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Catmull-Rom through points, closed back to start. */
function catmullRomClosedPath(points: P[], tension = 0.5): string {
  if (points.length < 3) return catmullRomPath(points, tension);
  let d = `M ${points[0].x},${points[0].y}`;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  d += ' Z';
  return d;
}
