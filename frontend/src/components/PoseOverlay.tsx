import React from 'react';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { colors } from '../theme';
import { Pose, SKELETON, KP } from '../pose/keypoints';

type Props = {
  pose: Pose;
  width: number;
  height: number;
  opacity?: number;
  stroke?: string;
  dashed?: boolean;
  /** Per-joint highlight set (names from ANGLE_JOINTS). */
  highlight?: Set<string>;
  showPoints?: boolean;
  /** Whether to mirror horizontally (for front camera). */
  mirrored?: boolean;
};

export default function PoseOverlay({
  pose,
  width,
  height,
  opacity = 0.55,
  stroke = colors.textPrimary,
  dashed = true,
  highlight,
  showPoints = true,
  mirrored = false,
}: Props) {
  const toXY = (idx: number) => {
    const k = pose.keypoints[idx];
    const x = mirrored ? (1 - k.x) * width : k.x * width;
    const y = k.y * height;
    return { x, y };
  };

  // Head circle derived from ear/eye keypoints
  const le = toXY(KP.LEFT_EAR);
  const re = toXY(KP.RIGHT_EAR);
  const headCx = (le.x + re.x) / 2;
  const headCy = (le.y + re.y) / 2 - 6;
  const headR = Math.max(14, Math.hypot(le.x - re.x, le.y - re.y) * 0.9);

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', left: 0, top: 0 }}
      pointerEvents="none"
    >
      <G opacity={opacity}>
        {/* Head */}
        <Circle
          cx={headCx}
          cy={headCy}
          r={headR}
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={dashed ? '6,6' : undefined}
          fill="none"
        />
        {/* Bones */}
        {SKELETON.map(([a, b], i) => {
          const pa = toXY(a);
          const pb = toXY(b);
          return (
            <Line
              key={i}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={stroke}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={dashed ? '8,8' : undefined}
            />
          );
        })}
        {/* Joints */}
        {showPoints &&
          pose.keypoints.slice(5).map((_k, i) => {
            const idx = i + 5;
            const { x, y } = toXY(idx);
            const isHot =
              highlight &&
              Array.from(highlight).some(name => name.includes(kpShortName(idx)));
            return (
              <Circle
                key={idx}
                cx={x}
                cy={y}
                r={isHot ? 7 : 4}
                fill={isHot ? colors.error : stroke}
                opacity={isHot ? 1 : 0.9}
              />
            );
          })}
      </G>
    </Svg>
  );
}

function kpShortName(idx: number): string {
  // crude mapping so FeedbackToast/highlight names ('left_elbow' etc.) match joints
  const map: Record<number, string> = {
    [KP.LEFT_SHOULDER]: 'left_shoulder',
    [KP.RIGHT_SHOULDER]: 'right_shoulder',
    [KP.LEFT_ELBOW]: 'left_elbow',
    [KP.RIGHT_ELBOW]: 'right_elbow',
    [KP.LEFT_WRIST]: 'wrist',
    [KP.RIGHT_WRIST]: 'wrist',
    [KP.LEFT_HIP]: 'left_hip',
    [KP.RIGHT_HIP]: 'right_hip',
    [KP.LEFT_KNEE]: 'left_knee',
    [KP.RIGHT_KNEE]: 'right_knee',
    [KP.LEFT_ANKLE]: 'ankle',
    [KP.RIGHT_ANKLE]: 'ankle',
  };
  return map[idx] ?? '';
}
