import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

// Simple icon components (replace with actual icons from react-native-vector-icons or expo icons)
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Text style={styles.iconText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A56DB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#1A56DB',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'ZANA',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerTitle: 'Search',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="search" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          headerTitle: 'My Appointments',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="appointments" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'My Account',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});