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
import { SceneId, SCENES } from '../src/pose/scenes';
import { createWebSceneDetector, SceneDetector } from '../src/pose/sceneDetector';
import { createPoseDetector } from '../src/pose/factory';
import { PoseDetector } from '../src/pose/detector';
import { matchPoses, MIN_KP_CONF } from '../src/pose/matcher';
import { generateHint, scoreLabel } from '../src/pose/feedback';
import {
  addCapture,
  getSettings,
  setSettings,
  Settings,
  DEFAULT_SETTINGS,
} from '../src/storage/gallery';
import PoseOverlay from '../src/components/PoseOverlay';
import PoseSilhouette from '../src/components/PoseSilhouette';
import ScoreMeter from '../src/components/ScoreMeter';
import PoseDrawer from '../src/components/PoseDrawer';
import FeedbackToast from '../src/components/FeedbackToast';
import CaptureButton from '../src/components/CaptureButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

type DetectorState =
  | { kind: 'loading' }
  | { kind: 'ready'; detector: PoseDetector }
  | { kind: 'unavailable'; reason: string };

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pose?: string }>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const videoHostRef = useRef<View>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [selectedPoseId, setSelectedPoseId] = useState<string>(
    (typeof params.pose === 'string' && params.pose) || POSE_TEMPLATES[0].id,
  );
  const [detectorState, setDetectorState] = useState<DetectorState>({ kind: 'loading' });
  const [scene, setScene] = useState<SceneId>('generic');
  const [sceneConfidence, setSceneConfidence] = useState(0);
  const sceneDetectorRef = useRef<SceneDetector | null>(null);
  const [score, setScore] = useState(0);
  const [hasPose, setHasPose] = useState(false);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [worstJoints, setWorstJoints] = useState<Set<string>>(new Set());
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const target = useMemo(() => getTemplateById(selectedPoseId).pose, [selectedPoseId]);
  const mountedAt = useRef(Date.now());
  const stableSince = useRef<number | null>(null);

  // Load settings from storage
  useEffect(() => {
    getSettings().then(s => setSettingsState(s));
  }, []);

  // Permission request (native)
  useEffect(() => {
    if (!IS_WEB && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Sync pose id from route param
  useEffect(() => {
    if (typeof params.pose === 'string' && params.pose && params.pose !== selectedPoseId) {
      setSelectedPoseId(params.pose);
      stableSince.current = null;
      mountedAt.current = Date.now();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pose]);

  // Reset stability timer when user changes pose
  useEffect(() => {
    stableSince.current = null;
    mountedAt.current = Date.now();
  }, [selectedPoseId]);

  // Create detector once
  useEffect(() => {
    let cancelled = false;
    let created: PoseDetector | null = null;
    (async () => {
      const res = await createPoseDetector(facing === 'front' ? 'front' : 'back');
      if (cancelled) {
        if (res.ok) await res.detector.stop();
        return;
      }
      if (res.ok) {
        created = res.detector;
        setDetectorState({ kind: 'ready', detector: res.detector });
      } else {
        setDetectorState({ kind: 'unavailable', reason: res.reason });
      }
    })();
    return () => {
      cancelled = true;
      if (created) void created.stop();
    };
    // We intentionally only create once — changing facing will stop+start in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On web, mount the detector's <video> into our host + start scene detection
  useEffect(() => {
    if (!IS_WEB) return;
    if (detectorState.kind !== 'ready') return;
    const host = videoHostRef.current as unknown as HTMLElement | null;
    if (!host) return;
    const det: any = detectorState.detector;
    if (det && typeof det.mountInto === 'function') {
      det.mountInto(host);
    }

    // Start MobileNet scene classifier on the same video element.
    let cancelled = false;
    (async () => {
      const getVideo = () =>
        (typeof det.getVideoElement === 'function' ? det.getVideoElement() : null) as HTMLVideoElement | null;
      const sd = await createWebSceneDetector(getVideo, 2000);
      if (cancelled) return;
      sd.onScene(({ scene: s, confidence }) => {
        setScene(s);
        setSceneConfidence(confidence);
      });
      await sd.start();
      sceneDetectorRef.current = sd;
    })();
    return () => {
      cancelled = true;
      sceneDetectorRef.current?.stop();
      sceneDetectorRef.current = null;
    };
  }, [detectorState]);

  // Matching loop — ~20Hz
  useEffect(() => {
    if (detectorState.kind !== 'ready') return;
    const det = detectorState.detector;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      last = now;
      const user = det.currentPose();
      if (!user) {
        setHasPose(false);
        setScore(0);
        setHint('Step into frame — no body detected');
        setWorstJoints(new Set());
        stableSince.current = null;
        return;
      }
      setHasPose(true);
      const m = matchPoses(user, target);
      setScore(m.score);
      setHint(generateHint(user, target, m));
      setWorstJoints(new Set(m.jointDiffs.filter(j => j.diff > 0.25).map(j => j.name)));

      // Auto-capture stability
      const elapsedSinceMount = now - mountedAt.current;
      const graceOk = elapsedSinceMount > 3000; // 3s grace after mount/pose change
      if (settings.autoCapture && graceOk && m.score >= 85 && !capturing && countdown == null) {
        if (stableSince.current == null) {
          stableSince.current = now;
        } else if (now - stableSince.current >= 1000) {
          stableSince.current = null;
          void triggerCapture(true);
        }
      } else if (m.score < 80) {
        stableSince.current = null;
      }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectorState, target, settings.autoCapture, capturing, countdown, selectedPoseId]);

  const currentUserPose = detectorState.kind === 'ready' ? detectorState.detector.currentPose() : null;

  async function triggerCapture(auto = false, capturedScore?: number, capturedPose?: ReturnType<PoseDetector['currentPose']>) {
    if (capturing) return;
    if (!auto && settings.timer > 0) {
      for (let i = settings.timer; i > 0; i--) {
        setCountdown(i);
        await wait(1000);
      }
      setCountdown(null);
    }
    setCapturing(true);
    try {
      if (settings.haptics && !IS_WEB) {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }

      let uri: string = '';
      if (IS_WEB && detectorState.kind === 'ready') {
        const det: any = detectorState.detector;
        if (typeof det.captureFrameDataURL === 'function') {
          uri = det.captureFrameDataURL(0.85) ?? '';
        }
      } else if (!IS_WEB) {
        try {
          const shot = await cameraRef.current?.takePictureAsync?.({
            quality: 0.8,
            base64: true,
            skipProcessing: true,
          } as any);
          if (shot) {
            uri = shot.base64 ? `data:image/jpeg;base64,${shot.base64}` : shot.uri;
          }
        } catch {}
      }

      if (!uri) {
        uri = TINY_PLACEHOLDER;
      }

      const poseAtCapture = capturedPose ?? currentUserPose;
      const scoreAtCapture = capturedScore ?? score;
      const cap = {
        id: `cap_${Date.now()}`,
        poseId: selectedPoseId,
        poseName: getTemplateById(selectedPoseId).name,
        uri,
        userPose: poseAtCapture ? JSON.stringify(poseAtCapture) : '',
        createdAt: Date.now(),
        score: scoreAtCapture,
      };
      await addCapture(cap);
      if (settings.haptics && !IS_WEB) {
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

  const hasML = detectorState.kind === 'ready';
  const locked = hasML && ready && score >= 85;
  const showNativeCamera =
    !IS_WEB && permission?.granted;

  return (
    <View style={styles.root} testID="camera-screen">
      {/* Background — camera preview or faux */}
      <View style={StyleSheet.absoluteFill}>
        {IS_WEB ? (
          // Host div for the detector's managed <video>
          <View
            ref={videoHostRef}
            testID="web-video-host"
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}
          />
        ) : showNativeCamera ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        ) : (
          <FauxPreview />
        )}
      </View>

      {/* Grid */}
      {settings.grid && <GridOverlay />}

      {/* Ghost target pose — full silhouette (Huawei-style) */}
      <PoseSilhouette
        pose={target}
        width={SCREEN_W}
        height={SCREEN_H}
        opacity={settings.overlayOpacity}
        stroke={colors.textPrimary}
        limbWidth={Math.max(18, SCREEN_W * 0.055)}
        dashed
      />

      {/* Detected user pose — only when real detection is running.
          minConfidence filters out keypoints MoveNet isn't sure about,
          so we never draw skeleton lines through empty space. */}
      {hasML && currentUserPose && (
        <PoseOverlay
          pose={currentUserPose}
          width={SCREEN_W}
          height={SCREEN_H}
          opacity={0.9}
          stroke={locked ? colors.success : ready ? colors.accent : 'rgba(255,214,10,0.5)'}
          dashed={false}
          showPoints
          highlight={worstJoints}
          mirrored={false}
          minConfidence={MIN_KP_CONF}
        />
      )}

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
          {hasML && (
            <HudChip
              icon={settings.autoCapture ? 'flash' : 'flash-off-outline'}
              label={settings.autoCapture ? 'Auto ON' : 'Auto OFF'}
              onPress={() => updateSettings({ autoCapture: !settings.autoCapture })}
              active={settings.autoCapture}
              testID="toggle-auto"
            />
          )}
        </View>

        {/* Honest mode banner */}
        {detectorState.kind === 'unavailable' && (
          <View style={styles.banner} testID="manual-mode-banner">
            <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
            <Text style={styles.bannerText}>
              Manual align mode · on-device AI needs an EAS dev-build
            </Text>
          </View>
        )}
        {detectorState.kind === 'loading' && (
          <View style={styles.banner}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={styles.bannerText}>Loading pose model…</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Right-side opacity slider */}
      <View
        style={[styles.opacityCol, { top: insets.top + 140 }]}
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

      {countdown != null && (
        <View style={styles.countdownWrap} pointerEvents="none">
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      )}

      {/* Bottom HUD */}
      <SafeAreaView style={styles.bottomHud} edges={['bottom']}>
        <View style={styles.feedbackRow}>
          <FeedbackToast
            message={
              hasML
                ? locked
                  ? scoreLabel(score)
                  : hasPose
                    ? hint
                    : 'Step into frame'
                : 'Align your body with the outline'
            }
          />
        </View>

        <View style={styles.carouselWrap}>
          <PoseDrawer
            selectedId={selectedPoseId}
            onSelect={id => setSelectedPoseId(id)}
            scene={scene}
            sceneConfidence={sceneConfidence}
            onOpenLibrary={() => router.push('/library')}
            onDeepPose={() => {
              // Deep Pose v2: full AI scene analysis via Gemini Vision.
              // Currently gated — flip settings.useAI to call the real API.
              setHint('Deep Pose lights up in final testing');
              setTimeout(() => setHint(null), 2500);
            }}
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
            {hasML ? (
              <ScoreMeter score={score} locked={locked} size={52} />
            ) : (
              <View style={styles.manualChip}>
                <Text style={styles.manualChipText}>MANUAL</Text>
              </View>
            )}
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
            {hasML && (
              <SheetRow
                label="Auto-capture"
                value={settings.autoCapture}
                onToggle={v => updateSettings({ autoCapture: v })}
              />
            )}
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
            {detectorState.kind === 'ready' && (
              <Text style={styles.sheetMeta}>
                Detection backend · {detectorState.detector.backendLabel()}
              </Text>
            )}
            {detectorState.kind === 'unavailable' && (
              <Text style={styles.sheetMeta}>On-device AI · {detectorState.reason}</Text>
            )}
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

const TINY_PLACEHOLDER =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A//2Q==';

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
  banner: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bannerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  hudBtn: { borderRadius: radii.pill, overflow: 'hidden' },
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
  chipText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: { color: colors.accent, fontSize: 140, fontWeight: '800' },
  bottomHud: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  feedbackRow: { alignItems: 'center', marginBottom: spacing.sm, minHeight: 30 },
  carouselWrap: { marginBottom: spacing.sm },
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
  manualChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  manualChipText: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
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
  sw: { width: 42, height: 24, borderRadius: 12, padding: 2 },
  swKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  sheetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetLinkText: { color: colors.textPrimary, fontSize: 15 },
  sheetMeta: {
    color: colors.textMuted,
    fontSize: 11,
    paddingTop: spacing.sm,
    paddingBottom: 4,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
