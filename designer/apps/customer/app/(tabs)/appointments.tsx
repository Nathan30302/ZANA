import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'http://localhost:3000/v1';

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
    // Mock data for demonstration
    const mockBookings: Booking[] = [
      {
        id: '1',
        reference: 'ZNA-20260330-0001',
        customerId: 'user1',
        serviceId: 'svc1',
        venueId: 'venue1',
        mobileProviderId: null,
        staffId: null,
        date: '2026-03-30T00:00:00.000Z',
        startTime: '10:00',
        endTime: '11:00',
        status: 'CONFIRMED',
        serviceMode: 'SALON_VISIT',
        notes: null,
        totalAmount: 250,
        createdAt: '2026-03-28T10:00:00.000Z',
        updatedAt: '2026-03-28T10:30:00.000Z',
        service: {
          id: 'svc1',
          name: 'Haircut & Style',
          description: 'Professional haircut and styling',
          category: 'HAIRCUT',
          price: 250,
          duration: 60,
        },
        venue: {
          id: 'venue1',
          name: 'Kutz by Daka',
          address: 'Plot 123, Great East Road',
          city: 'Lusaka',
          phone: '0971234567',
        },
        staff: {
          id: 'staff1',
          title: 'Senior Barber',
          user: {
            firstName: 'John',
            lastName: 'Phiri',
          },
        },
      },
      {
        id: '2',
        reference: 'ZNA-20260325-0002',
        customerId: 'user1',
        serviceId: 'svc2',
        venueId: 'venue2',
        mobileProviderId: null,
        staffId: null,
        date: '2026-03-25T00:00:00.000Z',
        startTime: '14:00',
        endTime: '15:30',
        status: 'COMPLETED',
        serviceMode: 'SALON_VISIT',
        notes: null,
        totalAmount: 500,
        createdAt: '2026-03-20T10:00:00.000Z',
        updatedAt: '2026-03-25T15:30:00.000Z',
        service: {
          id: 'svc2',
          name: 'Full Head Braids',
          description: 'Professional braiding service',
          category: 'BRAIDING',
          price: 500,
          duration: 90,
        },
        venue: {
          id: 'venue2',
          name: 'Glamour Nails & Hair',
          address: 'Cairo Road, City Center',
          city: 'Lusaka',
          phone: '0961234567',
        },
      },
    ];

    setBookings(mockBookings);
    setLoading(false);
  }, []);

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
  );

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'CONFIRMED':
        return '#10B981';
      case 'IN_PROGRESS':
        return '#3B82F6';
      case 'COMPLETED':
        return '#10B981';
      case 'CANCELLED':
        return '#EF4444';
      case 'NO_SHOW':
        return '#6B7280';
      default:
        return '#6B7280';
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
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      onPress={() => router.push(`/appointments/${booking.id}`)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingReference}>{booking.reference}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(booking.status) },
          ]}
        >
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>

      <Text style={styles.serviceName}>
        {booking.service?.name || 'Service'}
      </Text>

      <Text style={styles.venueName}>
        {booking.venue?.name || 'Venue'}
      </Text>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅</Text>
          <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🕐</Text>
          <Text style={styles.detailText}>
            {booking.startTime} - {booking.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>💰</Text>
          <Text style={styles.detailText}>K {booking.totalAmount.toFixed(0)}</Text>
        </View>
      </View>

      {booking.staff && (
        <Text style={styles.staffName}>
          with {booking.staff.user.firstName} {booking.staff.user.lastName}
        </Text>
      )}

      {booking.status === 'COMPLETED' && (
        <TouchableOpacity style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Leave a Review</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
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
        >
          <Text
            style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      {currentBookings.length > 0 ? (
        <ScrollView style={styles.listContainer}>
          {currentBookings.map(renderBookingCard)}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>
            {activeTab === 'upcoming' ? '📅' : '✅'}
          </Text>
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
            >
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1A56DB',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1A56DB',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingReference: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  bookingDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  staffName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  reviewButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#1A56DB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});