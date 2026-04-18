import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -4,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          borderBottomWidth: 0,
          shadowColor: 'transparent',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'ZANA',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerTitle: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
          tabBarLabel: 'Search',
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          headerTitle: 'My Appointments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          tabBarLabel: 'Appointments',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerTitle: 'My Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Account',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});