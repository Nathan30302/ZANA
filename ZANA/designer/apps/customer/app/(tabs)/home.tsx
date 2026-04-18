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
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';

const SERVICE_CATEGORIES = [
  { key: 'HAIRCUT', label: 'Haircut', icon: '✂️' },
  { key: 'HAIR_STYLING', label: 'Hair Styling', icon: '💇' },
  { key: 'BRAIDING', label: 'Braiding', icon: '🪢' },
  { key: 'NAILS', label: 'Nails', icon: '💅' },
  { key: 'MAKEUP', label: 'Makeup', icon: '💄' },
  { key: 'BEARD_TRIM', label: 'Beard Trim', icon: '🧔' }
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

  const fetchData = async () => {
    try {
      const mockLocation = { latitude: -15.4089, longitude: 28.2815 };

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
    <ThemedCard
      onPress={() => router.push(`/venue/${item.id}`)}
      shadow="md"
      style={styles.venueCard}
    >
      <Image
        source={{ uri: item.coverPhoto || 'https://images.unsplash.com/photo-1633416476697-1e589ae6e76b?w=300' }}
        style={styles.venueImage}
      />
      <View style={styles.venueInfo}>
        <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.venueCategory} numberOfLines={1}>
          {item.category.replace(/_/g, ' ')}
        </Text>
        <View style={styles.venueRating}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.ratingText}> {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}> ({item.reviewCount})</Text>
        </View>
        <Text style={styles.venueAddress} numberOfLines={1}>
          📍 {item.address}
        </Text>
      </View>
    </ThemedCard>
  );

  const renderMobileProviderCard = ({ item }: { item: MobileProvider }) => (
    <ThemedCard
      onPress={() => router.push(`/provider/${item.id}`)}
      shadow="md"
      style={styles.providerCard}
    >
      <View style={styles.providerContent}>
        <Image
          source={{ uri: item.user.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
          style={styles.providerImage}
        />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName} numberOfLines={1}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.providerBio} numberOfLines={2}>
            {item.bio || 'Beauty Professional'}
          </Text>
          <View style={styles.providerRating}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.providerRatingText}> {item.rating.toFixed(1)}</Text>
            <Text style={styles.providerReviewCount}> ({item.reviewCount})</Text>
          </View>
        </View>
      </View>
    </ThemedCard>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Premium Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>Welcome back! ✨</Text>
          <Text style={styles.heroTitle}>Find Your Beauty Expert</Text>
          <Text style={styles.heroSubtitle}>Discover top-rated salons and professionals</Text>
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={18} color={colors.text.secondary} />
          <Text style={styles.searchPlaceholder}>Search here...</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Categories */}
      <View style={styles.section}>
        <SectionHeader 
          title="Browse Categories"
          actionText="View All"
          onActionPress={() => router.push('/search')}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {SERVICE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={styles.categoryCard}
              onPress={() => router.push(`/search?category=${category.key}`)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryIconText}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Nearby Venues */}
      <View style={styles.section}>
        <SectionHeader 
          title="Featured Venues"
          actionText="See All"
          onActionPress={() => router.push('/search')}
        />
        {venues.length > 0 ? (
          <FlatList
            data={venues.slice(0, 5)}
            renderItem={renderVenueCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.venuesList}
            scrollEventThrottle={16}
          />
        ) : (
          <EmptyState icon="🏢" title="No venues found" description="Check your location settings" />
        )}
      </View>

      {/* Mobile Professionals */}
      <View style={styles.section}>
        <SectionHeader 
          title="Mobile Professionals"
          actionText="See All"
          onActionPress={() => router.push('/search?type=mobile')}
        />
        {mobileProviders.length > 0 ? (
          <FlatList
            data={mobileProviders}
            renderItem={renderMobileProviderCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.providersList}
          />
        ) : (
          <EmptyState icon="👤" title="No professionals available" />
        )}
      </View>

      {/* Top Rated Section */}
      <View style={styles.section}>
        <SectionHeader 
          title="Highest Rated"
          actionText="See All"
          onActionPress={() => router.push('/search?minRating=4')}
        />
        {venues.length > 0 ? (
          <FlatList
            data={venues.sort((a, b) => b.rating - a.rating).slice(0, 3)}
            renderItem={renderVenueCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.venuesList}
          />
        ) : (
          <EmptyState icon="⭐" title="No rated venues yet" />
        )}
      </View>

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
  
  // Hero Section
  heroSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroContent: {
    marginBottom: spacing.lg,
  },
  heroGreeting: {
    ...typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  heroTitle: {
    ...typography.display,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  
  // Categories
  categoriesContainer: {
    paddingRight: spacing.lg,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 80,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconText: {
    fontSize: 28,
  },
  categoryLabel: {
    ...typography.small,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Venues
  venuesList: {
    paddingRight: spacing.lg,
  },
  venueCard: {
    width: 160,
    height: 220,
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: 110,
  },
  venueInfo: {
    padding: spacing.md,
    backgroundColor: colors.bg.primary,
  },
  venueName: {
    ...typography.smallMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  venueCategory: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  reviewCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  venueAddress: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Providers
  providersList: {
    paddingRight: spacing.lg,
  },
  providerCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  providerContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...typography.smallMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  providerBio: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  providerRatingText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  providerReviewCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Bottom spacing
  bottomSpacing: {
    height: spacing.xl,
  },
});