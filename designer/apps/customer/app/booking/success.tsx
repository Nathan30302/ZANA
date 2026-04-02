import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reference = params.reference || 'ZNA-20260330-0001';

  return (
    <View style={styles.container}>
      {/* Success Animation */}
      <View style={styles.successIconContainer}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
      </View>

      {/* Success Message */}
      <Text style={styles.successTitle}>Booking Confirmed!</Text>
      <Text style={styles.successSubtitle}>
        Your appointment has been successfully booked.
      </Text>

      {/* Reference Number */}
      <View style={styles.referenceCard}>
        <Text style={styles.referenceLabel}>Booking Reference</Text>
        <Text style={styles.referenceNumber}>{reference}</Text>
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        A confirmation has been sent to your email and phone. Please arrive 5 minutes before your appointment time.
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/appointments')}
        >
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(tabs)/home')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Calendar */}
      <TouchableOpacity style={styles.calendarButton}>
        <Text style={styles.calendarButtonText}>📅 Add to Calendar</Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity style={styles.shareButton}>
        <Text style={styles.shareButtonText}>📤 Share</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successCheck: {
    fontSize: 60,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  referenceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  referenceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  referenceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A56DB',
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  calendarButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  calendarButtonText: {
    color: '#1A56DB',
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});