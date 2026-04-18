import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function OnboardingCompleteScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>You're almost there</Text>
        <Text style={styles.subtitle}>
          Your professional profile has been sent for review. Zana admin will approve your listing before customers can book.
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Approval pending</Text>
        </View>

        <Text style={styles.body}>
          Expect review within 24 hours. Once approved, your business will appear to customers on Zana.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Text style={styles.buttonText}>Go to dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: 18,
  },
  badge: {
    backgroundColor: '#FAF3DD',
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
  },
  badgeText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
  },
  body: {
    color: '#374151',
    fontSize: 15,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
