import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#1A56DB',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#F9FAFB',
          },
        }}
      >
        <Stack.Screen
          name="business"
          options={{ title: 'Business Setup' }}
        />
        <Stack.Screen
          name="services"
          options={{ title: 'Services' }}
        />
        <Stack.Screen
          name="complete"
          options={{ title: 'Await Approval' }}
        />
      </Stack>
    </>
  );
}
