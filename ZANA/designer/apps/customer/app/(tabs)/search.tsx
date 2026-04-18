import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';

const SERVICE_CATEGORIES = [
  { key: 'HAIRCUT', label: 'Haircut' },
  { key: 'HAIR_STYLING', label: 'Hair Styling' },
  { key: 'BRAIDING', label: 'Braiding' },
  { key: 'NAILS', label: 'Nails' },
  { key: 'MAKEUP', label: 'Makeup' },
];

const VENUE_CATEGORIES = [
  { key: 'SALON', label: 'Hair Salon' },
  { key: 'BARBERSHOP', label: 'Barbershop' },
  { key: 'NAIL_STUDIO', label: 'Nail Studio' },
  { key: 'MAKEUP_STUDIO', label: 'Makeup Studio' }
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

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category as string || null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const mockLocation = { latitude: -15.4089, longitude: 28.2815 };
      const apiParams: Record<string, string> = {
        lat: mockLocation.latitude.toString(),
        lng: mockLocation.longitude.toString(),
        radius: '20',
        limit: '50',
      };

      if (selectedCategory) {
        apiParams.category = selectedCategory;
      }
      if (searchQuery) {
        apiParams.search = searchQuery;
      }

      const response = await api.getVenues(apiParams);
      if (response.error) {
        throw new Error(response.error);
      }

      let sorted = response.data || [];
      if (sortBy === 'rating') {
        sorted.sort((a, b) => b.rating - a.rating);
      }

      setVenues(sorted);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      Alert.alert('Search failed', error.message || 'Unable to load venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [selectedCategory, searchQuery, sortBy]);

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
        <View style={styles.venueHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.venueName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.venueCategory}>
              {VENUE_CATEGORIES.find(c => c.key === item.category)?.label || item.category}
            </Text>
          </View>
        </View>
        <View style={styles.venueRating}>
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.ratingText}> {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}> ({item.reviewCount})</Text>
        </View>
        <View style={styles.venueFooter}>
          <Ionicons name="location-outline" size={13} color={colors.text.secondary} />
          <Text style={styles.venueAddress} numberOfLines={1}>{item.address}, {item.city}</Text>
        </View>
      </View>
    </ThemedCard>
  );

  return (
    <View style={styles.container}>
      {/* Search & Filter Bar */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, services..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {VENUE_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[styles.filterChip, selectedCategory === category.key && styles.filterChipActive]}
            onPress={() => setSelectedCategory(category.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, selectedCategory === category.key && styles.filterChipTextActive]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
          onPress={() => setSortBy('distance')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="swap-vertical" 
            size={16} 
            color={sortBy === 'distance' ? colors.primary : colors.text.secondary}
            style={styles.sortIcon}
          />
          <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextActive]}>
            Distance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => setSortBy('rating')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="star" 
            size={16} 
            color={sortBy === 'rating' ? colors.primary : colors.text.secondary}
            style={styles.sortIcon}
          />
          <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
            Highest Rated
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : venues.length > 0 ? (
        <FlatList
          data={venues}
          renderItem={renderVenueCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No venues found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your filters or search query
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  
  // Header & Search
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    ...shadows.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },

  // Filters
  filtersContainer: {
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg.tertiary,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Sort
  sortContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg.tertiary,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(26, 86, 219, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sortIcon: {
    marginRight: spacing.xs,
  },
  sortButtonText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  venueCard: {
    overflow: 'hidden',
    height: 240,
  },
  venueImage: {
    width: '100%',
    height: 130,
  },
  venueInfo: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flex: 1,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  venueName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
  },
  venueCategory: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingText: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '600',
  },
  reviewCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  venueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  venueAddress: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});