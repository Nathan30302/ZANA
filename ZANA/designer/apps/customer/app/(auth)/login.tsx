import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.login(email, password);
      
      if (response.error) {
        setError(response.error || 'Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      if (response.data) {
        await setAuth(
          response.data.user,
          response.data.accessToken,
          response.data.refreshToken
        );
        router.push('/(tabs)/home');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <Ionicons name="spa-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>ZANA</Text>
          <Text style={styles.tagline}>Beauty at your fingertips</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={colors.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email or phone"
                placeholderTextColor={colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text.secondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => Alert.alert('Password Reset', 'Please contact support to reset your password.')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/register')}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.registerButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  logoText: {
    ...typography.display,
    color: colors.primary,
    fontWeight: '700',
  },
  tagline: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },

  // Form
  formContainer: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },

  // Error
  errorContainer: {
    backgroundColor: colors.bg.error,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.error,
  },
  errorText: {
    ...typography.small,
    color: colors.semantic.error,
    flex: 1,
  },

  // Input
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },

  // Links
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  // Buttons
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    ...typography.small,
    color: colors.text.tertiary,
  },

  registerButton: {
    backgroundColor: colors.bg.secondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  registerButtonText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});