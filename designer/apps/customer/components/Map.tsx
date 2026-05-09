import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';

interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
}

interface Props {
  venues: Venue[];
  location: { latitude: number; longitude: number } | null;
  onMarkerPress?: (id: string) => void;
  /** compact = fixed height preview; fill = flex for full-screen map routes */
  variant?: 'compact' | 'fill';
}

export function CrossPlatformMap({ venues, location, onMarkerPress, variant = 'compact' }: Props) {
  const frameStyle = variant === 'fill' ? [styles.map, styles.mapFill] : styles.map;

  if (Platform.OS === 'web') {
    const centerLat = location?.latitude ?? venues[0]?.latitude ?? -15.4089;
    const centerLng = location?.longitude ?? venues[0]?.longitude ?? 28.2815;
    const marker = venues[0] ?? null;

    // Use OSM's lightweight embed. No extra deps, works in Expo web.
    const bboxDelta = 0.06;
    const left = centerLng - bboxDelta;
    const right = centerLng + bboxDelta;
    const top = centerLat + bboxDelta;
    const bottom = centerLat - bboxDelta;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik${
      marker ? `&marker=${marker.latitude}%2C${marker.longitude}` : ''
    }`;

    return (
      <View style={frameStyle}>
        {/* @ts-expect-error: iframe is supported in react-native-web */}
        <iframe title="Zana Map" src={src} style={styles.iframe as any} loading="lazy" />
        {venues.length > 1 || onMarkerPress ? (
          <View style={styles.webHint}>
            <Text style={styles.webHintText}>
              Map is a preview on web. Use the venue cards below to open details.
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[frameStyle, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={styles.title}>Maps</Text>
      <Text style={styles.body}>
        On device builds, use the venue list or open Search. Full native maps can be enabled with Google Maps / MapKit.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapFill: {
    flex: 1,
    height: undefined,
    minHeight: 280,
    borderRadius: 0,
  },
  iframe: {
    borderWidth: 0,
    width: '100%',
    height: '100%',
  },
  webHint: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  webHintText: { fontSize: 12, opacity: 0.8, textAlign: 'center' },
  title: { fontWeight: '800', marginBottom: 6 },
  body: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 24 },
});

export default CrossPlatformMap;
