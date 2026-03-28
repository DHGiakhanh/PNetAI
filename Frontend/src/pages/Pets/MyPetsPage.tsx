import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit3, Plus, Stethoscope, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Select, { StylesConfig } from "react-select";
import { Pet, PetPayload, petService } from "@/services/pet.service";

const initialForm: PetPayload = {
  name: "",
  species: "Dog",
  breed: "",
  gender: "Unknown",
  age: 0,
  weightKg: 0,
  healthStatus: "Healthy",
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
      weightKg: pet.weightKg || 0,
      healthStatus: pet.healthStatus || "Healthy",
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

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing?._id) {
        await petService.updatePet(editing._id, form);
      } else {
        await petService.createPet(form);
      }
      closeModal();
      fetchPets();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not save pet.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this pet profile?")) return;
    try {
      await petService.deletePet(id);
      fetchPets();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not delete pet.");
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
                        onClick={() => handleDelete(pet._id)}
                        className="inline-flex items-center justify-center gap-1 rounded-full border border-rust/30 px-3 py-2 text-sm font-semibold text-rust hover:bg-[#fff1eb]"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                      <Link
                        to="/services"
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-brown px-3 py-2 text-sm font-semibold text-white hover:bg-brown-dark"
                      >
                        <Stethoscope className="h-4 w-4" /> Book
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
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/20 p-4">
          <form onSubmit={handleSave} className="w-full max-w-xl rounded-3xl border border-sand bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-3xl font-bold italic text-ink">{editing ? "Edit Pet" : "Add New Pet"}</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel"
              />
              <Select
                options={speciesOptions}
                value={speciesOptions.find((opt) => opt.value === form.species) || speciesOptions[0]}
                onChange={(option) =>
                  setForm((p) => ({ ...p, species: (option?.value as PetPayload["species"]) || "Dog" }))
                }
                styles={selectStyles}
                isSearchable={false}
              />
              <input value={form.breed} onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))} placeholder="Breed" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel" />
              <Select
                options={genderOptions}
                value={genderOptions.find((opt) => opt.value === form.gender) || genderOptions[0]}
                onChange={(option) =>
                  setForm((p) => ({ ...p, gender: (option?.value as PetPayload["gender"]) || "Unknown" }))
                }
                styles={selectStyles}
                isSearchable={false}
              />
              <input type="number" min={0} value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))} placeholder="Age" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel" />
              <input type="number" min={0} step="0.1" value={form.weightKg} onChange={(e) => setForm((p) => ({ ...p, weightKg: Number(e.target.value) }))} placeholder="Weight (kg)" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel" />
              <input value={form.healthStatus} onChange={(e) => setForm((p) => ({ ...p, healthStatus: e.target.value }))} placeholder="Health status" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel" />
              <input type="date" value={form.lastVisitDate || ""} onChange={(e) => setForm((p) => ({ ...p, lastVisitDate: e.target.value }))} className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel" />
              <input value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} placeholder="Avatar URL" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2" />
              <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="rounded-xl border border-sand bg-warm/50 p-3 text-sm outline-none focus:border-caramel sm:col-span-2" rows={3} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-ink hover:bg-warm">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-full bg-brown px-5 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update Pet" : "Create Pet"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
