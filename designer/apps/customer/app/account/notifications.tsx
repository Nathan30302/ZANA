import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

const PLACEHOLDER = [
  { id: '1', title: 'Booking confirmed', body: 'You’ll see real notifications here when push is enabled.', at: 'Soon' },
  { id: '2', title: 'Reminders', body: '24h before your appointment (Phase 5 push wiring).', at: 'Soon' },
];

export default function NotificationsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.head}>Notifications</Text>
      <Text style={styles.sub}>History will appear here. Enable notifications in settings on device builds.</Text>
      {PLACEHOLDER.map((n) => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
          <Text style={styles.at}>{n.at}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.secondary },
  content: { padding: spacing.lg, gap: spacing.md },
  head: { ...typography.h3, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  sub: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  title: { ...typography.bodyMedium, fontWeight: '600', color: colors.text.primary },
  body: { ...typography.small, color: colors.text.secondary, marginTop: spacing.xs },
  at: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.sm },
});
