import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { providerApi } from '../../services/api';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DayAvailability {
  day: string;
  open: boolean;
  slots: TimeSlot[];
}

export default function AvailabilityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [venueAvailability, setVenueAvailability] = useState<DayAvailability[]>([]);
  const [staffAvailability, setStaffAvailability] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<DayAvailability | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  const fetchAvailability = async () => {
    try {
      const response = await providerApi.getVenueAvailability();

      if (response.error) {
        throw new Error(response.error);
      }

      const hours = response.data || [];
      const schedule = [
        { day: 'Monday', open: false, slots: [] },
        { day: 'Tuesday', open: false, slots: [] },
        { day: 'Wednesday', open: false, slots: [] },
        { day: 'Thursday', open: false, slots: [] },
        { day: 'Friday', open: false, slots: [] },
        { day: 'Saturday', open: false, slots: [] },
        { day: 'Sunday', open: false, slots: [] },
      ];

      const mappedSchedule = schedule.map(item => {
        const record = hours.find((hour: any) => hour.dayOfWeek === getDayIndex(item.day));
        if (!record) return item;

        return {
          day: item.day,
          open: !record.isClosed,
          slots: [
            {
              startTime: record.openTime,
              endTime: record.closeTime,
              available: !record.isClosed,
            },
          ],
        };
      });

      setVenueAvailability(mappedSchedule);
      setStaffAvailability([]);
    } catch (error) {
      console.error('Error fetching availability:', error);
      Alert.alert('Error', 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailability();
    setRefreshing(false);
  };

  const toggleDayOpen = (dayIndex: number) => {
    const updatedAvailability = [...venueAvailability];
    updatedAvailability[dayIndex].open = !updatedAvailability[dayIndex].open;
    setVenueAvailability(updatedAvailability);
  };

  const toggleSlotAvailability = (dayIndex: number, slotIndex: number) => {
    const updatedAvailability = [...venueAvailability];
    updatedAvailability[dayIndex].slots[slotIndex].available = !updatedAvailability[dayIndex].slots[slotIndex].available;
    setVenueAvailability(updatedAvailability);
  };

  const addTimeSlot = (dayIndex: number) => {
    const updatedAvailability = [...venueAvailability];
    const lastSlot = updatedAvailability[dayIndex].slots[updatedAvailability[dayIndex].slots.length - 1];
    const newEndTime = (parseInt(lastSlot.endTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00';
    updatedAvailability[dayIndex].slots.push({
      startTime: lastSlot.endTime,
      endTime: newEndTime,
      available: true,
    });
    setVenueAvailability(updatedAvailability);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedAvailability = [...venueAvailability];
    updatedAvailability[dayIndex].slots.splice(slotIndex, 1);
    setVenueAvailability(updatedAvailability);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getDayShortName = (day: string) => {
    return day.substring(0, 3);
  };

  const getDayIndex = (day: string) => {
    switch (day.toLowerCase()) {
      case 'monday': return 1;
      case 'tuesday': return 2;
      case 'wednesday': return 3;
      case 'thursday': return 4;
      case 'friday': return 5;
      case 'saturday': return 6;
      case 'sunday': return 0;
      default: return -1;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Availability</Text>
        <Text style={styles.subtitle}>Set your business hours and staff availability</Text>
      </View>

      {/* Venue Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Hours</Text>
        {venueAvailability.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.day}</Text>
              <Switch
                value={day.open}
                onValueChange={() => toggleDayOpen(dayIndex)}
                trackColor={{ false: '#E5E7EB', true: '#1A56DB' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {day.open && (
              <View style={styles.slotsContainer}>
                {day.slots.map((slot, slotIndex) => (
                  <View key={slotIndex} style={styles.slotRow}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeText}>{formatTime(slot.startTime)}</Text>
                      <Text style={styles.timeSeparator}>-</Text>
                      <Text style={styles.timeText}>{formatTime(slot.endTime)}</Text>
                    </View>
                    <View style={styles.slotActions}>
                      <TouchableOpacity
                        style={[
                          styles.availabilityButton,
                          slot.available ? styles.availableButton : styles.unavailableButton,
                        ]}
                        onPress={() => toggleSlotAvailability(dayIndex, slotIndex)}
                      >
                        <Text style={[
                          styles.availabilityButtonText,
                          slot.available ? styles.availableButtonText : styles.unavailableButtonText,
                        ]}>
                          {slot.available ? 'Available' : 'Closed'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeTimeSlot(dayIndex, slotIndex)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addSlotButton}
                  onPress={() => addTimeSlot(dayIndex)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#1A56DB" />
                  <Text style={styles.addSlotText}>Add Time Slot</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Staff Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Staff Availability</Text>
        {staffAvailability.map((staff, staffIndex) => (
          <View key={staffIndex} style={styles.staffCard}>
            <Text style={styles.staffName}>{staff.name}</Text>
            <TouchableOpacity
              style={styles.editStaffButton}
              onPress={() => setEditingStaff(staff)}
            >
              <Ionicons name="create-outline" size={20} color="#1A56DB" />
              <Text style={styles.editStaffText}>Edit Availability</Text>
            </TouchableOpacity>
            
            <View style={styles.weekGrid}>
              {staff.availability.map((day: any, dayIndex: number) => (
                <View key={dayIndex} style={styles.dayColumn}>
                  <Text style={styles.dayHeaderText}>{getDayShortName(day.day)}</Text>
                  {day.slots.map((slot: any, slotIndex: number) => (
                    <View
                      key={slotIndex}
                      style={[
                        styles.timeSlot,
                        slot.available ? styles.availableSlot : styles.unavailableSlot,
                      ]}
                    >
                      <Text style={[
                        styles.slotTime,
                        slot.available ? styles.availableSlotText : styles.unavailableSlotText,
                      ]}>
                        {formatTime(slot.startTime)}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Save Changes */}
      <View style={styles.saveContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={async () => {
            try {
              const response = await providerApi.updateVenueAvailability(venueAvailability);
              if (response.error) {
                throw new Error(response.error);
              }
              Alert.alert('Success', 'Availability updated successfully');
            } catch (error) {
              console.error('Error updating availability:', error);
              Alert.alert('Error', 'Failed to update availability');
            }
          }}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  slotsContainer: {
    gap: 8,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  slotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availableButton: {
    backgroundColor: '#10B981',
  },
  unavailableButton: {
    backgroundColor: '#EF4444',
  },
  availabilityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  availableButtonText: {
    color: '#FFFFFF',
  },
  unavailableButtonText: {
    color: '#FFFFFF',
  },
  removeButton: {
    padding: 4,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 8,
  },
  addSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A56DB',
    marginLeft: 8,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  editStaffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  editStaffText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A56DB',
    marginLeft: 8,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  timeSlot: {
    height: 24,
    width: '100%',
    borderRadius: 4,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableSlot: {
    backgroundColor: '#10B981',
  },
  unavailableSlot: {
    backgroundColor: '#EF4444',
  },
  slotTime: {
    fontSize: 10,
    fontWeight: '600',
  },
  availableSlotText: {
    color: '#FFFFFF',
  },
  unavailableSlotText: {
    color: '#FFFFFF',
  },
  saveContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#1A56DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});