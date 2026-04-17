import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radii } from '../src/theme';
import { setOnboarded } from '../src/storage/gallery';
import { POSE_TEMPLATES } from '../src/pose/templates';
import { SKELETON, KP } from '../src/pose/keypoints';

const { width } = Dimensions.get('window');

type Slide = {
  kicker: string;
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  pose: number;
};

const SLIDES: Slide[] = [
  {
    kicker: '01 — POINT',
    title: 'Pick a pose',
    body: 'Ten cinematic templates, from casual stand to power pose. One tap to load.',
    icon: 'grid-outline',
    pose: 0,
  },
  {
    kicker: '02 — ALIGN',
    title: 'Match the outline',
    body: 'A ghost silhouette appears over your camera. Move until your body lines up.',
    icon: 'scan-outline',
    pose: 2,
  },
  {
    kicker: '03 — CAPTURE',
    title: 'Auto-shutter at 85%',
    body: 'Hold the pose for a second. PosePilot nails the shot so you don\'t have to.',
    icon: 'camera-outline',
    pose: 9,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const next = async () => {
    if (page < SLIDES.length - 1) {
      setPage(p => p + 1);
      return;
    }
    await setOnboarded(true);
    router.replace('/camera');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="onboarding-screen">
      <View style={styles.header}>
        <Text style={styles.brand}>PosePilot</Text>
        <TouchableOpacity
          testID="onboarding-skip"
          onPress={async () => {
            await setOnboarded(true);
            router.replace('/camera');
          }}
        >
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const p = Math.round(e.nativeEvent.contentOffset.x / width);
          setPage(p);
        }}
        contentOffset={{ x: page * width, y: 0 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon} size={28} color={colors.accent} />
            </View>
            <Text style={styles.kicker}>{s.kicker}</Text>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
            <View style={styles.preview}>
              <PoseIllustration pose={s.pose} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, page === i && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity
          testID="onboarding-next"
          style={styles.cta}
          onPress={next}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>
            {page < SLIDES.length - 1 ? 'Continue' : 'Start shooting'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={18}
            color={colors.accentFg}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PoseIllustration({ pose }: { pose: number }) {
  const p = POSE_TEMPLATES[pose]?.pose ?? POSE_TEMPLATES[0].pose;
  const w = width - spacing.xl * 2;
  const h = w * 1.2;
  const x = (i: number) => p.keypoints[i].x * w;
  const y = (i: number) => p.keypoints[i].y * h;
  const le = p.keypoints[KP.LEFT_EAR];
  const re = p.keypoints[KP.RIGHT_EAR];
  const headCx = ((le.x + re.x) / 2) * w;
  const headCy = ((le.y + re.y) / 2) * h - 6;
  const headR = Math.max(14, Math.hypot((le.x - re.x) * w, (le.y - re.y) * h) * 0.9);
  return (
    <Svg width={w} height={h}>
      <Circle cx={headCx} cy={headCy} r={headR} stroke={colors.accent} strokeWidth={2} fill="none" strokeDasharray="6,6" />
      {SKELETON.map(([a, b], i) => (
        <Line
          key={i}
          x1={x(a)}
          y1={y(a)}
          x2={x(b)}
          y2={y(b)}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="8,8"
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { color: colors.textPrimary, ...typography.h3 },
  skip: { color: colors.textSecondary, ...typography.bodyMd },
  slide: {
    paddingHorizontal: spacing.xl,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    marginBottom: 6,
  },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  body: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    maxWidth: width - 80,
  },
  preview: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: '#0a0a0a',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: { backgroundColor: colors.accent, width: 20 },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ctaText: {
    color: colors.accentFg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
