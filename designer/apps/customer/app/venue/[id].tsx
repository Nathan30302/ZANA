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
    // Mock data for demonstration
    const mockVenue: Venue = {
      id: params.id as string,
      name: 'Kutz by Daka',
      description: 'Premier barbershop in Lusaka offering professional haircuts, beard trims, and styling services. Our experienced barbers use the latest techniques to give you the perfect look.',
      category: 'BARBERSHOP',
      phone: '0971234567',
      email: 'info@kutzbydaka.com',
      address: 'Plot 123, Great East Road',
      city: 'Lusaka',
      latitude: -15.4089,
      longitude: 28.2815,
      coverPhoto: 'https://via.placeholder.com/800x400',
      photos: [
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300',
        'https://via.placeholder.com/400x300',
      ],
      rating: 4.5,
      reviewCount: 128,
      amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Card Payments'],
      services: [
        { id: '1', name: 'Haircut & Style', description: 'Professional haircut with styling', category: 'HAIRCUT', price: 250, duration: 45 },
        { id: '2', name: 'Beard Trim', description: 'Precision beard trimming', category: 'BEARD_TRIM', price: 100, duration: 20 },
        { id: '3', name: 'Full Service', description: 'Haircut, beard trim, and wash', category: 'HAIRCUT', price: 400, duration: 60 },
        { id: '4', name: 'Kids Haircut', description: 'Haircut for children under 12', category: 'HAIRCUT', price: 150, duration: 30 },
      ],
      staff: [
        { id: '1', title: 'Senior Barber', user: { id: 'u1', firstName: 'John', lastName: 'Phiri', avatarUrl: null } },
        { id: '2', title: 'Barber', user: { id: 'u2', firstName: 'Michael', lastName: 'Chanda', avatarUrl: null } },
      ],
      openingHours: [
        { id: '1', dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isClosed: false },
        { id: '2', dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isClosed: false },
        { id: '3', dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isClosed: false },
        { id: '4', dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isClosed: false },
        { id: '5', dayOfWeek: 5, openTime: '08:00', closeTime: '20:00', isClosed: false },
        { id: '6', dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isClosed: false },
        { id: '7', dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isClosed: true },
      ],
      reviews: [
        { id: '1', rating: 5, comment: 'Excellent service! Best haircut in Lusaka.', createdAt: '2026-03-25T00:00:00.000Z', customer: { firstName: 'Patrick', lastName: 'M' } },
        { id: '2', rating: 4, comment: 'Great barbers, professional service.', createdAt: '2026-03-20T00:00:00.000Z', customer: { firstName: 'Sarah', lastName: 'K' } },
      ],
    };

    setVenue(mockVenue);
    setLoading(false);
  }, []);

  const handleBookNow = (service?: Service) => {
    router.push(`/booking/service?venueId=${venue?.id}${service ? `&serviceId=${service.id}` : ''}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Venue not found</Text>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cover Photo */}
      <Image
        source={{ uri: venue.coverPhoto || 'https://via.placeholder.com/800x400' }}
        style={styles.coverImage}
      />

      {/* Photo Gallery */}
      {venue.photos && venue.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
          {venue.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.galleryPhoto} />
          ))}
        </ScrollView>
      )}

      {/* Venue Info */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.venueName}>{venue.name}</Text>
            <Text style={styles.venueCategory}>
              {venue.category.replace(/_/g, ' ')}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingStars}>{renderStars(venue.rating)}</Text>
            <Text style={styles.ratingNumber}>{venue.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({venue.reviewCount})</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{venue.address}, {venue.city}</Text>
        </View>

        {/* Phone */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{venue.phone}</Text>
        </View>

        {/* Amenities */}
        {venue.amenities && venue.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesRow}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityBadge}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Opening Hours */}
        {venue.openingHours && venue.openingHours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            {venue.openingHours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((hour) => (
              <View key={hour.id} style={styles.hoursRow}>
                <Text style={styles.dayName}>
                  {DAY_NAMES[hour.dayOfWeek]}
                </Text>
                <Text style={[styles.hoursText, hour.isClosed && styles.closedText]}>
                  {hour.isClosed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`}
                </Text>
              </View>
            ))}
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
            style={[styles.tab, activeTab === 'team' && styles.tabActive]}
            onPress={() => setActiveTab('team')}
          >
            <Text style={[styles.tabText, activeTab === 'team' && styles.tabTextActive]}>
              Team
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
        {activeTab === 'services' && venue.services && (
          <View style={styles.tabContent}>
            {venue.services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => handleBookNow(service)}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {service.description && (
                    <Text style={styles.serviceDescription} numberOfLines={1}>
                      {service.description}
                    </Text>
                  )}
                  <Text style={styles.serviceDuration}>{service.duration} min</Text>
                </View>
                <View style={styles.servicePriceContainer}>
                  <Text style={styles.servicePrice}>K {service.price.toFixed(0)}</Text>
                  <Text style={styles.bookButton}>Book</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'team' && venue.staff && (
          <View style={styles.tabContent}>
            {venue.staff.map((member) => (
              <View key={member.id} style={styles.staffCard}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>
                    {member.user.firstName.charAt(0)}{member.user.lastName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>
                    {member.user.firstName} {member.user.lastName}
                  </Text>
                  <Text style={styles.staffTitle}>{member.title || 'Staff Member'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'reviews' && venue.reviews && (
          <View style={styles.tabContent}>
            {venue.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewCustomer}>
                    {review.customer.firstName} {review.customer.lastName}
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
      </View>

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
  coverImage: {
    width: '100%',
    height: 200,
  },
  photoGallery: {
    maxHeight: 100,
    paddingVertical: 8,
    paddingLeft: 16,
  },
  galleryPhoto: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  infoContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  venueCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingStars: {
    fontSize: 14,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#1A56DB',
    fontWeight: '500',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dayName: {
    fontSize: 14,
    color: '#374151',
  },
  hoursText: {
    fontSize: 14,
    color: '#374151',
  },
  closedText: {
    color: '#EF4444',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
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
    marginTop: 8,
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
  staffCard: {
    flexDirection: 'row',
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
  },
  staffTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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