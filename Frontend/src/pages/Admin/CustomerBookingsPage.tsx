import { useEffect, useState } from "react";
import apiClient from "@/utils/api.service";
import { Users } from "lucide-react";
import toast from "react-hot-toast";

type BookingCustomer = {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  totalOrders: number;
  totalSpent: number;
  lastBookedAt: string;
};

export const CustomerBookingsPage = () => {
  const [customers, setCustomers] = useState<BookingCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/admin/customers-bookings");
        setCustomers(response.data?.customers || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Could not load customer bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
          <Users className="h-5 w-5 text-brown" />
        </span>
        <div>
          <h1 className="font-serif text-4xl font-bold italic text-ink">Customers Booking</h1>
          <p className="text-sm text-muted">Customers who have placed bookings/orders in the system.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-warm/70">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Total Orders</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Total Spent</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Last Booking</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Loading customer bookings...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No customer bookings found.
                  </td>
                </tr>
              ) : (
                customers.map((item) => (
                  <tr key={item.user._id} className="border-t border-sand/70">
                    <td className="px-4 py-3 text-sm font-semibold text-ink">{item.user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted">{item.user.email}</td>
                    <td className="px-4 py-3 text-sm text-muted">{item.user.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-ink">{item.totalOrders}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink">${item.totalSpent.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {item.lastBookedAt ? new Date(item.lastBookedAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

