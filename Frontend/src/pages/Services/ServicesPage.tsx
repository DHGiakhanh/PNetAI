import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search,
  ChevronRight,
  Loader2, 
  Building2,
  MapPin
} from "lucide-react";
import { serviceService } from "@/services/service.service";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getServices({ 
        limit: 10, 
        page,
        search
      });
      setServices(response.services);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [page, search]);

  const facilities = useMemo(() => {
    // For the UI, we just use the pre-filtered services from backend
    return services;
  }, [services]);

  return (
    <main className="min-h-screen bg-[#FBF9F2] font-sans text-ink">
      <div className="max-w-4xl mx-auto px-4 py-32">
        <div className="text-center mb-24">
           <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-caramel mb-6">
              <div className="w-12 h-px bg-caramel/30"></div>
              Network Directory
              <div className="w-12 h-px bg-caramel/30"></div>
           </div>
           <h1 className="text-6xl font-serif font-bold italic text-ink mb-6 tracking-tight">
              Certified Partner Registry
           </h1>
           <p className="text-muted/60 text-[13px] font-black uppercase tracking-[0.4em]">Authorized Medical & Lifestyle Facilities</p>
           
           <div className="mt-16 max-w-2xl mx-auto relative group">
              <div className="absolute left-8 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-caramel transition-colors">
                 <Search className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Search clinics, pet shops, or wellness centers..." 
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className="w-full bg-white border border-sand px-16 py-8 rounded-full text-lg outline-none shadow-xl shadow-ink/5 focus:border-caramel/30 focus:ring-12 focus:ring-warm transition-all font-bold text-ink placeholder:text-muted/20"
              />
           </div>
        </div>

        <section className="bg-white rounded-[4rem] p-8 shadow-2xl shadow-ink/5 border border-sand/30">
           {loading ? (
             <div className="py-40 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-caramel/40" />
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-muted/40 animate-pulse font-serif italic">Synchronizing Global Network...</p>
             </div>
           ) : (
             <div className="divide-y divide-sand/10">
                {facilities.map((facility) => (
                  <Link 
                    key={facility._id}
                    to={`/services/${facility._id}`}
                    className="flex items-start gap-10 py-14 hover:bg-warm/30 transition-all group px-12 rounded-[3.5rem]"
                  >
                     <div className="w-24 h-24 rounded-3xl border border-sand/50 flex items-center justify-center bg-white shadow-sm shrink-0 overflow-hidden relative">
                        {facility.images?.[0] ? (
                          <img src={facility.images[0]} alt="" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
                        ) : (
                          <Building2 className="w-12 h-12 text-sand/30" />
                        )}
                        <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>

                      <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-center gap-4 mb-3">
                            <h3 className="text-3xl font-serif font-bold italic text-ink group-hover:text-caramel transition-colors tracking-tight">
                               {facility.providerName || facility.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
                               {(facility.categories || [facility.category]).map((cat: string) => (
                                  <span key={cat} className="px-2 py-0.5 bg-caramel/10 text-caramel text-[8px] font-black uppercase tracking-widest rounded-md border border-caramel/5">
                                     {cat}
                                  </span>
                               ))}
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <MapPin className="w-4 h-4 text-caramel shrink-0 mt-1" />
                            <p className="text-[12px] text-muted font-medium leading-relaxed line-clamp-2">
                               {facility.providerAddress || facility.location?.address}
                            </p>
                         </div>
                      </div>

                     <div className="h-14 w-14 rounded-full border border-sand bg-white text-muted/30 flex items-center justify-center group-hover:bg-ink group-hover:text-white group-hover:border-ink group-hover:shadow-2xl group-hover:shadow-ink/20 transition-all self-center">
                        <ChevronRight className="w-7 h-7" />
                     </div>
                  </Link>
                ))}

                {facilities.length === 0 && (
                  <div className="py-48 text-center bg-warm/20 rounded-[3rem] border border-dashed border-sand">
                     <p className="text-lg font-serif italic text-muted/40">No certified partners found matching your criteria.</p>
                     <button onClick={() => setSearch("")} className="mt-6 text-[10px] font-black uppercase tracking-widest text-caramel hover:underline">Reset Search Filters</button>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="py-10 flex items-center justify-center gap-4">
                     <button 
                       disabled={page === 1}
                       onClick={() => setPage(p => Math.max(1, p - 1))}
                       className="px-6 py-3 rounded-2xl border border-sand text-[10px] font-black uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition shadow-sm disabled:opacity-20 disabled:pointer-events-none"
                     >
                        Previous
                     </button>
                     <div className="flex items-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                           <button 
                             key={i}
                             onClick={() => setPage(i + 1)}
                             className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? "bg-caramel text-white shadow-lg" : "bg-warm text-muted/40 hover:bg-sand/30"}`}
                           >
                              {i + 1}
                           </button>
                        ))}
                     </div>
                     <button 
                       disabled={page === totalPages}
                       onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                       className="px-6 py-3 rounded-2xl border border-sand text-[10px] font-black uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition shadow-sm disabled:opacity-20 disabled:pointer-events-none"
                     >
                        Next
                     </button>
                  </div>
                )}
             </div>
           )}
        </section>
      </div>
    </main>
  );
}
