import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Staff {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function SelectDateTimeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let serviceData: Service | null = null;
        let staffData: Staff | null = null;

        // Fetch service details if serviceId provided
        if (params.serviceId) {
          const serviceRes = await api.getService(params.serviceId as string);
          if (serviceRes.error) throw new Error(serviceRes.error);
          if (serviceRes.data) {
            serviceData = {
              id: serviceRes.data.id,
              name: serviceRes.data.name,
              price: serviceRes.data.price,
              duration: serviceRes.data.duration,
            };
          }
        }

        // Fetch staff details if staffId provided
        if (params.staffId) {
          const staffRes = await api.getStaffMember(params.staffId as string);
          if (staffRes.error) throw new Error(staffRes.error);
          if (staffRes.data) {
            staffData = {
              id: staffRes.data.id,
              user: { firstName: staffRes.data.user.firstName, lastName: staffRes.data.user.lastName },
            };
          }
        }

        // Fetch availability for the selected date
        if (params.venueId) {
          const availabilityResponse = await api.getVenueAvailability(
            params.venueId as string,
            selectedDate.toISOString().split('T')[0],
            params.serviceId as string
          );
          if (availabilityResponse.error) throw new Error(availabilityResponse.error);
          const slots: TimeSlot[] = (availabilityResponse.data?.timeSlots || []).map((slot: any) => ({
            time: slot.time,
            available: !!slot.available,
          }));
          setTimeSlots(slots);
        } else if (params.providerId) {
          const availabilityResponse = await api.getMobileProviderAvailability(
            params.providerId as string,
            selectedDate.toISOString().split('T')[0],
            params.serviceId as string
          );
          if (availabilityResponse.error) throw new Error(availabilityResponse.error);
          const slots: TimeSlot[] = (availabilityResponse.data?.timeSlots || []).map((slot: any) => ({
            time: slot.time,
            available: !!slot.available,
          }));
          setTimeSlots(slots);
        }

        setService(serviceData);
        setStaff(staffData);
      } catch (error: any) {
        console.error('Error fetching availability:', error);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, params.venueId, params.serviceId, params.staffId]);

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      const base = params.venueId
        ? `venueId=${params.venueId}`
        : `providerId=${params.providerId}`;
      router.push(
        `/booking/confirm?${base}&serviceId=${params.serviceId}&date=${selectedDate.toISOString()}&time=${selectedTime}${params.staffId ? `&staffId=${params.staffId}` : ''}`
      );
    }
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        <View style={styles.progressStepActive}>
          <Text style={styles.progressStepTextActive}>3</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={styles.progressStepText}>4</Text>
        </View>
      </View>

      {/* Service & Staff Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Service</Text>
          <Text style={styles.infoValue}>{service?.name}</Text>
        </View>
        {staff && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Staff</Text>
            <Text style={styles.infoValue}>{staff.user.firstName} {staff.user.lastName}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Price</Text>
          <Text style={styles.infoValue}>K {service?.price.toFixed(0)}</Text>
        </View>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {getNextDays().map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCard,
                selectedDate.toDateString() === date.toDateString() && styles.dateCardSelected,
              ]}
              onPress={() => {
                setSelectedDate(date);
                setSelectedTime(null); // Reset time when date changes
              }}
            >
              <Text style={[
                styles.dateDay,
                selectedDate.toDateString() === date.toDateString() && styles.dateDaySelected,
              ]}>
                {formatDate(date).split(',')[0]}
              </Text>
              <Text style={[
                styles.dateNumber,
                selectedDate.toDateString() === date.toDateString() && styles.dateNumberSelected,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlot,
                !slot.available && styles.timeSlotUnavailable,
                selectedTime === slot.time && styles.timeSlotSelected,
              ]}
              onPress={() => slot.available && setSelectedTime(slot.time)}
              disabled={!slot.available}
            >
              <Text style={[
                styles.timeSlotText,
                !slot.available && styles.timeSlotTextUnavailable,
                selectedTime === slot.time && styles.timeSlotTextSelected,
              ]}>
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedTime && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedTime}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoCard: {
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.smallMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateScroll: {
    paddingRight: 16,
  },
  dateCard: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  dateCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateDay: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  timeSlotSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  timeSlotUnavailable: {
    backgroundColor: colors.bg.tertiary,
    borderColor: colors.border,
  },
  timeSlotText: {
    ...typography.smallMedium,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextUnavailable: {
    color: colors.text.tertiary,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  continueButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  continueButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});