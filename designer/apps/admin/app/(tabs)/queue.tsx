import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';
import { useAdminAuthStore } from '../../stores/authStore';

export default function AdminQueueScreen() {
  const router = useRouter();
  const logout = useAdminAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any>({ pendingVenues: [], pendingMobileProviders: [] });
  const [actionLoading, setActionLoading] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    const response = await adminApi.getQueue();
    if (response.error) {
      Alert.alert('Unable to load queue', response.error);
      setLoading(false);
      return;
    }
    setQueue(response.data || { pendingVenues: [], pendingMobileProviders: [] });
    setLoading(false);
  };

  const handleStatus = async (type: 'venue' | 'mobile', id: string, status: string) => {
    setActionLoading(id);
    const response = type === 'venue'
      ? await adminApi.updateVenueStatus(id, status)
      : await adminApi.updateMobileProviderStatus(id, status);

    if (response.error) {
      Alert.alert('Action failed', response.error);
      setActionLoading('');
      return;
    }

    await fetchQueue();
    setActionLoading('');
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const totalPending = queue.pendingVenues.length + queue.pendingMobileProviders.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="storefront-outline" size={24} color="#1A56DB" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Venues</Text>
            <Text style={styles.statValue}>{queue.pendingVenues.length}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Ionicons name="person-outline" size={24} color="#F59E0B" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Professionals</Text>
            <Text style={styles.statValue}>{queue.pendingMobileProviders.length}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
          <View style={styles.statContent}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{totalPending}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1A56DB" style={styles.loader} />
      ) : (
        <>
          {/* Venues Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="storefront-outline" size={20} color="#1A56DB" />
              <Text style={styles.sectionTitle}>Venues awaiting approval</Text>
              {queue.pendingVenues.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{queue.pendingVenues.length}</Text>
                </View>
              )}
            </View>

            {queue.pendingVenues.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>All venues approved!</Text>
              </View>
            ) : (
              queue.pendingVenues.map((venue: any) => (
                <View key={venue.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="storefront-outline" size={24} color="#1A56DB" />
                    </View>
                    <View style={styles.cardTitleSection}>
                      <Text style={styles.cardTitle}>{venue.name}</Text>
                      <Text style={styles.cardSubtext}>
                        {venue.owner.firstName} {venue.owner.lastName}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDescription}>{venue.description}</Text>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{venue.owner.email || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleStatus('venue', venue.id, 'APPROVED')}
                      disabled={actionLoading === venue.id}
                      activeOpacity={0.8}
                    >
                      {actionLoading === venue.id ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.actionText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleStatus('venue', venue.id, 'REJECTED')}
                      disabled={actionLoading === venue.id}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.actionText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Mobile Providers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Professionals awaiting approval</Text>
              {queue.pendingMobileProviders.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{queue.pendingMobileProviders.length}</Text>
                </View>
              )}
            </View>

            {queue.pendingMobileProviders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>All professionals approved!</Text>
              </View>
            ) : (
              queue.pendingMobileProviders.map((provider: any) => (
                <View key={provider.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, styles.cardIconMobile]}>
                      <Ionicons name="person-outline" size={24} color="#F59E0B" />
                    </View>
                    <View style={styles.cardTitleSection}>
                      <Text style={styles.cardTitle}>
                        {provider.user.firstName} {provider.user.lastName}
                      </Text>
                      <Text style={styles.cardSubtext}>Mobile Professional</Text>
                    </View>
                  </View>

                  {provider.bio && <Text style={styles.cardDescription}>{provider.bio}</Text>}

                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{provider.user.email || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{provider.user.phone || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleStatus('mobile', provider.id, 'APPROVED')}
                      disabled={actionLoading === provider.id}
                      activeOpacity={0.8}
                    >
                      {actionLoading === provider.id ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.actionText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleStatus('mobile', provider.id, 'REJECTED')}
                      disabled={actionLoading === provider.id}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.actionText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  // Stats Bar
  statsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statContent: {
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },

  // Cards
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#1A56DB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconMobile: {
    backgroundColor: '#FEF3C7',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 18,
  },

  // Details
  cardDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontWeight: '500',
  },

  // Loader
  loader: {
    marginTop: 40,
  },
});
