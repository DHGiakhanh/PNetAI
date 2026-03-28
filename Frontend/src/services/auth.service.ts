import apiClient from '../utils/api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  saleCode?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  saleCode?: string;
  role?: string;
  createdAt: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/user/profile');
    const user = response.data?.user ?? {};
    return {
      id: user.id ?? user._id ?? "",
      email: user.email ?? "",
      name: user.name ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
      saleCode: user.saleCode ?? "",
      role: user.role ?? "",
      createdAt: user.createdAt ?? "",
    };
  },

  updateProfile: async (data: Partial<Pick<UserProfile, 'name' | 'phone' | 'address'>>) => {
    const response = await apiClient.put('/user/profile', data);
    return response.data?.user;
  },
};
