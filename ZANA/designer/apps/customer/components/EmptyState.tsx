import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...typography.small,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
