import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import PremiumSplash from '../components/PremiumSplash';

const STORAGE_KEYS_ONBOARDING = 'zana_onboarding_completed';
const ROUTES_HOME = '/(tabs)/home';
const ROUTES_ONBOARDING = '/onboarding';

export default function SplashScreen() {
  const router = useRouter();

  const handleFinish = async () => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS_ONBOARDING);
      if (completed === 'true') {
        router.replace(ROUTES_HOME);
      } else {
        router.replace(ROUTES_ONBOARDING);
      }
    } catch (e) {
      router.replace(ROUTES_HOME);
    }
  };

  return <PremiumSplash onFinish={handleFinish} />;
}
