import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.h}>Help & Support</Text>
      <Text style={styles.p}>
        ZANA connects you with verified salons and mobile pros across Zambia. For account or payment issues, reach our team.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@zana.zm')}>
          <Text style={styles.link}>support@zana.zm</Text>
        </TouchableOpacity>
        <Text style={styles.pSmall}>We typically reply within one business day.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>FAQs</Text>
        <Text style={styles.bullet}>• How do I cancel? Open Appointments → select booking → Cancel.</Text>
        <Text style={styles.bullet}>• Currency: prices are in ZMW (displayed as K).</Text>
        <Text style={styles.bullet}>• Professionals apply in the ZANA Provider app and are approved by our team.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.secondary },
  content: { padding: spacing.lg, gap: spacing.md },
  h: { ...typography.h3, fontWeight: '700', color: colors.text.primary },
  p: { ...typography.body, color: colors.text.secondary, lineHeight: 22 },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardTitle: { ...typography.bodyMedium, fontWeight: '700', marginBottom: spacing.sm, color: colors.text.primary },
  link: { ...typography.body, color: colors.primary, fontWeight: '600' },
  pSmall: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.sm },
  bullet: { ...typography.body, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 22 },
});
