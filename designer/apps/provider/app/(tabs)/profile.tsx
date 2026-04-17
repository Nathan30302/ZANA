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
  TextInput,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { providerApi } from '../../services/api';

interface VenueProfile {
  id: string;
  name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  coverPhoto: string;
  photos: string[];
  amenities: string[];
  active: boolean;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<VenueProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editProfile, setEditProfile] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    amenities: [],
  });

  const fetchProfile = async () => {
    try {
      const response = await providerApi.getVenueProfile();
      if (response.error) {
        throw new Error(response.error);
      }

      const venue = response.data;
      if (venue) {
        setProfile(venue);
        setEditProfile({
          name: venue.name || '',
          description: venue.description || '',
          category: venue.category || '',
          phone: venue.phone || '',
          email: venue.email || '',
          address: venue.address || '',
          city: venue.city || '',
          amenities: venue.amenities || [],
        });
      } else {
        throw new Error('Venue profile not found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await providerApi.updateVenueProfile(editProfile);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setProfile(response.data);
        setEditProfile({
          name: response.data.name || '',
          description: response.data.description || '',
          category: response.data.category || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          address: response.data.address || '',
          city: response.data.city || '',
          amenities: response.data.amenities || [],
        });
      }

      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangeCoverPhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert('Error', 'Failed to get image data');
          return;
        }

        // Upload the image
        const response = await providerApi.uploadCoverPhoto(asset.base64);
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setProfile(response.data);
          Alert.alert('Success', 'Cover photo updated successfully');
        }
      }
    } catch (error) {
      console.error('Error changing cover photo:', error);
      Alert.alert('Error', 'Failed to update cover photo');
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (profile) {
      setEditProfile({
        name: profile.name,
        description: profile.description,
        category: profile.category,
        phone: profile.phone,
        email: profile.email,
        address: profile.address,
        city: profile.city,
        amenities: profile.amenities,
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (editProfile.amenities.includes(amenity)) {
      setEditProfile({
        ...editProfile,
        amenities: editProfile.amenities.filter(a => a !== amenity),
      });
    } else {
      setEditProfile({
        ...editProfile,
        amenities: [...editProfile.amenities, amenity],
      });
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'WIFI': return 'wifi-outline';
      case 'PARKING': return 'car-outline';
      case 'AIR_CONDITIONING': return 'snow-outline';
      case 'WHEELCHAIR_ACCESS': return 'accessibility-outline';
      default: return 'checkmark-circle-outline';
    }
  };

  const getAmenityLabel = (amenity: string) => {
    switch (amenity) {
      case 'WIFI': return 'Wi-Fi';
      case 'PARKING': return 'Parking';
      case 'AIR_CONDITIONING': return 'Air Conditioning';
      case 'WHEELCHAIR_ACCESS': return 'Wheelchair Access';
      default: return amenity;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'SALON': return 'Salon';
      case 'BARBERSHOP': return 'Barbershop';
      case 'NAIL_STUDIO': return 'Nail Studio';
      case 'MAKEUP_STUDIO': return 'Makeup Studio';
      case 'SPA': return 'Spa';
      default: return category;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A56DB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
        <Text style={styles.title}>Business Profile</Text>
        <Text style={styles.subtitle}>Manage your business information</Text>
      </View>

      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: profile?.coverPhoto || 'https://via.placeholder.com/800x400' }}
          style={styles.coverImage}
        />
        <TouchableOpacity style={styles.editImageButton} onPress={handleChangeCoverPhoto}>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editImageText}>Change Cover</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name}</Text>
            <Text style={styles.profileCategory}>{getCategoryLabel(profile?.category || '')}</Text>
            <Text style={styles.profileAddress}>{profile?.address}, {profile?.city}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{profile?.active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>120</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>K 8,500</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      {/* Amenities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {profile?.amenities.map((amenity, index) => (
            <View key={index} style={styles.amenityItem}>
              <Ionicons name={getAmenityIcon(amenity)} size={24} color="#1A56DB" />
              <Text style={styles.amenityLabel}>{getAmenityLabel(amenity)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {profile?.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.photo} />
          ))}
          <TouchableOpacity style={styles.addPhotoButton}>
            <Ionicons name="add-circle-outline" size={40} color="#1A56DB" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>{profile?.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>{profile?.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <Text style={styles.contactText}>{profile?.address}, {profile?.city}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>{profile?.description}</Text>
        </View>
      </View>

      {/* Edit Button */}
      {!editing ? (
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => setEditing(true)}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelEdit}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSaveProfile}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
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
  coverContainer: {
    position: 'relative',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  profileCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  profileAddress: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  amenityLabel: {
    fontSize: 14,
    color: '#374151',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A56DB',
    borderStyle: 'dashed',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#1A56DB',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
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