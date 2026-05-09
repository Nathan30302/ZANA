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

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const providerType = params.providerType as string || 'PROVIDER_VENUE';
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('Lusaka, Zambia');
  const [city, setCity] = useState('Lusaka');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('Modern beauty services for Lusaka');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!businessName || !phone || !address) {
      Alert.alert('Missing information', 'Please complete your business details to continue.');
      return;
    }

    setLoading(true);
    try {
      const placeholderCoords = {
        latitude: 15.3875,
        longitude: 28.3228,
      };

      if (providerType === 'PROVIDER_MOBILE') {
        const mobileResponse = await providerApi.createMobileProvider({
          bio: description,
          portfolioPhotos: [],
          baseLat: placeholderCoords.latitude,
          baseLng: placeholderCoords.longitude,
          serviceRadius: 25,
        });

        if (mobileResponse.error || !mobileResponse.data) {
          Alert.alert('Unable to continue', mobileResponse.error || 'Failed to create mobile provider profile.');
          setLoading(false);
          return;
        }

        await router.push({
          pathname: '/onboarding/services',
          params: {
            providerType,
            profileId: mobileResponse.data.id,
          },
        });
      } else {
        const venueResponse = await providerApi.createVenue({
          name: businessName,
          description,
          category: 'Salon',
          phone,
          email,
          address,
          city,
          latitude: placeholderCoords.latitude,
          longitude: placeholderCoords.longitude,
          coverPhoto: '',
          photos: [],
          amenities: [],
        });

        if (venueResponse.error || !venueResponse.data) {
          Alert.alert('Unable to continue', venueResponse.error || 'Failed to create venue profile.');
          setLoading(false);
          return;
        }

        await router.push({
          pathname: '/onboarding/services',
          params: {
            providerType,
            profileId: venueResponse.data.id,
          },
        });
      }
    } catch (error: any) {
      console.error('Navigation error:', error);
      Alert.alert('Unable to continue', error.message || 'Please try again.');
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
        <Text style={styles.header}>Business information</Text>
        <Text style={styles.subtext}>
          Create a polished profile so customers can discover your business quickly.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Business / Salon name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Zana Beauty Lounge"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="A premium salon in the heart of Lusaka"
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Plot 123, Manda Hill Road"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+260 97 123 4567"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Business email (optional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="business@zana.zm"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Loading…' : 'Continue to services'}</Text>
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
    marginBottom: 12,
  },
  subtext: {
    color: '#6B7280',
    marginBottom: 24,
    fontSize: 15,
  },
  form: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
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
    marginTop: 8,
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
