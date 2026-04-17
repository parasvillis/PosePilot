import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isOnboarded } from '../src/storage/gallery';
import { colors, typography, spacing } from '../src/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await isOnboarded();
      // brief splash for polish
      await new Promise(r => setTimeout(r, 350));
      if (cancelled) return;
      router.replace(seen ? '/camera' : '/onboarding');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.mark}>
        <Ionicons name="scan-outline" size={44} color={colors.accent} />
      </View>
      <Text style={styles.title}>PosePilot</Text>
      <Text style={styles.tag}>Never look awkward in photos again.</Text>
      <ActivityIndicator color={colors.textMuted} style={{ marginTop: spacing.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  mark: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tag: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
