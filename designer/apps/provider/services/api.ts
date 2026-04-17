// API response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

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

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
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

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  amount: number;
  notes: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  active: boolean;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  services: string[];
  availability: any;
}
const getDayIndex = (day: string) => {
  switch (day.toLowerCase()) {
    case 'monday': return 1;
    case 'tuesday': return 2;
    case 'wednesday': return 3;
    case 'thursday': return 4;
    case 'friday': return 5;
    case 'saturday': return 6;
    case 'sunday': return 0;
    default: return 0;
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple storage helper using AsyncStorage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zana_provider_access_token',
  REFRESH_TOKEN: 'zana_provider_refresh_token',
  USER: 'zana_provider_user',
  VENUE: 'zana_provider_venue',
};

// API client
class ProviderApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Get stored access token
  private async getAccessToken(): Promise<string | null> {
    try {
      const storage = AsyncStorage;
      return await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  // Store tokens
  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  // Store user
  private async storeUser(user: User): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  // Get stored user
  async getUser(): Promise<User | null> {
    try {
      const storage = AsyncStorage;
      const userStr = await storage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Store venue
  private async storeVenue(venue: Venue): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.setItem(STORAGE_KEYS.VENUE, JSON.stringify(venue));
    } catch (error) {
      console.error('Error storing venue:', error);
    }
  }

  // Get stored venue
  async getVenue(): Promise<Venue | null> {
    try {
      const storage = AsyncStorage;
      const venueStr = await storage.getItem(STORAGE_KEYS.VENUE);
      return venueStr ? JSON.parse(venueStr) : null;
    } catch (error) {
      console.error('Error getting venue:', error);
      return null;
    }
  }

  // Clear all stored data
  private async clearStorage(): Promise<void> {
    try {
      const storage = AsyncStorage;
      await storage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.VENUE,
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

      const data = await response.json() as ApiResponse<T>;

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
      const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json() as any;

      if (response.ok && data.accessToken && data.refreshToken) {
        await this.storeTokens(data.accessToken, data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        userType: 'PROVIDER',
      }),
    });
    
    if (result.data) {
      await this.storeTokens(result.data.accessToken, result.data.refreshToken);
      await this.storeUser(result.data.user);
      
      // Get and store venue
      const venueResult = await this.getVenueProfile();
      if (venueResult.data) {
        await this.storeVenue(venueResult.data);
      }
    }
    
    return result;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    venueName: string;
    venueCategory: string;
    venueAddress: string;
    venueCity: string;
  }): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userType: 'PROVIDER',
      }),
    });
    
    if (result.data) {
      await this.storeTokens(result.data.accessToken, result.data.refreshToken);
      await this.storeUser(result.data.user);
      
      // Get and store venue
      const venueResult = await this.getVenueProfile();
      if (venueResult.data) {
        await this.storeVenue(venueResult.data);
      }
    }
    
    return result;
  }

  async logout(): Promise<void> {
    const storage = AsyncStorage;
    const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
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

  // Dashboard methods
  async getDashboardStats(): Promise<ApiResponse<{
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    todayRevenue: number;
    totalRevenue: number;
  }>> {
    return this.request('/dashboard/stats');
  }

  async getRecentBookings(): Promise<ApiResponse<Booking[]>> {
    return this.request<Booking[]>('/dashboard/recent-bookings');
  }

  // Booking methods
  async getBookings(params?: Record<string, any>): Promise<ApiResponse<Booking[]>> {
    const queryParams = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.request<Booking[]>(`/bookings${queryParams ? `?${queryParams}` : ''}`);
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async confirmBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}/confirm`, { method: 'PATCH' });
  }

  async cancelBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' });
  }

  async completeBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}/complete`, { method: 'PATCH' });
  }

  // Service methods
  async getServices(): Promise<ApiResponse<Service[]>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<Service[]>(`/venues/${venue.id}/services`);
  }

  async createService(data: {
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
  }): Promise<ApiResponse<Service>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<Service>(`/venues/${venue.id}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: Partial<Service>): Promise<ApiResponse<Service>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<Service>(`/venues/${venue.id}/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string): Promise<ApiResponse<any>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<any>(`/venues/${venue.id}/services/${id}`, { method: 'DELETE' });
  }

  // Staff methods
  async getStaff(): Promise<ApiResponse<StaffMember[]>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<StaffMember[]>(`/venues/${venue.id}/staff`);
  }

  async createStaff(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    services: string[];
  }): Promise<ApiResponse<StaffMember>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<StaffMember>(`/venues/${venue.id}/staff/invite`, {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        phone: data.phone,
        title: data.role,
      }),
    });
  }

  async updateStaff(staffId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    active?: boolean;
  }): Promise<ApiResponse<StaffMember>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<StaffMember>(`/venues/${venue.id}/staff/${staffId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStaff(id: string): Promise<ApiResponse<any>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<any>(`/venues/${venue.id}/staff/${id}`, { method: 'DELETE' });
  }

  // Availability methods
  async getVenueAvailability(): Promise<ApiResponse<any>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }
    return this.request<any>(`/opening-hours/venues/${venue.id}/hours`);
  }

  async updateVenueAvailability(data: any): Promise<ApiResponse<any>> {
    const venue = await this.getVenue();
    if (!venue) {
      return { error: 'Venue not loaded' };
    }

    const hours = Array.isArray(data)
      ? data.map((item: any) => ({
          dayOfWeek: getDayIndex(item.day),
          openTime: item.slots?.[0]?.startTime || '09:00',
          closeTime: item.slots?.[0]?.endTime || '17:00',
          isClosed: item.open === false,
        }))
      : data;

    return this.request<any>(`/opening-hours/venues/${venue.id}/hours`, {
      method: 'POST',
      body: JSON.stringify({ hours }),
    });
  }

  async getStaffAvailability(staffId: string): Promise<ApiResponse<any>> {
    return this.request(`/staff/${staffId}/availability`);
  }

  async updateStaffAvailability(staffId: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/staff/${staffId}/availability`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Venue profile methods
  async getVenueProfile(): Promise<ApiResponse<Venue>> {
    return this.request<Venue>('/venue/profile');
  }

  async updateVenueProfile(data: Partial<Venue>): Promise<ApiResponse<Venue>> {
    return this.request<Venue>('/venue/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadCoverPhoto(imageBase64: string): Promise<ApiResponse<Venue>> {
    try {
      const response = await this.request<Venue>('/venue/cover-photo', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
      });

      if (response.data) {
        await this.storeVenue(response.data);
      }

      return response;
    } catch (error) {
      console.error('Upload error:', error);
      return { error: 'Failed to upload photo' };
    }
  }
}

// Export singleton instance
export const providerApi = new ProviderApiClient('http://localhost:3000/api/v1');
export default providerApi;