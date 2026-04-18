import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';
import { Badge } from '../../components/Badge';

interface MobileProvider {
  id: string;
  userId: string;
  bio: string | null;
  portfolioPhotos: string[];
  baseLat: number;
  baseLng: number;
  serviceRadius: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  services?: Service[];
  reviews?: Review[];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  duration: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
}

export default function ProviderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [provider, setProvider] = useState<MobileProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services');

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const providerResponse = await api.getMobileProvider(params.id as string);
        if (!providerResponse.data) {
          throw new Error('Provider not found');
        }

        let providerData = providerResponse.data;

        providerData.services = [
          { id: '1', name: 'Haircut & Style', description: 'Professional haircut with styling', category: 'HAIRCUT', price: 250, duration: 45 },
          { id: '2', name: 'Braiding', description: 'Professional braiding service', category: 'BRAIDING', price: 500, duration: 120 },
        ];
        providerData.reviews = [
          { id: '1', rating: 5, comment: 'Excellent service!', createdAt: '2026-03-25T00:00:00.000Z', customer: { firstName: 'Customer', lastName: 'A' } },
        ];

        setProvider(providerData);
      } catch (error: any) {
        console.error('Error fetching provider:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [params.id]);

  const handleBookNow = (service?: Service) => {
    router.push(`/booking/service?providerId=${provider?.id}${service ? `&serviceId=${service.id}` : ''}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Provider not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Avatar */}
        {provider.user.avatarUrl ? (
          <Image source={{ uri: provider.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {provider.user.firstName.charAt(0)}{provider.user.lastName.charAt(0)}
            </Text>
          </View>
        )}

        <Text style={styles.providerName}>
          {provider.user.firstName} {provider.user.lastName}
        </Text>

        {provider.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
            <Text style={styles.verifiedText}>Verified Professional</Text>
          </View>
        )}

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingBox}>
            <View style={styles.stars}>
              {[...Array(Math.floor(provider.rating))].map((_, i) => (
                <Ionicons key={i} name="star" size={16} color={colors.warning} />
              ))}
            </View>
            <Text style={styles.ratingNumber}>{provider.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Service Area */}
        <ThemedCard shadow="sm" style={styles.serviceAreaCard}>
          <View style={styles.serviceAreaContent}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={styles.serviceAreaLabel}>Service Area</Text>
              <Text style={styles.serviceAreaValue}>Within {provider.serviceRadius}km radius</Text>
            </View>
          </View>
        </ThemedCard>
      </View>

      {/* Bio */}
      {provider.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{provider.bio}</Text>
        </View>
      )}

      {/* Portfolio */}
      {provider.portfolioPhotos && provider.portfolioPhotos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.portfolioContainer}
          >
            {provider.portfolioPhotos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.portfolioPhoto} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => setActiveTab('services')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
            Services ({provider.services?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'services' && provider.services && provider.services.length > 0 && (
        <View style={styles.tabContent}>
          {provider.services.map((service) => (
            <ThemedCard
              key={service.id}
              shadow="sm"
              style={styles.serviceCard}
              onPress={() => handleBookNow(service)}
            >
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceDetails}>
                    <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>K {service.price.toFixed(0)}</Text>
                </View>
              </View>
            </ThemedCard>
          ))}
        </View>
      )}

      {activeTab === 'reviews' && provider.reviews && provider.reviews.length > 0 && (
        <View style={styles.tabContent}>
          {provider.reviews.map((review) => (
            <ThemedCard key={review.id} shadow="sm" style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewCustomer}>
                    {review.customer.firstName} {review.customer.lastName.charAt(0)}.
                  </Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.reviewRatingContainer}>
                  {[...Array(Math.floor(review.rating))].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color={colors.warning} />
                  ))}
                </View>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
            </ThemedCard>
          ))}
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    backgroundColor: colors.bg.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    gap: spacing.md,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },

  // Hero Section
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  providerName: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  verifiedText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ratingContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  ratingBox: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  ratingNumber: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  reviewCount: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  serviceAreaCard: {
    width: '100%',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  serviceAreaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceAreaLabel: {
    ...typography.small,
    color: colors.text.secondary,
  },
  serviceAreaValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  bioText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },

  // Portfolio
  portfolioContainer: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  portfolioPhoto: {
    width: 150,
    height: 120,
    borderRadius: radius.md,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    backgroundColor: colors.bg.tertiary,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabActive: {
    backgroundColor: colors.bg.primary,
    ...shadows.sm,
  },
  tabText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  // Services
  serviceCard: {
    padding: spacing.md,
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  serviceDuration: {
    ...typography.small,
    color: colors.text.secondary,
  },
  servicePrice: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },

  // Reviews
  reviewCard: {
    padding: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  reviewCustomer: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  reviewDate: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  reviewRatingContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  reviewComment: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 20,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: spacing.xl,
  },
});