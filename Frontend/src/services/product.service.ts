import apiClient from '../utils/api.service';

export interface Product {
  _id: string;
  providerId?: {
    _id: string;
    name: string;
    email: string;
  } | string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  isHot: boolean;
  isRecommended: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface ProductFilters {
  search?: string;
  category?: string;
  providerId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price-asc' | 'price-desc' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export const productService = {
  // Get all products with filters
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get hot products
  getHotProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products/hot');
    return response.data.products;
  },

  // Get recommended products
  getRecommendedProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products/recommended');
    return response.data.products;
  },

  // Get latest products
  getLatestProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products/latest');
    return response.data.products;
  },

  // Get product by ID
  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.product;
  },

  // Create product (Service Provider only)
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/products', productData);
    return response.data.product;
  },

  // Update product (Service Provider owner only)
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data.product;
  },

  // Delete product (Service Provider owner only)
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  }
};
