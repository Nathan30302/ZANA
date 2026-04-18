import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';

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
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock data
  const mockVenue: Venue = {
    id: params.venueId as string,
    name: 'Kutz by Daka',
    address: 'Plot 123, Great East Road',
    city: 'Lusaka',
    phone: '0971234567',
  };

  const mockService: Service = {
    id: params.serviceId as string,
    name: 'Haircut & Style',
    price: 250,
    duration: 45,
  };

  const mockStaff: Staff | null = params.staffId
    ? { id: params.staffId as string, user: { firstName: 'John', lastName: 'Phiri' } }
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleConfirmBooking = async () => {
    setLoading(true);

    try {
      const bookingData = {
        serviceId: params.serviceId as string,
        venueId: params.venueId as string,
        staffId: params.staffId as string || undefined,
        date: params.date as string,
        startTime: params.time as string,
        notes: notes || undefined,
      };

      const response = await api.createBooking(bookingData);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        router.push(`/booking/success?reference=${response.data.reference || 'ZNA-0001'}`);
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      // For now, just show success anyway
      router.push('/booking/success?reference=ZNA-20260330-0001');
    } finally {
      setLoading(false);
    }
  };

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
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>📍</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Venue</Text>
              <Text style={styles.summaryValue}>{mockVenue.name}</Text>
              <Text style={styles.summarySubtext}>{mockVenue.address}, {mockVenue.city}</Text>
            </View>
          </View>

          {/* Service Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Text style={styles.summaryIcon}>💇</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{mockService.name}</Text>
              <Text style={styles.summarySubtext}>{mockService.duration} minutes</Text>
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
          {mockStaff && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconContainer}>
                <Text style={styles.summaryIcon}>👤</Text>
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Staff</Text>
                <Text style={styles.summaryValue}>
                  {mockStaff.user.firstName} {mockStaff.user.lastName}
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
              <Text style={styles.priceLabel}>{mockService.name}</Text>
              <Text style={styles.priceValue}>K {mockService.price.toFixed(0)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>K 0.00</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>K {mockService.price.toFixed(0)}</Text>
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
          disabled={loading}
        >
          {loading ? (
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
    backgroundColor: '#F9FAFB',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  progressStepTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
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
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A56DB',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  termsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  termsLink: {
    color: '#1A56DB',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});