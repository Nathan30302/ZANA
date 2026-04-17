import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

export default function RootLayout() {
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