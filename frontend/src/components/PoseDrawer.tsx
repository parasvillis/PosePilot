import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
import { colors, radii, spacing, typography } from '../theme';
import {
  POSE_TEMPLATES,
  PoseTemplate,
  recommendPoses,
} from '../pose/templates';
import { SceneId, SCENES } from '../pose/scenes';
import { KP } from '../pose/keypoints';

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
  scene: SceneId;
  sceneConfidence: number;
  onDeepPose?: () => void;
  onOpenLibrary?: () => void;
};

const CARD_W = 88;
const CARD_H = 112;

export default function PoseDrawer({
  selectedId,
  onSelect,
  scene,
  sceneConfidence,
  onDeepPose,
  onOpenLibrary,
}: Props) {
  const recommended = useMemo(() => recommendPoses(scene, 12), [scene]);
  const list = recommended.length > 0 ? recommended : POSE_TEMPLATES.slice(0, 8);
  const sceneMeta = SCENES[scene];

  return (
    <View style={styles.wrap} testID="pose-drawer">
      {/* Scene pill row */}
      <View style={styles.headerRow}>
        <View style={styles.scenePill}>
          <Ionicons name={sceneMeta.icon as any} size={13} color={colors.accent} />
          <Text style={styles.scenePillKicker}>{sceneMeta.kicker}</Text>
          {scene !== 'generic' && (
            <View style={styles.confDot}>
              <View
                style={[
                  styles.confDotFill,
                  { width: `${Math.min(100, Math.round(sceneConfidence * 100))}%` },
                ]}
              />
            </View>
          )}
          <Text style={styles.sceneCount}>
            {list.length}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {onDeepPose && (
          <TouchableOpacity
            testID="deep-pose-btn"
            onPress={onDeepPose}
            activeOpacity={0.8}
            style={styles.deepBtn}
          >
            <Ionicons name="sparkles" size={13} color={colors.accent} />
            <Text style={styles.deepBtnText}>Deep Pose</Text>
          </TouchableOpacity>
        )}

        {onOpenLibrary && (
          <TouchableOpacity
            testID="drawer-open-library"
            onPress={onOpenLibrary}
            activeOpacity={0.7}
            style={styles.libBtn}
          >
            <Ionicons name="grid-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Pose cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {list.map(t => (
          <PoseCard
            key={t.id}
            template={t}
            active={t.id === selectedId}
            onPress={() => onSelect(t.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function PoseCard({
  template,
  active,
  onPress,
}: {
  template: PoseTemplate;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      testID={`pose-card-${template.id}`}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, active && styles.cardActive]}
    >
      <View style={styles.cardArt}>
        <SilhouetteThumb template={template} active={active} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.cardName, active && { color: colors.textPrimary }]}
      >
        {template.name}
      </Text>
      <Text numberOfLines={1} style={styles.cardTag}>
        {template.tag}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Monochrome silhouette thumbnail — the Huawei reference-strip vibe, but
 * generated deterministically from keypoints. Zero external assets.
 */
function SilhouetteThumb({ template, active }: { template: PoseTemplate; active: boolean }) {
  const w = CARD_W - 14;
  const h = 68;
  const col = active ? colors.accent : 'rgba(255,255,255,0.75)';
  const fill = active ? 'rgba(255,214,10,0.15)' : 'rgba(255,255,255,0.06)';
  const p = template.pose.keypoints;
  const X = (i: number) => p[i].x * w;
  const Y = (i: number) => p[i].y * h;
  const shW = Math.hypot(X(KP.LEFT_SHOULDER) - X(KP.RIGHT_SHOULDER), Y(KP.LEFT_SHOULDER) - Y(KP.RIGHT_SHOULDER));
  const neckMid = { x: (X(KP.LEFT_SHOULDER) + X(KP.RIGHT_SHOULDER)) / 2, y: (Y(KP.LEFT_SHOULDER) + Y(KP.RIGHT_SHOULDER)) / 2 };
  const headRy = Math.max(5, shW * 0.6);
  const torso = `M ${X(KP.LEFT_SHOULDER)},${Y(KP.LEFT_SHOULDER)} L ${X(KP.RIGHT_SHOULDER)},${Y(KP.RIGHT_SHOULDER)} L ${X(KP.RIGHT_HIP)},${Y(KP.RIGHT_HIP)} L ${X(KP.LEFT_HIP)},${Y(KP.LEFT_HIP)} Z`;

  return (
    <Svg width={w} height={h}>
      <Ellipse cx={neckMid.x} cy={Y(KP.NOSE) - headRy * 0.2} rx={headRy * 0.75} ry={headRy} stroke={col} strokeWidth={1.2} fill={fill} />
      <Path d={torso} stroke={col} strokeWidth={1.2} fill={fill} />
      <Path d={`M ${X(KP.LEFT_SHOULDER)},${Y(KP.LEFT_SHOULDER)} L ${X(KP.LEFT_ELBOW)},${Y(KP.LEFT_ELBOW)} L ${X(KP.LEFT_WRIST)},${Y(KP.LEFT_WRIST)}`} stroke={col} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d={`M ${X(KP.RIGHT_SHOULDER)},${Y(KP.RIGHT_SHOULDER)} L ${X(KP.RIGHT_ELBOW)},${Y(KP.RIGHT_ELBOW)} L ${X(KP.RIGHT_WRIST)},${Y(KP.RIGHT_WRIST)}`} stroke={col} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d={`M ${X(KP.LEFT_HIP)},${Y(KP.LEFT_HIP)} L ${X(KP.LEFT_KNEE)},${Y(KP.LEFT_KNEE)} L ${X(KP.LEFT_ANKLE)},${Y(KP.LEFT_ANKLE)}`} stroke={col} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Path d={`M ${X(KP.RIGHT_HIP)},${Y(KP.RIGHT_HIP)} L ${X(KP.RIGHT_KNEE)},${Y(KP.RIGHT_KNEE)} L ${X(KP.RIGHT_ANKLE)},${Y(KP.RIGHT_ANKLE)}`} stroke={col} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      <Circle cx={X(KP.LEFT_WRIST)} cy={Y(KP.LEFT_WRIST)} r={1.5} fill={col} />
      <Circle cx={X(KP.RIGHT_WRIST)} cy={Y(KP.RIGHT_WRIST)} r={1.5} fill={col} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xs },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  scenePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scenePillKicker: {
    color: colors.textPrimary,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  confDot: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginLeft: 4,
  },
  confDotFill: { height: '100%', backgroundColor: colors.accent },
  sceneCount: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  deepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,214,10,0.08)',
  },
  deepBtnText: { color: colors.accent, fontSize: 10, letterSpacing: 0.8, fontWeight: '700' },
  libBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  row: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'flex-start' },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 6,
    opacity: 0.7,
  },
  cardActive: {
    opacity: 1,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255,214,10,0.08)',
  },
  cardArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardName: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  cardTag: {
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
});
