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
    // Mock data for demonstration
    const mockService: Service = {
      id: params.serviceId as string,
      name: 'Haircut & Style',
      price: 250,
      duration: 45,
    };

    const mockStaff: Staff | null = params.staffId
      ? { id: params.staffId as string, user: { firstName: 'John', lastName: 'Phiri' } }
      : null;

    // Generate mock time slots
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 18;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: Math.random() > 0.3, // Random availability for demo
        });
      }
    }

    setService(mockService);
    setStaff(mockStaff);
    setTimeSlots(slots);
    setLoading(false);
  }, []);

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      router.push(`/booking/confirm?venueId=${params.venueId}&serviceId=${params.serviceId}&date=${selectedDate.toISOString()}&time=${selectedTime}${params.staffId ? `&staffId=${params.staffId}` : ''}`);
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
    backgroundColor: '#F9FAFB',
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
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dateScroll: {
    paddingRight: 16,
  },
  dateCard: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dateCardSelected: {
    borderColor: '#1A56DB',
    backgroundColor: '#1A56DB',
  },
  dateDay: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotSelected: {
    borderColor: '#1A56DB',
    backgroundColor: '#1A56DB',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextUnavailable: {
    color: '#9CA3AF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});