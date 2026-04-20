import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search,
  ChevronRight,
  Loader2, 
  Building2,
  Stethoscope,
  Sparkles
} from "lucide-react";
import { serviceService, Service } from "@/services/service.service";
import { motion, AnimatePresence } from "framer-motion";

type ServiceTab = "clinic" | "spa";

const TABS = [
  { id: "clinic" as const, label: "Medical Clinics", icon: Stethoscope },
  { id: "spa" as const, label: "Spa & Grooming", icon: Sparkles },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<ServiceTab>("clinic");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        // We fetch all services and filter them client-side for the premium facility list
        const response = await serviceService.getServices({ limit: 100 });
        setServices(response.services);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredFacilities = useMemo(() => {
    const providerMap = new Map<string, Service>();
    services.forEach(s => {
      const providerKey = typeof s.providerId === 'object' ? s.providerId?._id : s.providerId;
      if (!providerKey) return;
      
      const cat = s.category?.toLowerCase() || "";
      const tit = s.title.toLowerCase();
      
      let matchesTab = false;
      if (activeTab === "clinic") matchesTab = cat.includes("clinic") || cat.includes("vet") || tit.includes("phòng khám") || tit.includes("bệnh viện");
      if (activeTab === "spa") matchesTab = cat.includes("grooming") || cat.includes("spa") || cat.includes("làm đẹp") || tit.includes("spa");

      if (matchesTab && !providerMap.has(providerKey)) {
        providerMap.set(providerKey, s);
      }
    });

    return Array.from(providerMap.values()).filter(f => {
      const s = search.toLowerCase();
      return (f.providerName?.toLowerCase() || "").includes(s) ||
             f.title.toLowerCase().includes(s) || 
             (f.location?.address || "").toLowerCase().includes(s) ||
             f.category.toLowerCase().includes(s);
    });
  }, [activeTab, services, search]);

  return (
    <main className="min-h-screen bg-[#FBF9F2] font-sans text-ink">
      {/* PNetAI English Navigation */}
      <nav className="bg-white border-b border-sand/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
           <div className="flex items-center justify-center space-x-12">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center gap-3 py-7 px-4 transition-all group ${
                      active ? "text-caramel font-black" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? "text-caramel" : "text-muted/60 group-hover:text-ink"}`} />
                    <span className="text-[11px] uppercase tracking-[0.2em] font-black">{tab.label}</span>
                    <AnimatePresence>
                      {active && (
                        <motion.div 
                          layoutId="activeUnderline"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-0 left-0 right-0 h-[3px] bg-caramel rounded-t-full"
                        />
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
           </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
           <h1 className="text-5xl font-serif font-bold italic text-ink mb-4">
              Premium Facility Registry
           </h1>
           <p className="text-muted/60 text-[13px] font-black uppercase tracking-[0.4em]">Authorized Medical & Spa Network</p>
           
           <div className="mt-14 max-w-2xl mx-auto relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-caramel transition-colors">
                 <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Search by facility name, specialty, or street..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-sand px-14 py-6 rounded-full text-sm outline-none shadow-sm focus:border-caramel/30 focus:ring-8 focus:ring-warm transition-all font-bold text-ink placeholder:text-muted/20"
              />
           </div>
        </div>

        <section className="bg-white rounded-[3rem] p-6 shadow-xl shadow-ink/5 border border-sand/50">
           {loading ? (
             <div className="py-32 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-caramel/40" />
                <p className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-muted/40 animate-pulse">Synchronizing Global Records...</p>
             </div>
           ) : (
             <div className="divide-y divide-sand/20">
                {filteredFacilities.map((facility) => (
                  <Link 
                    key={facility._id}
                    to={`/services/${facility._id}`}
                    className="flex items-start gap-8 py-12 hover:bg-warm/50 transition-all group px-10 rounded-[2.5rem]"
                  >
                     <div className="w-20 h-20 rounded-2xl border border-sand flex items-center justify-center bg-white shadow-sm shrink-0 overflow-hidden relative">
                        {facility.images?.[0] ? (
                          <img src={facility.images[0]} alt="" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-opacity duration-500" />
                        ) : (
                          <Building2 className="w-10 h-10 text-sand" />
                        )}
                        <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>

                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-serif font-bold italic text-ink group-hover:text-caramel transition-colors">
                               {facility.providerName || facility.title}
                            </h3>
                            <span className="px-3 py-1 bg-warm rounded-lg text-[9px] font-black uppercase tracking-widest text-caramel border border-caramel/10">
                               {facility.category}
                            </span>
                         </div>
                         <p className="text-[14px] font-medium text-muted/60 leading-relaxed max-w-lg">
                            {facility.location?.address || "Location registration in progress..."}
                         </p>
                      </div>

                     <div className="h-12 w-12 rounded-full border border-sand bg-white text-muted/30 flex items-center justify-center group-hover:bg-caramel group-hover:text-white group-hover:border-caramel group-hover:shadow-lg group-hover:shadow-caramel/20 transition-all self-center">
                        <ChevronRight className="w-6 h-6" />
                     </div>
                  </Link>
                ))}

                {filteredFacilities.length === 0 && (
                  <div className="py-40 text-center">
                     <p className="text-sm font-serif italic text-muted/30">No matching facilities discovered in our certified directory.</p>
                  </div>
                )}
             </div>
           )}
        </section>
      </div>
    </main>
  );
}
