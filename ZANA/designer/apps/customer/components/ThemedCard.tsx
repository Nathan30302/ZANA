import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../constants/theme';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  shadow?: 'xs' | 'sm' | 'md' | 'lg';
}

export function ThemedCard({ 
  children, 
  style, 
  onPress,
  shadow = 'md',
}: ThemedCardProps) {
  const cardStyle = [
    styles.card,
    shadows[shadow],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
});
