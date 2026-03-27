import apiClient from '../utils/api.service';

export interface Category {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data.categories;
  },

  // Get category by ID
  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.category;
  },

  // Create category (Admin only)
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data.category;
  },

  // Update category (Admin only)
  updateCategory: async (id: string, categoryData: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data.category;
  },

  // Delete category (Admin only)
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};