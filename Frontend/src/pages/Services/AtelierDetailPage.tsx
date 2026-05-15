import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Star,
  Building2,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";
import { serviceService, AtelierDetail, Service } from "@/services/service.service";
import { formatVnd } from "@/utils/currency";

export default function AtelierDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const [atelier, setAtelier] = useState<AtelierDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (providerId) {
      setLoading(true);
      serviceService
        .getAtelierById(providerId)
        .then(({ atelier, services }) => {
          setAtelier(atelier);
          setServices(services);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [providerId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FBF9F2]">
        <Loader2 className="w-10 h-10 animate-spin text-caramel" />
      </div>
    );
  }

  if (!atelier) {
    return (
      <div className="min-h-screen bg-[#FBF9F2] flex items-center justify-center">
        <p className="font-serif italic text-lg text-muted">Atelier not found.</p>
      </div>
    );
  }

  const availableServices = services.filter((s) => s.isAvailable);
  const unavailableServices = services.filter((s) => !s.isAvailable);

  return (
    <main className="min-h-screen bg-[#FBF9F2] font-sans text-ink pb-24">
      {/* Hero / Banner */}
      <div className="bg-white border-b border-sand/20">
        {/* Back navigation */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted/40 hover:text-caramel transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
        </div>

        {/* Atelier Hero */}
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-end gap-12">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="h-44 w-44 rounded-[3.5rem] bg-white border border-sand p-1 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-700">
              {atelier.avatarUrl ? (
                <img
                  src={atelier.avatarUrl}
                  alt={atelier.name}
                  className="w-full h-full object-cover rounded-[3rem]"
                />
              ) : (
                <div className="w-full h-full rounded-[3rem] bg-warm flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-sand/50" />
                </div>
              )}
            </div>
            <div className="absolute -top-3 -right-3 h-10 w-10 bg-caramel rounded-2xl flex items-center justify-center text-white shadow-xl z-20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {atelier.subscriptionPlan && atelier.subscriptionPlan !== "free" && (
              <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-ink text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                {atelier.subscriptionPlan}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-caramel mb-3 italic">
              Certified Partner · PNetAI Registry
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-ink mb-6 tracking-tighter leading-none">
              {atelier.name}
            </h1>
            <div className="flex flex-wrap gap-3">
              {atelier.address && (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm text-ink rounded-full text-[11px] font-black uppercase tracking-widest border border-sand">
                  <MapPin className="w-3.5 h-3.5 text-caramel" />
                  {atelier.address}
                </span>
              )}
              {atelier.phone && (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm text-ink rounded-full text-[11px] font-black uppercase tracking-widest border border-sand">
                  <Phone className="w-3.5 h-3.5 text-caramel" />
                  {atelier.phone}
                </span>
              )}
              {atelier.email && (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm text-ink rounded-full text-[11px] font-black uppercase tracking-widest border border-sand">
                  <Mail className="w-3.5 h-3.5 text-caramel" />
                  {atelier.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-7xl mx-auto px-6 pb-6 flex flex-wrap gap-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-muted/50">
            <Stethoscope className="w-4 h-4 text-caramel/50" />
            <span>{services.length} service{services.length !== 1 ? "s" : ""} available</span>
          </div>
          {atelier.operatingHours && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted/50">
              <Clock className="w-4 h-4 text-caramel/50" />
              <span>{atelier.operatingHours.start} — {atelier.operatingHours.end}</span>
            </div>
          )}
          {atelier.legalDocuments?.clinicLicenseNumber && (
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted/50">
              <ShieldCheck className="w-4 h-4 text-caramel/50" />
              <span>License: {atelier.legalDocuments.clinicLicenseNumber}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-14 grid lg:grid-cols-3 gap-14">
        {/* Left: About + images */}
        <div className="lg:col-span-1 space-y-8">
          {/* About */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-sand/30 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30 mb-6 italic">
              About this Atelier
            </h2>
            <p className="font-serif font-bold italic text-ink leading-[1.8] opacity-80 text-lg">
              {atelier.description || "A premier healthcare and lifestyle facility certified under the PNetAI global excellence standards for high-performance pet care."}
            </p>
          </section>

          {/* Business Certification (Replaces Clinic Gallery) */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-sand/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-caramel" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30 italic">
                Business Certification
              </h2>
            </div>
            {(() => {
              const docs = [
                { label: "Clinic License",   url: atelier.legalDocuments?.clinicLicenseUrl },
                { label: "Business License", url: atelier.legalDocuments?.businessLicenseUrl },
                { label: "Doctor License",   url: atelier.legalDocuments?.doctorLicenseUrl },
              ].filter((d) => d.url);

              return docs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {docs.map((doc) => (
                    <a
                      key={doc.label}
                      href={doc.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-2xl overflow-hidden border border-sand/30 hover:border-caramel/40 transition-all"
                    >
                      <div className="aspect-[4/3] bg-warm overflow-hidden">
                        <img
                          src={doc.url!}
                          alt={doc.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted/40">{doc.label}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-caramel">View ↗</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-sand/40 bg-warm/20">
                  <ShieldCheck className="w-8 h-8 mx-auto text-sand/30 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted/30 italic">
                    No certification provided
                  </p>
                </div>
              );
            })()}
          </section>

          {/* Operating Hours */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-sand/30 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30 mb-6 italic">
              Operating Schedule
            </h2>
            <div className="space-y-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted/30 group-hover:text-caramel transition-colors">
                    {day}
                  </span>
                  <span className="text-[11px] font-bold text-ink">
                    {atelier.operatingHours
                      ? `${atelier.operatingHours.start} — ${atelier.operatingHours.end}`
                      : "08:00 — 18:00"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Doctors */}
          {atelier.doctors && atelier.doctors.length > 0 && (
            <section className="bg-white rounded-[2.5rem] p-8 border border-sand/30 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/30 mb-6 italic">
                Our Specialists
              </h2>
              <ul className="space-y-3">
                {atelier.doctors.map((doc, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-warm flex items-center justify-center border border-sand/30">
                      <Stethoscope className="w-4 h-4 text-caramel/50" />
                    </div>
                    <span className="text-sm font-bold text-ink">{doc}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* Right: Services list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-serif font-bold italic text-ink">
              Available Services
            </h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted/30">
              {availableServices.length} of {services.length}
            </span>
          </div>

          {services.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 border border-dashed border-sand text-center">
              <p className="font-serif italic text-muted/40 text-lg">
                No services published yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableServices.map((service) => (
                <Link
                  key={service._id}
                  to={`/services/${service._id}`}
                  className="group flex items-center gap-6 bg-white rounded-[2rem] p-6 border border-sand/30 shadow-sm hover:shadow-xl hover:border-caramel/20 hover:-translate-y-0.5 transition-all"
                >
                  {/* Image */}
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-sand/20 shrink-0 bg-warm">
                    {service.images?.[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stethoscope className="w-8 h-8 text-sand/30" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-caramel/60 mr-2">
                          {service.category}
                        </span>
                        {service.isPopular && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-extrabold text-ink shrink-0">
                        {formatVnd(service.basePrice)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-ink mb-1 group-hover:text-caramel transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed mb-3">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                        ⏱ {service.duration} min
                      </span>
                      {service.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {service.averageRating.toFixed(1)} ({service.totalReviews})
                        </span>
                      )}
                      {service.tags && service.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {service.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-warm text-brown text-[8px] font-black uppercase tracking-widest rounded-full border border-sand/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="h-12 w-12 rounded-full border border-sand bg-white text-muted/30 flex items-center justify-center group-hover:bg-caramel group-hover:text-white group-hover:border-caramel group-hover:shadow-xl transition-all shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              ))}

              {unavailableServices.length > 0 && (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted/20 pt-4">
                    Currently Unavailable
                  </p>
                  {unavailableServices.map((service) => (
                    <div
                      key={service._id}
                      className="flex items-center gap-6 bg-white/50 rounded-[2rem] p-6 border border-sand/20 opacity-50"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-sand/10 shrink-0 bg-warm/50">
                        {service.images?.[0] ? (
                          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover grayscale" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Stethoscope className="w-8 h-8 text-sand/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted/30">{service.category}</p>
                        <h3 className="text-lg font-bold text-muted/40 line-clamp-1">{service.title}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted/20 mt-2">
                          Service Unavailable
                        </p>
                      </div>
                      <span className="text-lg font-extrabold text-muted/20">{formatVnd(service.basePrice)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
