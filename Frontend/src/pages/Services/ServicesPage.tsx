import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Building2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Navigation,
  LocateFixed,
  Compass,
  Map as MapIcon,
} from "lucide-react";
import { serviceService } from "@/services/service.service";
import { ServicesMapOverlay } from "@/components/services/ServicesMapOverlay";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied" | "prompt">("prompt");
  const [showMap, setShowMap] = useState(false);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await serviceService.getServices({
        limit: 12,
        page,
        search,
      });
      setServices(response.services);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLocationStatus("loading");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      (error) => {
        console.error("Location error:", error);
        setLocationStatus("denied");
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [page, search]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const facilities = useMemo(() => services, [services]);

  const toneMap: Record<string, { bg: string; text: string }> = {
    Veterinary:   { bg: "bg-emerald-50",  text: "text-emerald-600" },
    Grooming:     { bg: "bg-pink-50",     text: "text-pink-600" },
    Training:     { bg: "bg-violet-50",   text: "text-violet-600" },
    Boarding:     { bg: "bg-blue-50",     text: "text-blue-600" },
    Nutrition:    { bg: "bg-amber-50",    text: "text-amber-600" },
    Dental:       { bg: "bg-cyan-50",     text: "text-cyan-600" },
  };

  return (
    <main className="min-h-screen bg-[#FBF9F2] font-sans text-ink">
      <div className="max-w-7xl mx-auto px-4 py-28">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-caramel mb-6">
            <div className="w-12 h-px bg-caramel/30" />
            Network Directory
            <div className="w-12 h-px bg-caramel/30" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-ink mb-4 tracking-tight">
            Certified Partner Registry
          </h1>
          <p className="text-muted/50 text-[13px] font-black uppercase tracking-[0.3em]">
            Authorized Medical &amp; Lifestyle Ateliers
          </p>

          {/* Search & Location Control */}
          <div className="mt-12 max-w-3xl mx-auto flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 group w-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within:text-caramel transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search ateliers, clinics, or wellness centers..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-sand pl-14 pr-6 py-5 rounded-[2rem] text-base outline-none shadow-xl shadow-ink/5 focus:border-caramel/30 focus:ring-8 focus:ring-warm transition-all font-semibold text-ink placeholder:text-muted/25"
              />
            </div>
            
            <button 
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
              className={`h-[68px] px-8 rounded-[2rem] flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl border ${
                locationStatus === "granted" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-emerald-500/5 hover:bg-emerald-100" 
                  : locationStatus === "denied"
                  ? "bg-rose-50 border-rose-100 text-rose-600 shadow-rose-500/5 hover:bg-rose-100"
                  : "bg-white border-sand text-caramel shadow-ink/5 hover:bg-warm"
              }`}
            >
              {locationStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Compass className={`w-4 h-4 ${locationStatus === "granted" ? "animate-pulse" : ""}`} />
              )}
              <span className="hidden sm:inline">
                {locationStatus === "granted" ? "Location Active" : locationStatus === "denied" ? "Location Denied" : "Identify Location"}
              </span>
            </button>

            <button 
              onClick={() => setShowMap(true)}
              className="h-[68px] px-8 bg-ink text-white rounded-[2rem] flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-caramel active:scale-95"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">View Map</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showMap && (
            <ServicesMapOverlay 
              facilities={facilities}
              userLocation={userLocation}
              onClose={() => setShowMap(false)}
            />
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-caramel/40" />
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-muted/40 animate-pulse italic">
              Synchronizing Global Network...
            </p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="py-32 text-center bg-white/50 rounded-[3rem] border border-dashed border-sand">
            <Building2 className="w-12 h-12 mx-auto text-sand/40 mb-4" />
            <p className="text-lg font-serif italic text-muted/40">
              No certified partners found matching your criteria.
            </p>
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-caramel hover:underline"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => {
                const cats: string[] = facility.categories || (facility.category ? [facility.category] : []);
                const tags: string[] = facility.tags || [];

                return (
                  <Link
                    key={facility._id}
                    to={`/services/atelier/${facility.providerUserId || facility._id}`}
                    className="group flex flex-col bg-white rounded-[2rem] border border-sand/40 shadow-sm hover:shadow-2xl hover:shadow-ink/8 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Cover image — from Atelier clinic images or avatar */}
                    {(() => {
                      const coverImg =
                        facility.providerClinicImages?.[0] ||
                        facility.providerAvatarUrl ||
                        null;
                      return (
                        <div className="relative aspect-[16/9] bg-warm overflow-hidden">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={facility.providerName}
                              className="w-full h-full object-cover grayscale-[0.15] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-16 h-16 text-sand/30" />
                            </div>
                          )}
                          {/* Verified badge */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-caramel" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-ink">Certified</span>
                          </div>
                          {/* Category pills overlay */}
                          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                            {cats.slice(0, 2).map((cat) => {
                              const tone = toneMap[cat] || { bg: "bg-white/80", text: "text-ink" };
                              return (
                                <span
                                  key={cat}
                                  className={`px-2.5 py-1 ${tone.bg} ${tone.text} backdrop-blur-sm text-[8px] font-black uppercase tracking-widest rounded-full border border-white/60 shadow-sm`}
                                >
                                  {cat}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-6">
                      {/* Name */}
                      <h3 className="text-xl font-serif font-bold italic text-ink mb-2 group-hover:text-caramel transition-colors line-clamp-1">
                        {facility.providerName}
                      </h3>

                      {/* Description (Atelier tagline) */}
                      {facility.providerDescription && (
                        <p className="text-xs text-muted/60 line-clamp-2 leading-relaxed mb-3">
                          {facility.providerDescription}
                        </p>
                      )}

                      {/* Address & Distance */}
                      <div className="space-y-2 mb-3">
                         {facility.providerAddress && (
                           <div className="flex items-start gap-2">
                             <MapPin className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" />
                             <p className="text-[11px] font-semibold text-muted line-clamp-1">
                               {facility.providerAddress}
                             </p>
                           </div>
                         )}
                         
                         {locationStatus === "granted" && userLocation && facility.providerLocation?.coordinates ? (
                            <div className="flex items-center gap-2">
                               <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                  {calculateDistance(
                                     userLocation.lat, 
                                     userLocation.lng, 
                                     facility.providerLocation.coordinates[1], 
                                     facility.providerLocation.coordinates[0]
                                  ).toFixed(1)} km
                               </p>
                            </div>
                         ) : locationStatus === "denied" || locationStatus === "prompt" ? (
                            <div className="flex flex-col gap-2 p-3 bg-warm/50 rounded-xl border border-sand/20">
                               <p className="text-[9px] font-bold text-muted/60 uppercase leading-tight">
                                  Bạn cần cung cấp vị trí để biết khoảng cách
                               </p>
                               <button 
                                 onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    requestLocation();
                                 }}
                                 className="flex items-center gap-2 text-[9px] font-black text-caramel uppercase hover:underline"
                               >
                                  <LocateFixed className="w-3 h-3" />
                                  Cấp quyền truy cập
                               </button>
                            </div>
                         ) : locationStatus === "loading" ? (
                            <div className="flex items-center gap-2 animate-pulse">
                               <div className="w-3 h-3 bg-sand rounded-full" />
                               <div className="h-2 w-20 bg-sand rounded-full" />
                            </div>
                         ) : null}
                      </div>

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-warm text-brown text-[8px] font-black uppercase tracking-widest rounded-full border border-sand/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-sand/20 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                          <Stethoscope className="w-3.5 h-3.5" />
                          {cats.length} service type{cats.length !== 1 ? "s" : ""}
                        </div>
                        <div className="h-8 w-8 rounded-full border border-sand bg-warm text-muted/30 flex items-center justify-center group-hover:bg-caramel group-hover:text-white group-hover:border-caramel transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-3">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-6 py-3 rounded-2xl border border-sand text-[10px] font-black uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition shadow-sm disabled:opacity-20 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                        page === i + 1
                          ? "bg-caramel text-white shadow-lg"
                          : "bg-white text-muted/40 border border-sand/40 hover:bg-warm"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-6 py-3 rounded-2xl border border-sand text-[10px] font-black uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition shadow-sm disabled:opacity-20 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
