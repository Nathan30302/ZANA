import { create } from 'zustand';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  restoreAuth: () => Promise<boolean>;
}

// Simple in-memory storage (replace with AsyncStorage when needed)
const storage = {
  data: new Map<string, string>(),
  
  async setItem(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  },
  
  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  },
  
  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => this.data.delete(key));
  },
  
  async multiGet(keys: string[]): Promise<[string, string][]> {
    return keys
      .map(key => [key, this.data.get(key) || ''])
      .filter(([_, value]) => value !== '') as [string, string][];
  },
};

const STORAGE_KEYS = {
  USER: '@auth_user',
  ACCESS_TOKEN: '@auth_accessToken',
  REFRESH_TOKEN: '@auth_refreshToken',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (user: User, accessToken: string, refreshToken: string) => {
    try {
      await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      set({
        user,
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
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
      
      set({
        user: null,
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
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      const userEntry = stored.find(([key]) => key === STORAGE_KEYS.USER);
      const tokenEntry = stored.find(([key]) => key === STORAGE_KEYS.ACCESS_TOKEN);
      const refreshEntry = stored.find(([key]) => key === STORAGE_KEYS.REFRESH_TOKEN);

      if (userEntry && tokenEntry && refreshEntry) {
        const user = JSON.parse(userEntry[1]) as User;
        set({
          user,
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
}));