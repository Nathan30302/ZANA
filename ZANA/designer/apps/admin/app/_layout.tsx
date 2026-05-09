import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAdminAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isLoading = useAdminAuthStore((state) => state.isLoading);
  const restoreAuth = useAdminAuthStore((state) => state.restoreAuth);

  useEffect(() => {
    // Restore auth on app startup
    restoreAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/queue');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#111827',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#F3F4F6',
          },
        }}
      >
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Admin Login',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'ZANA Admin',
          }}
        />
      </Stack>
    </>
  );
}
