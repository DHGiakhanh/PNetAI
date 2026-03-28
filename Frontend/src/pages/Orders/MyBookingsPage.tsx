import { useEffect, useMemo, useState } from "react";
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
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  paymentMethod?: string;
};

const statusTone: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function MyBookingsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/orders/history");
        setOrders(response.data?.orders || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Could not load bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [orders]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-bold italic text-ink">My Booking</h1>
        <p className="mt-2 text-sm text-muted">Track your order history and current booking status.</p>

        <div className="mt-4 rounded-2xl border border-sand bg-white/90 p-4 text-sm text-ink shadow-sm">
          <p>
            Total bookings: <span className="font-semibold">{orders.length}</span> · Total spent:{" "}
            <span className="font-semibold text-brown">{formatUsd(totalSpent)}</span>
          </p>
        </div>

        <section className="mt-5 space-y-4">
          {loading ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted">Loading bookings...</p>
          ) : orders.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-white/90 p-4 text-sm text-muted">No bookings yet.</p>
          ) : (
            orders.map((order) => (
              <article key={order._id} className="rounded-2xl border border-sand bg-white/90 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod || "COD"}
                </p>
                <div className="mt-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={`${order._id}-${idx}`} className="flex items-center justify-between rounded-xl bg-warm/50 px-3 py-2">
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs font-semibold text-muted">
                        Quantity {item.quantity} · {formatUsd(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-right text-sm font-semibold text-brown">
                  Total: {formatUsd(order.totalAmount)}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
