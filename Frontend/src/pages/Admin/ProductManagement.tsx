import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Package, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";
import { productService } from "@/services/product.service";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  isHot: boolean;
  isRecommended: boolean;
  createdAt: string;
};

type Category = {
  _id: string;
  name: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
  isHot: boolean;
  isRecommended: boolean;
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: 0,
  category: "",
  imageUrl: "",
  stock: 0,
  isHot: false,
  isRecommended: false,
};

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pageSize = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get("/admin/products", { params: search ? { search } : {} }),
        apiClient.get("/admin/categories"),
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = useMemo(
    () => products.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [products, currentPage]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      imageUrl: product.images?.[0] || "",
      stock: product.stock || 0,
      isHot: product.isHot,
      isRecommended: product.isRecommended,
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
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        images: form.imageUrl ? [form.imageUrl] : [],
        stock: Number(form.stock),
        isHot: form.isHot,
        isRecommended: form.isRecommended,
      };

      if (editing?._id) {
        await apiClient.put(`/products/${editing._id}`, payload);
        toast.success("Product updated.");
      } else {
        await apiClient.post("/products", payload);
        toast.success("Product created.");
      }

      closeModal();
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success("Product deleted.");
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete product.");
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { url } = await productService.uploadProductImage(file);
      if (!url) throw new Error("Upload failed");
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-bold italic text-ink">Product Management</h1>
          <p className="text-sm text-muted">Manage catalog items for your store.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-brown px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-sand bg-white/90 p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          className="w-full rounded-xl border border-sand bg-warm/50 px-4 py-2.5 text-sm outline-none focus:border-caramel"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-warm/70">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-ink">Flags</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product._id} className="border-t border-sand/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                          <Package className="h-4 w-4 text-brown" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{product.name}</p>
                          <p className="line-clamp-1 max-w-[300px] text-xs text-muted">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-ink">{product.stock}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {product.isHot ? "Hot " : ""}
                      {product.isRecommended ? "Recommended" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-1.5 text-sm font-medium text-ink hover:bg-warm"
                        >
                          <Edit3 className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={products.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {showModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
          <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-3xl border border-sand bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-3xl font-bold italic text-ink">
              {editing ? "Edit Product" : "Create Product"}
            </h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-sand/80 bg-warm/30 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Basic Information</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Product name"
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  />
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    required
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description"
                    rows={3}
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-sand/80 bg-warm/30 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pricing & Inventory</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="Price"
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  />
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                    placeholder="Stock"
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-sand/80 bg-warm/30 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Media & Visibility</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-warm disabled:opacity-60"
                    >
                      {uploadingImage ? "Uploading..." : "Upload from device"}
                    </button>
                  </div>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="Image URL"
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2"
                  />
                  {form.imageUrl ? (
                    <div className="sm:col-span-2">
                      <img
                        src={form.imageUrl}
                        alt="Product preview"
                        className="h-28 w-28 rounded-xl object-cover ring-1 ring-sand"
                      />
                    </div>
                  ) : null}
                  <label className="inline-flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.isHot}
                      onChange={(e) => setForm((p) => ({ ...p, isHot: e.target.checked }))}
                    />
                    Hot product
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.isRecommended}
                      onChange={(e) => setForm((p) => ({ ...p, isRecommended: e.target.checked }))}
                    />
                    Recommended
                  </label>
                </div>
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
                {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};
