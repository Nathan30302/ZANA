import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreAuth = useAuthStore((s) => s.restoreAuth);

  useEffect(() => {
    restoreAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
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
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'ZANA',
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
          name="(auth)/login"
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Register',
          }}
        />
        <Stack.Screen name="(auth)/forgot-password" options={{ title: 'Forgot password' }} />
        <Stack.Screen name="(auth)/reset-password" options={{ title: 'Reset password' }} />
        <Stack.Screen name="account/edit" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="account/notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="account/help" options={{ title: 'Help & Support' }} />
        <Stack.Screen
          name="venue/[id]"
          options={{
            title: 'Venue Details',
          }}
        />
        <Stack.Screen
          name="provider/[id]"
          options={{
            title: 'Provider Details',
          }}
        />
        <Stack.Screen
          name="booking/service"
          options={{
            title: 'Select Service',
          }}
        />
        <Stack.Screen
          name="booking/staff"
          options={{
            title: 'Select Staff',
          }}
        />
        <Stack.Screen
          name="booking/datetime"
          options={{
            title: 'Select Date & Time',
          }}
        />
        <Stack.Screen
          name="booking/confirm"
          options={{
            title: 'Confirm Booking',
          }}
        />
        <Stack.Screen
          name="booking/success"
          options={{
            title: 'Booking Confirmed',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="appointments/[id]"
          options={{
            title: 'Booking Details',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}