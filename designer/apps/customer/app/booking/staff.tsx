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

interface Staff {
  id: string;
  title: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Venue {
  id: string;
  name: string;
}

export default function SelectStaffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | 'any' | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let staffData: Staff[] = [];
        let serviceData: Service | null = null;
        let venueData: Venue | null = null;

        if (params.venueId) {
          // Fetch venue staff
          const staffResponse = await api.getVenueStaff(params.venueId as string);
          if (staffResponse.error) {
            throw new Error(staffResponse.error);
          }
          staffData = staffResponse.data || [];

          // Fetch venue details
          const venueResponse = await api.getVenue(params.venueId as string);
          if (venueResponse.data) {
            venueData = venueResponse.data;
          }
        }

        // Fetch service details if serviceId provided
        if (params.serviceId) {
          // We might need to get service details, but for now assume we have basic info
          serviceData = {
            id: params.serviceId as string,
            name: 'Selected Service',
            price: 0,
            duration: 0,
          };
        }

        setStaff(staffData);
        setService(serviceData);
        setVenue(venueData);
      } catch (error: any) {
        console.error('Error fetching staff:', error);
        // Keep empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.venueId, params.serviceId]);

  const handleContinue = () => {
    const staffId = selectedStaff === 'any' ? null : (selectedStaff as Staff)?.id || null;
    router.push(`/booking/datetime?venueId=${params.venueId}&serviceId=${params.serviceId}${staffId ? `&staffId=${staffId}` : ''}`);
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
        <View style={styles.progressStepActive}>
          <Text style={styles.progressStepTextActive}>2</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={styles.progressStepText}>3</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={styles.progressStepText}>4</Text>
        </View>
      </View>

      {/* Service Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Service</Text>
        <Text style={styles.infoTitle}>{service?.name}</Text>
        <Text style={styles.infoPrice}>K {service?.price.toFixed(0)} • {service?.duration} min</Text>
      </View>

      {/* Staff List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select a Staff Member</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Any Available Option */}
          <TouchableOpacity
            style={[
              styles.staffCard,
              selectedStaff === 'any' && styles.staffCardSelected,
            ]}
            onPress={() => setSelectedStaff('any')}
          >
            <View style={styles.staffAvatar}>
              <Text style={styles.staffAvatarText}>?</Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[
                styles.staffName,
                selectedStaff === 'any' && styles.staffNameSelected,
              ]}>
                Any Available
              </Text>
              <Text style={styles.staffTitle}>First available professional</Text>
            </View>
            {selectedStaff === 'any' && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Individual Staff Members */}
          {staff.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.staffCard,
                selectedStaff !== 'any' && selectedStaff?.id === member.id && styles.staffCardSelected,
              ]}
              onPress={() => setSelectedStaff(member)}
            >
              <View style={styles.staffAvatar}>
                {member.user.avatarUrl ? (
                  <Text style={styles.staffAvatarText}>
                    {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                  </Text>
                ) : (
                  <Text style={styles.staffAvatarText}>
                    {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                  </Text>
                )}
              </View>
              <View style={styles.staffInfo}>
                <Text style={[
                  styles.staffName,
                  selectedStaff !== 'any' && selectedStaff?.id === member.id && styles.staffNameSelected,
                ]}>
                  {member.user.firstName} {member.user.lastName}
                </Text>
                <Text style={styles.staffTitle}>{member.title || 'Staff Member'}</Text>
              </View>
              {selectedStaff !== 'any' && selectedStaff?.id === member.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
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
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  infoPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  staffCardSelected: {
    borderColor: '#1A56DB',
    backgroundColor: '#EFF6FF',
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  staffNameSelected: {
    color: '#1A56DB',
  },
  staffTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});