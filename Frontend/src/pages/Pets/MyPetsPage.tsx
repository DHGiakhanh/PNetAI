import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Heart,
  ImageUp,
  PawPrint,
  Plus,
  Stethoscope,
  Trash2,
  Weight,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import Select, { StylesConfig } from "react-select";
import toast from "react-hot-toast";
import { Pet, PetPayload, petService } from "@/services/pet.service";

const initialForm: PetPayload = {
  name: "",
  species: "Dog",
  breed: "",
  gender: "Unknown",
  age: 0,
  birthday: "",
  weightKg: 0,
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
  { value: "Other", label: "Other" },
];

const genderOptions: SelectOption[] = [
  { value: "Unknown", label: "Unknown" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

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

export default function MyPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
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
    setForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      gender: pet.gender || "Unknown",
      age: pet.age || 0,
      birthday: pet.birthday ? new Date(pet.birthday).toISOString().slice(0, 10) : "",
      weightKg: pet.weightKg || 0,
      isSpayed: Boolean(pet.isSpayed),
      healthStatus: pet.healthStatus || "Healthy",
      allergies: pet.allergies || "",
      medicalHistory: pet.medicalHistory || "",
      avatarUrl: pet.avatarUrl || "",
      notes: pet.notes || "",
      lastVisitDate: pet.lastVisitDate ? new Date(pet.lastVisitDate).toISOString().slice(0, 10) : "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
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
      if (editing?._id) {
        await petService.updatePet(editing._id, form);
        toast.success("Pet profile updated.");
      } else {
        await petService.createPet(form);
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
                <article key={pet._id} className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
                  <div className="relative bg-[#f3ead8] px-5 pb-8 pt-5">
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
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="font-serif text-4xl font-bold italic text-ink">{pet.name}</h2>
                      <p className="text-sm text-muted">
                        {pet.breed || pet.species} • {pet.gender || "Unknown"} • {pet.age || 0} years
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
                        onClick={() => openEdit(pet)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-sand px-3 py-2 text-sm font-semibold text-ink hover:bg-warm"
                      >
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setDeletingPet(pet)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-rust/30 px-3 py-2 text-sm font-semibold text-rust hover:bg-[#fff1eb]"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                      <Link
                        to="/services"
                        className="inline-flex items-center justify-center rounded-full bg-brown px-3 py-2 text-sm font-semibold text-white hover:bg-brown-dark"
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
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/45 backdrop-blur-[2px] p-2 sm:p-4">
          <form
            onSubmit={handleSave}
            className="relative max-h-[96vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-sand bg-[#FAF7F2] shadow-2xl"
          >
            <div className="sticky top-0 z-30 mb-4 border-b border-sand bg-[#FAF7F2] px-6 pb-3 pt-4 md:px-8 md:pt-5">
              <div className="mb-1.5 flex items-start justify-between gap-4">
                <h3 className="font-serif text-[2rem] font-bold italic leading-tight text-ink md:text-[1.85rem]">
                  {editing ? "Edit" : "Create"} <span className="text-caramel">Pet Passport</span>
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="grid h-9 w-9 place-items-center rounded-full border border-sand bg-white text-muted shadow-sm hover:bg-warm hover:text-ink"
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
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Preview
                  </p>
                </div>
                <input
                  value={form.avatarUrl}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, avatarUrl: e.target.value }))
                  }
                  placeholder="Paste image URL"
                  className="mt-4 w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sand bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-warm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImageUp className="h-4 w-4 text-caramel" />
                  {uploadingAvatar ? "Uploading..." : "Upload from device"}
                </button>
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
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          Birthday
                        </label>
                        <input
                          type="date"
                          value={form.birthday || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              birthday: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
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
                          value={form.age}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              age: Number(e.target.value),
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
                          value={form.weightKg}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              weightKg: Number(e.target.value),
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
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          Allergies
                        </label>
                        <input
                          value={form.allergies || ""}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, allergies: e.target.value }))
                          }
                          placeholder="Food, products, etc."
                          className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                          Medical History / Medications
                        </label>
                        <input
                          value={form.medicalHistory || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              medicalHistory: e.target.value,
                            }))
                          }
                          placeholder="Ear infection, Apoquel..."
                          className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                        />
                      </div>
                    </div>
                    <label className="mt-4 mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Notes For Staff
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Allergies, medications, personality notes for staff..."
                      className="w-full rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
                      rows={4}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 mb-6 flex justify-end gap-2 border-t border-sand pt-5">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-sand px-5 py-2 text-sm font-semibold text-ink hover:bg-warm"
              >
                Cancel
              </button>
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
            </div>
          </form>
        </div>
      ) : null}

      {deletingPet ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-sand bg-white p-6 shadow-2xl">
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
          </div>
        </div>
      ) : null}
    </main>
  );
}
