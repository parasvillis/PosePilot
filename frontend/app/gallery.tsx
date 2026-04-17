import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Capture, getCaptures } from '../src/storage/gallery';
import { colors, spacing, radii, typography } from '../src/theme';

const { width } = Dimensions.get('window');
const ITEM_W = (width - spacing.md * 2 - spacing.sm * 2) / 3;

export default function Gallery() {
  const router = useRouter();
  const [items, setItems] = useState<Capture[]>([]);

  const load = useCallback(async () => {
    const list = await getCaptures();
    setItems(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="gallery-screen">
      <View style={styles.header}>
        <TouchableOpacity
          testID="gallery-back"
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.kicker}>CAPTURES</Text>
          <Text style={styles.title}>Your shots</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sparkles-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No captures yet</Text>
          <Text style={styles.emptyBody}>
            Hit the shutter — or let auto-capture lock it in for you.
          </Text>
          <TouchableOpacity
            testID="gallery-cta"
            style={styles.cta}
            activeOpacity={0.85}
            onPress={() => router.replace('/camera')}
          >
            <Text style={styles.ctaText}>Start shooting</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          numColumns={3}
          columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`gallery-item-${item.id}`}
              activeOpacity={0.85}
              style={styles.cell}
              onPress={() => router.push({ pathname: '/preview', params: { id: item.id } })}
            >
              {item.uri.startsWith('data:') ? (
                <Image source={{ uri: item.uri }} style={styles.img} />
              ) : (
                <Image source={{ uri: item.uri }} style={styles.img} />
              )}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.score}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
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
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md },
  emptyBody: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  ctaText: { color: colors.accentFg, fontWeight: '700', fontSize: 15 },
  cell: {
    width: ITEM_W,
    height: ITEM_W,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: '#151515',
  },
  img: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
});
