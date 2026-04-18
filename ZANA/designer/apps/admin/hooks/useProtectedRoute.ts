import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAdminAuthStore } from './stores/authStore';

export function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAdminAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: false,
  }));

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/queue');
    }
  }, [isAuthenticated, segments, isLoading]);
}
