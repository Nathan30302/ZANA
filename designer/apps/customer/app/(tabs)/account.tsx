import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { colors, typography, spacing, radius, shadows } from '../../constants/theme';
import { ThemedCard } from '../../components/ThemedCard';

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  if (!user) {
    return (
      <ScrollView style={[styles.container, { paddingHorizontal: spacing.lg }]} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Welcome to ZANA</Text>
          <Text style={styles.authSubtitle}>Log in or sign up to book appointments and manage your activity</Text>

          <TouchableOpacity style={[styles.authButton, styles.appleButton]} activeOpacity={0.85} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="logo-apple" size={18} color="#fff" />
            <Text style={styles.authButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.authButton, styles.facebookButton]} activeOpacity={0.85} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="logo-facebook" size={18} color="#fff" />
            <Text style={styles.authButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.authButton, styles.googleButton]} activeOpacity={0.85} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.authButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.authButton, styles.emailButton]} activeOpacity={0.85} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.authButtonText, { color: colors.primary }]}>Continue with Email</Text>
          </TouchableOpacity>

          <View style={styles.authFooter}>
            <Text style={styles.footerText}>Have a business account?</Text>
            <TouchableOpacity onPress={handleProfessionalSignIn} activeOpacity={0.8}>
              <Text style={styles.footerLink}> Sign in as a professional</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  async function handleProfessionalSignIn() {
    const url = 'https://zana.zm/provider';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Professional sign in',
          'Open the ZANA Provider portal or visit zana.zm/provider to create a professional account.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to open link',
        'Please visit zana.zm/provider or install the ZANA Provider app.'
      );
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.push('/(auth)/login');
          },
        },
      ]
    );
  };

  

  const menuItems = [
    {
      id: 'professional',
      title: 'Join as a Professional',
      icon: 'briefcase-outline',
      onPress: handleProfessionalSignIn,
    },
    {
      id: 'profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => router.push('/account/edit'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => router.push('/account/notifications'),
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: 'card-outline',
      onPress: () => Alert.alert('Coming Soon', 'Payment method management will be available soon.'),
    },
    {
      id: 'addresses',
      title: 'Saved Addresses',
      icon: 'location-outline',
      onPress: () => Alert.alert('Coming Soon', 'Address management will be available soon.'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => router.push('/account/help'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => Alert.alert('Privacy Policy', 'Your privacy is important to us. Full policy available at zana.zm/privacy'),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text-outline',
      onPress: () => Alert.alert('Terms of Service', 'Full terms available at zana.zm/terms'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.userName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.userEmail}>{user.email || '—'}</Text>
        <Text style={styles.userPhone}>{user.phone || '—'}</Text>
        {user.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
        {/* Business account link */}
        <TouchableOpacity onPress={handleProfessionalSignIn} style={styles.businessLink} activeOpacity={0.8}>
          <Text style={styles.businessLinkText}>Have a business account? Sign in as a professional</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>ZANA v1.0.0</Text>
        <Text style={styles.versionSubtext}>Built for Lusaka • Designed for Zambia</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  profileHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  },
  userName: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  userEmail: {
    ...typography.smallMedium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
  },
  userPhone: {
    ...typography.smallMedium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  verifiedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  verifiedText: {
    color: '#FFFFFF',
    ...typography.small,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bg.primary,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  menuContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.bg.primary,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(26, 86, 219, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuItemTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontWeight: '500',
  },
  logoutContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    backgroundColor: colors.bg.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...shadows.sm,
    gap: spacing.sm,
  },
  logoutButtonText: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '600',
  },
  versionContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  versionText: {
    ...typography.small,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  versionSubtext: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  businessLink: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  businessLinkText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  authCard: {
    backgroundColor: colors.bg.primary,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  authTitle: {
    ...typography.h2,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  authSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  emailButton: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  authButtonText: {
    color: '#FFFFFF',
    marginLeft: spacing.sm,
    fontWeight: '700',
  },
  authFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});