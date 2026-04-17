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

const API_BASE_URL = 'http://localhost:3000/v1';

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
          // For mobile providers, we might need a different endpoint
          // For now, use mock or assume services are available
          servicesData = [
            { id: '1', name: 'Haircut & Style', description: 'Professional haircut with styling', category: 'HAIRCUT', price: 250, duration: 45 },
            { id: '2', name: 'Beard Trim', description: 'Precision beard trimming', category: 'BEARD_TRIM', price: 100, duration: 20 },
          ];
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
    if (selectedService && venue) {
      router.push(`/booking/staff?venueId=${venue.id}&serviceId=${selectedService.id}`);
    } else if (selectedService && provider) {
      router.push(`/booking/staff?providerId=${provider.id}&serviceId=${selectedService.id}`);
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
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoAddress: {
    fontSize: 14,
    color: '#6B7280',
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
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  serviceCardSelected: {
    borderColor: '#1A56DB',
    backgroundColor: '#EFF6FF',
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceNameSelected: {
    color: '#1A56DB',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A56DB',
    marginBottom: 4,
  },
  servicePriceSelected: {
    color: '#1A56DB',
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
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});