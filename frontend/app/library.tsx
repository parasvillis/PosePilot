import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Line, Circle } from 'react-native-svg';
import { colors, spacing, radii, typography } from '../src/theme';
import { POSE_TEMPLATES, PoseTemplate } from '../src/pose/templates';
import { SKELETON, KP } from '../src/pose/keypoints';

const { width } = Dimensions.get('window');
const CARD_W = (width - spacing.md * 3) / 2;
const CARD_H = CARD_W * 1.35;

export default function Library() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="library-screen">
      <View style={styles.header}>
        <TouchableOpacity
          testID="library-back"
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.kicker}>POSE LIBRARY</Text>
          <Text style={styles.title}>Pick your moment</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {POSE_TEMPLATES.map(t => (
          <TouchableOpacity
            key={t.id}
            testID={`library-card-${t.id}`}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push({ pathname: '/camera', params: { pose: t.id } })}
          >
            <View style={styles.cardArt}>
              <PoseArt template={t} />
            </View>
            <View style={styles.cardFoot}>
              <Text style={styles.cardTag}>{t.tag.toUpperCase()}</Text>
              <Text style={styles.cardName}>{t.name}</Text>
              <Text style={styles.cardHint}>{t.hint}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const ART_H = CARD_H * 0.58;

function PoseArt({ template }: { template: PoseTemplate }) {
  const w = CARD_W - 24;
  const h = ART_H - 16;
  const p = template.pose;
  const x = (i: number) => p.keypoints[i].x * w;
  const y = (i: number) => p.keypoints[i].y * h;
  const le = p.keypoints[KP.LEFT_EAR];
  const re = p.keypoints[KP.RIGHT_EAR];
  const headCx = ((le.x + re.x) / 2) * w;
  const headCy = ((le.y + re.y) / 2) * h - 5;
  const headR = Math.max(8, Math.hypot((le.x - re.x) * w, (le.y - re.y) * h) * 0.9);
  return (
    <Svg width={w} height={h}>
      <Circle
        cx={headCx}
        cy={headCy}
        r={headR}
        stroke={colors.accent}
        strokeWidth={1.5}
        fill="none"
        strokeDasharray="5,5"
      />
      {SKELETON.map(([a, b], i) => (
        <Line
          key={i}
          x1={x(a)}
          y1={y(a)}
          x2={x(b)}
          y2={y(b)}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray="6,6"
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
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  cardArt: {
    height: ART_H,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  cardFoot: {
    padding: spacing.sm,
  },
  cardTag: {
    color: colors.accent,
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  cardName: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  cardHint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
