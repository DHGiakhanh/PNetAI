import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, UserRoundCheck } from "lucide-react";
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, managedRes] = await Promise.all([
        apiClient.get("/sale/service-providers/pending"),
        apiClient.get("/sale/service-providers"),
      ]);
      setPendingProviders(pendingRes.data.pendingProviders || []);
      setManagedProviders(managedRes.data.providers || []);
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

        <section className="mb-8 rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-caramel" />
            <h2 className="text-lg font-semibold text-ink">Pending Approval</h2>
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
            <h2 className="text-lg font-semibold text-ink">Service Providers You Manage</h2>
          </div>
          {loading ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : managedProviders.length === 0 ? (
            <p className="rounded-2xl border border-sand bg-warm/40 px-4 py-3 text-sm text-muted">
              No Service Providers assigned yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-warm/70">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Sale ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {managedProviders.map((provider) => (
                    <tr key={provider._id} className="border-t border-sand/70">
                      <td className="px-4 py-3 text-sm font-semibold text-ink">{provider.name}</td>
                      <td className="px-4 py-3 text-sm text-muted">{provider.email}</td>
                      <td className="px-4 py-3 text-sm text-ink">{provider.saleCode || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            provider.isVerified
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {provider.isVerified ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

