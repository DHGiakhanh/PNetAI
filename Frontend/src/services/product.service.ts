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
  status: 'active' | 'inactive';
  isDeleted?: boolean;
  deletedAt?: string | null;
  isHot: boolean;
  isRecommended: boolean;
  tags: string[];
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
  tags?: string;
}

export const productService = {
  normalizeProductResponse: (payload: any): Product => {
    return (payload?.product ?? payload) as Product;
  },

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
    return productService.normalizeProductResponse(response.data);
  },

  // Get provider-owned products, including inactive items but excluding soft-deleted ones
  getProviderProducts: async (search?: string): Promise<{ products: Product[] }> => {
    const response = await apiClient.get('/admin/products', {
      params: search ? { search } : {},
    });
    return response.data;
  },

  // Create product (Service Provider only)
  createProduct: async (productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/products', productData);
    return productService.normalizeProductResponse(response.data);
  },

  // Update product (Service Provider owner only)
  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return productService.normalizeProductResponse(response.data);
  },

  // Delete product (Service Provider owner only)
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  // Toggle product visibility (Service Provider owner only)
  updateProductStatus: async (id: string, status: Product['status']): Promise<Product> => {
    try {
      const response = await apiClient.patch(`/products/${id}/status`, { status });
      return productService.normalizeProductResponse(response.data);
    } catch (error: any) {
      const statusCode = error?.response?.status;
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }

      const response = await apiClient.put(`/products/${id}`, { status });
      return productService.normalizeProductResponse(response.data);
    }
  },

  // Upload product image (Service Provider only)
  uploadProductImage: async (file: File): Promise<{ url: string; publicId?: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post("/products/upload-image", formData);
    return response.data;
  }
};
