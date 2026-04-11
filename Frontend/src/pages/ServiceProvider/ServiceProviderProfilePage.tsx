import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

type OnboardingStatus =
  | "pending_sale_approval"
  | "pending_legal_submission"
  | "pending_legal_approval"
  | "approved";

const statusMeta: Record<OnboardingStatus, { label: string; className: string; description: string }> = {
  pending_sale_approval: {
    label: "Pending Initial Sale Approval",
    className: "bg-amber-100 text-amber-700",
    description: "Your account is waiting for first approval from the assigned sale representative.",
  },
  pending_legal_submission: {
    label: "Need Legal Documents",
    className: "bg-slate-100 text-slate-700",
    description: "Your account can login now. Submit legal documents to continue onboarding.",
  },
  pending_legal_approval: {
    label: "Pending Legal Approval",
    className: "bg-orange-100 text-orange-700",
    description: "Legal documents submitted. Waiting for sale review.",
  },
  approved: {
    label: "Fully Approved",
    className: "bg-emerald-100 text-emerald-700",
    description: "You can publish clinics, products and services.",
  },
};

const resolveStatus = (value?: string): OnboardingStatus => {
  if (
    value === "pending_sale_approval" ||
    value === "pending_legal_submission" ||
    value === "pending_legal_approval" ||
    value === "approved"
  ) {
    return value;
  }
  return "pending_sale_approval";
};

export default function ServiceProviderProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingLegal, setSubmittingLegal] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("pending_sale_approval");
  const [canPublishServices, setCanPublishServices] = useState(false);
  const [legalSubmittedAt, setLegalSubmittedAt] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [legalForm, setLegalForm] = useState({
    clinicName: "",
    clinicLicenseNumber: "",
    clinicLicenseUrl: "",
    businessLicenseUrl: "",
    note: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      const nextStatus = resolveStatus(user.providerOnboardingStatus);

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setOnboardingStatus(nextStatus);
      setCanPublishServices(Boolean(user.canPublishServices));
      setLegalSubmittedAt(user.legalDocuments?.submittedAt || "");
      setLegalForm({
        clinicName: user.legalDocuments?.clinicName || "",
        clinicLicenseNumber: user.legalDocuments?.clinicLicenseNumber || "",
        clinicLicenseUrl: user.legalDocuments?.clinicLicenseUrl || "",
        businessLicenseUrl: user.legalDocuments?.businessLicenseUrl || "",
        note: user.legalDocuments?.submissionNote || "",
      });
    } catch {
      toast.error("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await authService.updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
      });

      const raw = localStorage.getItem("user");
      const currentUser = raw ? JSON.parse(raw) : {};
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updated }));

      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitLegal = async (e: FormEvent) => {
    e.preventDefault();

    if (onboardingStatus === "pending_sale_approval") {
      toast.error("Your account still needs initial sale approval.");
      return;
    }

    try {
      setSubmittingLegal(true);
      await authService.submitProviderLegalDocuments({
        clinicName: legalForm.clinicName,
        clinicLicenseNumber: legalForm.clinicLicenseNumber,
        clinicLicenseUrl: legalForm.clinicLicenseUrl,
        businessLicenseUrl: legalForm.businessLicenseUrl || undefined,
        note: legalForm.note || undefined,
      });
      toast.success("Legal documents submitted.");
      await loadProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not submit legal documents.");
    } finally {
      setSubmittingLegal(false);
    }
  };

  const status = statusMeta[onboardingStatus];

  return (
    <main className="min-h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">My Profile</h1>
        <p className="mt-2 text-sm text-muted">Update your service provider information.</p>
      </div>

      <section className="mb-6 max-w-3xl rounded-3xl border border-sand bg-white/90 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
          <>
            <div className="mb-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                {status.label}
              </span>
              <p className="mt-2 text-sm text-muted">{status.description}</p>
              <p className="mt-1 text-sm text-ink">
                Publish permission:{" "}
                <span className={canPublishServices ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                  {canPublishServices ? "Enabled" : "Blocked"}
                </span>
              </p>
              {legalSubmittedAt ? (
                <p className="mt-1 text-xs text-muted">Legal submitted at: {new Date(legalSubmittedAt).toLocaleString()}</p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Email
                </label>
                <input
                  value={form.email}
                  className="w-full rounded-xl border border-sand bg-gray-100 px-4 py-3 text-sm text-gray-500 outline-none"
                  disabled
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                  rows={4}
                  placeholder="Address"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      <section className="max-w-3xl rounded-3xl border border-sand bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Legal Documents</h2>
        <p className="mt-1 text-sm text-muted">
          Submit clinic/legal information so sale can complete the final approval.
        </p>

        {loading ? null : onboardingStatus === "approved" ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Legal approval completed. You can publish services and products.
          </p>
        ) : (
          <form onSubmit={handleSubmitLegal} className="mt-4 grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Clinic Name
              </label>
              <input
                value={legalForm.clinicName}
                onChange={(e) => setLegalForm((p) => ({ ...p, clinicName: e.target.value }))}
                className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                placeholder="Your clinic name"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Clinic License Number
              </label>
              <input
                value={legalForm.clinicLicenseNumber}
                onChange={(e) => setLegalForm((p) => ({ ...p, clinicLicenseNumber: e.target.value }))}
                className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                placeholder="License number"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Clinic License URL
              </label>
              <input
                type="url"
                value={legalForm.clinicLicenseUrl}
                onChange={(e) => setLegalForm((p) => ({ ...p, clinicLicenseUrl: e.target.value }))}
                className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Business License URL (optional)
              </label>
              <input
                type="url"
                value={legalForm.businessLicenseUrl}
                onChange={(e) => setLegalForm((p) => ({ ...p, businessLicenseUrl: e.target.value }))}
                className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Note (optional)
              </label>
              <textarea
                rows={3}
                value={legalForm.note}
                onChange={(e) => setLegalForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-3 text-sm outline-none focus:border-caramel"
                placeholder="Additional details for sale reviewer"
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={submittingLegal || onboardingStatus === "pending_sale_approval"}
                className="rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
              >
                {submittingLegal ? "Submitting..." : "Submit Legal Documents"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
