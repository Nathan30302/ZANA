import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zana_admin_access_token',
  REFRESH_TOKEN: 'zana_admin_refresh_token',
  USER: 'zana_admin_user',
};

class AdminApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error reading access token', error);
      return null;
    }
  }

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Error storing tokens', error);
    }
  }

  private async storeUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user', error);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers as Record<string, string>),
        },
      });

      const data = await response.json() as ApiResponse<T>;
      if (!response.ok) {
        return { error: (data as any).message || (data as any).error || 'Request failed' };
      }
      return data;
    } catch (error) {
      console.error('Network request failed', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      await this.storeTokens(response.data.accessToken, response.data.refreshToken);
      await this.storeUser(response.data.user);
    }

    return response;
  }

  async getQueue(): Promise<ApiResponse<any>> {
    return this.request('/admin/queue');
  }

  async updateVenueStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/venues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateMobileProviderStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/mobile-providers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const adminApi = new AdminApiClient('http://localhost:3000/api/v1');
