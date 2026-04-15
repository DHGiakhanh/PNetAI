import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, Clock3, Scissors, Stethoscope } from "lucide-react";
import { serviceService, Service } from "@/services/service.service";
import Pagination from "@/components/common/Pagination";
import { formatVnd } from "@/utils/currency";
import { MarketplaceSearchBar } from "@/components/common/MarketplaceSearchBar";

type ServiceCategory = "all" | "grooming" | "veterinary";

const serviceCategories: Array<{
  id: ServiceCategory;
  label: string;
  icon: typeof CalendarDays;
  apiValue?: string;
}> = [
  { id: "all", label: "All", icon: CalendarDays },
  { id: "grooming", label: "Grooming", icon: Scissors, apiValue: "Grooming" },
  {
    id: "veterinary",
    label: "Veterinary",
    icon: Stethoscope,
    apiValue: "Veterinary",
  },
];

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

const getProviderName = (service: Service) => {
  if (service.providerName) return service.providerName;
  if (typeof service.providerId === "string") return "";
  return service.providerId?.name || "";
};

const getWorkingHoursText = (service: Service) => {
  const start = service.availability?.hours?.start;
  const end = service.availability?.hours?.end;
  if (!start || !end) return "Flexible hours";
  return `${start} - ${end}`;
};

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>(
    (searchParams.get("category") as ServiceCategory) || "all",
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(parsePage(searchParams.get("page")));
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const requestIdRef = useRef(0);
  const pageSize = 6;

  useEffect(() => {
    const categoryParam = (searchParams.get("category") as ServiceCategory) || "all";
    const queryParam = searchParams.get("q") || "";
    const pageParam = parsePage(searchParams.get("page"));
    const validCategory = serviceCategories.some(
      (category) => category.id === categoryParam,
    )
      ? categoryParam
      : "all";

    setActiveCategory((prev) => (prev === validCategory ? prev : validCategory));
    setSearchInput((prev) => (prev === queryParam ? prev : queryParam));
    setSearchQuery((prev) => (prev === queryParam ? prev : queryParam));
    setCurrentPage((prev) => (prev === pageParam ? prev : pageParam));
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
    const nextParams = new URLSearchParams();
    if (searchQuery) nextParams.set("q", searchQuery);
    if (activeCategory !== "all") nextParams.set("category", activeCategory);
    if (currentPage > 1) nextParams.set("page", currentPage.toString());

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeCategory, currentPage, searchParams, searchQuery, setSearchParams]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const categoryFilter =
      serviceCategories.find((category) => category.id === activeCategory)?.apiValue;

    const fetchServices = async () => {
      try {
        if (hasFetchedOnce) {
          setSearching(true);
        } else {
          setLoading(true);
        }

        const response = await serviceService.getServices({
          search: searchQuery || undefined,
          category: categoryFilter,
          page: currentPage,
          limit: pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        setServices(response.services);
        setTotalPages(Math.max(1, response.pagination.pages || 1));
        setTotalItems(response.pagination.total || 0);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        console.error("Error fetching services:", error);
        setServices([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setSearching(false);
        setHasFetchedOnce(true);
      }
    };

    fetchServices();
  }, [activeCategory, currentPage, pageSize, searchQuery]);

  const activeCategoryLabel =
    activeCategory === "all"
      ? undefined
      : serviceCategories.find((category) => category.id === activeCategory)?.label;
  const hasActiveFilters = Boolean(searchQuery) || activeCategory !== "all";
  const hasCatalogData = totalItems > 0;
  const isSearchBusy = searching || searchInput.trim() !== searchQuery;

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="mt-4 overflow-hidden rounded-[28px] bg-emerald-100/70 ring-1 ring-emerald-100">
        <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Professional Care
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
              Book trusted
              <br />
              pet services
            </h1>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Grooming, veterinary, and more from verified providers.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] bg-white/60 shadow-sm ring-1 ring-slate-200">
              <img
                alt="Pet service"
                src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1600&auto=format&fit=crop"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <MarketplaceSearchBar
            mode="services"
            value={searchInput}
            placeholder="Search grooming, checkups, vaccinations, wellness care..."
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
          {serviceCategories.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                  active
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <p className="text-sm font-semibold text-slate-500">
            {searchQuery
              ? `Showing matches for "${searchQuery}"`
              : activeCategory === "all"
                ? "Browse trusted care providers"
                : `Showing ${activeCategoryLabel}`}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setActiveCategory("all");
                setCurrentPage(1);
              }}
              className="text-sm font-semibold text-sky-700 hover:text-sky-800"
            >
              Clear search
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="mb-4 aspect-[4/3] rounded-[22px] bg-gray-200" />
                <div className="mb-2 h-4 rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="mt-5 rounded-[26px] border border-sky-100 bg-white p-8 text-center shadow-sm">
            <h3 className="text-2xl font-extrabold text-slate-900">
              {hasActiveFilters
                ? "No matching services found"
                : "No services are available yet"}
            </h3>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {hasActiveFilters
                ? "Try a broader keyword or clear the service category filter to expand the results."
                : "Providers have not published available services yet. Check back once the catalog is ready."}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id}
                className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sky-200/80"
              >
                <Link to={`/services/${service._id}`} className="block">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <img
                      alt={service.title}
                      src={
                        service.images[0] ||
                        "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
                      }
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-extrabold text-sky-700 ring-1 ring-sky-200">
                      Service
                    </span>
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Service • {service.category}
                  </p>
                  <Link to={`/services/${service._id}`} className="block">
                    <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900 hover:underline">
                      {service.title}
                    </h3>
                  </Link>
                  {getProviderName(service) ? (
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-sky-700">
                      by {getProviderName(service)}
                    </p>
                  ) : null}
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted">
                    <Clock3 className="h-3.5 w-3.5" />
                    Working hours: {getWorkingHoursText(service)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">
                      {formatVnd(service.basePrice)}
                    </span>
                    <Link
                      to={`/services/${service._id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700"
                      aria-label={`Book ${service.title}`}
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      Book
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && services.length > 0 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </main>
  );
}
