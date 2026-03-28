import { FormEvent, useEffect, useState } from "react";
import { Edit3, Plus, Shapes, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";

type Category = {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
};

type CategoryForm = {
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
};

const initialForm: CategoryForm = {
  name: "",
  description: "",
  icon: "",
  color: "#C4913A",
  isActive: true,
  sortOrder: 0,
};

export const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CategoryForm>(initialForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/categories");
      setCategories(response.data.categories || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "#C4913A",
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
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
      if (editing?._id) {
        await apiClient.put(`/categories/${editing._id}`, form);
        toast.success("Category updated.");
      } else {
        await apiClient.post("/categories", form);
        toast.success("Category created.");
      }
      closeModal();
      await fetchCategories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      toast.success("Category deleted.");
      await fetchCategories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete category.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-bold italic text-ink">Category Management</h1>
          <p className="text-sm text-muted">Create and maintain catalog categories.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-warm/70">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Icon</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Color</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Sort</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="border-t border-sand/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                          <Shapes className="h-4 w-4 text-brown" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{category.name}</p>
                          <p className="line-clamp-1 max-w-[300px] text-xs text-muted">{category.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{category.icon || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-2 rounded-full border border-sand px-3 py-1 text-xs font-semibold text-ink"
                      >
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-sand"
                          style={{ backgroundColor: category.color || "#C4913A" }}
                        />
                        {category.color || "#C4913A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{category.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          category.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(category)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-1.5 text-sm font-medium text-ink hover:bg-warm"
                        >
                          <Edit3 className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
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
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-3xl border border-sand bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-3xl font-bold italic text-ink">
              {editing ? "Edit Category" : "Create Category"}
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Category description"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.icon}
                  onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="Icon (emoji/text)"
                  className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  placeholder="Color hex"
                  className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                />
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                  placeholder="Sort order"
                  className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                />
                <label className="inline-flex items-center gap-2 rounded-xl border border-sand bg-warm/50 px-3 py-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
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
                {saving ? "Saving..." : editing ? "Update Category" : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

