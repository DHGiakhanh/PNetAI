import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";

type Provider = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  saleCode?: string;
  isVerified: boolean;
  providerOnboardingStatus?:
    | "pending_sale_approval"
    | "pending_legal_submission"
    | "pending_legal_approval"
    | "approved";
  legalDocuments?: {
    submittedAt?: string;
    clinicName?: string;
    clinicLicenseNumber?: string;
  };
  createdAt: string;
};

export default function SalePendingApprovalsPage() {
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchPending = async () => {
    try {
      setLoading(true);
      const pendingRes = await apiClient.get("/sale/service-providers/pending");
      setPendingProviders(pendingRes.data.pendingProviders || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load pending approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const totalPages = Math.max(1, Math.ceil(pendingProviders.length / pageSize));
  const paginatedPendingProviders = useMemo(
    () => pendingProviders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [pendingProviders, currentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const approveProvider = async (providerId: string) => {
    try {
      setApprovingId(providerId);
      const res = await apiClient.put(`/sale/service-providers/${providerId}/approve`);
      const stage = res?.data?.approvalStage;
      toast.success(stage === "legal_documents" ? "Legal documents approved." : "Initial account approved.");
      await fetchPending();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not approve provider.");
    } finally {
      setApprovingId(null);
    }
  };

  const getPendingStage = (provider: Provider) => {
    if (!provider.isVerified || provider.providerOnboardingStatus === "pending_sale_approval") {
      return {
        label: "Initial Account Approval",
        actionText: "Approve Account",
      };
    }
    return {
      label: "Legal Documents Approval",
      actionText: "Approve Legal Docs",
    };
  };

  return (
    <main className="min-h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Approval Orders</h1>
        <p className="mt-2 text-sm text-muted">
          Approve initial registrations and legal documents from your assigned Service Providers.
        </p>
      </div>

      <section className="rounded-3xl border border-sand bg-white/90 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink">
            <Clock3 className="h-5 w-5 text-caramel" />
            Pending Actions
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
            {paginatedPendingProviders.map((provider) => {
              const stage = getPendingStage(provider);
              return (
                <article key={provider._id} className="rounded-2xl border border-sand bg-warm/30 p-4">
                  <p className="mb-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                    {stage.label}
                  </p>
                  <p className="text-base font-semibold text-ink">{provider.name}</p>
                  <p className="text-sm text-muted">{provider.email}</p>
                  <p className="mt-2 text-xs text-muted">
                    Sale ID: <span className="font-semibold text-ink">{provider.saleCode || "-"}</span>
                  </p>
                  <p className="text-xs text-muted">
                    Registered: {new Date(provider.createdAt).toLocaleString()}
                  </p>
                  {provider.providerOnboardingStatus === "pending_legal_approval" ? (
                    <>
                      <p className="text-xs text-muted">
                        Clinic: <span className="font-semibold text-ink">{provider.legalDocuments?.clinicName || "-"}</span>
                      </p>
                      <p className="text-xs text-muted">
                        License No:{" "}
                        <span className="font-semibold text-ink">{provider.legalDocuments?.clinicLicenseNumber || "-"}</span>
                      </p>
                      <p className="text-xs text-muted">
                        Docs submitted:{" "}
                        <span className="font-semibold text-ink">
                          {provider.legalDocuments?.submittedAt
                            ? new Date(provider.legalDocuments.submittedAt).toLocaleString()
                            : "-"}
                        </span>
                      </p>
                    </>
                  ) : null}
                  <button
                    type="button"
                    disabled={approvingId === provider._id}
                    onClick={() => approveProvider(provider._id)}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-brown px-4 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {approvingId === provider._id ? "Approving..." : stage.actionText}
                  </button>
                </article>
              );
            })}
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pendingProviders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          className="mt-4"
        />
      </section>
    </main>
  );
}
