import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { colors, spacing, radii, typography } from '../src/theme';
import { POSE_TEMPLATES, getTemplateById } from '../src/pose/templates';
import { createSimulatedDetector, PoseDetector } from '../src/pose/detector';
import { matchPoses } from '../src/pose/matcher';
import { generateHint, scoreLabel } from '../src/pose/feedback';
import { addCapture, getSettings, setSettings, Settings, DEFAULT_SETTINGS } from '../src/storage/gallery';
import PoseOverlay from '../src/components/PoseOverlay';
import ScoreMeter from '../src/components/ScoreMeter';
import PoseCarousel from '../src/components/PoseCarousel';
import FeedbackToast from '../src/components/FeedbackToast';
import CaptureButton from '../src/components/CaptureButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pose?: string }>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [selectedPoseId, setSelectedPoseId] = useState<string>(
    (typeof params.pose === 'string' && params.pose) || POSE_TEMPLATES[0].id,
  );

  // Sync selected pose when route param changes (coming back from library)
  useEffect(() => {
    if (typeof params.pose === 'string' && params.pose && params.pose !== selectedPoseId) {
      setSelectedPoseId(params.pose);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pose]);
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [worstJoints, setWorstJoints] = useState<Set<string>>(new Set());
  const [stableSince, setStableSince] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const detector = useRef<PoseDetector>(createSimulatedDetector()).current;
  const target = useMemo(() => getTemplateById(selectedPoseId).pose, [selectedPoseId]);
  const [frameTick, setFrameTick] = useState(0);

  // Load settings
  useEffect(() => {
    getSettings().then(s => setSettingsState(s));
  }, []);

  // Permissions
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Reset detector when target changes
  useEffect(() => {
    detector.setTarget(selectedPoseId);
    setStableSince(null);
  }, [selectedPoseId, detector]);

  // Detection + matching loop (~20Hz)
  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      detector.tick(dt);
      const user = detector.currentPose();
      const m = matchPoses(user, target);
      setScore(m.score);
      const nextHint = generateHint(user, target, m);
      setHint(nextHint);
      setWorstJoints(
        new Set(m.jointDiffs.filter(j => j.diff > 0.25).map(j => j.name))
      );
      setFrameTick(t => t + 1);

      // Auto-capture stability tracking
      if (settings.autoCapture && m.score >= 85 && !capturing && countdown == null) {
        if (stableSince == null) {
          setStableSince(now);
        } else if (now - stableSince >= 1000) {
          setStableSince(null);
          void triggerCapture(true);
        }
      } else if (m.score < 80) {
        setStableSince(null);
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, settings.autoCapture, capturing, countdown, stableSince]);

  const currentUserPose = detector.currentPose();

  async function triggerCapture(auto = false) {
    if (capturing) return;
    // Timer
    if (!auto && settings.timer > 0) {
      for (let i = settings.timer; i > 0; i--) {
        setCountdown(i);
        await wait(1000);
      }
      setCountdown(null);
    }
    setCapturing(true);
    try {
      if (settings.haptics) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }
      let uri: string = '';
      try {
        const shot = await cameraRef.current?.takePictureAsync?.({
          quality: 0.8,
          base64: true,
          skipProcessing: true,
        } as any);
        if (shot) {
          uri = shot.base64 ? `data:image/jpeg;base64,${shot.base64}` : shot.uri;
        }
      } catch {
        uri = '';
      }
      // Fallback placeholder (web or denied): a 1x1 transparent gif
      if (!uri) {
        uri =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A//2Q==';
      }
      const cap = {
        id: `cap_${Date.now()}`,
        poseId: selectedPoseId,
        poseName: getTemplateById(selectedPoseId).name,
        uri,
        userPose: JSON.stringify(currentUserPose),
        createdAt: Date.now(),
        score,
      };
      await addCapture(cap);
      if (settings.haptics) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
      router.push({ pathname: '/preview', params: { id: cap.id } });
    } finally {
      setCapturing(false);
    }
  }

  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    void setSettings(next);
  }

  const locked = score >= 85;
  const hasCamera =
    Platform.OS !== 'web' && permission?.granted;

  return (
    <View style={styles.root} testID="camera-screen">
      {/* Camera / Fallback background */}
      <View style={StyleSheet.absoluteFill}>
        {hasCamera ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
          />
        ) : (
          <FauxPreview />
        )}
      </View>

      {/* Grid */}
      {settings.grid && <GridOverlay />}

      {/* Ghost pose overlay */}
      <PoseOverlay
        pose={target}
        width={SCREEN_W}
        height={SCREEN_H}
        opacity={settings.overlayOpacity}
        stroke={colors.textPrimary}
        dashed
      />

      {/* Detected user pose in accent */}
      <PoseOverlay
        pose={currentUserPose}
        width={SCREEN_W}
        height={SCREEN_H}
        opacity={0.85}
        stroke={locked ? colors.success : colors.accent}
        dashed={false}
        showPoints
        highlight={worstJoints}
        mirrored={facing === 'front'}
      />

      {/* Top HUD */}
      <SafeAreaView style={styles.topHud} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow} pointerEvents="box-none">
          <HudButton
            icon="grid-outline"
            onPress={() => router.push('/library')}
            testID="open-library"
          />
          <View style={styles.centerPill}>
            <View style={[styles.dot, { backgroundColor: locked ? colors.success : colors.accent }]} />
            <Text style={styles.centerPillText}>
              {getTemplateById(selectedPoseId).name.toUpperCase()}
            </Text>
          </View>
          <HudButton
            icon="settings-outline"
            onPress={() => setShowSettings(v => !v)}
            testID="open-settings"
          />
        </View>

        <View style={styles.metaRow} pointerEvents="box-none">
          <HudChip
            icon="camera-reverse-outline"
            label={facing === 'back' ? 'Rear' : 'Front'}
            onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))}
            testID="toggle-facing"
          />
          <HudChip
            icon="time-outline"
            label={settings.timer === 0 ? 'Timer off' : `${settings.timer}s`}
            onPress={() =>
              updateSettings({
                timer: (settings.timer === 0 ? 3 : settings.timer === 3 ? 5 : 0) as 0 | 3 | 5,
              })
            }
            testID="toggle-timer"
          />
          <HudChip
            icon={settings.autoCapture ? 'flash' : 'flash-off-outline'}
            label={settings.autoCapture ? 'Auto ON' : 'Auto OFF'}
            onPress={() => updateSettings({ autoCapture: !settings.autoCapture })}
            active={settings.autoCapture}
            testID="toggle-auto"
          />
        </View>
      </SafeAreaView>

      {/* Right-side opacity slider */}
      <View
        style={[styles.opacityCol, { top: insets.top + 120 }]}
        pointerEvents="box-none"
      >
        <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
        <View style={styles.sliderHolder}>
          <Slider
            testID="opacity-slider"
            style={styles.slider}
            minimumValue={0.15}
            maximumValue={1}
            value={settings.overlayOpacity}
            minimumTrackTintColor={colors.textPrimary}
            maximumTrackTintColor="rgba(255,255,255,0.25)"
            thumbTintColor={colors.textPrimary}
            onValueChange={v => updateSettings({ overlayOpacity: v })}
          />
        </View>
      </View>

      {/* Big countdown */}
      {countdown != null && (
        <View style={styles.countdownWrap} pointerEvents="none">
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      )}

      {/* Bottom HUD */}
      <SafeAreaView style={styles.bottomHud} edges={['bottom']}>
        <View style={styles.feedbackRow}>
          <FeedbackToast message={locked ? scoreLabel(score) : hint} />
        </View>

        <View style={styles.carouselWrap}>
          <PoseCarousel
            selectedId={selectedPoseId}
            onSelect={id => setSelectedPoseId(id)}
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            testID="open-gallery"
            onPress={() => router.push('/gallery')}
            style={styles.sideBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <CaptureButton
            onPress={() => triggerCapture(false)}
            locked={locked}
            disabled={capturing}
          />

          <View style={styles.sideBtn}>
            <ScoreMeter score={score} locked={locked} size={52} />
          </View>
        </View>
      </SafeAreaView>

      {/* Settings sheet */}
      {showSettings && (
        <Pressable
          style={styles.settingsBackdrop}
          onPress={() => setShowSettings(false)}
        >
          <Pressable onPress={() => {}} style={styles.settingsSheet}>
            <Text style={styles.sheetTitle}>Settings</Text>
            <SheetRow
              label="Auto-capture"
              value={settings.autoCapture}
              onToggle={v => updateSettings({ autoCapture: v })}
            />
            <SheetRow
              label="Haptics"
              value={settings.haptics}
              onToggle={v => updateSettings({ haptics: v })}
            />
            <SheetRow
              label="Composition grid"
              value={settings.grid}
              onToggle={v => updateSettings({ grid: v })}
            />
            <TouchableOpacity
              style={styles.sheetLink}
              onPress={() => {
                setShowSettings(false);
                router.push('/library');
              }}
            >
              <Text style={styles.sheetLinkText}>Browse full pose library</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetLink}
              onPress={() => {
                setShowSettings(false);
                router.push('/gallery');
              }}
            >
              <Text style={styles.sheetLinkText}>My captures</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

function HudButton({
  icon,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7} style={styles.hudBtn}>
      <BlurView intensity={40} tint="dark" style={styles.hudBtnInner}>
        <Ionicons name={icon} size={18} color={colors.textPrimary} />
      </BlurView>
    </TouchableOpacity>
  );
}

function HudChip({
  icon,
  label,
  onPress,
  active,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  testID?: string;
}) {
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}>
      <BlurView
        intensity={40}
        tint="dark"
        style={[styles.chip, active && { borderColor: colors.accent }]}
      >
        <Ionicons name={icon} size={13} color={active ? colors.accent : colors.textPrimary} />
        <Text style={[styles.chipText, active && { color: colors.accent }]}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

function SheetRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.sheetRow}
      onPress={() => onToggle(!value)}
    >
      <Text style={styles.sheetRowLabel}>{label}</Text>
      <View
        style={[
          styles.sw,
          { backgroundColor: value ? colors.accent : 'rgba(255,255,255,0.15)' },
        ]}
      >
        <View style={[styles.swKnob, value && { alignSelf: 'flex-end' }]} />
      </View>
    </TouchableOpacity>
  );
}

function GridOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.gridLine, { top: '33.33%' }]} />
      <View style={[styles.gridLine, { top: '66.66%' }]} />
      <View style={[styles.gridLineV, { left: '33.33%' }]} />
      <View style={[styles.gridLineV, { left: '66.66%' }]} />
    </View>
  );
}

function FauxPreview() {
  // A quiet, cinematic fallback for web / no-permission state.
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View
        style={{
          position: 'absolute',
          top: '10%',
          left: '-30%',
          width: SCREEN_W * 1.6,
          height: SCREEN_H * 0.6,
          backgroundColor: 'rgba(255,214,10,0.05)',
          transform: [{ rotate: '-12deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: '5%',
          right: '-20%',
          width: SCREEN_W * 1.2,
          height: SCREEN_H * 0.4,
          backgroundColor: 'rgba(50,215,75,0.05)',
          transform: [{ rotate: '20deg' }],
        }}
      />
      <View style={styles.fauxLabel}>
        <Ionicons name="videocam-off-outline" size={16} color={colors.textMuted} />
        <Text style={styles.fauxText}>
          Camera preview unavailable · UX simulation active
        </Text>
      </View>
    </View>
  );
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hudBtn: {
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  hudBtnInner: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(28,28,30,0.55)',
  },
  centerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  centerPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(28,28,30,0.55)',
    gap: 6,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  opacityCol: {
    position: 'absolute',
    right: 8,
    height: 220,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sliderHolder: {
    width: 40,
    height: 180,
    transform: [{ rotate: '-90deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: { width: 180, height: 40 },
  countdownWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    color: colors.accent,
    fontSize: 140,
    fontWeight: '800',
  },
  bottomHud: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  feedbackRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    minHeight: 30,
  },
  carouselWrap: {
    marginBottom: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sideBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  settingsSheet: {
    backgroundColor: '#1c1c1e',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetRowLabel: { color: colors.textPrimary, fontSize: 15 },
  sw: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  swKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  sheetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetLinkText: { color: colors.textPrimary, fontSize: 15 },
  gridLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  fauxLabel: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fauxText: { color: colors.textMuted, fontSize: 11 },
});
