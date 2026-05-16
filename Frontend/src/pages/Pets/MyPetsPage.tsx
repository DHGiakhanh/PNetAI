import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Edit3,
  Heart,
  ImageUp,
  PawPrint,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Weight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Select, { StylesConfig } from "react-select";
import toast from "react-hot-toast";
import { Pet, PetPayload, petService } from "@/services/pet.service";

const initialForm: PetPayload = {
  name: "",
  species: "Dog",
  breed: "",
  gender: "Unknown",
  age: undefined,
  weightKg: undefined,
  isSpayed: false,
  healthStatus: "Healthy",
  allergies: "",
  medicalHistory: "",
  avatarUrl: "",
  notes: "",
  lastVisitDate: "",
};

type SelectOption = { value: string; label: string };

const speciesOptions: SelectOption[] = [
  { value: "Dog", label: "Dog" },
  { value: "Cat", label: "Cat" },
  { value: "Bird", label: "Bird" },
  { value: "Rabbit", label: "Rabbit" },
  { value: "Hamster", label: "Hamster" },
  { value: "Other", label: "Other" },
];

const genderOptions: SelectOption[] = [
  { value: "Unknown", label: "Unknown" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const closeButtonClass =
  "grid h-9 w-9 place-items-center rounded-full border border-sand bg-[#FAF7F2] text-ink shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-caramel/40";

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderColor: state.isFocused ? "#C4913A" : "#E4D5BC",
    backgroundColor: "rgba(240, 232, 216, 0.5)",
    boxShadow: "none",
    "&:hover": { borderColor: "#C4913A" },
  }),
  menu: (base) => ({
    ...base,
    border: "1px solid #E4D5BC",
    borderRadius: 12,
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#F0E8D8" : "#fff",
    color: "#2C2418",
  }),
  singleValue: (base) => ({ ...base, color: "#2C2418" }),
};

