import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getBooking(String(id));
        if (res.error) throw new Error(res.error);
        setBooking(res.data);
      } catch (e: any) {
        Alert.alert('Unable to load booking', e?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Booking not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <ThemedCard shadow="md" style={{ padding: spacing.lg }}>
        <Text style={styles.ref}>{booking.reference}</Text>
        <Text style={styles.h1}>{booking.service?.name || 'Service'}</Text>
        <Text style={styles.sub}>
          {booking.venue?.name || booking.mobileProvider?.user?.firstName || 'Provider'}
        </Text>
      </ThemedCard>

      <ThemedCard shadow="sm" style={{ padding: spacing.lg }}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.rowText}>{new Date(booking.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.rowText}>{booking.startTime} - {booking.endTime}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="cash-outline" size={18} color={colors.text.secondary} />
          <Text style={styles.rowText}>K {Number(booking.totalAmount || 0).toFixed(0)}</Text>
        </View>
      </ThemedCard>

      {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={async () => {
            try {
              const res = await api.cancelBooking(booking.id);
              if (res.error) throw new Error(res.error);
              setBooking(res.data);
            } catch (e: any) {
              Alert.alert('Unable to cancel', e?.message || 'Please try again.');
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelText}>Cancel booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.secondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.secondary, padding: spacing.lg },
  emptyTitle: { ...typography.h3, color: colors.text.primary, fontWeight: '700' },
  backBtn: { marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg, ...shadows.sm },
  backBtnText: { ...typography.bodyMedium, color: '#fff', fontWeight: '700' },
  ref: { ...typography.caption, color: colors.text.tertiary, fontWeight: '600' },
  h1: { ...typography.h2, color: colors.text.primary, fontWeight: '800', marginTop: spacing.xs },
  sub: { ...typography.body, color: colors.text.secondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  rowText: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  cancelBtn: { backgroundColor: colors.bg.primary, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center', ...shadows.sm },
  cancelText: { ...typography.bodyMedium, color: colors.error, fontWeight: '800' },
});

