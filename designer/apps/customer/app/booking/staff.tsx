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
    const base = params.venueId
      ? `venueId=${params.venueId}`
      : `providerId=${params.providerId}`;
    router.push(
      `/booking/datetime?${base}&serviceId=${params.serviceId}${staffId ? `&staffId=${staffId}` : ''}`
    );
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
  infoLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  infoPrice: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  staffCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
  },
  staffAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
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
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  staffNameSelected: {
    color: colors.primary,
  },
  staffTitle: {
    ...typography.small,
    color: colors.text.secondary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  continueButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});