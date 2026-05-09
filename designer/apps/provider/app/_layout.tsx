import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useProviderAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useProviderAuthStore((state) => state.isAuthenticated);
  const isLoading = useProviderAuthStore((state) => state.isLoading);
  const restoreAuth = useProviderAuthStore((state) => state.restoreAuth);

  useEffect(() => {
    // Restore auth on app startup
    restoreAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1A56DB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Provider Login',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Provider Registration',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'ZANA Provider',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            title: 'Onboarding',
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
          }}
        />
        <Stack.Screen
          name="bookings"
          options={{
            title: 'Bookings',
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            title: 'Booking Details',
          }}
        />
        <Stack.Screen
          name="services"
          options={{
            title: 'Services',
          }}
        />
        <Stack.Screen
          name="staff"
          options={{
            title: 'Staff',
          }}
        />
        <Stack.Screen
          name="availability"
          options={{
            title: 'Availability',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Business Profile',
          }}
        />
        <Stack.Screen
          name="analytics"
          options={{
            title: 'Analytics',
          }}
        />
      </Stack>
    </>
  );
}