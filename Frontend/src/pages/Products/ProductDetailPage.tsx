import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Minus, Plus, ShieldCheck, Star } from "lucide-react";
import { productService, Product } from "../../services/product.service";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<"S" | "M" | "L">("M");

  useEffect(() => {
    if (productId) {
      fetchProduct(productId);
      fetchRelatedProducts();
    }
  }, [productId]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const productData = await productService.getProductById(id);
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 4 });
      setRelatedProducts(response.products);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] bg-gray-200 rounded-[28px]"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-500">Product not found.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images.length ? product.images : [];
  const activeImage = images[Math.min(activeImageIdx, Math.max(images.length - 1, 0))];

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      {/* Breadcrumb + back */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <Heart className="h-4 w-4 text-pink-500" />
          Save
        </button>
      </div>

      <section className="grid gap-6 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="relative aspect-[4/3] bg-slate-50">
              {activeImage ? (
                <img
                  alt={product.name}
                  src={activeImage}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-semibold text-slate-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto p-4">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ${
                    idx === activeImageIdx ? "ring-sky-300" : "ring-slate-200"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img alt="" src={img} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              {product.category}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-snug text-slate-900">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-700 ring-1 ring-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  ({product.totalReviews} reviews)
                </span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatUsd(product.price)}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600">
              {product.description}
            </p>

            <div className="mt-5 grid gap-4">
              {/* Size */}
              <div>
                <p className="text-sm font-extrabold text-slate-900">Size</p>
                <div className="mt-2 flex gap-2">
                  {(["S", "M", "L"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`rounded-full px-4 py-2 text-sm font-extrabold ring-1 ${
                        size === s
                          ? "bg-sky-600 text-white ring-sky-600"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <p className="text-sm font-extrabold text-slate-900">Quantity</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-50 p-1 ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4 text-slate-700" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-extrabold text-slate-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-1 grid gap-3">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-pink-600"
                >
                  Add to cart · {formatUsd(product.price * qty)}
                </button>
                <div className="flex items-center gap-2 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  <p className="text-sm font-semibold text-slate-700">
                    Free returns within 7 days · Community verified picks
                  </p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="mt-6">
              <p className="text-sm font-extrabold text-slate-900">Product Info</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  <span>Stock Available</span>
                  <span className="text-xs font-extrabold text-slate-400">{product.stock} units</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  <span>Category</span>
                  <span className="text-xs font-extrabold text-slate-400">{product.category}</span>
                </div>
                {product.isHot && (
                  <div className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                    <span>Hot Product</span>
                    <span className="text-xs font-extrabold text-red-400">🔥</span>
                  </div>
                )}
                {product.isRecommended && (
                  <div className="flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 ring-1 ring-green-200">
                    <span>Recommended</span>
                    <span className="text-xs font-extrabold text-green-400">⭐</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky add-on card */}
          <div className="mt-5 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-extrabold text-slate-900">Selected</p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Size</span>
              <span className="font-extrabold text-slate-900">{size}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Qty</span>
              <span className="font-extrabold text-slate-900">{qty}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <p className="text-sm font-extrabold text-slate-900">You may also like</p>
          <Link
            to="/products"
            className="text-sm font-semibold text-pink-500 hover:text-pink-600"
          >
            Browse all
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p._id}`}
              className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-slate-50">
                <img
                  alt={p.name}
                  src={p.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-400">{p.category}</p>
                <p className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900">
                  {p.name}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatUsd(p.price)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {p.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

