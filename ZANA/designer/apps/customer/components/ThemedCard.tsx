import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

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
        activeOpacity={0.7}
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
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
