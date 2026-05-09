import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function SearchStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ title: 'Map view', headerShown: true }} />
    </Stack>
  );
}
