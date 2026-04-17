import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { colors, radii, spacing, typography } from '../theme';
import { POSE_TEMPLATES, PoseTemplate } from '../pose/templates';
import { SKELETON, KP } from '../pose/keypoints';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

const ITEM_W = 64;
const ITEM_H = 80;

export default function PoseCarousel({ selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="pose-carousel"
    >
      {POSE_TEMPLATES.map(t => {
        const active = t.id === selectedId;
        return (
          <TouchableOpacity
            key={t.id}
            testID={`pose-item-${t.id}`}
            activeOpacity={0.8}
            onPress={() => onSelect(t.id)}
            style={[styles.item, active && styles.itemActive]}
          >
            <View style={styles.thumb}>
              <PoseThumb template={t} active={active} />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.name, active && { color: colors.textPrimary }]}
            >
              {t.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function PoseThumb({ template, active }: { template: PoseTemplate; active: boolean }) {
  const w = ITEM_W - 10;
  const h = ITEM_H - 28;
  const col = active ? colors.accent : 'rgba(255,255,255,0.7)';
  const pose = template.pose;
  const x = (i: number) => pose.keypoints[i].x * w;
  const y = (i: number) => pose.keypoints[i].y * h;
  const le = pose.keypoints[KP.LEFT_EAR];
  const re = pose.keypoints[KP.RIGHT_EAR];
  const headCx = ((le.x + re.x) / 2) * w;
  const headCy = ((le.y + re.y) / 2) * h - 3;
  const headR = Math.max(3, Math.hypot((le.x - re.x) * w, (le.y - re.y) * h) * 0.8);
  return (
    <Svg width={w} height={h}>
      <Circle cx={headCx} cy={headCy} r={headR} stroke={col} strokeWidth={1.2} fill="none" />
      {SKELETON.map(([a, b], i) => (
        <Line key={i} x1={x(a)} y1={y(a)} x2={x(b)} y2={y(b)} stroke={col} strokeWidth={1.3} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  item: {
    width: ITEM_W,
    height: ITEM_H,
    borderRadius: radii.md,
    alignItems: 'center',
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  itemActive: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  thumb: {
    flex: 1,
    width: '100%',
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: ITEM_W,
    textAlign: 'center',
    fontSize: 10,
  },
});
