import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
}: BadgeProps) {
  const variants = {
    success: { bg: '#ECFDF5', text: '#065F46' },
    warning: { bg: '#FFFBEB', text: '#B45309' },
    error: { bg: '#FEF2F2', text: '#7F1D1D' },
    info: { bg: '#ECFDF5', text: '#065F46' },
    default: { bg: colors.bg.tertiary, text: colors.text.primary },
  };

  const currentVariant = variants[variant];
  const sizes = {
    sm: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      fontSize: 11,
    },
    md: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 12,
    },
  };

  const currentSize = sizes[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: currentVariant.bg,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: currentVariant.text,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
