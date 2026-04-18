import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing, radius } from '../constants/theme';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ThemedButtonProps) {
  const sizeStyles = {
    sm: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 12,
    },
    md: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 14,
    },
    lg: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      fontSize: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`variant_${variant}`],
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          width: fullWidth ? '100%' : 'auto',
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? colors.primary : '#FFFFFF'} 
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            { fontSize: currentSize.fontSize },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  variant_primary: {
    backgroundColor: colors.primary,
  },
  variant_secondary: {
    backgroundColor: colors.primaryDark,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
});
