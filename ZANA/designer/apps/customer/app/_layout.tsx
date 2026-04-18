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
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'ZANA',
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
    </>
  );
}