import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

const SERVICE_CATEGORIES = [
  { key: 'HAIRCUT', label: 'Haircut' },
  { key: 'HAIR_STYLING', label: 'Hair Styling' },
  { key: 'BRAIDING', label: 'Braiding' },
  { key: 'LOCS', label: 'Locs' },
  { key: 'WEAVE', label: 'Weave' },
  { key: 'BEARD_TRIM', label: 'Beard Trim' },
  { key: 'SHAVE', label: 'Shave' },
  { key: 'NAILS', label: 'Nails' },
  { key: 'MAKEUP', label: 'Makeup' },
  { key: 'EYEBROWS', label: 'Eyebrows' }
];

interface Venue {
  id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  coverPhoto: string | null;
  photos: string[];
  rating: number;
  reviewCount: number;
  amenities: string[];
}

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
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [mobileProviders, setMobileProviders] = useState<MobileProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchData = async () => {
    try {
      const mockLocation = { latitude: -15.4089, longitude: 28.2815 }; // Lusaka
      setUserLocation(mockLocation);

      const venuesResponse = await api.getVenues({
        lat: mockLocation.latitude.toString(),
        lng: mockLocation.longitude.toString(),
        radius: '10',
        limit: '10',
      });

      if (venuesResponse.error) {
        throw new Error(venuesResponse.error);
      }

      const providersResponse = await api.getMobileProviders({
        lat: mockLocation.latitude.toString(),
        lng: mockLocation.longitude.toString(),
        radius: '10',
        limit: '5',
      });

      if (providersResponse.error) {
        throw new Error(providersResponse.error);
      }

      setVenues(venuesResponse.data || []);
      setMobileProviders(providersResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Unable to load content', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const renderVenueCard = ({ item }: { item: Venue }) => (
    <TouchableOpacity
      style={styles.venueCard}
      onPress={() => router.push(`/venue/${item.id}`)}
    >
      <Image
        source={{ uri: item.coverPhoto || 'https://via.placeholder.com/300x200' }}
        style={styles.venueImage}
      />
      <View style={styles.venueInfo}>
        <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.venueCategory}>{item.category.replace(/_/g, ' ')}</Text>
        <View style={styles.venueRating}>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.reviewCount})</Text>
        </View>
        <Text style={styles.venueAddress} numberOfLines={1}>{item.address}, {item.city}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMobileProviderCard = ({ item }: { item: MobileProvider }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => router.push(`/provider/${item.id}`)}
    >
      <Image
        source={{ uri: item.user.avatarUrl || 'https://via.placeholder.com/100' }}
        style={styles.providerImage}
      />
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>
          {item.user.firstName} {item.user.lastName}
        </Text>
        <Text style={styles.providerBio} numberOfLines={2}>
          {item.bio || 'Professional mobile beauty service'}
        </Text>
        <View style={styles.providerRating}>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.reviewCount})</Text>
        </View>
        <Text style={styles.providerRadius}>{item.serviceRadius}km service radius</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
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
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingTitle}>Welcome to ZANA</Text>
        <Text style={styles.greetingSubtitle}>Beauty at your fingertips</Text>
      </View>

      {/* Category Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SERVICE_CATEGORIES.slice(0, 6).map((category) => (
            <TouchableOpacity
              key={category.key}
              style={styles.categoryChip}
              onPress={() => router.push(`/search?category=${category.key}`)}
            >
              <Text style={styles.categoryChipText}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Nearby Venues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Venues</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {venues.length > 0 ? (
          <FlatList
            data={venues}
            renderItem={renderVenueCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.venuesList}
          />
        ) : (
          <Text style={styles.emptyText}>No venues found nearby</Text>
        )}
      </View>

      {/* Mobile Professionals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mobile Pros Near You</Text>
          <TouchableOpacity onPress={() => router.push('/search?type=mobile')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {mobileProviders.length > 0 ? (
          <FlatList
            data={mobileProviders}
            renderItem={renderMobileProviderCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providersList}
          />
        ) : (
          <Text style={styles.emptyText}>No mobile providers found nearby</Text>
        )}
      </View>

      {/* Top Rated Venues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Rated</Text>
          <TouchableOpacity onPress={() => router.push('/search?minRating=4')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {venues
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => router.push(`/venue/${venue.id}`)}
            >
              <Image
                source={{ uri: venue.coverPhoto || 'https://via.placeholder.com/300x200' }}
                style={styles.venueImage}
              />
              <View style={styles.venueInfo}>
                <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                <Text style={styles.venueCategory}>{venue.category.replace(/_/g, ' ')}</Text>
                <View style={styles.venueRating}>
                  <Text style={styles.ratingText}>⭐ {venue.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewCount}>({venue.reviewCount})</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  greetingSection: {
    backgroundColor: '#1A56DB',
    padding: 24,
    paddingTop: 32,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  greetingSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#1A56DB',
    fontWeight: '500',
  },
  categoryChip: {
    backgroundColor: '#1A56DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  venuesList: {
    paddingRight: 16,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 200,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  venueInfo: {
    padding: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  venueCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  venueAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  providersList: {
    paddingRight: 16,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 180,
    marginRight: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  providerBio: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  providerRadius: {
    fontSize: 11,
    color: '#1A56DB',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
});