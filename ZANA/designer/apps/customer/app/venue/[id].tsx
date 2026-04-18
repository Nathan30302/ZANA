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

interface Venue {
  id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  coverPhoto: string | null;
  photos: string[];
  rating: number;
  reviewCount: number;
  amenities: string[];
  services?: Service[];
  staff?: Staff[];
  openingHours?: OpeningHour[];
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

interface OpeningHour {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function VenueDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'team' | 'reviews'>('services');

  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        const venueResponse = await api.getVenue(params.id as string);
        if (!venueResponse.data) {
          throw new Error('Venue not found');
        }

        let venueData = venueResponse.data;

        const servicesResponse = await api.getVenueServices(params.id as string);
        if (servicesResponse.data) {
          venueData.services = servicesResponse.data;
        }

        const staffResponse = await api.getVenueStaff(params.id as string);
        if (staffResponse.data) {
          venueData.staff = staffResponse.data;
        }

        venueData.reviews = [
          { id: '1', rating: 5, comment: 'Excellent service!', createdAt: '2026-03-25T00:00:00.000Z', customer: { firstName: 'Customer', lastName: 'A' } },
        ];
        venueData.openingHours = [
          { id: '1', dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { id: '2', dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { id: '3', dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { id: '4', dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
          { id: '5', dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
          { id: '6', dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isClosed: false },
          { id: '7', dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
        ];

        setVenue(venueData);
      } catch (error: any) {
        console.error('Error fetching venue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [params.id]);

  const handleBookNow = (service?: Service) => {
    router.push(`/booking/service?venueId=${venue?.id}${service ? `&serviceId=${service.id}` : ''}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Venue not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Cover Photo with Back Button */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: venue.coverPhoto || 'https://images.unsplash.com/photo-1633416476697-1e589ae6e76b?w=600' }}
          style={styles.coverImage}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.ratingOverlay}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={styles.overlayRating}>{venue.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Photo Gallery */}
      {venue.photos && venue.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoGallery}
          contentContainerStyle={styles.photoGalleryContent}
        >
          {venue.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.galleryPhoto} />
          ))}
        </ScrollView>
      )}

      {/* Venue Header Info */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueCategory}>
            {venue.category.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Key Info Cards */}
      <View style={styles.infoCardsSection}>
        <ThemedCard shadow="sm" style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.infoCardLabel}>Location</Text>
              <Text style={styles.infoCardValue} numberOfLines={2}>
                {venue.address}, {venue.city}
              </Text>
            </View>
          </View>
        </ThemedCard>

        <ThemedCard shadow="sm" style={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.infoCardLabel}>Phone</Text>
              <Text style={styles.infoCardValue}>{venue.phone}</Text>
            </View>
          </View>
        </ThemedCard>
      </View>

      {/* Amenities */}
      {venue.amenities && venue.amenities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesContainer}>
            {venue.amenities.map((amenity, index) => (
              <Badge key={index} variant="info">
                {amenity}
              </Badge>
            ))}
          </View>
        </View>
      )}

      {/* Opening Hours */}
      {venue.openingHours && venue.openingHours.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          <ThemedCard shadow="sm">
            {venue.openingHours
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((hour, index) => (
                <View
                  key={hour.id}
                  style={[
                    styles.hoursRow,
                    index !== venue.openingHours!.length - 1 && styles.hoursRowBorder,
                  ]}
                >
                  <Text style={styles.dayName}>{DAY_NAMES[hour.dayOfWeek]}</Text>
                  <Text style={[styles.hoursText, hour.isClosed && styles.closedText]}>
                    {hour.isClosed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`}
                  </Text>
                </View>
              ))}
          </ThemedCard>
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
            Services ({venue.services?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'team' && styles.tabActive]}
          onPress={() => setActiveTab('team')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
            Team ({venue.staff?.length || 0})
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
      {activeTab === 'services' && venue.services && venue.services.length > 0 && (
        <View style={styles.tabContent}>
          {venue.services.map((service) => (
            <ThemedCard
              key={service.id}
              shadow="sm"
              style={styles.serviceCard}
              onPress={() => handleBookNow(service)}
            >
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description && (
                  <Text style={styles.serviceDescription} numberOfLines={1}>
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

      {activeTab === 'team' && venue.staff && venue.staff.length > 0 && (
        <View style={styles.tabContent}>
          {venue.staff.map((member) => (
            <ThemedCard key={member.id} shadow="sm" style={styles.staffCard}>
              <View style={styles.staffContent}>
                {member.user.avatarUrl ? (
                  <Image source={{ uri: member.user.avatarUrl }} style={styles.staffAvatar} />
                ) : (
                  <View style={styles.staffAvatarPlaceholder}>
                    <Text style={styles.staffAvatarText}>
                      {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {member.user.firstName} {member.user.lastName}
                  </Text>
                  <Text style={styles.staffTitle}>{member.title || 'Staff Member'}</Text>
                </View>
              </View>
            </ThemedCard>
          ))}
        </View>
      )}

      {activeTab === 'reviews' && venue.reviews && venue.reviews.length > 0 && (
        <View style={styles.tabContent}>
          {venue.reviews.map((review) => (
            <ThemedCard key={review.id} shadow="sm" style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.reviewCustomer}>
                    {review.customer.firstName} {review.customer.lastName}
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
  
  // Cover Image
  coverContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.md,
  },
  overlayRating: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Photo Gallery
  photoGallery: {
    maxHeight: 100,
  },
  photoGalleryContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  galleryPhoto: {
    width: 120,
    height: 80,
    borderRadius: radius.md,
  },

  // Header
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  venueName: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  venueCategory: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Info Cards
  infoCardsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  infoCard: {
    padding: spacing.md,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCardLabel: {
    ...typography.small,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoCardValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },

  // Amenities
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
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  // Hours
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  hoursRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
    width: '40%',
  },
  hoursText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  closedText: {
    color: colors.error,
    fontWeight: '600',
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

  // Staff
  staffCard: {
    padding: spacing.md,
  },
  staffContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  staffAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  staffAvatarText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  staffTitle: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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