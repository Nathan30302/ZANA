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

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
}

export default function ServicesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: 'HAIRCUT',
  });

  const fetchServices = async () => {
    try {
      const response = await providerApi.getServices();
      if (response.error) {
        throw new Error(response.error);
      }
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const toggleServiceActive = async (serviceId: string) => {
    try {
      const existingService = services.find(service => service.id === serviceId);
      if (!existingService) return;

      const response = await providerApi.updateService(serviceId, {
        active: !existingService.active,
      });
      if (response.error) {
        throw new Error(response.error);
      }

      setServices(services.map(service => 
        service.id === serviceId 
          ? { ...service, active: !service.active }
          : service
      ));
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'Failed to update service');
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setNewService({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: 'HAIRCUT',
    });
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
    });
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!newService.name || !newService.price || !newService.duration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        name: newService.name,
        description: newService.description,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration, 10),
        category: newService.category,
      };

      if (editingService) {
        const response = await providerApi.updateService(editingService.id, payload);
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setServices(services.map(service => 
            service.id === editingService.id 
              ? response.data
              : service
          ));
        }
        Alert.alert('Success', 'Service updated successfully');
      } else {
        const response = await providerApi.createService(payload);
        if (response.error) {
          throw new Error(response.error);
        }
        if (response.data) {
          setServices([...services, response.data]);
        }
        Alert.alert('Success', 'Service added successfully');
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service');
    }
  };

  const handleDeleteService = (serviceId: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await providerApi.deleteService(serviceId);
              if (response.error) {
                throw new Error(response.error);
              }
              setServices(services.filter(service => service.id !== serviceId));
              Alert.alert('Success', 'Service deleted successfully');
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HAIRCUT': return 'cut-outline';
      case 'BEARD_TRIM': return 'body-outline';
      case 'HAIR_STYLING': return 'sparkles-outline';
      case 'NAILS': return 'hand-left-outline';
      case 'MAKEUP': return 'color-palette-outline';
      case 'BRAIDING': return 'layers-outline';
      case 'WEAVE': return 'ribbon-outline';
      case 'SHAVE': return 'scan-outline';
      case 'EYEBROWS': return 'eye-outline';
      default: return 'cut-outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'HAIRCUT': return 'Haircut';
      case 'BEARD_TRIM': return 'Beard Trim';
      case 'HAIR_STYLING': return 'Hair Styling';
      case 'NAILS': return 'Nails';
      case 'MAKEUP': return 'Makeup';
      case 'BRAIDING': return 'Braiding';
      case 'WEAVE': return 'Weave';
      case 'SHAVE': return 'Shave';
      case 'EYEBROWS': return 'Eyebrows';
      default: return category;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
        <Text style={styles.loadingText}>Loading services...</Text>
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
        <Text style={styles.title}>Services</Text>
        <Text style={styles.subtitle}>Manage your service catalog</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{services.length}</Text>
          <Text style={styles.statLabel}>Total Services</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{services.filter(s => s.active).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{services.filter(s => !s.active).length}</Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service List</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Service</Text>
          </TouchableOpacity>
        </View>

        {services.length > 0 ? (
          services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceIconContainer}>
                <Ionicons name={getCategoryIcon(service.category)} size={24} color="#1A56DB" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription} numberOfLines={1}>
                  {service.description || 'No description'}
                </Text>
                <View style={styles.serviceMeta}>
                  <Text style={styles.servicePrice}>K {service.price}</Text>
                  <Text style={styles.serviceDuration}>{service.duration} min</Text>
                  <Text style={styles.serviceCategory}>{getCategoryLabel(service.category)}</Text>
                </View>
              </View>
              <View style={styles.serviceActions}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>{service.active ? 'Active' : 'Inactive'}</Text>
                  <Switch
                    value={service.active}
                    onValueChange={() => toggleServiceActive(service.id)}
                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.actionButtonRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditService(service)}
                  >
                    <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteService(service.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cut-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No services yet</Text>
            <Text style={styles.emptyText}>Add your first service to get started</Text>
          </View>
        )}
      </View>

      {/* Add/Edit Service Modal */}
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
                {editingService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Service Name *</Text>
              <TextInput
                style={styles.input}
                value={newService.name}
                onChangeText={(text) => setNewService({ ...newService, name: text })}
                placeholder="e.g., Haircut"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newService.description}
                onChangeText={(text) => setNewService({ ...newService, description: text })}
                placeholder="Describe the service"
                multiline
                numberOfLines={3}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Price (K) *</Text>
                  <TextInput
                    style={styles.input}
                    value={newService.price}
                    onChangeText={(text) => setNewService({ ...newService, price: text })}
                    placeholder="150"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Duration (min) *</Text>
                  <TextInput
                    style={styles.input}
                    value={newService.duration}
                    onChangeText={(text) => setNewService({ ...newService, duration: text })}
                    placeholder="45"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {['HAIRCUT', 'BEARD_TRIM', 'HAIR_STYLING', 'BRAIDING', 'WEAVE', 'NAILS', 'MAKEUP', 'EYEBROWS'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newService.category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewService({ ...newService, category: cat })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newService.category === cat && styles.categoryChipTextActive,
                    ]}>
                      {getCategoryLabel(cat)}
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
                onPress={handleSaveService}
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
  serviceCard: {
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
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  serviceActions: {
    alignItems: 'flex-end',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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