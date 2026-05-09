import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../../constants/theme';
import { ThemedCard } from '../../../components/ThemedCard';
import * as Location from 'expo-location';
import CrossPlatformMap from '../../../components/Map';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const center = location || { latitude: -15.4089, longitude: 28.2815 };
      const apiParams: Record<string, string> = {
        lat: center.latitude.toString(),
        lng: center.longitude.toString(),
        radius: '20',
        limit: '50',
      };
      const response = await api.getVenues(apiParams);
      setVenues(response.data || []);
    } catch (error: unknown) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } else {
          setLocation({ latitude: -15.4089, longitude: 28.2815 });
        }
      } catch {
        setLocation({ latitude: -15.4089, longitude: 28.2815 });
      }
    })();
  }, []);

  useEffect(() => {
    if (location) fetchVenues();
  }, [location]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        v.city.toLowerCase().includes(q)
    );
  }, [venues, searchQuery]);

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
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueCategory}>{item.category}</Text>
      </View>
    </ThemedCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <CrossPlatformMap
          venues={filtered.map((v) => ({
            id: v.id,
            name: v.name,
            latitude: v.latitude,
            longitude: v.longitude,
            category: v.category,
          }))}
          location={location}
          onMarkerPress={(id) => router.push(`/venue/${id}`)}
        />

        <TouchableOpacity
          style={styles.mapExpand}
          onPress={() => router.push('/(tabs)/search/map')}
          accessibilityRole="button"
        >
          <Ionicons name="expand" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerButton}
          onPress={async () => {
            try {
              const loc = await Location.getCurrentPositionAsync({});
              if (loc) {
                setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
              }
            } catch {
              Alert.alert('Location', 'Unable to access current location');
            }
          }}
        >
          <Ionicons name="locate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search venues, services..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderVenueCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  mapContainer: {
    height: 260,
    backgroundColor: colors.bg.primary,
    marginBottom: spacing.md,
  },
  centerButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  mapExpand: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(26,86,219,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...shadows.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bg.primary,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
});
