import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Package, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/api.service";
import Pagination from "@/components/common/Pagination";
import { productService } from "@/services/product.service";
import { useNavigate } from "react-router-dom";
import { formatVnd } from "@/utils/currency";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  status: "active" | "inactive";
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
  imageUrls: string[];
  imageUrlInput: string;
  stock: number;
  status: "active" | "inactive";
  isHot: boolean;
  isRecommended: boolean;
};

const MAX_PRODUCT_IMAGES = 6;

const moveImageToFront = (images: string[], index: number) => {
  if (index <= 0 || index >= images.length) return images;
  return [images[index], ...images.filter((_, imageIndex) => imageIndex !== index)];
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: 0,
  category: "",
  imageUrls: [],
  imageUrlInput: "",
  stock: 0,
  status: "active",
  isHot: false,
  isRecommended: false,
};

export const ProductManagement = () => {
  const navigate = useNavigate();
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
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);
  const [archivingProductId, setArchivingProductId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pageSize = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getProviderProducts(search),
        apiClient.get("/admin/categories"),
      ]);
      setProducts(productsRes.products || []);
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
      imageUrls: product.images?.filter(Boolean) || [],
      imageUrlInput: "",
      stock: product.stock || 0,
      status: product.status || "active",
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

  const handleProviderNotReady = (error: any) => {
    if (error?.response?.data?.code !== "PROVIDER_NOT_READY") {
      return false;
    }
    toast.error("Complete legal documents before publishing products or services.");
    navigate("/service-provider/profile?section=legal-documents");
    return true;
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
        images: form.imageUrls.filter(Boolean),
        stock: Number(form.stock),
        status: form.status,
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
      if (handleProviderNotReady(error)) return;
      toast.error(error?.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this product? Customers will no longer see it in the shop.")) return;
    try {
      setArchivingProductId(id);
      await apiClient.delete(`/products/${id}`);
      toast.success("Product archived.");
      setProducts((prev) => prev.filter((product) => product._id !== id));
    } catch (error: any) {
      if (handleProviderNotReady(error)) return;
      toast.error(error?.response?.data?.message || "Could not delete product.");
    } finally {
      setArchivingProductId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === "active" ? "inactive" : "active";
    try {
      setTogglingProductId(product._id);
      const updated = await productService.updateProductStatus(product._id, nextStatus);
      setProducts((prev) => prev.map((item) => (item._id === updated._id ? { ...item, ...updated } : item)));
      if (editing?._id === updated._id) {
        setEditing({ ...editing, ...updated });
        setForm((prev) => ({ ...prev, status: updated.status }));
      }
      toast.success(nextStatus === "active" ? "Product is visible again." : "Product hidden from customers.");
    } catch (error: any) {
      if (handleProviderNotReady(error)) return;
      toast.error(error?.response?.data?.message || "Could not update status.");
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_PRODUCT_IMAGES - form.imageUrls.length;
    if (remainingSlots <= 0) {
      toast.error(`You can upload up to ${MAX_PRODUCT_IMAGES} product images.`);
      e.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      const uploadedUrls: string[] = [];

      for (const file of files.slice(0, remainingSlots)) {
        const { url } = await productService.uploadProductImage(file);
        if (!url) {
          throw new Error("Upload failed");
        }
        uploadedUrls.push(url);
      }

      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...uploadedUrls].slice(0, MAX_PRODUCT_IMAGES),
      }));
      toast.success(
        uploadedUrls.length === 1
          ? "Image uploaded."
          : `${uploadedUrls.length} images uploaded.`
      );
    } catch (error: any) {
      if (handleProviderNotReady(error)) return;
      toast.error(error?.response?.data?.message || "Could not upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleAddImageUrl = () => {
    const trimmedUrl = form.imageUrlInput.trim();
    if (!trimmedUrl) return;
    if (form.imageUrls.length >= MAX_PRODUCT_IMAGES) {
      toast.error(`You can upload up to ${MAX_PRODUCT_IMAGES} product images.`);
      return;
    }

    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, trimmedUrl].slice(0, MAX_PRODUCT_IMAGES),
      imageUrlInput: "",
    }));
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleSetPrimaryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: moveImageToFront(prev.imageUrls, index),
    }));
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
                        <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-warm ring-1 ring-sand">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-4 w-4 text-brown" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{product.name}</p>
                          <p className="line-clamp-1 max-w-[300px] text-xs text-muted">{product.description}</p>
                          <p className="mt-1 text-[11px] font-medium text-muted">
                            {product.images?.length || 0} image{product.images?.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{product.category}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink">{formatVnd(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-ink">{product.stock}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          product.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {product.status}
                        </span>
                        <span>
                          {product.isHot ? "Hot " : ""}
                          {product.isRecommended ? "Recommended" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          disabled={togglingProductId === product._id}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium ${
                            product.status === "active"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          } disabled:opacity-60`}
                        >
                          {togglingProductId === product._id ? "Saving..." : product.status === "active" ? "Hide" : "Show"}
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-1.5 text-sm font-medium text-ink hover:bg-warm"
                        >
                          <Edit3 className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          disabled={archivingProductId === product._id}
                          className="inline-flex items-center gap-1 rounded-lg border border-rust/30 px-3 py-1.5 text-sm font-medium text-rust hover:bg-[#fff1eb]"
                        >
                          <Trash2 className="h-4 w-4" /> Archive
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
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-3xl font-bold italic text-ink">
                {editing ? "Edit Product" : "Create Product"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="grid h-9 w-9 place-items-center rounded-full border border-sand bg-white text-muted shadow-sm hover:bg-warm hover:text-ink"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Price (VND)</p>
                <div className="grid gap-3">
                  <input
                    type="number"
                    min={0}
                    step="1000"
                    required
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="Price in VND"
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  />
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}
                    className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-sand/80 bg-warm/30 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Inventory</p>
                <div className="grid gap-3">
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
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-warm disabled:opacity-60"
                      >
                        {uploadingImage ? "Uploading..." : "Upload from device"}
                      </button>
                      <span className="text-xs font-medium text-muted">
                        {form.imageUrls.length}/{MAX_PRODUCT_IMAGES} images
                      </span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      value={form.imageUrlInput}
                      onChange={(e) => setForm((p) => ({ ...p, imageUrlInput: e.target.value }))}
                      placeholder="Paste image URL"
                      className="flex-1 rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="rounded-xl border border-sand bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-warm"
                    >
                      Add URL
                    </button>
                  </div>
                  {form.imageUrls.length ? (
                    <div className="sm:col-span-2">
                      <div className="mb-3 text-xs font-medium text-muted">
                        The first image is used as the product cover in the catalog.
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {form.imageUrls.map((image, index) => (
                          <div
                            key={`${image}-${index}`}
                            className="relative overflow-hidden rounded-2xl border border-sand bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(index)}
                              className="block aspect-[4/3] w-full"
                            >
                              <img
                                src={image}
                                alt={`Product preview ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
                              aria-label={`Remove image ${index + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              {index === 0 ? "Cover" : "Set as cover"}
                            </div>
                          </div>
                        ))}
                      </div>
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
