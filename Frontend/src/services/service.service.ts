import apiClient from '../utils/api.service';

export interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  providerName?: string;
  basePrice: number;
  duration: number;
  images: string[];
  features: string[];
  isPopular: boolean;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  providerId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | string;
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServicesResponse {
  services: Service[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface ServiceFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'popular' | 'rating';
  page?: number;
  limit?: number;
}

export const serviceService = {
  // Get all services with filters
  getServices: async (filters: ServiceFilters = {}): Promise<ServicesResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/services?${params.toString()}`);
    return response.data;
  },

  // Get popular services
  getPopularServices: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services/popular');
    return response.data.services;
  },

  // Get services by category
  getServicesByCategory: async (category: string): Promise<Service[]> => {
    const response = await apiClient.get(`/services/category/${category}`);
    return response.data.services;
  },

  // Get latest services
  getLatestServices: async (): Promise<Service[]> => {
    const response = await apiClient.get('/services/latest');
    return response.data.services;
  },

  // Get service by ID
  getServiceById: async (id: string): Promise<Service> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data.service;
  },

  // Create service (Service Provider only)
  createService: async (serviceData: Partial<Service>): Promise<Service> => {
    const response = await apiClient.post('/services', serviceData);
    return response.data.service;
  },

  // Update service (Service Provider owner only)
  updateService: async (id: string, serviceData: Partial<Service>): Promise<Service> => {
    const response = await apiClient.put(`/services/${id}`, serviceData);
    return response.data.service;
  },

  // Delete service (Service Provider owner only)
  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  }
};
