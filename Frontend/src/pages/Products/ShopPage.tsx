import {
  Bone,
  Cat,
  Dog,
  Scissors,
  Stethoscope,
  ToyBrick,
  Shirt,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { productService, Product } from "../../services/product.service";
import { categoryService } from "../../services/category.service";
import { cartService } from "../../services/cart.service";
import Pagination from "@/components/common/Pagination";

type CategoryItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warm" | "sand" | "sage" | "caramel" | "blush" | "cream";
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "🍖": Bone,
  "🎾": ToyBrick,
  "🎀": Shirt,
  "💊": Stethoscope,
  "✂️": Scissors,
  "🧳": Cat,
};

const toneStyles: Record<CategoryItem["tone"], { bg: string; fg: string }> = {
  warm: { bg: "bg-warm", fg: "text-brown-dark" },
  sand: { bg: "bg-sand", fg: "text-brown" },
  sage: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  caramel: { bg: "bg-caramel/20", fg: "text-brown" },
  blush: { bg: "bg-blush/30", fg: "text-rust" },
  cream: { bg: "bg-cream", fg: "text-muted" },
};

type ShopItem =
  {
    id: string;
    title: string;
    subtitle: string;
    providerName: string;
    meta: string;
    imageUrl: string;
    href: string;
    addLabel: string;
    filterKey: "food" | "toys" | "apparel" | "grooming" | "health" | "travel";
  };

export default function ShopPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<CategoryItem["id"]>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesData] = await Promise.all([
        productService.getProducts({ limit: 50 }),
        categoryService.getCategories()
      ]);
      
      setProducts(productsResponse.products);
      
      // Convert backend categories to frontend format
      const rawCategoryItems: CategoryItem[] = [
        { id: "all", label: "All", icon: Dog, tone: "cream" },
        ...categoriesData.map((cat, index) => {
          const categoryId = cat.name.toLowerCase();
          // Map category names to filter keys
          const filterId = categoryId === "accessories" ? "apparel" : categoryId;
          
          return {
            id: filterId,
            label: cat.name,
            icon: iconMap[cat.icon] || Dog,
            tone: (["warm", "sand", "sage", "caramel", "blush", "cream"] as const)[index % 6]
          };
        }),
      ];

      const uniqueCategoryItems: CategoryItem[] = [];
      const seen = new Set<string>();
      for (const item of rawCategoryItems) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        uniqueCategoryItems.push(item);
      }

      setCategories(uniqueCategoryItems);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const items = useMemo<ShopItem[]>(() => {
    return products.map((p) => {
      const providerName =
        typeof p.providerId === "string"
          ? "Service Provider"
          : p.providerId?.name || "Service Provider";

      const filterKey: ShopItem["filterKey"] =
        p.category.toLowerCase() === "food"
          ? "food"
          : p.category.toLowerCase() === "toys"
            ? "toys"
            : p.category.toLowerCase() === "accessories"
              ? "apparel"
              : p.category.toLowerCase() === "health"
                ? "health"
                : p.category.toLowerCase() === "grooming"
                  ? "grooming"
                  : p.category.toLowerCase() === "travel"
                    ? "travel"
                    : "apparel";

      return {
        kind: "product",
        id: p._id,
        title: p.name,
        subtitle: p.category,
        providerName,
        meta: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(p.price),
        imageUrl: p.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop",
        href: `/products/${p._id}`,
        addLabel: `Add ${p.name} to cart`,
        filterKey,
      };
    });
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((i) => i.filterKey === activeCategory);
  }, [activeCategory, items]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedItems = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage]
  );

  const handleAddToCart = async (productId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart.");
      navigate("/login");
      return;
    }

    try {
      setAddingId(productId);
      await cartService.addToCart(productId, 1);
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Added to cart successfully.");
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Could not add item to cart.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm via-cream to-warm">
      <div className="mx-auto max-w-6xl px-5 pb-16">
      {/* Hero */}
      <section className="mt-4 overflow-hidden rounded-[28px] bg-warm ring-1 ring-sand">
        <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brown ring-1 ring-sand">
              Summer Special
            </span>
            <h1 className="mt-4 font-serif text-4xl font-extrabold italic leading-tight text-ink md:text-5xl">
              Get 50% off on
              <br />
              Organic Treats
            </h1>
            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-brown px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brown-dark">
              Shop Now
            </button>
          </div>

          <div className="relative">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-white/60 shadow-sm ring-1 ring-sand">
              <img
                alt="Pets"
                src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1600&auto=format&fit=crop"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => {
            const Icon = c.icon;
            const tone = toneStyles[c.tone];
            const active = c.id === activeCategory;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition ${
                  active
                    ? "bg-brown text-white ring-brown"
                    : "bg-white text-ink ring-sand hover:bg-warm"
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    active ? "bg-white/15" : tone.bg
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-white" : tone.fg}`} />
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </section>

      Results
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">
              {activeCategory === "all"
                ? "Trending for Mochi"
                : `Results in ${categories.find((c) => c.id === activeCategory)?.label ?? "Category"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className="text-sm font-semibold text-brown hover:text-brown-dark"
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-sand rounded-[22px] mb-4"></div>
                <div className="h-4 bg-sand rounded mb-2"></div>
                <div className="h-4 bg-sand rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {paginatedItems.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sand"
              >
                <Link to={p.href} className="block">
                  <div className="relative aspect-[4/3] bg-warm">
                    <img
                      alt={p.title}
                      src={p.imageUrl}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs font-semibold text-muted">
                    {p.subtitle}
                  </p>
                  <Link to={p.href} className="block">
                    <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-ink hover:underline">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-brown">
                    by {p.providerName}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-ink">
                      {"meta" in p ? p.meta : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p.id)}
                      disabled={addingId === p.id}
                      className="grid h-9 w-9 place-items-center rounded-full bg-brown text-white shadow-sm hover:bg-brown-dark"
                      aria-label={p.addLabel}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!loading ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>

      {/* Spacer section to match airy layout */}
      <section className="mt-10 grid gap-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
          <Dog className="h-6 w-6 text-brown" />
          <div>
            <p className="text-sm font-extrabold text-ink">
              Curated picks
            </p>
            <p className="text-xs font-semibold text-muted">
              Based on pet needs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
          <Cat className="h-6 w-6 text-brown" />
          <div>
            <p className="text-sm font-extrabold text-ink">Fast delivery</p>
            <p className="text-xs font-semibold text-muted">
              From trusted sellers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
          <Bone className="h-6 w-6 text-brown" />
          <div>
            <p className="text-sm font-extrabold text-ink">
              Quality guaranteed
            </p>
            <p className="text-xs font-semibold text-muted">
              Community reviewed
            </p>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
