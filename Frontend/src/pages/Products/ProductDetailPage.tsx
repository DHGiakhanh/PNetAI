import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Minus, Plus, ShieldCheck, Star } from "lucide-react";
import toast from "react-hot-toast";
import { productService, Product } from "../../services/product.service";
import { cartService } from "../../services/cart.service";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getProductProviderName(product: Product) {
  if (typeof product.providerId === "string") return "Service Provider";
  return product.providerId?.name || "Service Provider";
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

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

  const handleAddToCart = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart.");
      navigate("/login");
      return;
    }

    try {
      setAddLoading(true);
      await cartService.addToCart(product._id, qty);
      toast.success("Added to cart successfully.");
      window.dispatchEvent(new Event("cart:updated"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not add to cart.");
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-sand rounded mb-4 w-32"></div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] bg-sand rounded-[28px]"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="space-y-4">
                <div className="h-4 bg-sand rounded w-20"></div>
                <div className="h-8 bg-sand rounded w-3/4"></div>
                <div className="h-20 bg-sand rounded"></div>
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
        <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
          <p className="text-sm font-semibold text-muted">Product not found.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
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
  const providerName = getProductProviderName(product);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      {/* Breadcrumb + back */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-sand hover:bg-warm"
        >
          <Heart className="h-4 w-4 text-brown" />
          Save
        </button>
      </div>

      <section className="grid gap-6 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-sand">
            <div className="relative aspect-[4/3] bg-warm">
              {activeImage ? (
                <img
                  alt={product.name}
                  src={activeImage}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-semibold text-muted">
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
                    idx === activeImageIdx ? "ring-caramel" : "ring-sand"
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
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
              {product.category}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-extrabold italic leading-snug text-ink">
              {product.name}
            </h1>
            <p className="mt-1 text-xs font-semibold text-brown">Provided by {providerName}</p>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-700 ring-1 ring-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.averageRating.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-muted">
                  ({product.totalReviews} reviews)
                </span>
              </div>
              <span className="text-2xl font-extrabold text-ink">
                {formatUsd(product.price)}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">
              {product.description}
            </p>

            <div className="mt-5 grid gap-4">
              {/* Quantity */}
              <div>
                <p className="font-serif text-sm font-extrabold italic text-ink">Quantity</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-warm p-1 ring-1 ring-sand">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4 text-ink" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-extrabold text-ink">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4 text-ink" />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-1 grid gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addLoading || product.stock <= 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brown px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-brown-dark disabled:opacity-60"
                >
                  {addLoading ? "Adding..." : `Add to cart · ${formatUsd(product.price * qty)}`}
                </button>
                <div className="flex items-center gap-2 rounded-2xl bg-warm p-4 ring-1 ring-sand">
                  <ShieldCheck className="h-5 w-5 text-brown" />
                  <p className="text-sm font-semibold text-ink">
                    Free returns within 7 days · Community verified picks
                  </p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="mt-6">
              <p className="font-serif text-sm font-extrabold italic text-ink">Product Info</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Stock Available</span>
                  <span className="text-xs font-extrabold text-muted">{product.stock} units</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Category</span>
                  <span className="text-xs font-extrabold text-muted">{product.category}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Service Provider</span>
                  <span className="text-xs font-extrabold text-muted">{providerName}</span>
                </div>
                {product.isHot && (
                  <div className="flex items-center justify-between rounded-2xl bg-[#fff5f1] px-4 py-3 text-sm font-semibold text-rust ring-1 ring-rust/25">
                    <span>Hot Product</span>
                    <span className="text-xs font-extrabold text-rust">🔥</span>
                  </div>
                )}
                {product.isRecommended && (
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span>Recommended</span>
                    <span className="text-xs font-extrabold text-emerald-600">⭐</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky add-on card */}
          <div className="mt-5 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-sand">
            <p className="font-serif text-sm font-extrabold italic text-ink">Selected</p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-muted">
              <span>Quantity</span>
              <span className="font-extrabold text-ink">{qty}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <p className="font-serif text-lg font-extrabold italic text-ink">You may also like</p>
          <Link
            to="/products"
            className="text-sm font-semibold text-brown hover:text-brown-dark"
          >
            Browse all
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p._id}`}
              className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sand hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-warm">
                <img
                  alt={p.name}
                  src={p.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-muted">{p.category}</p>
                <p className="mt-1 line-clamp-1 text-sm font-extrabold text-ink">
                  {p.name}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-brown">
                  by {getProductProviderName(p)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-ink">
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
