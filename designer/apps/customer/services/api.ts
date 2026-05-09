// API response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string') return envUrl.replace(/\/$/, '');

  // Web runs on the same machine as the backend in dev.
  if (Platform.OS === 'web') return 'http://localhost:3000/api/v1';

  // Native: derive dev machine IP from Expo hostUri (e.g. "192.168.1.10:8081")
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.hostUri;

  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : null;
  if (host) return `http://${host}:3000/api/v1`;

  // Last resort (will only work on simulators with port forwarding / same host)
  return 'http://localhost:3000/api/v1';
}

// Simple storage helper using AsyncStorage
export const AUTH_STORAGE_KEYS = {
  USER: 'zana_user',
  ACCESS_TOKEN: 'zana_access_token',
  REFRESH_TOKEN: 'zana_refresh_token',
} as const;

// API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get stored access token
  private async getAccessToken(): Promise<string | null> {
    try {
      const storage = AsyncStorage;
      return await storage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Store tokens
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await storage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Store user
  private async storeUser(user: User): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Get stored user
  async getUser(): Promise<User | null> {
    try {
      const storage = AsyncStorage;
      const userStr = await storage.getItem(AUTH_STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Clear all stored data
  private async clearStorage(): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.multiRemove([
        AUTH_STORAGE_KEYS.ACCESS_TOKEN,
        AUTH_STORAGE_KEYS.REFRESH_TOKEN,
        AUTH_STORAGE_KEYS.USER,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Make API request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string>),
        },
      });

      const raw = (await response.json()) as any;
      const data: ApiResponse<T> =
        raw && typeof raw === 'object' && 'data' in raw
          ? raw
          : ({ data: raw } as ApiResponse<T>);

      if (!response.ok) {
        // Handle token refresh if 401
        if (response.status === 401 && token) {
          // Token expired, try to refresh
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry request with new token
            return this.request<T>(endpoint, options);
          }
          await this.clearStorage();
        }

        return { error: (data as any).message || (data as any).error || 'Request failed' };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }

  // Refresh access token
  private async refreshToken(): Promise<boolean> {
    try {
      const storage = AsyncStorage;
      const refreshToken = await storage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json() as any;

      const payload = data?.data ?? data;
      if (response.ok && payload?.accessToken && payload?.refreshToken) {
        await this.storeTokens(payload.accessToken, payload.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Auth methods
  async register(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (result.data) {
      await this.storeTokens(result.data.accessToken, result.data.refreshToken);
      await this.storeUser(result.data.user);
    }
    
    return result;
  }

  async login(identifier: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const isEmail = identifier.includes('@');
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        [isEmail ? 'email' : 'phone']: identifier,
        password,
      }),
    });
    
    if (result.data) {
      await this.storeTokens(result.data.accessToken, result.data.refreshToken);
      await this.storeUser(result.data.user);
    }
    
    return result;
  }

  async logout(): Promise<void> {
    const storage = AsyncStorage;
    const refreshToken = await storage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    await this.clearStorage();
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/me');
  }

  // Venue methods
  async getVenues(params?: Record<string, any>): Promise<ApiResponse<any>> {
    const queryParams = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.request<any>(`/venues${queryParams ? `?${queryParams}` : ''}`);
  }

  async getVenue(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/venues/${id}`);
  }

  async getVenueAvailability(venueId: string, date: string, serviceId?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append('serviceId', serviceId);
    return this.request<any>(`/venues/${venueId}/availability?${params.toString()}`);
  }

  // Mobile Provider methods
  async getMobileProviders(params?: Record<string, any>): Promise<ApiResponse<any>> {
    const queryParams = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.request<any>(`/mobile-providers${queryParams ? `?${queryParams}` : ''}`);
  }

  async getMobileProvider(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/mobile-providers/${id}`);
  }

  async getMobileProviderAvailability(providerId: string, date: string, serviceId?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ date });
    if (serviceId) params.append('serviceId', serviceId);
    return this.request<any>(`/mobile-providers/${providerId}/availability?${params.toString()}`);
  }

  async getService(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/services/${id}`);
  }

  async getStaffMember(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/staff/${id}`);
  }

  // Service methods
  async getVenueServices(venueId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/venues/${venueId}/services`);
  }

  async getVenueStaff(venueId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/venues/${venueId}/staff`);
  }

  // Booking methods
  async createBooking(data: {
    serviceId: string;
    venueId?: string;
    mobileProviderId?: string;
    staffId?: string;
    date: string;
    startTime: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookings(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/bookings');
  }

  async getBooking(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/bookings/${id}`);
  }

  async cancelBooking(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/bookings/${id}/cancel`, { method: 'PATCH' });
  }

  // Review methods
  async createReview(data: {
    bookingId: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(body: { email?: string; phone?: string }): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async resetPassword(body: { token: string; password: string }): Promise<ApiResponse<{ message?: string }>> {
    return this.request<{ message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateProfile(patch: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }): Promise<ApiResponse<{ user: User }>> {
    const result = await this.request<{ user: User }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (result.data?.user) {
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(result.data.user));
      } catch {
        /* ignore */
      }
    }
    return result;
  }

  async getVenueReviews(venueId: string, limit?: number): Promise<ApiResponse<any[]>> {
    const q = limit ? `?limit=${limit}` : '';
    return this.request<any[]>(`/venues/${venueId}/reviews${q}`);
  }
}

// Export singleton instance
export const api = new ApiClient(resolveApiBaseUrl());
export default api;