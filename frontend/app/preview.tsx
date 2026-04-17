import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Capture, getCapture, removeCapture } from '../src/storage/gallery';
import { getTemplateById } from '../src/pose/templates';
import { Pose } from '../src/pose/keypoints';
import PoseOverlay from '../src/components/PoseOverlay';
import { colors, spacing, radii, typography } from '../src/theme';

const { width, height } = Dimensions.get('window');

export default function Preview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [cap, setCap] = useState<Capture | null>(null);
  const [mode, setMode] = useState<'after' | 'before'>('after');

  useEffect(() => {
    if (!id) return;
    getCapture(String(id)).then(setCap);
  }, [id]);

  if (!cap) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const target = getTemplateById(cap.poseId).pose;
  let userPose: Pose | null = null;
  try {
    userPose = JSON.parse(cap.userPose) as Pose;
  } catch {}

  const share = async () => {
    try {
      await Share.share({
        message: `Shot this one on PosePilot · ${cap.poseName} · Match ${cap.score}/100`,
      });
    } catch {}
  };

  const onDelete = () => {
    const doDelete = async () => {
      await removeCapture(cap.id);
      router.back();
    };
    Alert.alert('Delete capture?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void doDelete() },
    ]);
  };

  const stageH = height * 0.62;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="preview-screen">
      <View style={styles.header}>
        <TouchableOpacity
          testID="preview-back"
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.kicker}>{cap.poseName.toUpperCase()}</Text>
          <Text style={styles.title}>Match {cap.score}/100</Text>
        </View>
        <TouchableOpacity
          testID="preview-delete"
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.stage, { height: stageH }]}>
        {cap.uri.length > 100 ? (
          <Image source={{ uri: cap.uri }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={styles.imgFallback} />
        )}
        {mode === 'before' && (
          <>
            <PoseOverlay
              pose={target}
              width={width}
              height={stageH}
              opacity={0.6}
              stroke={colors.textPrimary}
              dashed
            />
            {userPose && (
              <PoseOverlay
                pose={userPose}
                width={width}
                height={stageH}
                opacity={0.85}
                stroke={colors.accent}
                dashed={false}
                showPoints
              />
            )}
          </>
        )}
        <View style={styles.modePills}>
          <ModePill
            label="Before"
            active={mode === 'before'}
            onPress={() => setMode('before')}
            testID="preview-mode-before"
          />
          <ModePill
            label="After"
            active={mode === 'after'}
            onPress={() => setMode('after')}
            testID="preview-mode-after"
          />
        </View>
      </View>

      <View style={styles.meta}>
        <Row label="Captured" value={new Date(cap.createdAt).toLocaleString()} />
        <Row label="Pose" value={cap.poseName} />
        <Row label="Match" value={`${cap.score} / 100`} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          testID="preview-retake"
          style={[styles.secondary]}
          activeOpacity={0.85}
          onPress={() => router.replace('/camera')}
        >
          <Ionicons name="camera-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="preview-share"
          style={styles.cta}
          activeOpacity={0.85}
          onPress={share}
        >
          <Ionicons name="share-outline" size={18} color={colors.accentFg} />
          <Text style={styles.ctaText}>Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ModePill({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  stage: {
    width,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  imgFallback: { flex: 1, backgroundColor: '#111' },
  modePills: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  pillActive: { backgroundColor: colors.textPrimary },
  pillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: colors.bg },
  meta: {
    padding: spacing.md,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 10,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 13 },
  rowVal: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.textPrimary, fontWeight: '600' },
  cta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  ctaText: { color: colors.accentFg, fontWeight: '700' },
});
