import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";

export default function SaleProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
        });
      } catch {
        toast.error("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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

  return (
    <main className="min-h-[calc(100vh-7rem)]">
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-bold italic text-ink">Sale Profile</h1>
        <p className="mt-2 text-sm text-muted">Update your profile information.</p>
      </div>

      <section className="max-w-3xl rounded-3xl border border-sand bg-white/90 p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : (
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
        )}
      </section>
    </main>
  );
}

