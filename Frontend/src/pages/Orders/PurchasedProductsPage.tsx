import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";

type OrderItem = {
  product?: {
    _id?: string;
    images?: string[];
  } | string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
};

type PurchasedProduct = {
  key: string;
  productId?: string;
  orderId: string; // Store most recent order ID
  name: string;
  quantity: number;
  totalSpent: number;
  image?: string;
  lastPurchasedAt: string;
  canReview: boolean;
  status: string;
};

export default function PurchasedProductsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/orders/history");
      setOrders(response.data?.orders || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load purchased products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReturnRequest = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to request a return for this item? This will notify our administrators.")) return;
    try {
      await apiClient.post(`/orders/${orderId}/return-request`);
      toast.success("Return request submitted successfully");
      fetchOrders(); // Refresh status
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Action failed");
    }
  };

  const purchasedProducts = useMemo<PurchasedProduct[]>(() => {
    const map = new Map<string, PurchasedProduct>();

    for (const order of orders) {
      for (const item of order.items || []) {
        const productObj = typeof item.product === "object" ? item.product : undefined;
        const productId = productObj?._id;
        const key = productId || item.name;
        const existed = map.get(key);
        const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
        const delivered = order.status === "delivered" || order.status === "success";

        if (!existed) {
          map.set(key, {
            key,
            productId,
            orderId: order._id,
            name: item.name,
            quantity: Number(item.quantity || 0),
            totalSpent: subtotal,
            image: productObj?.images?.[0],
            lastPurchasedAt: order.createdAt,
            canReview: delivered,
            status: order.status,
          });
        } else {
          existed.quantity += Number(item.quantity || 0);
          existed.totalSpent += subtotal;
          existed.canReview = existed.canReview || delivered;
          if (new Date(order.createdAt) > new Date(existed.lastPurchasedAt)) {
            existed.lastPurchasedAt = order.createdAt;
            existed.orderId = order._id;
            existed.status = order.status;
          }
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime()
    );
  }, [orders]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Purchased Products</h1>
        <p className="mt-2 text-sm text-muted">
          Products you have purchased from the shop. Delivered items can be reviewed or returned.
        </p>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted animate-pulse">
              Consulting Ledger...
            </p>
          ) : purchasedProducts.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted">
              No purchased products yet.
            </p>
          ) : (
            purchasedProducts.map((product) => (
              <article
                key={product.key}
                className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-warm overflow-hidden">
                  <img
                    src={
                      product.image ||
                      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=600&auto=format&fit=crop"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex justify-between items-start">
                    <p className="line-clamp-2 text-sm font-semibold text-ink flex-1">{product.name}</p>
                    {product.status === 'return_requested' && (
                       <span className="ml-2 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black uppercase whitespace-nowrap">
                         Refund Pending
                       </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">Quantity {product.quantity}</p>
                  <p className="text-sm font-semibold text-brown">{(product.totalSpent || 0).toLocaleString()} VND</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                    Purchased: {new Date(product.lastPurchasedAt).toLocaleDateString()}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-3">
                    {product.productId && (
                      <Link
                        to={`/products/${product.productId}`}
                        className="flex-1 text-center rounded-full border border-sand px-3 py-2 text-[10px] font-black uppercase tracking-widest text-ink hover:bg-warm transition-all"
                      >
                        Details
                      </Link>
                    )}
                    {product.canReview && (
                      <Link
                        to={`/products/${product.productId}#reviews`}
                        className="flex-1 text-center rounded-full bg-ink text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-brown transition-all shadow-lg shadow-ink/20"
                      >
                        Review
                      </Link>
                    )}
                    {product.status !== 'return_requested' && (
                       <button
                         onClick={() => handleReturnRequest(product.orderId)}
                         className="w-full rounded-full border border-rose-200 text-rose-600 bg-rose-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all mt-1"
                       >
                         Request Return
                       </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
