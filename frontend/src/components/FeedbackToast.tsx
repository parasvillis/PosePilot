import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '../theme';

type Props = {
  message: string | null;
};

export default function FeedbackToast({ message }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(8, { duration: 150 });
    }
  }, [message, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="none" testID="feedback-toast">
      <View style={styles.pill}>
        <Text style={styles.text}>{message ?? ''}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.bodySm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
