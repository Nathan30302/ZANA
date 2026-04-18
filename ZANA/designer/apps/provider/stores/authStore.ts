import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface Venue {
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

export interface MobileProvider {
  id: string;
  bio: string;
  portfolioPhotos: string[];
  baseLat: number;
  baseLng: number;
  serviceRadius: number;
  status: string;
}

interface AuthState {
  user: User | null;
  venue: Venue | null;
  mobileProvider: MobileProvider | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, venue: Venue | null, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  restoreAuth: () => Promise<boolean>;
  updateVenue: (venue: Venue) => Promise<void>;
  setMobileProvider: (mobileProvider: MobileProvider | null) => Promise<void>;
}

const STORAGE_KEYS = {
  USER: '@provider_auth_user',
  VENUE: '@provider_venue',
  MOBILE_PROVIDER: '@provider_mobile_provider',
  ACCESS_TOKEN: '@provider_auth_accessToken',
  REFRESH_TOKEN: '@provider_auth_refreshToken',
};

const storage = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async multiRemove(keys: string[]): Promise<void> {
    await AsyncStorage.multiRemove(keys);
  },

  async multiGet(keys: string[]): Promise<[string, string][]> {
    const entries = await AsyncStorage.multiGet(keys);
    return entries.filter(([_, value]) => value !== '');
  },
};

export const useProviderAuthStore = create<AuthState>((set) => ({
  user: null,
  venue: null,
  mobileProvider: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user: User, venue: Venue | null, accessToken: string, refreshToken: string) => {
    try {
      await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      if (venue) {
        await storage.setItem(STORAGE_KEYS.VENUE, JSON.stringify(venue));
      }
      
      set({
        user,
        venue,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  },

  logout: async () => {
    try {
      await storage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.VENUE,
        STORAGE_KEYS.MOBILE_PROVIDER,
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
      
      set({
        user: null,
        venue: null,
        mobileProvider: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  restoreAuth: async () => {
    try {
      const stored = await storage.multiGet([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.VENUE,
        STORAGE_KEYS.MOBILE_PROVIDER,
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      const userEntry = stored.find(([key]) => key === STORAGE_KEYS.USER);
      const venueEntry = stored.find(([key]) => key === STORAGE_KEYS.VENUE);
      const mobileEntry = stored.find(([key]) => key === STORAGE_KEYS.MOBILE_PROVIDER);
      const tokenEntry = stored.find(([key]) => key === STORAGE_KEYS.ACCESS_TOKEN);
      const refreshEntry = stored.find(([key]) => key === STORAGE_KEYS.REFRESH_TOKEN);

      if (userEntry && tokenEntry && refreshEntry) {
        const user = JSON.parse(userEntry[1]) as User;
        const venue = venueEntry ? JSON.parse(venueEntry[1]) as Venue : null;
        const mobileProvider = mobileEntry ? JSON.parse(mobileEntry[1]) as MobileProvider : null;
        
        set({
          user,
          venue,
          mobileProvider,
          accessToken: tokenEntry[1],
          refreshToken: refreshEntry[1],
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Error restoring auth state:', error);
      set({ isLoading: false });
      return false;
    }
  },

  updateVenue: async (venue: Venue) => {
    try {
      await storage.setItem(STORAGE_KEYS.VENUE, JSON.stringify(venue));
      set({ venue });
    } catch (error) {
      console.error('Error updating venue:', error);
    }
  },

  setMobileProvider: async (mobileProvider: MobileProvider | null) => {
    try {
      if (mobileProvider) {
        await storage.setItem(STORAGE_KEYS.MOBILE_PROVIDER, JSON.stringify(mobileProvider));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.MOBILE_PROVIDER);
      }
      set({ mobileProvider });
    } catch (error) {
      console.error('Error updating mobile provider:', error);
    }
  },
}));