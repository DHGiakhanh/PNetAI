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
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { productService, Product } from "../../services/product.service";
import { categoryService } from "../../services/category.service";
import { serviceService, Service } from "../../services/service.service";

type CategoryItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "pink" | "blue" | "green" | "orange" | "purple" | "slate";
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
  pink: { bg: "bg-pink-100", fg: "text-pink-600" },
  blue: { bg: "bg-sky-100", fg: "text-sky-600" },
  green: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  orange: { bg: "bg-orange-100", fg: "text-orange-600" },
  purple: { bg: "bg-violet-100", fg: "text-violet-600" },
  slate: { bg: "bg-slate-100", fg: "text-slate-600" },
};

type ShopItem =
  | {
      kind: "product";
      id: string;
      title: string;
      subtitle: string;
      meta: string;
      imageUrl: string;
      href: string;
      addLabel: string;
      filterKey: "food" | "toys" | "apparel" | "grooming" | "vet" | "health" | "travel";
    }
  | {
      kind: "service";
      id: string;
      title: string;
      subtitle: string;
      meta: string;
      imageUrl: string;
      href: string;
      addLabel: string;
      filterKey: "grooming" | "vet";
    };

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<Category["id"]>("all");

  const items = useMemo<ShopItem[]>(() => {
    const productItems: ShopItem[] = products.map((p) => {
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

    const serviceItems: ShopItem[] = services.map((s) => {
      const filterKey: ShopItem["filterKey"] =
        s.category === "Grooming" ? "grooming" : "vet";

      return {
        kind: "service",
        id: s._id,
        title: s.title,
        subtitle: s.category,
        meta: `$${s.basePrice.toFixed(2)}`,
        imageUrl: s.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop",
        href: `/services/${s._id}`,
        addLabel: `Book ${s.title}`,
        filterKey,
      };
    });

    return [...serviceItems, ...productItems];
  }, [products]);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((i) => i.filterKey === activeCategory);
  }, [activeCategory, items]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      {/* Hero */}
      <section className="mt-4 overflow-hidden rounded-[28px] bg-sky-100/70 ring-1 ring-sky-100">
        <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
              Summer Special
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
              Get 50% off on
              <br />
              Organic Treats
            </h1>
            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              Shop Now
            </button>
          </div>

          <div className="relative">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-white/60 shadow-sm ring-1 ring-slate-200">
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
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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

      {/* Results */}
      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {activeCategory === "all"
                ? "Trending for Mochi"
                : `Results in ${categories.find((c) => c.id === activeCategory)?.label ?? "Category"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className="text-sm font-semibold text-pink-500 hover:text-pink-600"
          >
            Reset
          </button>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-[22px] mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-slate-200"
              >
                <Link to={p.href} className="block">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <img
                      alt={p.title}
                      src={p.imageUrl}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    {p.subtitle}
                  </p>
                  <Link to={p.href} className="block">
                    <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900 hover:underline">
                      {p.title}
                    </h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">
                      {"meta" in p ? p.meta : ""}
                    </span>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-full bg-pink-500 text-white shadow-sm hover:bg-pink-600"
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
      </section>

      {/* Spacer section to match airy layout */}
      <section className="mt-10 grid gap-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <Dog className="h-6 w-6 text-slate-700" />
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Curated picks
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Based on pet needs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <Cat className="h-6 w-6 text-slate-700" />
          <div>
            <p className="text-sm font-extrabold text-slate-900">Fast delivery</p>
            <p className="text-xs font-semibold text-slate-500">
              From trusted sellers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <Bone className="h-6 w-6 text-slate-700" />
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              Quality guaranteed
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Community reviewed
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

