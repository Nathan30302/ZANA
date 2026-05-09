import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radius, shadows } from '../constants/theme';

const STORAGE_KEYS_ONBOARDING = 'zana_onboarding_completed';

export default function OnboardingScreen() {
  const router = useRouter();

  async function handleContinue() {
    await AsyncStorage.setItem(STORAGE_KEYS_ONBOARDING, 'true');
    router.replace('/(tabs)/home');
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>ZANA</Text>
        <Text style={styles.title}>Premium beauty bookings in Zambia</Text>
        <Text style={styles.subtitle}>
          Book trusted salons, barbers, and mobile professionals—fast.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.bullet}>- Verified professionals and venues</Text>
        <Text style={styles.bullet}>- Real-time availability</Text>
        <Text style={styles.bullet}>- Easy reschedule & cancellation</Text>
      </View>

      <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.9}>
        <Text style={styles.ctaText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  brand: {
    ...typography.display,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    marginBottom: spacing.lg,
  },
  bullet: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  ctaText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '800',
  },
});

