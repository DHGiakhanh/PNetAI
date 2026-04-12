import { useEffect, useMemo, useState } from "react";
import { UserRoundCheck, Users } from "lucide-react";
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
  canPublishServices?: boolean;
  providerOnboardingStatus?:
    | "pending_sale_approval"
    | "pending_legal_submission"
    | "pending_legal_approval"
    | "approved";
  legalDocuments?: {
    submittedAt?: string;
    reviewedAt?: string;
    clinicName?: string;
    clinicLicenseNumber?: string;
    clinicLicenseUrl?: string;
    businessLicenseUrl?: string;
  };
  createdAt: string;
};

const isImageDocumentUrl = (url?: string) => {
  if (!url) return false;
  return (
    /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(url) ||
    url.includes("/image/upload/")
  );
};

export default function ServiceProviderApprovalsPage() {
  const [managedProviders, setManagedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProviderId, setActiveProviderId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const getStatusMeta = (provider: Provider) => {
    const status = provider.providerOnboardingStatus;
    if (!provider.isVerified || status === "pending_sale_approval") {
      return { label: "Pending Initial Approval", className: "bg-amber-100 text-amber-700" };
    }
    if (status === "pending_legal_submission") {
      return { label: "Waiting Legal Submission", className: "bg-slate-100 text-slate-700" };
    }
    if (status === "pending_legal_approval") {
      return { label: "Pending Legal Approval", className: "bg-orange-100 text-orange-700" };
    }
    return { label: "Approved", className: "bg-emerald-100 text-emerald-700" };
  };

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
  const activeStatus = activeProvider ? getStatusMeta(activeProvider) : null;
  const totalPages = Math.max(1, Math.ceil(managedProviders.length / pageSize));
  const paginatedManagedProviders = useMemo(
    () => managedProviders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [managedProviders, currentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
                {paginatedManagedProviders.map((provider) => {
                  const active = provider._id === activeProviderId;
                  const status = getStatusMeta(provider);
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
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={managedProviders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              className="mt-3"
            />
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Status</p>
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${activeStatus?.className}`}>
                  {activeStatus?.label}
                </span>
              </div>
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
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Publish Permission</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    activeProvider.canPublishServices
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {activeProvider.canPublishServices ? "Can Publish" : "Blocked"}
                </span>
              </div>
              <div className="rounded-2xl border border-sand bg-warm/40 px-4 py-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Legal Documents</p>
                <p className="mt-1 text-sm text-ink">
                  Clinic: <span className="font-semibold">{activeProvider.legalDocuments?.clinicName || "-"}</span>
                </p>
                <p className="text-sm text-ink">
                  License No: <span className="font-semibold">{activeProvider.legalDocuments?.clinicLicenseNumber || "-"}</span>
                </p>
                <p className="text-sm text-ink">
                  Submitted:{" "}
                  <span className="font-semibold">
                    {activeProvider.legalDocuments?.submittedAt
                      ? new Date(activeProvider.legalDocuments.submittedAt).toLocaleString()
                      : "-"}
                  </span>
                </p>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-sand bg-white/70 p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Clinic License
                    </p>
                    {activeProvider.legalDocuments?.clinicLicenseUrl ? (
                      <>
                        {isImageDocumentUrl(activeProvider.legalDocuments.clinicLicenseUrl) ? (
                          <a
                            href={activeProvider.legalDocuments.clinicLicenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block"
                          >
                            <img
                              src={activeProvider.legalDocuments.clinicLicenseUrl}
                              alt="Clinic license"
                              className="h-40 w-full rounded-lg object-cover"
                            />
                          </a>
                        ) : null}
                        <a
                          href={activeProvider.legalDocuments.clinicLicenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-brown hover:underline"
                        >
                          Open clinic license document
                        </a>
                        <p className="mt-1 break-all text-[11px] text-muted">
                          {activeProvider.legalDocuments.clinicLicenseUrl}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-muted">No file</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-sand bg-white/70 p-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Business License
                    </p>
                    {activeProvider.legalDocuments?.businessLicenseUrl ? (
                      <>
                        {isImageDocumentUrl(activeProvider.legalDocuments.businessLicenseUrl) ? (
                          <a
                            href={activeProvider.legalDocuments.businessLicenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block"
                          >
                            <img
                              src={activeProvider.legalDocuments.businessLicenseUrl}
                              alt="Business license"
                              className="h-40 w-full rounded-lg object-cover"
                            />
                          </a>
                        ) : null}
                        <a
                          href={activeProvider.legalDocuments.businessLicenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-brown hover:underline"
                        >
                          Open business license document
                        </a>
                        <p className="mt-1 break-all text-[11px] text-muted">
                          {activeProvider.legalDocuments.businessLicenseUrl}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-muted">No file</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
