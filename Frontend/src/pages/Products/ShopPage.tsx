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
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
import { petService, Pet } from "@/services/pet.service";
import { motion, AnimatePresence } from "framer-motion";

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
  tags: string[];
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
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(parsePage(searchParams.get("page")));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [recommendationIndex, setRecommendationIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const requestIdRef = useRef(0);

  const AVAILABLE_TAGS = [
    "dog", "cat", "bird", "rabbit", "hamster", "other",
    "food", "toys", "accessories", "medical", "grooming", "travel"
  ];
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
    const fetchUserPets = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const pets = await petService.getMyPets();
        setUserPets(pets);
      } catch (error) {
        console.error("Error fetching user pets:", error);
      }
    };
    fetchUserPets();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (userPets.length === 0) {
        setRecommendedProducts([]);
        return;
      }

      try {
        setLoadingRecommendations(true);
        const speciesTags = Array.from(new Set(userPets.map(p => p.species.toLowerCase())));
        const response = await productService.getProducts({
          tags: speciesTags.join(","),
          limit: 12
        });
        setRecommendedProducts(response.products);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [userPets]);

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

    const fetchProducts = async () => {
      try {
        setSearching(true);
        const response = await productService.getProducts({
          page: currentPage,
          limit: pageSize,
          search: searchQuery,
          category: activeCategory === "all" ? undefined : activeCategory,
          tags: selectedTags.length > 0 ? selectedTags.join(",") : undefined,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          sort: sortBy,
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
      }
    };

    fetchProducts();
  }, [activeCategory, categories, currentPage, pageSize, searchQuery, sortBy, selectedTags, priceRange]);

  const mapToShopItem = (product: Product): ShopItem => {
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
      imageUrl: product.images[0] || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=500&auto=format&fit=crop",
      href: `/products/${product._id}`,
      addLabel: "Add to cart",
      tags: product.tags || [],
    };
  };

  const items = useMemo<ShopItem[]>(() => {
    return products.map(mapToShopItem);
  }, [products]);

  const recommendedItems = useMemo<ShopItem[]>(() => {
    return recommendedProducts.map(mapToShopItem);
  }, [recommendedProducts]);

  const nextRecommendation = () => {
    setRecommendationIndex((prev: number) => (prev + 1) % Math.max(1, recommendedItems.length));
  };

  const prevRecommendation = () => {
    setRecommendationIndex((prev: number) => (prev - 1 + recommendedItems.length) % Math.max(1, recommendedItems.length));
  };

  const visibleRecommendations = useMemo(() => {
    if (recommendedItems.length <= 4) return recommendedItems;
    const result = [];
    for (let i = 0; i < 4; i++) {
      result.push(recommendedItems[(recommendationIndex + i) % recommendedItems.length]);
    }
    return result;
  }, [recommendedItems, recommendationIndex]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const val = parseInt(e.target.value);
    setPriceRange(prev => {
      const next = [...prev] as [number, number];
      if (type === 'min') next[0] = Math.min(val, next[1]);
      else next[1] = Math.max(val, next[0]);
      return next;
    });
    setCurrentPage(1);
  };

  const activeCategoryLabel =
    activeCategory === "all"
      ? undefined
      : categories.find((category) => category.id === activeCategory)?.label;
  const hasActiveFilters = Boolean(searchQuery) || activeCategory !== "all" || sortBy !== "newest" || selectedTags.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000000;
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

        {/* Personalized Recommendations Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-caramel fill-caramel/20" />
              <h2 className="text-xl font-serif font-bold italic text-ink">Personalized Suggestions</h2>
            </div>
            <div className="flex items-center gap-4">
              {userPets.length > 0 && (
                <p className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted/40">
                  Based on your {userPets.length} pet{userPets.length > 1 ? "s" : ""}
                </p>
              )}
              {recommendedItems.length > 4 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={prevRecommendation}
                    className="w-8 h-8 rounded-full border border-sand bg-white flex items-center justify-center text-ink hover:bg-warm transition shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={nextRecommendation}
                    className="w-8 h-8 rounded-full border border-sand bg-white flex items-center justify-center text-ink hover:bg-warm transition shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {userPets.length === 0 ? (
            <div className="bg-white/40 border border-sand border-dashed rounded-[2rem] p-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-warm rounded-full flex items-center justify-center mb-4 ring-1 ring-sand">
                <Dog className="w-6 h-6 text-caramel opacity-40" />
              </div>
              <h3 className="text-sm font-bold text-ink mb-1">Tailor your shop experience</h3>
              <p className="text-xs text-muted mb-4 max-w-xs leading-relaxed">
                You haven't added any pets yet. Add your companions to get personalized product recommendations!
              </p>
              <Link
                to="/my-pets"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-ink text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-caramel transition shadow-lg shadow-ink/10"
              >
                Add Your First Pet
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="relative overflow-hidden py-2 px-1">
              {loadingRecommendations ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="mb-4 aspect-[4/3] rounded-[22px] bg-sand" />
                      <div className="mb-2 h-4 rounded bg-sand" />
                      <div className="h-4 w-3/4 rounded bg-sand" />
                    </div>
                  ))}
                </div>
              ) : recommendedItems.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {visibleRecommendations.map((item, idx) => (
                      <motion.div
                        key={`${item.id}-${(recommendationIndex + idx) % recommendedItems.length}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                      >
                        <article
                          className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sand transition-all hover:shadow-xl hover:-translate-y-1"
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
                            {item.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full bg-warm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brown ring-1 ring-sand/30"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
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
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="col-span-full py-10 text-center bg-warm/20 rounded-[22px] border border-sand/30">
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted/30 italic">No specific products found for your pet's species yet.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex flex-col gap-6 p-6 bg-white rounded-[28px] border border-sand shadow-sm">
            {/* Search Bar */}
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

            {/* Category Filter */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted mb-4">Categories</p>
              <div className="flex flex-wrap gap-2">
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
                          : "bg-warm text-muted ring-sand hover:bg-white hover:text-ink"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full ${
                          active ? "bg-white/15" : tone.bg
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${active ? "text-white" : tone.fg}`}
                        />
                      </span>
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag Filters */}
            <div className="pt-4 border-t border-sand/50">
              <p className="text-xs font-black uppercase tracking-widest text-muted mb-4">Filter by Tags</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ring-1 ${
                        active 
                          ? "bg-caramel text-white ring-caramel shadow-md" 
                          : "bg-warm text-muted ring-sand hover:bg-white hover:text-ink"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Slider */}
            <div className="pt-4 border-t border-sand/50">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-muted">Price Range</p>
                <div className="flex items-center gap-2">
                   <span className="px-3 py-1 bg-warm rounded-full text-[11px] font-bold text-ink ring-1 ring-sand">{formatVnd(priceRange[0])}</span>
                   <span className="text-muted text-xs">—</span>
                   <span className="px-3 py-1 bg-warm rounded-full text-[11px] font-bold text-ink ring-1 ring-sand">{formatVnd(priceRange[1])}</span>
                </div>
              </div>
              
              <div className="relative h-12 flex items-center">
                <div className="absolute w-full h-1.5 bg-warm rounded-full overflow-hidden ring-1 ring-sand/30">
                  <motion.div 
                    className="absolute h-full bg-brown/20"
                    style={{
                      left: `${(priceRange[0] / 10000000) * 100}%`,
                      right: `${100 - (priceRange[1] / 10000000) * 100}%`
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="50000"
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(e, 'min')}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer z-20 h-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-brown [&::-webkit-slider-thumb]:shadow-lg"
                />
                <input
                  type="range"
                  min="0"
                  max="10000000"
                  step="50000"
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(e, 'max')}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer z-20 h-full [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:ring-4 [&::-webkit-slider-thumb]:ring-brown [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <div className="flex justify-between mt-2">
                 <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">Min (0đ)</span>
                 <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">Max (10M+)</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setActiveCategory("all");
                  setSelectedTags([]);
                  setPriceRange([0, 10000000]);
                  setCurrentPage(1);
                }}
                className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-brown transition-colors"
              >
                Reset all filters
              </button>
            </div>
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
                  setSelectedTags([]);
                  setPriceRange([0, 10000000]);
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
                    {item.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-warm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brown ring-1 ring-sand/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
