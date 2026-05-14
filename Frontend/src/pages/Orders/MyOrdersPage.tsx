import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import apiClient from "@/utils/api.service";
import { formatVnd } from "@/utils/currency";

type OrderItem = {
  product?: {
    _id?: string;
    images?: string[];
    name?: string;
  } | string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "return_requested";
  paymentMethod: "COD" | "PAYOS";
  paymentStatus: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending approval", className: "bg-amber-50 text-amber-700 border-amber-100" },
  processing: { label: "Preparing", className: "bg-sky-50 text-sky-700 border-sky-100" },
  shipped: { label: "Shipping", className: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  delivered: { label: "Done", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700 border-rose-100" },
  return_requested: { label: "Return requested", className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100" },
};

const STEPS = [
  { status: "pending", label: "Placed", icon: Clock3 },
  { status: "processing", label: "Accepted", icon: PackageCheck },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Done", icon: CheckCircle2 },
];

const statusIndex = (status: string) => STEPS.findIndex((step) => step.status === status);

const getProductId = (item: OrderItem) => {
  return typeof item.product === "object" ? item.product?._id : item.product;
};

const getProductImage = (item: OrderItem) => {
  return typeof item.product === "object" ? item.product?.images?.[0] : undefined;
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/orders/history");
      setOrders(response.data?.orders || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReturnRequest = async (orderId: string) => {
    if (!window.confirm("Request a return for this order? Our admin team will review it.")) return;

    try {
      await apiClient.post(`/orders/${orderId}/return-request`);
      toast.success("Return request submitted.");
      fetchOrders();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not request a return.");
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold italic text-ink">My Orders</h1>
            <p className="mt-2 text-sm text-muted">
              Track purchased orders and review delivered products.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex rounded-full border border-sand bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-ink transition hover:bg-warm"
          >
            Continue Shopping
          </Link>
        </div>

        <section className="mt-6 space-y-5">
          {loading ? (
            <div className="rounded-3xl border border-sand bg-white/90 p-8 text-sm font-semibold text-muted">
              Loading your order history...
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="rounded-3xl border border-sand bg-white/90 p-8">
              <p className="text-sm font-semibold text-muted">You have no product orders yet.</p>
            </div>
          ) : (
            sortedOrders.map((order) => {
              const meta = STATUS_META[order.status] || STATUS_META.pending;
              const activeIndex = statusIndex(order.status);
              const canReview = order.status === "delivered";
              const canRequestReturn = order.status === "delivered" && order.paymentStatus !== "refunded";
              const isCancelled = order.status === "cancelled";

              return (
                <article key={order._id} className="overflow-hidden rounded-3xl border border-sand bg-white/95 shadow-sm">
                  <div className="border-b border-sand/70 bg-warm/20 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-ink">ORD-{order._id.slice(-6).toUpperCase()}</p>
                        <p className="mt-1 text-xs font-medium text-muted">
                          Placed {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
                          {meta.label}
                        </span>
                        <span className="rounded-full border border-sand bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
                          {order.paymentMethod} / {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-4">
                      {isCancelled ? (
                        <div className="col-span-full flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                          <XCircle className="h-4 w-4" />
                          This order has been cancelled.
                        </div>
                      ) : (
                        STEPS.map((step, index) => {
                          const Icon = step.icon;
                          const reached = activeIndex >= index;
                          return (
                            <div
                              key={step.status}
                              className={`rounded-2xl border px-4 py-3 ${
                                reached ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-sand bg-warm/20 text-muted"
                              }`}
                            >
                              <Icon className="mb-2 h-4 w-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">{step.label}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="space-y-3">
                      {order.items.map((item, index) => {
                        const productId = getProductId(item);
                        const image = getProductImage(item);

                        return (
                          <div key={`${order._id}-${productId || item.name}-${index}`} className="flex gap-4 rounded-2xl border border-sand/70 bg-white p-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-sand bg-warm">
                              <img
                                src={image || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=300&auto=format&fit=crop"}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-bold text-ink">{item.name}</p>
                              <p className="mt-1 text-xs text-muted">
                                Qty {item.quantity} x {formatVnd(Number(item.price || 0))}
                              </p>
                              <p className="mt-2 text-sm font-black text-brown">
                                {formatVnd(Number(item.price || 0) * Number(item.quantity || 0))}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col justify-center gap-2">
                              {productId ? (
                                <Link
                                  to={`/products/${productId}`}
                                  className="rounded-full border border-sand px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-ink transition hover:bg-warm"
                                >
                                  Details
                                </Link>
                              ) : null}
                              {canReview && productId ? (
                                <Link
                                  to={`/products/${productId}#reviews`}
                                  className="rounded-full bg-ink px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-brown"
                                >
                                  Review
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-4 border-t border-sand pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Ship To</p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {order.shippingAddress?.name || "-"} / {order.shippingAddress?.phone || "-"}
                        </p>
                        <p className="mt-1 text-sm text-muted">{order.shippingAddress?.address || "-"}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-lg font-black text-ink">{formatVnd(order.totalAmount || 0)}</p>
                        {canRequestReturn ? (
                          <button
                            type="button"
                            onClick={() => handleReturnRequest(order._id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-600 hover:text-white"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Request Return
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
