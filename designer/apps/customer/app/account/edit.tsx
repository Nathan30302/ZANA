import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  const save = async () => {
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '');
      const res = await api.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: digits.length >= 10 ? digits : null,
      });
      setLoading(false);
      if (res.error) {
        Alert.alert('Error', res.error);
        return;
      }
      if (res.data?.user) {
        await setUser(res.data.user);
      }
      Alert.alert('Saved', 'Your profile was updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Could not save changes.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.label}>First name</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
          <Text style={styles.label}>Last name</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
          <Text style={styles.label}>Phone (+260…)</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={save} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save changes</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.secondary },
  scroll: { padding: spacing.lg },
  card: {
    backgroundColor: colors.bg.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  label: { ...typography.small, fontWeight: '600', marginBottom: spacing.xs, color: colors.text.secondary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...typography.body,
    color: colors.text.primary,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', ...typography.bodyMedium },
});
