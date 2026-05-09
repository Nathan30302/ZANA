import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { providerApi } from '../../services/api';

export default function ServicesOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const providerType = params.providerType as string;
  const profileId = params.profileId as string;
  const [serviceName, setServiceName] = useState('Signature Haircut');
  const [description, setDescription] = useState('Premium haircut and styling');
  const [price, setPrice] = useState('200');
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!serviceName || !price || !duration) {
      Alert.alert('Missing details', 'Please complete the service form.');
      return;
    }

    if (!profileId) {
      Alert.alert('Missing profile', 'Provider profile could not be found. Please restart onboarding.');
      return;
    }

    setLoading(true);

    try {
      const serviceResult = await providerApi.createService({
        name: serviceName,
        description,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        category: 'Beauty',
        providerType: providerType === 'PROVIDER_MOBILE' ? 'PROVIDER_MOBILE' : 'PROVIDER_VENUE',
        profileId,
      });

      if (serviceResult.error || !serviceResult.data) {
        Alert.alert('Unable to save service', serviceResult.error || 'Please try again.');
        setLoading(false);
        return;
      }

      await router.push('/onboarding/complete');
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Unable to continue', error.message || 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Add your first service</Text>
        <Text style={styles.subtext}>
          Customers see your top service first. Keep it clear, premium and simple.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Service name</Text>
          <TextInput
            style={styles.input}
            value={serviceName}
            onChangeText={setServiceName}
            placeholder="Cut & finish"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Perfect for any occasion"
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <Text style={styles.label}>Price (ZMW)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving…' : 'Finish onboarding'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  label: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1A56DB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
