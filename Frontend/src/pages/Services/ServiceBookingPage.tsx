import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Star, Plus, ChevronLeft } from "lucide-react";
import { serviceService, Service } from "../../services/service.service";
import { petService, Pet } from "@/services/pet.service";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getProviderName(service: Service) {
  if (service.providerName) return service.providerName;
  if (typeof service.providerId === "string") return "";
  return service.providerId?.name || "";
}

function getWorkingHoursText(service: Service) {
  const start = service.availability?.hours?.start;
  const end = service.availability?.hours?.end;
  if (!start || !end) return "Flexible hours";
  return `${start} - ${end}`;
}

const dateOptions = [
  { dow: "MON", day: 12, label: "Mon, Aug 12" },
  { dow: "TUE", day: 13, label: "Tue, Aug 13" },
  { dow: "WED", day: 14, label: "Wed, Aug 14" },
  { dow: "THU", day: 15, label: "Thu, Aug 15" },
  { dow: "FRI", day: 16, label: "Fri, Aug 16" },
];

const morningTimes = ["09:00 AM", "10:30 AM", "11:00 AM"];
const afternoonTimes = ["01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

export default function ServiceBookingPage() {
  const { serviceId } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [pets, setPets] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(1);
  const [selectedTime, setSelectedTime] = useState(morningTimes[1]);

  useEffect(() => {
    if (serviceId) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      fetchService(serviceId);
    }
  }, [serviceId]);

  useEffect(() => {
    const fetchPets = async () => {
      if (!isLoggedIn) {
        setPets([]);
        setSelectedPetId(null);
        return;
      }

      try {
        setPetsLoading(true);
        const loaded = await petService.getMyPets();
        setPets(loaded);
        if (loaded.length && !selectedPetId) {
          setSelectedPetId(loaded[0]._id);
        }
      } catch {
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    };

    fetchPets();
  }, [isLoggedIn, selectedPetId]);

  const fetchService = async (id: string) => {
    try {
      setLoading(true);
      const serviceData = await serviceService.getServiceById(id);
      setService(serviceData);
    } catch (error) {
      console.error('Error fetching service:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPet = useMemo(() => {
    return pets.find((p) => p._id === selectedPetId) || null;
  }, [pets, selectedPetId]);

  const taxesAndFees = 15.00;
  const subtotal = service?.basePrice ?? 0;
  const total = subtotal + taxesAndFees;

  const canBook = isLoggedIn && pets.length > 0 && Boolean(service);
  const providerName = service ? getProviderName(service) : "";
  const workingHours = service ? getWorkingHoursText(service) : "Flexible hours";

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="animate-pulse">
          <div className="h-8 bg-sand rounded mb-4 w-32"></div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-32 bg-sand rounded-[22px]"></div>
              <div className="h-48 bg-sand rounded-[22px]"></div>
              <div className="h-64 bg-sand rounded-[22px]"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-96 bg-sand rounded-[22px]"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
          <p className="text-sm font-semibold text-muted">Service not found.</p>
          <Link
            to="/services"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Services
        </Link>
        <span />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <section className="lg:col-span-7">
          {/* Service card */}
          <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <div className="flex gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-warm ring-1 ring-sand">
                <img
                  alt={service.title}
                  src={service.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-ink">
                  {(providerName || "Pet Care Provider")} - {service.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {service.averageRating.toFixed(1)} ({service.totalReviews} Reviews)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted" />
                    {service.location.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4 text-muted" />
                    {service.duration} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-muted" />
                    Working: {workingHours}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">
              {service.description}
            </p>

            {service.features.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-extrabold text-muted mb-2">What's included:</p>
                <div className="grid gap-1">
                  {service.features.slice(0, 4).map((feature, index) => (
                    <p key={index} className="text-xs text-muted flex items-center gap-2">
                      <span className="w-1 h-1 bg-caramel rounded-full"></span>
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 1: Select Pet */}
          <div className="mt-6 rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-warm text-xs font-extrabold text-brown-dark">
                1
              </span>
              <h2 className="text-sm font-extrabold text-ink">
                Select Pet
              </h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {pets.map((pet) => {
                const active = pet._id === selectedPetId;
                return (
                  <button
                    key={pet._id}
                    type="button"
                    onClick={() => setSelectedPetId(pet._id)}
                    disabled={!isLoggedIn}
                    className={`rounded-[18px] border p-4 text-left transition ${active
                        ? "border-caramel bg-warm"
                        : "border-sand bg-white hover:bg-warm"
                      } ${!isLoggedIn ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-sand ring-1 ring-sand">
                        {pet.avatarUrl ? (
                          <img
                            alt={pet.name}
                            src={pet.avatarUrl}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-ink">
                          {pet.name}
                        </p>
                        <p className="text-xs font-semibold text-muted">
                          {pet.breed ?? pet.species}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              <Link
                to="/my-pets"
                className={`rounded-[18px] border border-dashed p-4 text-left transition ${isLoggedIn
                    ? "border-caramel bg-white hover:bg-warm"
                    : "border-sand bg-white/60 opacity-60"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm ring-1 ring-sand">
                    <Plus className="h-5 w-5 text-muted" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">
                      Add Pet
                    </p>
                    <p className="text-xs font-semibold text-muted">
                      {isLoggedIn ? "Open pet library" : "Login required"}
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {!isLoggedIn ? (
              <div className="mt-4 rounded-2xl bg-warm p-4 ring-1 ring-sand">
                <p className="text-sm font-semibold text-ink">
                  You can explore the booking flow as a guest, but you’ll need to{" "}
                  <Link to="/login" className="font-extrabold text-brown hover:underline">
                    login
                  </Link>{" "}
                  to select a pet and confirm booking.
                </p>
              </div>
            ) : petsLoading ? (
              <div className="mt-4 rounded-2xl bg-warm p-4 ring-1 ring-sand">
                <p className="text-sm font-semibold text-muted">Loading your pet profiles...</p>
              </div>
            ) : pets.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-sm font-semibold text-ink">
                  Bạn chưa có pet profile. Hãy thêm pet trong{" "}
                  <Link to="/my-pets" className="font-extrabold text-amber-800 hover:underline">
                    My Pets
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </div>

          {/* Step 2: Select Date & Time */}
          <div className="mt-6 rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-warm text-xs font-extrabold text-brown-dark">
                2
              </span>
              <h2 className="text-sm font-extrabold text-ink">
                Select Date &amp; Time
              </h2>
            </div>

            <div className={`mt-4 ${!isLoggedIn ? "opacity-60" : ""}`}>
              <div className="rounded-2xl bg-warm/70 px-4 py-3 ring-1 ring-sand">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-muted">Working Hours</p>
                <p className="mt-1 text-sm font-semibold text-ink">{workingHours}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {dateOptions.map((d, idx) => {
                  const active = idx === selectedDateIdx;
                  return (
                    <button
                      key={`${d.dow}-${d.day}`}
                      type="button"
                      onClick={() => setSelectedDateIdx(idx)}
                      disabled={!isLoggedIn}
                      className={`w-[74px] rounded-[18px] border px-3 py-3 text-center transition ${active
                          ? "border-caramel bg-caramel/30"
                          : "border-sand bg-white hover:bg-warm"
                        }`}
                    >
                      <p className="text-[11px] font-extrabold text-muted">
                        {d.dow}
                      </p>
                      <p className="mt-1 text-base font-extrabold text-ink">
                        {d.day}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
                  <CalendarDays className="h-4 w-4" />
                  Morning
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {morningTimes.map((t) => {
                    const active = t === selectedTime;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        disabled={!isLoggedIn}
                        className={`rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${active
                            ? "bg-caramel/20 text-brown ring-caramel/40"
                            : "bg-white text-ink ring-sand hover:bg-warm"
                          }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
                  <Clock3 className="h-4 w-4" />
                  Afternoon
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {afternoonTimes.map((t) => {
                    const active = t === selectedTime;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        disabled={!isLoggedIn}
                        className={`rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${active
                            ? "bg-caramel/20 text-brown ring-caramel/40"
                            : "bg-white text-ink ring-sand hover:bg-warm"
                          }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right summary */}
        <aside className="lg:col-span-5">
          <div className="sticky top-[84px] rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <h3 className="text-sm font-extrabold text-ink">
              Booking Summary
            </h3>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Service</span>
                <span className="font-extrabold text-ink">
                  {service.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Pet</span>
                <span className="font-extrabold text-ink">
                  {selectedPet
                    ? `${selectedPet.name}${selectedPet.breed ? ` (${selectedPet.breed})` : ""
                    }`
                    : isLoggedIn
                      ? "—"
                      : "Login to select"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Date</span>
                <span className="font-extrabold text-ink">
                  {dateOptions[selectedDateIdx]?.label ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Time</span>
                <span className="font-extrabold text-ink">
                  {selectedTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Working Hours</span>
                <span className="font-extrabold text-ink">
                  {workingHours}
                </span>
              </div>
            </div>

            <div className="my-5 h-px bg-sand" />

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Subtotal</span>
                <span className="font-extrabold text-ink">
                  {formatUsd(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">
                  Taxes &amp; Fees
                </span>
                <span className="font-extrabold text-ink">
                  {formatUsd(taxesAndFees)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-extrabold text-ink">Total</span>
              <span className="text-lg font-extrabold text-ink">
                {formatUsd(total)}
              </span>
            </div>

            <button
              type="button"
              disabled={!canBook}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-[18px] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition ${canBook ? "bg-brown hover:bg-brown-dark" : "bg-sand"
                }`}
            >
              Confirm Booking
            </button>

            <p className="mt-3 text-center text-xs font-semibold text-muted">
              You won&apos;t be charged yet.
            </p>

            {!isLoggedIn ? (
              <div className="mt-4 rounded-2xl bg-warm p-4 ring-1 ring-sand">
                <p className="text-sm font-semibold text-ink">
                  Ready to book?{" "}
                  <Link
                    to="/login"
                    className="font-extrabold text-brown hover:underline"
                  >
                    Login
                  </Link>{" "}
                  to confirm.
                </p>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  );
}
