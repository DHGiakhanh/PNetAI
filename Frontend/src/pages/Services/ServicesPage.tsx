import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock3, Scissors, Stethoscope } from "lucide-react";
import { serviceService, Service } from "@/services/service.service";
import Pagination from "@/components/common/Pagination";
import { formatVnd } from "@/utils/currency";

type ServiceCategory = "all" | "grooming" | "vet";

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
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await serviceService.getServices({ limit: 50 });
        setServices(response.services);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    if (activeCategory === "all") return services;
    if (activeCategory === "grooming") return services.filter((s) => s.category === "Grooming");
    return services.filter((s) => s.category !== "Grooming");
  }, [activeCategory, services]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const paginatedServices = useMemo(
    () => filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredServices, currentPage]
  );

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
        <div className="flex flex-wrap gap-3">
          {[
            { id: "all" as const, label: "All", icon: CalendarDays },
            { id: "grooming" as const, label: "Grooming", icon: Scissors },
            { id: "vet" as const, label: "Veterinary", icon: Stethoscope },
          ].map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
                  active
                    ? "bg-slate-900 text-white ring-slate-900"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        {loading ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 rounded-[22px] mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedServices.map((s) => (
              <article key={s._id} className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sky-200/80">
                <Link to={`/services/${s._id}`} className="block">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <img
                      alt={s.title}
                      src={
                        s.images[0] ||
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
                  <p className="text-xs font-semibold text-slate-400">Service • {s.category}</p>
                  <Link to={`/services/${s._id}`} className="block">
                    <h3 className="mt-1 line-clamp-1 text-sm font-extrabold text-slate-900 hover:underline">{s.title}</h3>
                  </Link>
                  {getProviderName(s) ? (
                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-sky-700">
                      by {getProviderName(s)}
                    </p>
                  ) : null}
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted">
                    <Clock3 className="h-3.5 w-3.5" />
                    Working hours: {getWorkingHoursText(s)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900">{formatVnd(s.basePrice)}</span>
                    <Link
                      to={`/services/${s._id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sky-600 px-3 text-xs font-extrabold text-white shadow-sm hover:bg-sky-700"
                      aria-label={`Book ${s.title}`}
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
        {!loading ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredServices.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </main>
  );
}
