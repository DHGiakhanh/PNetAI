import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, UserRoundCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";

type Provider = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  saleCode?: string;
  isVerified: boolean;
  createdAt: string;
};

export default function ServiceProviderApprovalsPage() {
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [managedProviders, setManagedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, managedRes] = await Promise.all([
        apiClient.get("/sale/service-providers/pending"),
        apiClient.get("/sale/service-providers"),
      ]);
      const pending = pendingRes.data.pendingProviders || [];
      const managed = managedRes.data.providers || [];
      setPendingProviders(pending);
      setManagedProviders(managed);
      if (!activeProviderId && managed.length > 0) {
        setActiveProviderId(managed[0]._id);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load service providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveProvider = async (providerId: string) => {
    try {
      setApprovingId(providerId);
      await apiClient.put(`/sale/service-providers/${providerId}/approve`);
      toast.success("Service Provider approved.");
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not approve provider.");
    } finally {
      setApprovingId(null);
    }
  };

  const activeProvider = useMemo(
    () => managedProviders.find((provider) => provider._id === activeProviderId) || null,
    [managedProviders, activeProviderId],
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h1 className="font-serif text-4xl font-bold italic text-ink">
            Service Provider Approvals
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review pending Service Provider accounts and track providers under your care.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
            <section className="rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Users className="h-5 w-5 text-caramel" />
                  Managed Providers
                </h2>
                <span className="rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                  {managedProviders.length}
                </span>
              </div>
              {loading ? (
                <p className="text-sm text-muted">Loading...</p>
              ) : managedProviders.length === 0 ? (
                <p className="rounded-2xl border border-sand bg-warm/40 px-3 py-3 text-sm text-muted">
                  No providers assigned.
                </p>
              ) : (
                <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
                  {managedProviders.map((provider) => {
                    const active = provider._id === activeProviderId;
                    return (
                      <button
                        key={provider._id}
                        type="button"
                        onClick={() => setActiveProviderId(provider._id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-caramel bg-warm/70"
                            : "border-sand bg-white hover:bg-warm/40"
                        }`}
                      >
                        <p className="text-sm font-semibold text-ink">{provider.name}</p>
                        <p className="text-xs text-muted">{provider.email}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            provider.isVerified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {provider.isVerified ? "Approved" : "Pending"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
                  <Clock3 className="h-5 w-5 text-caramel" />
                  Approval Orders
                </h2>
                <span className="rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                  {pendingProviders.length}
                </span>
              </div>
              {loading ? (
                <p className="text-sm text-muted">Loading...</p>
              ) : pendingProviders.length === 0 ? (
                <p className="rounded-2xl border border-sand bg-warm/40 px-4 py-3 text-sm text-muted">
                  No pending Service Provider accounts.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pendingProviders.map((provider) => (
                    <article key={provider._id} className="rounded-2xl border border-sand bg-warm/30 p-4">
                      <p className="text-base font-semibold text-ink">{provider.name}</p>
                      <p className="text-sm text-muted">{provider.email}</p>
                      <p className="mt-2 text-xs text-muted">
                        Sale ID: <span className="font-semibold text-ink">{provider.saleCode || "-"}</span>
                      </p>
                      <p className="text-xs text-muted">
                        Registered: {new Date(provider.createdAt).toLocaleString()}
                      </p>
                      <button
                        type="button"
                        disabled={approvingId === provider._id}
                        onClick={() => approveProvider(provider._id)}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approvingId === provider._id ? "Approving..." : "Approve"}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UserRoundCheck className="h-5 w-5 text-caramel" />
                <h2 className="text-lg font-semibold text-ink">Provider Detail</h2>
              </div>
              {!activeProvider ? (
                <p className="rounded-2xl border border-sand bg-warm/40 px-4 py-3 text-sm text-muted">
                  Select a provider from the sidebar to view detail.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-sand bg-warm/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Name</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{activeProvider.name}</p>
                  </div>
                  <div className="rounded-2xl border border-sand bg-warm/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Email</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{activeProvider.email}</p>
                  </div>
                  <div className="rounded-2xl border border-sand bg-warm/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Sale ID</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{activeProvider.saleCode || "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-sand bg-warm/40 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        activeProvider.isVerified
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {activeProvider.isVerified ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
