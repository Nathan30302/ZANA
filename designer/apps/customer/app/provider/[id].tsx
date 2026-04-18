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

const API_BASE_URL = 'http://localhost:3000/v1';

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
    // Mock data for demonstration
    const mockProvider: MobileProvider = {
      id: params.id as string,
      userId: 'user1',
      bio: 'Professional mobile hair stylist with 5+ years of experience. I bring the salon experience to your doorstep! Specializing in braids, weaves, and natural hair care.',
      portfolioPhotos: [
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300',
      ],
      baseLat: -15.4089,
      baseLng: 28.2815,
      serviceRadius: 15,
      rating: 4.8,
      reviewCount: 89,
      isVerified: true,
      user: {
        id: 'user1',
        firstName: 'Grace',
        lastName: 'Mwansa',
        avatarUrl: null,
      },
      services: [
        { id: '1', name: 'Box Braids', description: 'Professional box braids installation', category: 'BRAIDING', price: 800, duration: 180 },
        { id: '2', name: 'Cornrows', description: 'Neat and stylish cornrows', category: 'BRAIDING', price: 400, duration: 90 },
        { id: '3', name: 'Weave Installation', description: 'Full weave installation with sewing', category: 'WEAVE', price: 1200, duration: 240 },
        { id: '4', name: 'Natural Hair Styling', description: 'Styling for natural hair', category: 'HAIR_STYLING', price: 300, duration: 60 },
      ],
      reviews: [
        { id: '1', rating: 5, comment: 'Amazing work! Grace is so professional and the braids lasted for weeks.', createdAt: '2026-03-28T00:00:00.000Z', customer: { firstName: 'Mary', lastName: 'K' } },
        { id: '2', rating: 5, comment: 'Best mobile stylist in Lusaka! She came to my home and did an excellent job.', createdAt: '2026-03-22T00:00:00.000Z', customer: { firstName: 'Jane', lastName: 'P' } },
        { id: '3', rating: 4, comment: 'Great service, just wish she could come a bit earlier next time.', createdAt: '2026-03-15T00:00:00.000Z', customer: { firstName: 'Susan', lastName: 'M' } },
      ],
    };

    setProvider(mockProvider);
    setLoading(false);
  }, []);

  const handleBookNow = (service?: Service) => {
    router.push(`/booking/service?providerId=${provider?.id}${service ? `&serviceId=${service.id}` : ''}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Provider not found</Text>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {provider.user.avatarUrl ? (
            <Image source={{ uri: provider.user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {provider.user.firstName.charAt(0)}{provider.user.lastName.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.providerName}>
          {provider.user.firstName} {provider.user.lastName}
        </Text>
        {provider.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified Professional</Text>
          </View>
        )}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingStars}>{renderStars(provider.rating)}</Text>
          <Text style={styles.ratingNumber}>{provider.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
        </View>
        <Text style={styles.serviceRadius}>
          📍 Serves within {provider.serviceRadius}km of Lusaka
        </Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
            Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'services' && provider.services && (
        <View style={styles.tabContent}>
          {provider.services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handleBookNow(service)}
            >
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                <Text style={styles.serviceDuration}>⏱ {service.duration} min</Text>
              </View>
              <View style={styles.servicePriceContainer}>
                <Text style={styles.servicePrice}>K {service.price.toFixed(0)}</Text>
                <Text style={styles.bookButton}>Book</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {activeTab === 'reviews' && provider.reviews && (
        <View style={styles.tabContent}>
          {provider.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewCustomer}>
                  {review.customer.firstName} {review.customer.lastName.charAt(0)}.
                </Text>
                <Text style={styles.reviewRating}>{renderStars(review.rating)}</Text>
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              )}
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Book Now Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={() => handleBookNow()}
        >
          <Text style={styles.bookNowButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#1A56DB',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1A56DB',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStars: {
    fontSize: 14,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginHorizontal: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceRadius: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  portfolioPhoto: {
    width: 150,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1A56DB',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A56DB',
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: '#1A56DB',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewCustomer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewRating: {
    fontSize: 14,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookNowButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});