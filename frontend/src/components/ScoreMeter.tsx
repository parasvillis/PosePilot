import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme';
import { scoreColor, scoreLabel } from '../pose/feedback';

type Props = {
  score: number; // 0..100
  size?: number;
  locked?: boolean;
};

export default function ScoreMeter({ score, size = 72, locked = false }: Props) {
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (score / 100);
  const color = scoreColor(score, colors.accent, colors.success, 'rgba(255,255,255,0.35)');

  return (
    <View
      testID="score-meter"
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash}, ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[typography.mono, { color: colors.textPrimary }]}>{score}</Text>
        <Text style={styles.label}>{locked ? 'LOCKED' : scoreLabel(score).toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
    fontWeight: '600',
  },
});
