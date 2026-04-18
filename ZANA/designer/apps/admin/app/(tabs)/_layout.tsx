import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1A56DB',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarActiveTintColor: '#1A56DB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 10,
          paddingTop: 10,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Approval Queue',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
