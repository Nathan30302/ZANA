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
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { providerApi } from '../../services/api';

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  services: string[];
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

export default function StaffScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'STYLIST',
    services: [],
  });

  const fetchStaff = async () => {
    try {
      const response = await providerApi.getStaff();
      if (response.error) {
        throw new Error(response.error);
      }
      setStaff(response.data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  };

  const toggleStaffActive = async (staffId: string) => {
    try {
      const member = staff.find(item => item.id === staffId);
      if (!member) return;

      const response = await providerApi.updateStaff(staffId, {
        active: !member.active,
      });
      if (response.error) {
        throw new Error(response.error);
      }

      setStaff(staff.map(item => 
        item.id === staffId 
          ? { ...item, active: !item.active }
          : item
      ));
    } catch (error) {
      console.error('Error updating staff status:', error);
      Alert.alert('Error', 'Failed to update staff member');
    }
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setNewStaff({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'STYLIST',
      services: [],
    });
    setModalVisible(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setNewStaff({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      services: member.services,
    });
    setModalVisible(true);
  };

  const handleSaveStaff = async () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email || !newStaff.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingStaff) {
        const response = await providerApi.updateStaff(editingStaff.id, {
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
        });
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setStaff(staff.map(member => 
            member.id === editingStaff.id 
              ? { ...member, ...response.data }
              : member
          ));
        }
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        const response = await providerApi.createStaff({
          firstName: newStaff.firstName,
          lastName: newStaff.lastName,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
          services: newStaff.services,
        });
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setStaff([...staff, response.data]);
        }
        Alert.alert('Success', 'Staff member added successfully');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving staff member:', error);
      Alert.alert('Error', 'Failed to save staff member');
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    Alert.alert(
      'Delete Staff Member',
      'Are you sure you want to delete this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await providerApi.deleteStaff(staffId);
              if (response.error) {
                throw new Error(response.error);
              }
              setStaff(staff.filter(member => member.id !== staffId));
              Alert.alert('Success', 'Staff member deleted successfully');
            } catch (error) {
              console.error('Error deleting staff member:', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STYLIST': return 'cut-outline';
      case 'NAIL_TECHNICIAN': return 'hand-left-outline';
      case 'MAKEUP_ARTIST': return 'color-palette-outline';
      case 'BARBER': return 'body-outline';
      case 'MANAGER': return 'people-outline';
      default: return 'person-outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STYLIST': return 'Stylist';
      case 'NAIL_TECHNICIAN': return 'Nail Technician';
      case 'MAKEUP_ARTIST': return 'Makeup Artist';
      case 'BARBER': return 'Barber';
      case 'MANAGER': return 'Manager';
      default: return role;
    }
  };

  const getServicesLabel = (services: string[]) => {
    if (services.length === 0) return 'No services assigned';
    return services.map(service => {
      switch (service) {
        case 'HAIRCUT': return 'Haircut';
        case 'BEARD_TRIM': return 'Beard Trim';
        case 'HAIR_STYLING': return 'Hair Styling';
        case 'NAILS': return 'Nails';
        case 'MAKEUP': return 'Makeup';
        default: return service;
      }
    }).join(', ');
  };

  const getAvailabilityLabel = (availability: any) => {
    const days = Object.keys(availability).filter(day => availability[day]);
    if (days.length === 0) return 'No availability set';
    return days.map(day => day.charAt(0) + day.slice(1).toLowerCase()).join(', ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
        <Text style={styles.loadingText}>Loading staff...</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Text style={styles.subtitle}>Manage your team members</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{staff.length}</Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{staff.filter(s => s.active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{staff.filter(s => !s.active).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStaff}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {staff.length > 0 ? (
          staff.map((member) => (
            <View key={member.id} style={styles.staffCard}>
              <View style={styles.staffInfo}>
                <View style={styles.avatarContainer}>
                  <Ionicons name={getRoleIcon(member.role)} size={24} color="#1A56DB" />
                </View>
                <View style={styles.staffDetails}>
                  <Text style={styles.staffName}>{member.firstName} {member.lastName}</Text>
                  <Text style={styles.staffRole}>{getRoleLabel(member.role)}</Text>
                  <Text style={styles.staffContact}>{member.email}</Text>
                  <Text style={styles.staffContact}>{member.phone}</Text>
                </View>
              </View>
              <View style={styles.staffActions}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>{member.active ? 'Active' : 'Inactive'}</Text>
                  <Switch
                    value={member.active}
                    onValueChange={() => toggleStaffActive(member.id)}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditStaff(member)}
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStaff(member.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.staffMeta}>
                <Text style={styles.metaLabel}>Services:</Text>
                <Text style={styles.metaValue}>{getServicesLabel(member.services)}</Text>
              </View>
              <View style={styles.staffMeta}>
                <Text style={styles.metaLabel}>Availability:</Text>
                <Text style={styles.metaValue}>{getAvailabilityLabel(member.availability)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No staff yet</Text>
            <Text style={styles.emptyText}>Add your first staff member to get started</Text>
          </View>
        )}
      </View>

      {/* Add/Edit Staff Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newStaff.firstName}
                    onChangeText={(text) => setNewStaff({ ...newStaff, firstName: text })}
                    placeholder="John"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={newStaff.lastName}
                    onChangeText={(text) => setNewStaff({ ...newStaff, lastName: text })}
                    placeholder="Doe"
                  />
                </View>
              </View>

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={newStaff.email}
                onChangeText={(text) => setNewStaff({ ...newStaff, email: text })}
                placeholder="john@example.com"
                keyboardType="email-address"
              />

              <Text style={styles.label}>Phone *</Text>
              <TextInput
                style={styles.input}
                value={newStaff.phone}
                onChangeText={(text) => setNewStaff({ ...newStaff, phone: text })}
                placeholder="+260 97 123 4567"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {['STYLIST', 'NAIL_TECHNICIAN', 'MAKEUP_ARTIST', 'BARBER', 'MANAGER'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.categoryChip,
                      newStaff.role === role && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewStaff({ ...newStaff, role })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newStaff.role === role && styles.categoryChipTextActive,
                    ]}>
                      {getRoleLabel(role)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveStaff}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1A56DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  staffContact: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  staffActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  staffMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginRight: 8,
    minWidth: 80,
  },
  metaValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalForm: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#1A56DB',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#1A56DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});