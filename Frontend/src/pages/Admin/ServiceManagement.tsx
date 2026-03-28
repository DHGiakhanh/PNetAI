import { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, Scissors, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";

type Service = {
  _id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  images: string[];
  features: string[];
  isPopular: boolean;
  isAvailable: boolean;
  location?: { address?: string; city?: string };
};

type ServiceForm = {
  title: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  imageUrl: string;
  features: string;
  isPopular: boolean;
  isAvailable: boolean;
  address: string;
  city: string;
};

const initialForm: ServiceForm = {
  title: "",
  description: "",
  category: "",
  basePrice: 0,
  duration: 30,
  imageUrl: "",
  features: "",
  isPopular: false,
  isAvailable: true,
  address: "",
  city: "",
};

export const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(initialForm);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/services", {
        params: search ? { search } : {},
      });
      setServices(response.data.services || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description,
      category: service.category,
      basePrice: service.basePrice,
      duration: service.duration,
      imageUrl: service.images?.[0] || "",
      features: (service.features || []).join(", "),
      isPopular: service.isPopular,
      isAvailable: service.isAvailable,
      address: service.location?.address || "",
      city: service.location?.city || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        basePrice: Number(form.basePrice),
        duration: Number(form.duration),
        images: form.imageUrl ? [form.imageUrl] : [],
        features: form.features
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        isPopular: form.isPopular,
        isAvailable: form.isAvailable,
        location: {
          address: form.address,
          city: form.city,
        },
      };

      if (editing?._id) {
        await apiClient.put(`/services/${editing._id}`, payload);
        toast.success("Service updated.");
      } else {
        await apiClient.post("/services", payload);
        toast.success("Service created.");
      }

      closeModal();
      await fetchServices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save service.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await apiClient.delete(`/services/${id}`);
      toast.success("Service deleted.");
      await fetchServices();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete service.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-bold italic text-ink">Service Management</h1>
          <p className="text-sm text-muted">CRUD services owned by your service provider account.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
        >
          <Plus className="h-4 w-4" /> New Service
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-sand bg-white/90 p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by service title/category..."
          className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-2.5 text-sm outline-none focus:border-caramel"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-warm/70">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Service</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No services found.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id} className="border-t border-sand/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                          <Scissors className="h-4 w-4 text-brown" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{service.title}</p>
                          <p className="line-clamp-1 max-w-[300px] text-xs text-muted">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{service.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink">${service.basePrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-ink">{service.duration} min</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${service.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {service.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(service)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-1.5 text-sm font-medium text-ink hover:bg-warm"
                        >
                          <Edit3 className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rust/30 px-3 py-1.5 text-sm font-medium text-rust hover:bg-[#fff1eb]"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-3xl border border-sand bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-3xl font-bold italic text-ink">
              {editing ? "Edit Service" : "Create Service"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Service title"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <input
                required
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="Category"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.basePrice}
                onChange={(e) => setForm((p) => ({ ...p, basePrice: Number(e.target.value) }))}
                placeholder="Base price"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <input
                type="number"
                min={5}
                step={5}
                required
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                placeholder="Duration (min)"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="Image URL"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2"
              />
              <input
                value={form.features}
                onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
                placeholder="Features (comma separated)"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2"
              />
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Address"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="City"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) => setForm((p) => ({ ...p, isPopular: e.target.checked }))}
                />
                Popular
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))}
                />
                Available
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-ink hover:bg-warm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-brown px-5 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update Service" : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
