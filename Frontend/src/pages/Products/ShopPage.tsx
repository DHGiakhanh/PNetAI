import {
  Bone,
  CarTaxiFront,
  Dog,
  HeartPulse,
  Package2,
  Scissors,
  ToyBrick,
  UtensilsCrossed,
  Plus,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { productService, Product } from "../../services/product.service";
import { categoryService } from "../../services/category.service";
import { cartService } from "../../services/cart.service";
import Pagination from "@/components/common/Pagination";
import { formatVnd } from "@/utils/currency";
import { MarketplaceSearchBar } from "@/components/common/MarketplaceSearchBar";

type CategoryItem = {
  id: string;
  label: string;
  apiValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warm" | "sand" | "sage" | "caramel" | "blush" | "cream";
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  all: Dog,
  food: UtensilsCrossed,
  toys: ToyBrick,
  accessories: Package2,
  health: HeartPulse,
  grooming: Scissors,
  travel: CarTaxiFront,
};

const toneStyles: Record<CategoryItem["tone"], { bg: string; fg: string }> = {
  warm: { bg: "bg-warm", fg: "text-brown-dark" },
  sand: { bg: "bg-sand", fg: "text-brown" },
  sage: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  caramel: { bg: "bg-caramel/20", fg: "text-brown" },
  blush: { bg: "bg-blush/30", fg: "text-rust" },
  cream: { bg: "bg-cream", fg: "text-muted" },
};

type ShopItem = {
  id: string;
  title: string;
  subtitle: string;
  providerName: string;
  meta: string;
  imageUrl: string;
  href: string;
  addLabel: string;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function slugifyCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseSort(value: string | null): SortValue {
  if (SORT_OPTIONS.some((item) => item.value === value)) {
    return value as SortValue;
  }
  return "newest";
}

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<CategoryItem["id"]>(
    searchParams.get("category") || "all",
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState<SortValue>(parseSort(searchParams.get("sort")));
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parsePage(searchParams.get("page")));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const requestIdRef = useRef(0);
  const pageSize = 8;

  useEffect(() => {
    const categoryParam = searchParams.get("category") || "all";
    const queryParam = searchParams.get("q") || "";
    const pageParam = parsePage(searchParams.get("page"));
    const sortParam = parseSort(searchParams.get("sort"));

    setActiveCategory((prev) => (prev === categoryParam ? prev : categoryParam));
    setSearchInput((prev) => (prev === queryParam ? prev : queryParam));
    setSearchQuery((prev) => (prev === queryParam ? prev : queryParam));
    setCurrentPage((prev) => (prev === pageParam ? prev : pageParam));
    setSortBy((prev) => (prev === sortParam ? prev : sortParam));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized === searchQuery) return;
      setSearchQuery(normalized);
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getCategories();
        const rawCategoryItems: CategoryItem[] = [
          { id: "all", label: "All", icon: iconMap.all, tone: "cream" },
          ...categoriesData.map((cat, index) => {
            const categoryKey = slugifyCategory(cat.name);

            return {
              id: categoryKey,
              label: cat.name,
              apiValue: cat.name,
              icon: iconMap[categoryKey] || Bone,
              tone: (["warm", "sand", "sage", "caramel", "blush", "cream"] as const)[index % 6],
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
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeCategory === "all") return;
    if (categories.length === 0) return;
    if (!categories.some((category) => category.id === activeCategory)) {
      setActiveCategory("all");
      setCurrentPage(1);
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (searchQuery) nextParams.set("q", searchQuery);
    if (activeCategory !== "all") nextParams.set("category", activeCategory);
    if (sortBy !== "newest") nextParams.set("sort", sortBy);
    if (currentPage > 1) nextParams.set("page", currentPage.toString());

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeCategory, currentPage, searchParams, searchQuery, setSearchParams, sortBy]);

  useEffect(() => {
    if (activeCategory !== "all" && categories.length === 0) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const activeCategoryConfig = categories.find((category) => category.id === activeCategory);

    const fetchProducts = async () => {
      try {
        if (hasFetchedOnce) {
          setSearching(true);
        } else {
          setLoading(true);
        }

        const response = await productService.getProducts({
          search: searchQuery || undefined,
          category: activeCategoryConfig?.apiValue,
          sort: sortBy,
          page: currentPage,
          limit: pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        setProducts(response.products);
        setTotalPages(Math.max(1, response.pagination.pages || 1));
        setTotalItems(response.pagination.total || 0);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error("Error fetching products:", error);
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setSearching(false);
        setHasFetchedOnce(true);
      }
    };

    fetchProducts();
  }, [activeCategory, categories, currentPage, pageSize, searchQuery, sortBy]);

  const items = useMemo<ShopItem[]>(() => {
    return products.map((product) => {
      const providerName =
        typeof product.providerId === "string"
          ? "Service Provider"
          : product.providerId?.name || "Service Provider";

      return {
        id: product._id,
        title: product.name,
        subtitle: product.category,
        providerName,
        meta: formatVnd(product.price),
        imageUrl:
          product.images[0] ||
          "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop",
        href: `/products/${product._id}`,
        addLabel: `Add ${product.name} to cart`,
      };
    });
  }, [products]);

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

  const activeCategoryLabel =
    activeCategory === "all"
      ? undefined
      : categories.find((category) => category.id === activeCategory)?.label;
  const hasActiveFilters = Boolean(searchQuery) || activeCategory !== "all" || sortBy !== "newest";
  const hasCatalogData = totalItems > 0;
  const isSearchBusy = searching || searchInput.trim() !== searchQuery;

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm via-cream to-warm">
      <div className="mx-auto max-w-6xl px-5 pb-16">
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

        <section className="mt-6">
          <MarketplaceSearchBar
            mode="products"
            value={searchInput}
            placeholder="Search food, toys, supplements, grooming essentials..."
            loading={isSearchBusy}
            resultCount={totalItems}
            activeCategoryLabel={activeCategoryLabel}
            hasResults={hasCatalogData}
            onChange={setSearchInput}
            onClear={() => {
              setSearchInput("");
              setSearchQuery("");
              setCurrentPage(1);
            }}
          />
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const tone = toneStyles[category.tone];
              const active = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);
                    setCurrentPage(1);
                  }}
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
                    <Icon
                      className={`h-4 w-4 ${active ? "text-white" : tone.fg}`}
                    />
                  </span>
                  {category.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted">
                {searchQuery
                  ? `Showing matches for "${searchQuery}"`
                  : activeCategory === "all"
                    ? "Trending for Your Pet(s)"
                    : `Results in ${activeCategoryLabel ?? "Category"}`}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setActiveCategory("all");
                  setSortBy("newest");
                  setCurrentPage(1);
                }}
                className="text-sm font-semibold text-brown hover:text-brown-dark"
              >
                Clear search
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end">
            <label className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-sand">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(parseSort(event.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-full border border-sand bg-warm px-3 py-1 text-sm font-semibold text-ink outline-none focus:border-caramel"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="mb-4 aspect-[4/3] rounded-[22px] bg-sand" />
                  <div className="mb-2 h-4 rounded bg-sand" />
                  <div className="h-4 w-3/4 rounded bg-sand" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="mt-5 rounded-[26px] border border-sand bg-white/80 p-8 text-center shadow-sm">
              <h3 className="font-serif text-2xl font-bold italic text-ink">
                {hasActiveFilters
                  ? "No matching products found"
                  : "No products are available yet"}
              </h3>
              <p className="mt-3 text-sm font-semibold text-muted">
                {hasActiveFilters
                  ? "Try a broader keyword or clear the category filter to explore more items."
                  : "The shop catalog is still being prepared. Check back once providers publish products."}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sand"
                >
                  <Link to={item.href} className="block">
                    <div className="relative aspect-[4/3] bg-warm">
                      <img
                        alt={item.title}
                        src={item.imageUrl}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-muted">
                      {item.subtitle}
                    </p>
                    <Link to={item.href} className="block">
                      <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-ink hover:underline">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-brown">
                      by {item.providerName}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-ink">
                        {item.meta}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item.id)}
                        disabled={addingId === item.id}
                        className="grid h-9 w-9 place-items-center rounded-full bg-brown text-white shadow-sm hover:bg-brown-dark disabled:opacity-60"
                        aria-label={item.addLabel}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && items.length > 0 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          ) : null}
        </section>

        <section className="mt-10 grid gap-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
            <Dog className="h-6 w-6 text-brown" />
            <div>
              <p className="text-sm font-extrabold text-ink">Curated picks</p>
              <p className="text-xs font-semibold text-muted">
                Based on pet needs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
            <CarTaxiFront className="h-6 w-6 text-brown" />
            <div>
              <p className="text-sm font-extrabold text-ink">Fast delivery</p>
              <p className="text-xs font-semibold text-muted">
                From trusted sellers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-warm p-4 ring-1 ring-sand">
            <HeartPulse className="h-6 w-6 text-brown" />
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
