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

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface MobileProvider {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  services?: Service[];
}

export default function SelectServiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [provider, setProvider] = useState<MobileProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let servicesData: Service[] = [];
        let venueData: Venue | null = null;
        let providerData: MobileProvider | null = null;

        if (params.venueId) {
          // Fetch venue services
          const servicesResponse = await api.getVenueServices(params.venueId as string);
          if (servicesResponse.error) {
            throw new Error(servicesResponse.error);
          }
          servicesData = servicesResponse.data || [];

          // Fetch venue details
          const venueResponse = await api.getVenue(params.venueId as string);
          if (venueResponse.data) {
            venueData = venueResponse.data;
          }
        } else if (params.providerId) {
          // Mobile provider services are included on provider details; fetch provider profile and use its services.
          const providerRes = await api.getMobileProvider(params.providerId as string);
          if (providerRes.error) throw new Error(providerRes.error);
          providerData = providerRes.data;
          servicesData = providerData?.services || [];
        }

        setServices(servicesData);
        setVenue(venueData);
        setProvider(providerData);

        // Pre-select service if passed in URL
        if (params.serviceId) {
          const preSelected = servicesData.find(s => s.id === params.serviceId);
          if (preSelected) {
            setSelectedService(preSelected);
          }
        }
      } catch (error: any) {
        console.error('Error fetching services:', error);
        // Keep empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.venueId, params.providerId, params.serviceId]);

  const handleContinue = () => {
    if (!selectedService) return;
    if (venue) {
      router.push(`/booking/staff?venueId=${venue.id}&serviceId=${selectedService.id}`);
      return;
    }
    if (provider) {
      router.push(`/booking/staff?providerId=${provider.id}&serviceId=${selectedService.id}`);
      return;
    }
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
        <View style={styles.progressStepActive}>
          <Text style={styles.progressStepTextActive}>1</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <Text style={styles.progressStepText}>2</Text>
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

      {/* Venue/Provider Info */}
      {venue && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{venue.name}</Text>
          <Text style={styles.infoAddress}>{venue.address}, {venue.city}</Text>
        </View>
      )}

      {/* Service List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select a Service</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService?.id === service.id && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedService(service)}
            >
              <View style={styles.serviceContent}>
                <Text style={[
                  styles.serviceName,
                  selectedService?.id === service.id && styles.serviceNameSelected,
                ]}>
                  {service.name}
                </Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                <View style={styles.serviceMeta}>
                  <Text style={styles.serviceDuration}>⏱ {service.duration} min</Text>
                </View>
              </View>
              <View style={styles.servicePriceContainer}>
                <Text style={[
                  styles.servicePrice,
                  selectedService?.id === service.id && styles.servicePriceSelected,
                ]}>
                  K {service.price.toFixed(0)}
                </Text>
                {selectedService?.id === service.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedService && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedService}
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
  infoTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoAddress: {
    ...typography.small,
    color: colors.text.secondary,
  },
  section: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  serviceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 86, 219, 0.08)',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceNameSelected: {
    color: colors.primary,
  },
  serviceDescription: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  servicePriceSelected: {
    color: '#1A56DB',
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
  continueButtonDisabled: {
    backgroundColor: colors.text.tertiary,
  },
  continueButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});