import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  locked?: boolean; // match-locked state (green)
  testID?: string;
};

export default function CaptureButton({ onPress, disabled, locked, testID }: Props) {
  const ringColor = locked ? colors.success : colors.textPrimary;
  return (
    <TouchableOpacity
      testID={testID ?? 'capture-button'}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={styles.hit}
    >
      <View style={[styles.ring, { borderColor: ringColor }]}>
        <View style={[styles.core, locked && { backgroundColor: colors.success }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 9999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    backgroundColor: colors.textPrimary,
  },
});
