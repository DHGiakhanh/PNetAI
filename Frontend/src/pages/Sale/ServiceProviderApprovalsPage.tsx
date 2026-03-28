import { useEffect, useMemo, useState } from "react";
import { UserRoundCheck, Users } from "lucide-react";
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
  const [managedProviders, setManagedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProviderId, setActiveProviderId] = useState<string>("");

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const managedRes = await apiClient.get("/sale/service-providers");
        const managed = managedRes.data.providers || [];
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
    fetchProviders();
  }, []);

  const activeProvider = useMemo(
    () => managedProviders.find((provider) => provider._id === activeProviderId) || null,
    [managedProviders, activeProviderId],
  );

  return (
    <main className="min-h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Providers You Manage</h1>
        <p className="mt-2 text-sm text-muted">
          Follow up Service Provider accounts assigned to you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside>
          <section className="rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
                <Users className="h-5 w-5 text-caramel" />
                Managed List
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
    </main>
  );
}

