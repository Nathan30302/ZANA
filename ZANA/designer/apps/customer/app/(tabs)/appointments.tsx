import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';
import { Badge } from '../../components/Badge';

interface Booking {
  id: string;
  reference: string;
  customerId: string;
  serviceId: string;
  venueId: string | null;
  mobileProviderId: string | null;
  staffId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  serviceMode: 'SALON_VISIT' | 'BARBERSHOP_VISIT' | 'MOBILE';
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    price: number;
    duration: number;
  };
  venue?: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  staff?: {
    id: string;
    title: string | null;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.getBookings();
        if (response.error) {
          throw new Error(response.error);
        }
        setBookings(response.data || []);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
  );

  const getStatusVariant = (status: Booking['status']): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'info';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: Booking['status']): any => {
    switch (status) {
      case 'PENDING':
        return 'hourglass-outline';
      case 'CONFIRMED':
        return 'checkmark-circle-outline';
      case 'IN_PROGRESS':
        return 'play-circle-outline';
      case 'COMPLETED':
        return 'checkmark-done-circle-outline';
      case 'CANCELLED':
        return 'close-circle-outline';
      case 'NO_SHOW':
        return 'alert-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderBookingCard = (booking: Booking) => (
    <ThemedCard
      key={booking.id}
      shadow="md"
      onPress={() => Alert.alert('Appointment Details', `Booking ${booking.reference}\nStatus: ${booking.status}\nService: ${booking.service?.name || 'N/A'}\nDate: ${new Date(booking.date).toLocaleDateString()}\nTime: ${booking.startTime}`)}
      style={styles.bookingCard}
    >
      {/* Header */}
      <View style={styles.bookingHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bookingReference}>{booking.reference}</Text>
        </View>
        <Badge variant={getStatusVariant(booking.status)}>
          {booking.status}
        </Badge>
      </View>

      {/* Service & Venue */}
      <Text style={styles.serviceName}>{booking.service?.name || 'Service'}</Text>
      <Text style={styles.venueName}>{booking.venue?.name || 'Venue'}</Text>

      {/* Details */}
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.detailText}>K {booking.totalAmount.toFixed(0)}</Text>
        </View>
      </View>

      {/* Staff */}
      {booking.staff && (
        <Text style={styles.staffName}>
          with {booking.staff.user.firstName} {booking.staff.user.lastName}
        </Text>
      )}

      {/* Review Button */}
      {booking.status === 'COMPLETED' && (
        <TouchableOpacity style={styles.reviewButton} activeOpacity={0.7}>
          <Ionicons name="star-outline" size={16} color="#FFFFFF" />
          <Text style={styles.reviewButtonText}>Leave a Review</Text>
        </TouchableOpacity>
      )}
    </ThemedCard>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="calendar" 
            size={18} 
            color={activeTab === 'upcoming' ? colors.primary : colors.text.secondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="checkmark-done-circle" 
            size={18} 
            color={activeTab === 'past' ? colors.primary : colors.text.secondary}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {currentBookings.length > 0 ? (
        <ScrollView 
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {currentBookings.map(renderBookingCard)}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'upcoming' ? 'calendar-outline' : 'checkmark-done-circle-outline'} 
            size={64} 
            color={colors.text.tertiary}
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'upcoming'
              ? 'No upcoming appointments'
              : 'No past appointments'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'upcoming'
              ? 'Book your next appointment today!'
              : 'Your completed appointments will appear here.'}
          </Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.bookButtonText}>Browse Venues</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabIcon: {
    marginRight: spacing.sm,
  },
  tabText: {
    ...typography.bodyMedium,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  bookingCard: {
    padding: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bookingReference: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  serviceName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  venueName: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  bookingDetails: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailText: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '500',
  },
  staffName: {
    ...typography.small,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  reviewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  reviewButtonText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bookButtonText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});