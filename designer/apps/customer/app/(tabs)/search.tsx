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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const mockLocation = { latitude: -15.4089, longitude: 28.2815 }; // Lusaka
      const params: Record<string, string> = {
        lat: mockLocation.latitude.toString(),
        lng: mockLocation.longitude.toString(),
        radius: '20',
        limit: '20',
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.getVenues(params);
      if (response.error) {
        throw new Error(response.error);
      }
      setVenues(response.data || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      Alert.alert('Search failed', error.message || 'Unable to load venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, [selectedCategory, searchQuery]);

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
        <Text style={styles.venueCategory}>
          {VENUE_CATEGORIES.find(c => c.key === item.category)?.label || item.category}
        </Text>
        <View style={styles.venueRating}>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.reviewCount} reviews)</Text>
        </View>
        <Text style={styles.venueAddress} numberOfLines={1}>{item.address}, {item.city}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search venues, services..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          onPress={() => setSelectedCategory(null)}
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
          >
            <Text style={[styles.filterChipText, selectedCategory === category.key && styles.filterChipTextActive]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A56DB" />
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={venues}
          renderItem={renderVenueCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            Map view coming soon! 🗺️
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Showing {venues.length} venues in Lusaka area
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1A56DB',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#1A56DB',
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  venueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  venueInfo: {
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  venueCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: '#6B7280',
  },
});