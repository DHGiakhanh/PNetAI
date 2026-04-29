import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  SearchCheck,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import Pagination from "@/components/common/Pagination";
import {
  orderService,
  ProviderOrder,
  ProviderOrderStatus,
} from "@/services/order.service";
import { formatVnd } from "@/utils/currency";

const STATUS_LABELS: Record<ProviderOrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<ProviderOrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  processing: "bg-sky-50 text-sky-700 border-sky-100",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-rose-50 text-rose-700 border-rose-100",
};

const NEXT_STATUS_MAP: Record<ProviderOrderStatus, ProviderOrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatShortDate = (value?: string) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const StatusBadge = ({ status }: { status: ProviderOrderStatus }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[status]}`}>
    {STATUS_LABELS[status]}
  </span>
);

export const OrdersManagement = () => {
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProviderOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ProviderOrderStatus | "">("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await orderService.getProviderOrders({
        page,
        limit: 8,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setOrders(response.orders || []);
      setTotalPages(Math.max(response.pagination?.pages || 1, 1));
      setTotalItems(response.pagination?.total || 0);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load provider orders.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openDetails = async (orderId: string) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(null);
      const order = await orderService.getProviderOrderById(orderId);
      setSelectedOrder(order);
      setDraftStatus(NEXT_STATUS_MAP[order.status][0] || "");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load order details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setDraftStatus("");
    setDetailLoading(false);
  };

  const handleApplyStatus = async () => {
    if (!selectedOrder || !draftStatus) return;

    try {
      setUpdatingStatus(true);
      const updated = await orderService.updateProviderOrderStatus(selectedOrder._id, draftStatus);
      setSelectedOrder(updated);
      setDraftStatus(NEXT_STATUS_MAP[updated.status][0] || "");
      setOrders((prev) => prev.map((order) => (order._id === updated._id ? { ...order, ...updated } : order)));
      toast.success("Order status updated.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const summary = useMemo(() => {
    const pendingCount = orders.filter((order) => order.status === "pending" || order.status === "processing").length;
    const revenue = orders.reduce((sum, order) => sum + (order.providerSubtotal || 0), 0);
    const blockedCount = orders.filter((order) => !order.canManageStatus).length;
    return { pendingCount, revenue, blockedCount };
  }, [orders]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-caramel">
            <div className="h-px w-10 bg-caramel" />
            Commerce Desk
          </div>
          <h1 className="text-4xl font-serif font-bold italic text-ink">Orders Management</h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Review purchased orders, inspect shipment details, and advance fulfillment status for your shop.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[2rem] border border-sand bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Action Queue</p>
            <p className="mt-2 text-2xl font-serif font-bold italic text-ink">{summary.pendingCount}</p>
          </div>
          <div className="rounded-[2rem] border border-sand bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Visible Revenue</p>
            <p className="mt-2 text-xl font-serif font-bold italic text-ink">{formatVnd(summary.revenue)}</p>
          </div>
          <div className="rounded-[2rem] border border-sand bg-white px-5 py-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Mixed Orders</p>
            <p className="mt-2 text-2xl font-serif font-bold italic text-ink">{summary.blockedCount}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[2.5rem] border border-sand bg-white p-6 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Status</span>
            <div className="relative">
              <SearchCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-2xl border border-sand bg-warm/20 pl-11 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-caramel"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">From Day</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-sand bg-warm/20 px-4 text-sm font-semibold text-ink outline-none transition focus:border-caramel"
            />
          </label>

          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted">To Day</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-sand bg-warm/20 px-4 text-sm font-semibold text-ink outline-none transition focus:border-caramel"
            />
          </label>

          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-sand bg-white text-ink transition hover:bg-warm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-12 rounded-2xl border border-sand px-5 text-xs font-black uppercase tracking-widest text-muted transition hover:bg-warm hover:text-ink"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[3rem] border border-sand bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-warm/10">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">Order</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">Customer</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">Provider Scope</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-caramel" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Loading provider orders</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <Package className="mx-auto h-10 w-10 text-sand" />
                    <p className="mt-4 text-sm font-serif italic text-muted">No orders matched the selected filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="transition hover:bg-warm/10">
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-ink">ORD-{order._id.slice(-6).toUpperCase()}</p>
                      <p className="mt-1 text-xs font-medium text-muted">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-ink">{order.user?.name || "Customer"}</p>
                      <p className="mt-1 text-xs text-muted">{order.user?.email || "-"}</p>
                      <p className="mt-1 text-xs text-muted">{order.shippingAddress?.phone || order.user?.phone || "-"}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-ink">{formatVnd(order.providerSubtotal)}</p>
                      <p className="mt-1 text-xs text-muted">{order.providerItemCount} item(s) from your catalog</p>
                      {!order.canManageStatus ? (
                        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-600">
                          Mixed-provider order
                        </p>
                      ) : null}
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <StatusBadge status={order.status} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                          {order.paymentMethod} / {order.paymentStatus}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(order._id)}
                        className="inline-flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-ink transition hover:bg-ink hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-sand bg-warm/5 px-8 py-5">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={8}
            onPageChange={setPage}
          />
        </div>
      </section>

      {(detailLoading || selectedOrder) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            onClick={closeDetails}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-label="Close order details"
          />

          <div className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-sand bg-[#FBF9F2] p-8 shadow-2xl">
            <button
              type="button"
              onClick={closeDetails}
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-sand bg-white text-muted transition hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>

            {detailLoading || !selectedOrder ? (
              <div className="grid min-h-[320px] place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-caramel" />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">Loading order dossier</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-caramel">
                      <ShoppingBag className="h-4 w-4" />
                      Order Detail
                    </div>
                    <h2 className="text-3xl font-serif font-bold italic text-ink">
                      ORD-{selectedOrder._id.slice(-6).toUpperCase()}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      Created {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <div className="space-y-2 text-left lg:text-right">
                    <StatusBadge status={selectedOrder.status} />
                    <p className="text-xs font-bold uppercase tracking-widest text-muted">
                      {selectedOrder.paymentMethod} / {selectedOrder.paymentStatus}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="rounded-[2rem] border border-sand bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Customer</p>
                    <p className="mt-3 text-lg font-bold text-ink">{selectedOrder.user?.name || "-"}</p>
                    <p className="mt-1 text-sm text-muted">{selectedOrder.user?.email || "-"}</p>
                    <p className="mt-1 text-sm text-muted">{selectedOrder.user?.phone || selectedOrder.shippingAddress?.phone || "-"}</p>
                  </div>

                  <div className="rounded-[2rem] border border-sand bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Shipping</p>
                    <p className="mt-3 text-sm font-bold text-ink">{selectedOrder.shippingAddress?.name || "-"}</p>
                    <p className="mt-1 text-sm text-muted">{selectedOrder.shippingAddress?.phone || "-"}</p>
                    <p className="mt-1 text-sm text-muted">{selectedOrder.shippingAddress?.address || "-"}</p>
                  </div>

                  <div className="rounded-[2rem] border border-sand bg-white p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Provider Scope</p>
                    <p className="mt-3 text-lg font-bold text-ink">{formatVnd(selectedOrder.providerSubtotal)}</p>
                    <p className="mt-1 text-sm text-muted">{selectedOrder.providerItemCount} item(s) from your shop</p>
                    <p className="mt-1 text-sm text-muted">Paid at: {formatShortDate(selectedOrder.paidAt)}</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-sand bg-white p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Package className="h-4 w-4 text-caramel" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Your Items In This Order</p>
                  </div>

                  <div className="space-y-4">
                    {selectedOrder.providerItems.map((item, index) => (
                      <div key={`${item.productId || item.name}-${index}`} className="flex flex-col gap-4 rounded-[1.5rem] border border-sand/60 bg-warm/20 p-4 md:flex-row md:items-center">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl border border-sand bg-white">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] font-black uppercase tracking-widest text-muted">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-bold text-ink">{item.name}</p>
                          <p className="mt-1 text-xs text-muted">{item.category || "Product"}</p>
                          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-caramel">
                            Qty {item.quantity} x {formatVnd(item.price)}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-sm font-black text-ink">{formatVnd(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[2rem] border border-sand bg-white p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <CalendarRange className="h-4 w-4 text-caramel" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Order Metadata</p>
                    </div>
                    <div className="space-y-3 text-sm text-muted">
                      <p><span className="font-bold text-ink">Created:</span> {formatDateTime(selectedOrder.createdAt)}</p>
                      <p><span className="font-bold text-ink">Updated:</span> {formatDateTime(selectedOrder.updatedAt)}</p>
                      <p><span className="font-bold text-ink">PayOS:</span> {selectedOrder.payos?.status || "-"}</p>
                      <p><span className="font-bold text-ink">Order code:</span> {selectedOrder.payos?.orderCode || "-"}</p>
                      {!selectedOrder.canManageStatus ? (
                        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
                          This order contains products from multiple providers, so its global status is locked for provider-side updates.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-sand bg-white p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <Truck className="h-4 w-4 text-caramel" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">Fulfillment Update</p>
                    </div>

                    {NEXT_STATUS_MAP[selectedOrder.status].length === 0 ? (
                      <div className="rounded-2xl border border-sand/60 bg-warm/20 px-4 py-5 text-sm text-muted">
                        This order is already finalized and cannot move to another status.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <select
                          value={draftStatus}
                          onChange={(e) => setDraftStatus(e.target.value as ProviderOrderStatus)}
                          disabled={!selectedOrder.canManageStatus || updatingStatus}
                          className="h-12 w-full rounded-2xl border border-sand bg-warm/20 px-4 text-sm font-semibold text-ink outline-none transition focus:border-caramel disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {NEXT_STATUS_MAP[selectedOrder.status].map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={handleApplyStatus}
                          disabled={!selectedOrder.canManageStatus || !draftStatus || updatingStatus}
                          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-caramel disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                          Update Status
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
