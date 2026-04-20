import React from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import { colors } from '../theme';
import { Pose, KP } from '../pose/keypoints';

/**
 * Huawei-style silhouette outline — draws a traced body contour (head oval +
 * neck + torso polygon + thick rounded limb strokes + hands/feet) instead of
 * the thin stick-figure skeleton used for user-detected poses.
 *
 * Accepts the same normalized 17-keypoint pose data.
 */
type Props = {
  pose: Pose;
  width: number;
  height: number;
  opacity?: number;
  stroke?: string;
  fill?: string;
  limbWidth?: number; // px
  dashed?: boolean;
};

export default function PoseSilhouette({
  pose,
  width,
  height,
  opacity = 0.85,
  stroke = colors.textPrimary,
  fill = 'rgba(255,255,255,0.05)',
  limbWidth = 22,
  dashed = false,
}: Props) {
  const toXY = (idx: number) => {
    const k = pose.keypoints[idx];
    return { x: k.x * width, y: k.y * height };
  };

  const nose = toXY(KP.NOSE);
  const lSh = toXY(KP.LEFT_SHOULDER);
  const rSh = toXY(KP.RIGHT_SHOULDER);
  const lEl = toXY(KP.LEFT_ELBOW);
  const rEl = toXY(KP.RIGHT_ELBOW);
  const lWr = toXY(KP.LEFT_WRIST);
  const rWr = toXY(KP.RIGHT_WRIST);
  const lHip = toXY(KP.LEFT_HIP);
  const rHip = toXY(KP.RIGHT_HIP);
  const lKn = toXY(KP.LEFT_KNEE);
  const rKn = toXY(KP.RIGHT_KNEE);
  const lAn = toXY(KP.LEFT_ANKLE);
  const rAn = toXY(KP.RIGHT_ANKLE);

  // Head — oval centered above shoulders, sized proportional to shoulder width
  const shoulderW = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
  const headRx = Math.max(20, shoulderW * 0.55);
  const headRy = Math.max(26, shoulderW * 0.72);
  const neckMid = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
  const headCy = nose.y - headRy * 0.2;

  // Torso polygon: shoulders → hips (inset a bit for a cleaner waistline)
  const hipMid = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
  const shMidY = (lSh.y + rSh.y) / 2;
  const hipInset = Math.max(2, shoulderW * 0.05);
  const torso = `M ${lSh.x - 2},${lSh.y + 4} ` +
                `L ${rSh.x + 2},${rSh.y + 4} ` +
                `L ${rHip.x + hipInset},${rHip.y} ` +
                `L ${lHip.x - hipInset},${lHip.y} Z`;

  // Neck (short trapezoid between jaw and shoulders)
  const neckTopY = headCy + headRy - 2;
  const neckW = shoulderW * 0.22;
  const neck = `M ${neckMid.x - neckW},${neckTopY} ` +
               `L ${neckMid.x + neckW},${neckTopY} ` +
               `L ${neckMid.x + neckW * 1.4},${shMidY + 2} ` +
               `L ${neckMid.x - neckW * 1.4},${shMidY + 2} Z`;

  const dashArr = dashed ? '10,6' : undefined;

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
    >
      <G opacity={opacity}>
        {/* Arms — rounded capsules */}
        {limbLine(lSh, lEl, stroke, limbWidth, dashArr)}
        {limbLine(lEl, lWr, stroke, limbWidth * 0.85, dashArr)}
        {limbLine(rSh, rEl, stroke, limbWidth, dashArr)}
        {limbLine(rEl, rWr, stroke, limbWidth * 0.85, dashArr)}

        {/* Legs — thicker */}
        {limbLine(lHip, lKn, stroke, limbWidth * 1.1, dashArr)}
        {limbLine(lKn, lAn, stroke, limbWidth * 0.95, dashArr)}
        {limbLine(rHip, rKn, stroke, limbWidth * 1.1, dashArr)}
        {limbLine(rKn, rAn, stroke, limbWidth * 0.95, dashArr)}

        {/* Torso */}
        <Path d={torso} stroke={stroke} strokeWidth={2} strokeLinejoin="round" fill={fill} strokeDasharray={dashArr} />

        {/* Neck */}
        <Path d={neck} stroke={stroke} strokeWidth={2} fill={fill} strokeDasharray={dashArr} />

        {/* Head */}
        <Ellipse
          cx={neckMid.x}
          cy={headCy}
          rx={headRx}
          ry={headRy}
          stroke={stroke}
          strokeWidth={2.5}
          fill={fill}
          strokeDasharray={dashArr}
        />

        {/* Hands + feet markers */}
        {dot(lWr, stroke)}
        {dot(rWr, stroke)}
        {dot(lAn, stroke)}
        {dot(rAn, stroke)}
      </G>
    </Svg>
  );
}

function limbLine(a: { x: number; y: number }, b: { x: number; y: number }, stroke: string, w: number, dash?: string) {
  return (
    <Path
      d={`M ${a.x},${a.y} L ${b.x},${b.y}`}
      stroke={stroke}
      strokeWidth={w}
      strokeLinecap="round"
      strokeDasharray={dash}
      fill="none"
      opacity={0.9}
    />
  );
}

function dot(p: { x: number; y: number }, fill: string) {
  return <Circle cx={p.x} cy={p.y} r={5} fill={fill} />;
}
