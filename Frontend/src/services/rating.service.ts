import apiClient from "../utils/api.service";

export interface RatingUser {
  _id?: string;
  name: string;
}

export interface Rating {
  _id: string;
  product: string;
  user: RatingUser | string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
  ratingId: string | null;
}

export interface UpsertRatingPayload {
  product: string;
  rating: number;
  comment: string;
}

export const ratingService = {
  getProductRatings: async (productId: string): Promise<Rating[]> => {
    const response = await apiClient.get(`/ratings/product/${productId}`);
    return response.data?.ratings || [];
  },

  getMyProductRating: async (productId: string): Promise<Rating | null> => {
    const response = await apiClient.get(`/ratings/product/${productId}/me`);
    return response.data?.rating || null;
  },

  getReviewEligibility: async (productId: string): Promise<ReviewEligibility> => {
    const response = await apiClient.get(`/ratings/product/${productId}/eligibility`);
    return response.data;
  },

  createRating: async (payload: UpsertRatingPayload): Promise<Rating> => {
    const response = await apiClient.post("/ratings", payload);
    return response.data?.rating;
  },

  updateRating: async (
    ratingId: string,
    payload: Omit<UpsertRatingPayload, "product">
  ): Promise<Rating> => {
    const response = await apiClient.put(`/ratings/${ratingId}`, payload);
    return response.data?.rating;
  },

  deleteRating: async (ratingId: string): Promise<void> => {
    await apiClient.delete(`/ratings/${ratingId}`);
  },
};
