import apiClient from "@/utils/api.service";

export type ProviderOrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export interface ProviderOrderItem {
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
  category: string;
  lineTotal: number;
}

export interface ProviderOrder {
  _id: string;
  status: ProviderOrderStatus;
  paymentMethod: "COD" | "PAYOS";
  paymentStatus: string;
  totalAmount: number;
  providerSubtotal: number;
  providerItemCount: number;
  providerItems: ProviderOrderItem[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  hasForeignItems: boolean;
  canManageStatus: boolean;
  payos?: {
    orderCode?: number;
    status?: string;
  } | null;
}

export interface ProviderOrdersResponse {
  orders: ProviderOrder[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface ProviderOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const orderService = {
  getProviderOrders: async (params: ProviderOrdersQuery = {}): Promise<ProviderOrdersResponse> => {
    const response = await apiClient.get("/orders/provider/orders", { params });
    return response.data;
  },

  getProviderOrderById: async (id: string): Promise<ProviderOrder> => {
    const response = await apiClient.get(`/orders/provider/orders/${id}`);
    return response.data.order;
  },

  updateProviderOrderStatus: async (id: string, status: ProviderOrderStatus): Promise<ProviderOrder> => {
    const response = await apiClient.patch(`/orders/provider/orders/${id}/status`, { status });
    return response.data.order;
  },
};
