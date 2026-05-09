import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

interface Staff {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function ConfirmBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleConfirmBooking = async () => {
    if (!service || (!params.venueId && !params.providerId) || !params.date || !params.time) {
      Alert.alert('Missing details', 'Please go back and complete your booking details.');
      return;
    }

    setSubmitting(true);

    try {
      const bookingData: any = {
        serviceId: params.serviceId as string,
        venueId: params.venueId ? (params.venueId as string) : undefined,
        mobileProviderId: params.providerId ? (params.providerId as string) : undefined,
        staffId: params.staffId ? (params.staffId as string) : undefined,
        date: params.date as string,
        startTime: params.time as string,
        notes: notes || undefined,
      };

      const response = await api.createBooking(bookingData);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        router.push(`/booking/success?reference=${response.data.reference}`);
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert('Booking failed', error?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const serviceRes = await api.getService(params.serviceId as string);
        if (serviceRes.error) throw new Error(serviceRes.error);
        setService(serviceRes.data);

        if (params.venueId) {
          const venueRes = await api.getVenue(params.venueId as string);
          if (venueRes.error) throw new Error(venueRes.error);
          setVenue(venueRes.data);
        }

        if (params.staffId) {
          const staffRes = await api.getStaffMember(params.staffId as string);
          if (staffRes.error) throw new Error(staffRes.error);
          setStaff(staffRes.data);
        }
      } catch (e: any) {
        Alert.alert('Unable to load booking', e?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.serviceId, params.venueId, params.staffId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStepCompleted}>
          <Text style={styles.progressStepTextActive}>1</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStepCompleted}>
          <Text style={styles.progressStepTextActive}>2</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStepCompleted}>
          <Text style={styles.progressStepTextActive}>3</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStepActive}>
          <Text style={styles.progressStepTextActive}>4</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>

          {/* Venue Card */}
          {venue ? (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>📍</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Venue</Text>
                <Text style={styles.summaryValue}>{venue.name}</Text>
                <Text style={styles.summarySubtext}>{venue.address}, {venue.city}</Text>
              </View>
            </View>
          ) : null}

          {/* Service Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>💇</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{service?.name || 'Service'}</Text>
              <Text style={styles.summarySubtext}>{service?.duration || 0} minutes</Text>
            </View>
          </View>

          {/* Date & Time Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>📅</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {params.date ? formatDate(params.date as string) : 'Today'}
              </Text>
              <Text style={styles.summarySubtext}>{params.time || '10:00'}</Text>
            </View>
          </View>

          {/* Staff Card */}
          {staff && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>👤</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Staff</Text>
                <Text style={styles.summaryValue}>
                  {staff.user.firstName} {staff.user.lastName}
                </Text>
                <Text style={styles.summarySubtext}>Professional Barber</Text>
              </View>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{service?.name || 'Service'}</Text>
              <Text style={styles.priceValue}>K {Number(service?.price || 0).toFixed(0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>K 0.00</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>K {Number(service?.price || 0).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any special requests or instructions?"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By confirming this booking, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Cancellation Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={submitting || loading}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg.primary,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  progressStepTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryIcon: {
    fontSize: 24,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...typography.bodyMedium,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  summarySubtext: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  priceCard: {
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },
  priceValue: {
    ...typography.smallMedium,
    color: colors.text.primary,
    fontWeight: '700',
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  priceTotalLabel: {
    ...typography.bodyMedium,
    fontWeight: '800',
    color: colors.text.primary,
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  notesInput: {
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  termsContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  termsText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});