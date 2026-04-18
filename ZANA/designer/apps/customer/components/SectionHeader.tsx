import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.action}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  action: {
    ...typography.smallMedium,
    color: colors.primary,
    fontWeight: '600',
  },
});
