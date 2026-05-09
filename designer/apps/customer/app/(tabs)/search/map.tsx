import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../../constants/theme';
import CrossPlatformMap from '../../../components/Map';

interface Venue {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  coverPhoto: string | null;
  rating: number;
}

export default function SearchMapScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
    if (!location) return;
    (async () => {
      const res = await api.getVenues({
        lat: String(location.latitude),
        lng: String(location.longitude),
        radius: '25',
        limit: '40',
      });
      setVenues(res.data || []);
    })();
  }, [location]);

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        <CrossPlatformMap
          variant="fill"
          venues={venues.map((v) => ({
            id: v.id,
            name: v.name,
            latitude: v.latitude,
            longitude: v.longitude,
            category: v.category,
          }))}
          location={location}
          onMarkerPress={(id) => router.push(`/venue/${id}`)}
        />
      </View>

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Nearby venues</Text>
        <FlatList
          horizontal
          data={venues}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/venue/${item.id}`)}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: item.coverPhoto || 'https://images.unsplash.com/photo-1633416476697-1e589ae6e76b?w=300',
                }}
                style={styles.cardImg}
              />
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.cardMeta}>{item.category}</Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.cardRatingText}>{item.rating?.toFixed?.(1) ?? '—'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.secondary },
  mapWrap: { flex: 1, minHeight: 320 },
  sheet: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadows.md,
  },
  sheetTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  hList: { gap: spacing.sm, paddingBottom: spacing.sm },
  card: {
    width: 160,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
  },
  cardImg: { width: '100%', height: 88 },
  cardTitle: { ...typography.small, fontWeight: '600', padding: spacing.sm, color: colors.text.primary },
  cardMeta: { ...typography.caption, color: colors.text.secondary, paddingHorizontal: spacing.sm },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.sm },
  cardRatingText: { ...typography.caption, color: colors.text.primary },
});
