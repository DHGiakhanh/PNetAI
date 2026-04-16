import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import { formatVnd } from "@/utils/currency";

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
  name: string;
  quantity: number;
  totalSpent: number;
  image?: string;
  lastPurchasedAt: string;
  canReview: boolean;
};

export default function PurchasedProductsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchOrders();
  }, []);

  const purchasedProducts = useMemo<PurchasedProduct[]>(() => {
    const map = new Map<string, PurchasedProduct>();

    for (const order of orders) {
      for (const item of order.items || []) {
        const productObj = typeof item.product === "object" ? item.product : undefined;
        const productId = productObj?._id;
        const key = productId || item.name;
        const existed = map.get(key);
        const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
        const delivered = order.status === "delivered";

        if (!existed) {
          map.set(key, {
            key,
            productId,
            name: item.name,
            quantity: Number(item.quantity || 0),
            totalSpent: subtotal,
            image: productObj?.images?.[0],
            lastPurchasedAt: order.createdAt,
            canReview: delivered,
          });
        } else {
          existed.quantity += Number(item.quantity || 0);
          existed.totalSpent += subtotal;
          existed.canReview = existed.canReview || delivered;
          if (new Date(order.createdAt) > new Date(existed.lastPurchasedAt)) {
            existed.lastPurchasedAt = order.createdAt;
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
          Products you have purchased from the shop. Delivered items can be reviewed.
        </p>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted">
              Loading products...
            </p>
          ) : purchasedProducts.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted">
              No purchased products yet.
            </p>
          ) : (
            purchasedProducts.map((product) => (
              <article
                key={product.key}
                className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm"
              >
                <div className="aspect-[4/3] bg-warm">
                  <img
                    src={
                      product.image ||
                      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=600&auto=format&fit=crop"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{product.name}</p>
                  <p className="text-xs text-muted">Quantity {product.quantity}</p>
                  <p className="text-sm font-semibold text-brown">{formatVnd(product.totalSpent)}</p>
                  <p className="text-xs text-muted">
                    Last purchased: {new Date(product.lastPurchasedAt).toLocaleDateString()}
                  </p>

                  {product.productId ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        to={`/products/${product.productId}`}
                        className="inline-flex rounded-full border border-sand px-3 py-2 text-xs font-semibold text-ink hover:bg-warm"
                      >
                        View product
                      </Link>
                      <Link
                        to={`/products/${product.productId}#reviews`}
                        className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold ${
                          product.canReview
                            ? "bg-brown text-white hover:bg-brown-dark"
                            : "border border-sand text-muted hover:bg-warm"
                        }`}
                      >
                        {product.canReview ? "Write review" : "Review after delivery"}
                      </Link>
                    </div>
                  ) : (
                    <p className="pt-2 text-xs text-muted">
                      Product details are no longer available for this item.
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