const getModerationCopy = (status?: Pet["moderationStatus"]) => {
  if (status === "disabled") {
    return {
      label: "Booking Disabled",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      message: "This pet profile is temporarily disabled for booking. Please review the requested corrections.",
    };
  }
  if (status === "flagged") {
    return {
      label: "Needs Review",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      message: "This pet profile has been flagged for review. Please verify that the information is accurate.",
    };
  }
  return null;
};

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [form, setForm] = useState<PetPayload>(initialForm);
  const [saving, setSaving] = useState(false);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await petService.getMyPets();
      setPets(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not load pets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (pet: Pet) => {
    setEditing(pet);
    setViewOnly(false);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      gender: pet.gender || "Unknown",
      age: pet.age ?? undefined,
      weightKg: pet.weightKg ?? undefined,
      isSpayed: Boolean(pet.isSpayed),
      healthStatus: pet.healthStatus || "Healthy",
      allergies: pet.allergies || "",
      medicalHistory: pet.medicalHistory || "",
      medicalHistoryRecords: pet.medicalHistoryRecords || [],
      avatarUrl: pet.avatarUrl || "",
      notes: pet.notes || "",
      lastVisitDate: pet.lastVisitDate ? new Date(pet.lastVisitDate).toISOString().slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const openView = (pet: Pet) => {
    setEditing(pet);
    setViewOnly(true);
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      gender: pet.gender || "Unknown",
      age: pet.age ?? undefined,
      weightKg: pet.weightKg ?? undefined,
      isSpayed: Boolean(pet.isSpayed),
      healthStatus: pet.healthStatus || "Healthy",
      allergies: pet.allergies || "",
      medicalHistory: pet.medicalHistory || "",
      medicalHistoryRecords: pet.medicalHistoryRecords || [],
      avatarUrl: pet.avatarUrl || "",
      notes: pet.notes || "",
      lastVisitDate: pet.lastVisitDate ? new Date(pet.lastVisitDate).toISOString().slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const resetModalState = () => {
    setEditing(null);
    setViewOnly(false);
    setForm(initialForm);
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const { url } = await petService.uploadPetAvatar(file);
      if (!url) throw new Error("Upload failed");
      setForm((prev) => ({ ...prev, avatarUrl: url }));
      toast.success("Pet avatar uploaded.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not upload image.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { medicalHistoryRecords, ...editableProfile } = form;
      if (editing?._id) {
        await petService.updatePet(editing._id, editableProfile);
        toast.success("Pet profile updated.");
      } else {
        await petService.createPet(editableProfile);
        toast.success("New pet added successfully.");
      }
      closeModal();
      await fetchPets();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Could not save pet.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await petService.deletePet(id);
      toast.success("Pet profile deleted.");
      await fetchPets();
      setDeletingPet(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Could not delete pet.";
      setError(message);
      toast.error(message);
    }
  };

  const sortedPets = useMemo(() => [...pets].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "") * -1), [pets]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-caramel">The Family Archive</p>
          <h1 className="font-serif text-5xl font-bold italic text-ink">
            My <span className="text-caramel">Pet Library</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            A digital sanctuary for your beloved companions. Each passport stores their history and daily essentials.
          </p>
        </div>

        {error ? <p className="mb-4 text-sm font-semibold text-rust">{error}</p> : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [...Array(3)].map((_, idx) => <div key={idx} className="h-72 animate-pulse rounded-3xl bg-sand/70" />)
            : sortedPets.map((pet) => (
                <article
                  key={pet._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openView(pet)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openView(pet);
                    }
                  }}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-sand bg-white shadow-sm transition hover:-translate-y-1 hover:border-caramel/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-caramel/50"
                >
                  <div className="relative bg-[#f3ead8] px-5 pb-8 pt-5">
                    {getModerationCopy(pet.moderationStatus) ? (
                      <span className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${getModerationCopy(pet.moderationStatus)?.className}`}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {getModerationCopy(pet.moderationStatus)?.label}
                      </span>
                    ) : null}
                    <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                      {pet.healthStatus || "Healthy"}
                    </span>
                    <div className="mx-auto mt-6 h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-md">
                      <img
                        src={
                          pet.avatarUrl ||
                          "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=500&auto=format&fit=crop"
                        }
                        alt={pet.name}
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="font-serif text-4xl font-bold italic text-ink">{pet.name}</h2>
                      <p className="text-sm text-muted">
                        <span className="block">Species: {pet.species} • Breed: {pet.breed || "None"}</span>
                        <span className="block mt-1">Gender: {pet.gender || "Unknown"} • Age: {pet.age || 0} years</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                        {pet.weightKg || 0} kg
                      </span>
                      <span className="rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                        {pet.healthStatus || "Healthy"}
                      </span>
                      <span className="rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                        {pet.isSpayed ? "Spayed: Yes" : "Spayed: No"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-warm px-3 py-1 text-xs font-semibold text-ink ring-1 ring-sand">
                        <CalendarDays className="h-3.5 w-3.5 text-caramel" />
                        {pet.lastVisitDate ? new Date(pet.lastVisitDate).toISOString().slice(0, 10) : "No visit"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(pet);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-sand px-2 py-2 text-xs font-semibold text-ink hover:bg-warm"
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingPet(pet);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-rust/30 px-2 py-2 text-xs font-semibold text-rust hover:bg-[#fff1eb]"
                      >
                        <Trash2 className="h-4 w-4" /> Del
                      </button>
                      <Link
                        to="/services"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center rounded-full bg-brown px-2 py-2 text-xs font-semibold text-white hover:bg-brown-dark"
                      >
                        <Stethoscope className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}

          {!loading ? (
            <button
              onClick={openCreate}
              className="grid min-h-[288px] place-items-center rounded-3xl border border-dashed border-sand bg-white/60 text-brown hover:bg-white"
            >
              <div className="text-center">
                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-warm ring-1 ring-sand">
                  <Plus className="h-6 w-6" />
                </span>
                <p className="text-sm font-semibold">Add New Pet</p>
              </div>
            </button>
          ) : null}
        </div>
      </div>      <AnimatePresence onExitComplete={resetModalState}>
        {modalOpen && (
          <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 backdrop-blur-[2px] p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-sand bg-[#FAF7F2] shadow-2xl"
            >
              <div className="max-h-[96vh] overflow-y-auto [scrollbar-gutter:stable]">
              {viewOnly ? (
                <div className="relative">
                  {/* View Only Layout */}
                  <div className="relative h-48 overflow-hidden bg-ink">
                    <div className="absolute inset-0 bg-gradient-to-r from-caramel/20 to-transparent" />
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`absolute right-8 top-5 z-40 ${closeButtonClass}`}
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-8 pb-10">
                    <div className="-mt-24 relative z-10 flex flex-col items-center md:flex-row md:items-end md:gap-8">
                      <div className="h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-[#FAF7F2] bg-warm shadow-xl">
                        <img
                          src={form.avatarUrl || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=500&auto=format&fit=crop"}
                          alt={form.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-6 flex-1 text-center md:mb-4 md:text-left">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-caramel ring-1 ring-caramel/20">
                          <ShieldCheck className="h-3 w-3" /> {form.healthStatus || "Healthy"}
                        </span>
                        <h2 className="mt-2 font-serif text-6xl font-bold italic text-ink">{form.name}</h2>
                        <p className="mt-1 text-lg font-medium text-muted">{form.species} • {form.breed || "Mixed Breed"}</p>
                      </div>
                    </div>

                    {getModerationCopy(editing?.moderationStatus) ? (
                      <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${getModerationCopy(editing?.moderationStatus)?.className}`}>
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-black uppercase tracking-widest">{getModerationCopy(editing?.moderationStatus)?.label}</p>
                          <p className="mt-1">{editing?.correctionRequestMessage || getModerationCopy(editing?.moderationStatus)?.message}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: "Gender", value: form.gender, icon: PawPrint },
                        { label: "Age", value: `${form.age || 0} Years`, icon: CalendarDays },
                        { label: "Weight", value: `${form.weightKg || 0} KG`, icon: Weight },
                        { label: "Spayed", value: form.isSpayed ? "Yes" : "No", icon: Activity },
                      ].map((stat, i) => (
                        <div key={i} className="rounded-3xl border border-sand bg-white p-5 shadow-sm transition-transform hover:-translate-y-1">
                          <stat.icon className="mb-3 h-5 w-5 text-caramel" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{stat.label}</p>
                          <p className="mt-1 font-serif text-xl font-bold text-ink">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 grid gap-8 lg:grid-cols-2">
                      <div className="space-y-8">
                        <section className="rounded-[2.5rem] border border-sand bg-white p-8 shadow-sm">
                          <h3 className="flex items-center gap-3 font-serif text-2xl font-bold italic text-ink">
                            <Stethoscope className="h-6 w-6 text-caramel" /> Professional History
                          </h3>
                          <div className="mt-6 space-y-6">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">Medical Summary</p>
                              <p className="mt-2 text-sm leading-relaxed text-ink italic opacity-80">
                                {form.medicalHistory || "No professional history recorded."}
                              </p>
                            </div>
                            
                            {form.medicalHistoryRecords && form.medicalHistoryRecords.length > 0 && (
                              <div>
                                <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted/60">Clinic Timeline</p>
                                <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                                  {form.medicalHistoryRecords.slice().reverse().map((record, i) => (
                                    <div key={i} className="rounded-2xl bg-warm/30 p-4 border border-sand/50">
                                      <p className="text-sm font-medium italic text-ink">"{record.note}"</p>
                                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-caramel uppercase tracking-widest">{record.providerName || "Clinic"}</span>
                                        <span className="text-muted">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : ""}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8">
                        <section className="rounded-[2.5rem] border border-sand bg-white p-8 shadow-sm">
                          <h3 className="flex items-center gap-3 font-serif text-2xl font-bold italic text-ink">
                            <Heart className="h-6 w-6 text-caramel" /> Health & Behavior
                          </h3>
                          <div className="mt-6 space-y-6">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">Allergies</p>
                              <p className="mt-2 text-sm font-bold text-ink">{form.allergies || "None identified."}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">Special Instructions</p>
                              <p className="mt-2 text-sm leading-relaxed text-ink opacity-80">
                                {form.notes || "No special care instructions provided."}
                              </p>
                            </div>
                            <div className="pt-4 border-t border-sand">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="grid h-10 w-10 place-items-center rounded-full bg-warm text-caramel">
                                    <CalendarDays className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">Last Professional Visit</p>
                                    <p className="text-sm font-bold text-ink">{form.lastVisitDate || "No recorded visits"}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>

                        <div className="flex justify-end gap-3">
                           <button
                             onClick={() => openEdit(editing!)}
                             className="inline-flex items-center gap-2 rounded-full border border-sand bg-white px-8 py-3 text-sm font-bold text-ink hover:bg-warm shadow-sm transition-all"
                           >
                             <Edit3 className="h-4 w-4" /> Edit Passport
                           </button>
                           <button
                             onClick={closeModal}
                             className="rounded-full bg-ink px-10 py-3 text-sm font-bold text-white hover:bg-ink/90 shadow-xl transition-all"
                           >
                             Close
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <div className="sticky top-0 z-30 mb-4 border-b border-sand bg-[#FAF7F2] px-6 pb-3 pt-4 md:px-8 md:pt-5">
                    <div className="mb-1.5 flex items-start justify-between gap-4">
                      <h3 className="font-serif text-[2rem] font-bold italic leading-tight text-ink md:text-[1.85rem]">
                        {editing ? "Edit" : "Create"} <span className="text-caramel">Pet Passport</span>
                      </h3>
                      <button
                        type="button"
                        onClick={closeModal}
                        className={closeButtonClass}
                        aria-label="Close modal"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted md:text-sm">
                      Keep your furry friend profile complete for faster booking.
                    </p>
                  </div>

                  <div className="grid gap-6 px-6 pb-6 md:px-8 md:pb-8 lg:grid-cols-[220px_1fr]">
                    <aside className="rounded-3xl border border-sand bg-white p-5">
                      <p className="font-serif text-2xl font-bold italic text-ink">Avatar</p>
                      <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-sand bg-warm/40 p-5">
                        <div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-sand">
                          <img
                            src={
                              form.avatarUrl ||
                              "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=500&auto=format&fit=crop"
                            }
                            alt={form.name || "Pet avatar"}
                            crossOrigin="anonymous"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          Preview
                        </p>
                      </div>
                      <input
                        value={form.avatarUrl}
                        readOnly={viewOnly}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, avatarUrl: e.target.value }))
                        }
                        placeholder="Paste image URL"
                        className="mt-4 w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                      />
                      {!viewOnly && (
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ImageUp className="h-4 w-4 text-caramel" />
                          {uploadingAvatar ? "Uploading..." : "Upload from device"}
                        </button>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                        Avatar URL
                      </p>
                    </aside>

                    <section className="rounded-3xl border border-sand bg-white p-5">
                      <div className="grid gap-5">
                        <div>
                          <p className="inline-flex items-center gap-2 font-serif text-3xl font-bold italic text-ink">
                            <PawPrint className="h-5 w-5 text-caramel" />
                            Basic Information
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Pet Name
                              </label>
                              <input
                                required
                                value={form.name}
                                readOnly={viewOnly}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="Pet name"
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Species
                              </label>
                              <Select
                                options={speciesOptions}
                                isDisabled={viewOnly}
                                value={
                                  speciesOptions.find(
                                    (opt) => opt.value === form.species,
                                  ) || speciesOptions[0]
                                }
                                onChange={(option) =>
                                  setForm((p) => ({
                                    ...p,
                                    species:
                                      (option?.value as PetPayload["species"]) ||
                                      "Dog",
                                  }))
                                }
                                styles={selectStyles}
                                isSearchable={false}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Breed
                              </label>
                              <input
                                value={form.breed}
                                readOnly={viewOnly}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, breed: e.target.value }))
                                }
                                placeholder="Breed"
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Gender
                              </label>
                              <Select
                                options={genderOptions}
                                isDisabled={viewOnly}
                                value={
                                  genderOptions.find(
                                    (opt) => opt.value === form.gender,
                                  ) || genderOptions[0]
                                }
                                onChange={(option) =>
                                  setForm((p) => ({
                                    ...p,
                                    gender:
                                      (option?.value as PetPayload["gender"]) ||
                                      "Unknown",
                                  }))
                                }
                                styles={selectStyles}
                                isSearchable={false}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-sand pt-5">
                          <p className="inline-flex items-center gap-2 font-serif text-3xl font-bold italic text-ink">
                            <Weight className="h-5 w-5 text-caramel" />
                            Physical Status
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Age (Years)
                              </label>
                              <input
                                type="number"
                                min={0}
                                readOnly={viewOnly}
                                value={form.age ?? ""}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    age: e.target.value === "" ? undefined : Number(e.target.value),
                                  }))
                                }
                                placeholder="Age (years)"
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                min={0}
                                step="0.1"
                                readOnly={viewOnly}
                                value={form.weightKg ?? ""}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    weightKg: e.target.value === "" ? undefined : Number(e.target.value),
                                  }))
                                }
                                placeholder="Weight (kg)"
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Health Status
                              </label>
                              <input
                                value={form.healthStatus}
                                readOnly={viewOnly}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    healthStatus: e.target.value,
                                  }))
                                }
                                placeholder="Health status"
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Spayed?
                              </label>
                              <div className="grid grid-cols-2 rounded-xl border border-sand bg-warm/50 p-1">
                                <button
                                  type="button"
                                  disabled={viewOnly}
                                  onClick={() => setForm((p) => ({ ...p, isSpayed: true }))}
                                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    form.isSpayed
                                      ? "bg-brown text-white"
                                      : "text-muted hover:bg-white/70"
                                  }`}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  disabled={viewOnly}
                                  onClick={() => setForm((p) => ({ ...p, isSpayed: false }))}
                                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                    !form.isSpayed
                                      ? "bg-brown text-white"
                                      : "text-muted hover:bg-white/70"
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Last Visit Date
                              </label>
                              <input
                                type="date"
                                readOnly={viewOnly}
                                value={form.lastVisitDate || ""}
                                onChange={(e) =>
                                  setForm((p) => ({
                                    ...p,
                                    lastVisitDate: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-sand pt-5">
                          <p className="inline-flex items-center gap-2 font-serif text-3xl font-bold italic text-ink">
                            <Heart className="h-5 w-5 text-caramel" />
                            Health & Notes
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className={(editing && !viewOnly) ? "sm:col-span-2" : ""}>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                Allergies
                              </label>
                              <input
                                value={form.allergies || ""}
                                readOnly={viewOnly}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, allergies: e.target.value }))
                                }
                                placeholder="Food, products, etc."
                                className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                              />
                            </div>
                            {(viewOnly || !editing) && (
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                  Medical History / Medications
                                </label>
                                <input
                                  value={form.medicalHistory || ""}
                                  readOnly={viewOnly}
                                  onChange={(e) =>
                                    setForm((p) => ({
                                      ...p,
                                      medicalHistory: e.target.value,
                                    }))
                                  }
                                  placeholder="Ear infection, Apoquel..."
                                  className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                                />
                                {(form.medicalHistoryRecords?.length || 0) > 0 ? (
                                  <div className="mt-3 rounded-xl border border-sand bg-warm/30 p-3">
                                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                                      Clinic Notes Timeline
                                    </p>
                                    <div className="max-h-32 space-y-2 overflow-y-auto pr-1">
                                      {form.medicalHistoryRecords?.map((record, index) => (
                                        <div key={record._id || `${record.createdAt}-${index}`} className="rounded-lg bg-white px-3 py-2 ring-1 ring-sand">
                                          <p className="text-xs font-semibold text-ink">{record.note}</p>
                                          <p className="mt-1 text-[11px] text-muted">
                                            {(record.providerName || "Clinic")} · {record.createdAt ? new Date(record.createdAt).toLocaleString() : "Unknown time"}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                          <label className="mt-4 mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                            Notes For Staff
                          </label>
                          <textarea
                            value={form.notes}
                            readOnly={viewOnly}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            placeholder="Special instructions, personality notes for staff..."
                            className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                            rows={4}
                          />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="mx-6 mb-6 mt-6 flex justify-end gap-2 border-t border-sand pt-5 md:mx-8">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-full border border-sand px-5 py-2 text-sm font-semibold text-ink hover:bg-warm"
                    >
                      {viewOnly ? "Close" : "Cancel"}
                    </button>
                    {!viewOnly && (
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-full bg-brown px-6 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
                      >
                        {saving
                          ? "Saving..."
                          : editing
                            ? "Update Passport"
                            : "Create Passport"}
                      </button>
                    )}
                  </div>
                </form>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingPet && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl border border-sand bg-white p-6 shadow-2xl"
            >
              <h4 className="font-serif text-3xl font-bold italic text-ink">Delete Pet?</h4>
              <p className="mt-2 text-sm text-muted">
                This will remove <span className="font-semibold text-ink">{deletingPet.name}</span> from your pet library.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingPet(null)}
                  className="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-ink hover:bg-warm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingPet._id)}
                  className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
