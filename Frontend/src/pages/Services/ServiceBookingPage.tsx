import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Star, Plus, ChevronLeft } from "lucide-react";
import { serviceService, Service } from "../../services/service.service";

type Pet = {
  id: string;
  name: string;
  breed?: string;
  species: "Dog" | "Cat" | "Other";
  avatarUrl?: string;
};

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function readPetsFromStorage(): Pet[] {
  try {
    const raw = localStorage.getItem("pets");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as Pet[];
  } catch {
    return [];
  }
}

function seedDemoPets() {
  const demo: Pet[] = [
    {
      id: "mochi",
      name: "Mochi",
      breed: "Pug",
      species: "Dog",
      avatarUrl:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop",
    },
    {
      id: "luna",
      name: "Luna",
      breed: "Siamese Cat",
      species: "Cat",
      avatarUrl:
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=600&auto=format&fit=crop",
    },
  ];
  localStorage.setItem("pets", JSON.stringify(demo));
  return demo;
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
    const loaded = readPetsFromStorage();
    setPets(loaded);
    if (loaded.length && !selectedPetId) {
      setSelectedPetId(loaded[0].id);
    }
  }, [selectedPetId]);

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
    return pets.find((p) => p.id === selectedPetId) || null;
  }, [pets, selectedPetId]);

  const taxesAndFees = 15.00;
  const subtotal = service?.basePrice ?? 0;
  const total = subtotal + taxesAndFees;

  const canBook = isLoggedIn && pets.length > 0 && Boolean(service);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-32"></div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="h-32 bg-gray-200 rounded-[22px]"></div>
              <div className="h-48 bg-gray-200 rounded-[22px]"></div>
              <div className="h-64 bg-gray-200 rounded-[22px]"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="h-96 bg-gray-200 rounded-[22px]"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-500">Service not found.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        <span />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <section className="lg:col-span-7">
          {/* Service card */}
          <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                <img
                  alt={service.title}
                  src={service.images[0] || "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-900">
                  {service.providerId?.name || "Pet Care Provider"} - {service.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {service.averageRating.toFixed(1)} ({service.totalReviews} Reviews)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {service.location.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    {service.duration} min
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-600">
              {service.description}
            </p>

            {service.features.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-extrabold text-slate-500 mb-2">What's included:</p>
                <div className="grid gap-1">
                  {service.features.slice(0, 4).map((feature, index) => (
                    <p key={index} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-1 h-1 bg-pink-400 rounded-full"></span>
                      {feature}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 1: Select Pet */}
          <div className="mt-6 rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-100 text-xs font-extrabold text-pink-600">
                1
              </span>
              <h2 className="text-sm font-extrabold text-slate-900">
                Select Pet
              </h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {pets.slice(0, 2).map((pet) => {
                const active = pet.id === selectedPetId;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPetId(pet.id)}
                    disabled={!isLoggedIn}
                    className={`rounded-[18px] border p-4 text-left transition ${
                      active
                        ? "border-pink-300 bg-pink-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } ${!isLoggedIn ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
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
                        <p className="text-sm font-extrabold text-slate-900">
                          {pet.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {pet.breed ?? pet.species}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) return;
                  const demo = seedDemoPets();
                  setPets(demo);
                  setSelectedPetId(demo[0].id);
                }}
                className={`rounded-[18px] border border-dashed p-4 text-left transition ${
                  isLoggedIn
                    ? "border-slate-300 bg-white hover:bg-slate-50"
                    : "border-slate-200 bg-white/60 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
                    <Plus className="h-5 w-5 text-slate-500" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-700">
                      Add Pet
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {isLoggedIn ? "Quick add demo pet" : "Login required"}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="mt-4 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                <p className="text-sm font-semibold text-slate-700">
                  You can explore the booking flow as a guest, but you’ll need to{" "}
                  <Link to="/login" className="font-extrabold text-sky-700 hover:underline">
                    login
                  </Link>{" "}
                  to select a pet and confirm booking.
                </p>
              </div>
            ) : pets.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                <p className="text-sm font-semibold text-slate-700">
                  Bạn chưa có pet profile. Hãy thêm pet trong{" "}
                  <Link to="/profile" className="font-extrabold text-amber-800 hover:underline">
                    Profile
                  </Link>{" "}
                  (hoặc bấm “Add Pet” để tạo demo nhanh).
                </p>
              </div>
            ) : null}
          </div>

          {/* Step 2: Select Date & Time */}
          <div className="mt-6 rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pink-100 text-xs font-extrabold text-pink-600">
                2
              </span>
              <h2 className="text-sm font-extrabold text-slate-900">
                Select Date &amp; Time
              </h2>
            </div>

            <div className={`mt-4 ${!isLoggedIn ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap gap-3">
                {dateOptions.map((d, idx) => {
                  const active = idx === selectedDateIdx;
                  return (
                    <button
                      key={`${d.dow}-${d.day}`}
                      type="button"
                      onClick={() => setSelectedDateIdx(idx)}
                      disabled={!isLoggedIn}
                      className={`w-[74px] rounded-[18px] border px-3 py-3 text-center transition ${
                        active
                          ? "border-pink-300 bg-pink-200/60"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-[11px] font-extrabold text-slate-600">
                        {d.dow}
                      </p>
                      <p className="mt-1 text-base font-extrabold text-slate-900">
                        {d.day}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
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
                        className={`rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${
                          active
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                            : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-500">
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
                        className={`rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${
                          active
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                            : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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
          <div className="sticky top-[84px] rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-sm font-extrabold text-slate-900">
              Booking Summary
            </h3>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Service</span>
                <span className="font-extrabold text-slate-900">
                  {service.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Pet</span>
                <span className="font-extrabold text-slate-900">
                  {selectedPet
                    ? `${selectedPet.name}${
                        selectedPet.breed ? ` (${selectedPet.breed})` : ""
                      }`
                    : isLoggedIn
                      ? "—"
                      : "Login to select"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Date</span>
                <span className="font-extrabold text-slate-900">
                  {dateOptions[selectedDateIdx]?.label ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Time</span>
                <span className="font-extrabold text-slate-900">
                  {selectedTime}
                </span>
              </div>
            </div>

            <div className="my-5 h-px bg-slate-100" />

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Subtotal</span>
                <span className="font-extrabold text-slate-900">
                  {formatUsd(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">
                  Taxes &amp; Fees
                </span>
                <span className="font-extrabold text-slate-900">
                  {formatUsd(taxesAndFees)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Total</span>
              <span className="text-lg font-extrabold text-slate-900">
                {formatUsd(total)}
              </span>
            </div>

            <button
              type="button"
              disabled={!canBook}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-[18px] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition ${
                canBook ? "bg-pink-500 hover:bg-pink-600" : "bg-slate-300"
              }`}
            >
              Confirm Booking
            </button>

            <p className="mt-3 text-center text-xs font-semibold text-slate-400">
              You won&apos;t be charged yet.
            </p>

            {!isLoggedIn ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700">
                  Ready to book?{" "}
                  <Link
                    to="/login"
                    className="font-extrabold text-sky-700 hover:underline"
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
