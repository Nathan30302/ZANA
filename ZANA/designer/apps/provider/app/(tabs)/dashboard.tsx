import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { providerApi } from '../../services/api';

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  todayRevenue: number;
  totalRevenue: number;
}

interface RecentBooking {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  status: string;
  amount: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  const fetchDashboardData = async () => {
    try {
      const response = await providerApi.getBookings();
      if (response.error) {
        throw new Error(response.error);
      }

      const bookings = response.data || [];
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter((booking: any) => booking.status === 'PENDING').length;
      const confirmedBookings = bookings.filter((booking: any) => booking.status === 'CONFIRMED').length;
      const totalRevenue = bookings.reduce((sum: number, booking: any) => sum + (booking.amount || 0), 0);
      const todayRevenue = bookings
        .filter((booking: any) => {
          const bookingDate = new Date(booking.date).toDateString();
          return bookingDate === new Date().toDateString();
        })
        .reduce((sum: number, booking: any) => sum + (booking.amount || 0), 0);

      setStats({
        totalBookings,
        pendingBookings,
        confirmedBookings,
        todayRevenue,
        totalRevenue,
      });
      setRecentBookings(bookings.slice(0, 5).map((booking: any) => ({
        id: booking.id,
        customerName: booking.customerName || booking.customer?.firstName || 'Guest',
        serviceName: booking.serviceName || booking.service?.name || 'Service',
        time: booking.startTime || booking.time || 'TBD',
        status: booking.status || 'PENDING',
        amount: booking.amount || 0,
      })));
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const navigateToBookings = () => {
    router.push('/bookings');
  };

  const navigateToServices = () => {
    router.push('/services');
  };

  const navigateToStaff = () => {
    router.push('/staff');
  };

  const navigateToAvailability = () => {
    router.push('/availability');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back!</Text>
        <Text style={styles.welcomeSubtitle}>Here's your business overview</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#1A56DB" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats.pendingBookings}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Confirmed</Text>
              <Text style={styles.statValue}>{stats.confirmedBookings}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Today's Revenue</Text>
              <Text style={styles.statValue}>K {stats.todayRevenue}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToBookings}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#1A56DB" />
            </View>
            <Text style={styles.actionText}>Manage Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToServices}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="cut-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionText}>Manage Services</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToStaff}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="people-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Manage Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={navigateToAvailability}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="time-outline" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionText}>Set Availability</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={navigateToBookings}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentBookings.length > 0 ? (
          recentBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
                <Text style={styles.bookingService}>{booking.serviceName}</Text>
                <Text style={styles.bookingTime}>{booking.time}</Text>
              </View>
              <View style={styles.bookingDetails}>
                <View style={[
                  styles.statusBadge,
                  booking.status === 'confirmed' && styles.statusConfirmed,
                  booking.status === 'pending' && styles.statusPending,
                ]}>
                  <Text style={[
                    styles.statusText,
                    booking.status === 'confirmed' && styles.statusTextConfirmed,
                    booking.status === 'pending' && styles.statusTextPending,
                  ]}>
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.bookingAmount}>K {booking.amount}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent bookings</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  welcomeSection: {
    backgroundColor: '#1A56DB',
    padding: 24,
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#1A56DB',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bookingDetails: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginBottom: 8,
  },
  statusConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  statusTextConfirmed: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  bookingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
});