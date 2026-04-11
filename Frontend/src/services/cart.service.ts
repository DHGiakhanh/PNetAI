import apiClient from "../utils/api.service";

export type CartProduct = {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  stock?: number;
};

export type CartItem = {
  product: string | CartProduct;
  quantity: number;
  price: number;
};

export type Cart = {
  _id?: string;
  user?: string;
  items: CartItem[];
  totalAmount: number;
};

export const cartService = {
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get("/cart");
    return response.data?.cart;
  },

  addToCart: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await apiClient.post("/cart/add", { productId, quantity });
    return response.data?.cart;
  },

  updateCartItem: async (productId: string, quantity: number): Promise<Cart> => {
    const response = await apiClient.put(`/cart/update/${productId}`, { productId, quantity });
    return response.data?.cart;
  },

  removeCartItem: async (productId: string): Promise<Cart> => {
    const response = await apiClient.delete(`/cart/remove/${productId}`);
    return response.data?.cart;
  },
};
