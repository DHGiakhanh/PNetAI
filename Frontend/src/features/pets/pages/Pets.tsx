import { useEffect, useMemo, useState } from "react";
import apiClient from "@/utils/api.service";

type Pet = {
  _id: string;
  owner: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  photo?: string;
  allergies?: string[];
  vaccinations?: Array<{ vaccine: string; date: string; clinic?: string; notes?: string }>;
  medicalLogs?: Array<{ date: string; type?: string; title?: string; description: string }>;
};

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPet, setNewPet] = useState({
    name: "",
    species: "",
    breed: ""
  });

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const [vacForm, setVacForm] = useState({
    vaccine: "",
    date: "",
    clinic: "",
    notes: ""
  });

  const [logForm, setLogForm] = useState({
    date: "",
    type: "visit",
    title: "",
    description: ""
  });

  const selectedPet = useMemo(
    () => pets.find((p) => p._id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  async function refresh() {
    setLoading(true);
    try {
      const res = await apiClient.get("/pets");
      const nextPets = res.data?.pets || [];
      setPets(nextPets);
      if (!selectedPetId && nextPets.length) setSelectedPetId(nextPets[0]._id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPet = async () => {
    if (!newPet.name || !newPet.species) return;
    try {
      await apiClient.post("/pets", newPet);
      setNewPet({ name: "", species: "", breed: "" });
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to create pet");
    }
  };

  const addVaccination = async () => {
    if (!selectedPetId) return;
    if (!vacForm.vaccine || !vacForm.date) return;
    try {
      await apiClient.post(`/pets/${selectedPetId}/vaccinations`, {
        ...vacForm,
        date: vacForm.date
      });
      setVacForm({ vaccine: "", date: "", clinic: "", notes: "" });
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to add vaccination");
    }
  };

  const addMedicalLog = async () => {
    if (!selectedPetId) return;
    if (!logForm.date || !logForm.description) return;
    try {
      await apiClient.post(`/pets/${selectedPetId}/medical-logs`, {
        ...logForm,
        date: logForm.date
      });
      setLogForm({ date: "", type: "visit", title: "", description: "" });
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to add medical log");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Pets & EHR</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-pink-100 p-4">
          <h2 className="font-semibold mb-3">Pets</h2>
          <div className="space-y-2">
            {pets.map((p) => (
              <button
                key={p._id}
                className={`w-full text-left px-3 py-2 rounded-xl border ${
                  selectedPetId === p._id ? "bg-pink-50 border-pink-200" : "bg-white hover:bg-pink-50/40 border-pink-100"
                }`}
                onClick={() => setSelectedPetId(p._id)}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-500">{p.species}{p.breed ? ` • ${p.breed}` : ""}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-pink-100">
            <h3 className="font-semibold mb-2">Add pet</h3>
            <div className="space-y-2">
              <input
                className="w-full rounded-xl border border-pink-100 p-2"
                placeholder="Name"
                value={newPet.name}
                onChange={(e) => setNewPet((s) => ({ ...s, name: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-pink-100 p-2"
                placeholder="Species (dog/cat/other)"
                value={newPet.species}
                onChange={(e) => setNewPet((s) => ({ ...s, species: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-pink-100 p-2"
                placeholder="Breed (optional)"
                value={newPet.breed}
                onChange={(e) => setNewPet((s) => ({ ...s, breed: e.target.value }))}
              />
              <button
                onClick={createPet}
                className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
              >
                Create pet
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-pink-100 p-4">
          {!selectedPet ? (
            <div>Select a pet to view EHR.</div>
          ) : (
            <>
              <h2 className="font-semibold mb-4">
                EHR: {selectedPet.name}
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Vaccinations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="rounded-xl border border-pink-100 p-2"
                      placeholder="Vaccine"
                      value={vacForm.vaccine}
                      onChange={(e) => setVacForm((s) => ({ ...s, vaccine: e.target.value }))}
                    />
                    <input
                      className="rounded-xl border border-pink-100 p-2"
                      type="date"
                      value={vacForm.date}
                      onChange={(e) => setVacForm((s) => ({ ...s, date: e.target.value }))}
                    />
                    <input
                      className="rounded-xl border border-pink-100 p-2 md:col-span-2"
                      placeholder="Clinic (optional)"
                      value={vacForm.clinic}
                      onChange={(e) => setVacForm((s) => ({ ...s, clinic: e.target.value }))}
                    />
                    <textarea
                      className="rounded-xl border border-pink-100 p-2 md:col-span-2"
                      placeholder="Notes (optional)"
                      value={vacForm.notes}
                      onChange={(e) => setVacForm((s) => ({ ...s, notes: e.target.value }))}
                      rows={3}
                    />
                    <button
                      onClick={addVaccination}
                      className="md:col-span-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
                    >
                      Add vaccination
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(selectedPet.vaccinations || []).map((v, idx) => (
                      <div key={idx} className="border rounded-xl border-pink-100 p-3">
                        <div className="font-medium">{v.vaccine}</div>
                        <div className="text-sm text-gray-500">
                          {v.date}{v.clinic ? ` • ${v.clinic}` : ""}
                        </div>
                        {v.notes ? <div className="text-xs mt-1 text-gray-600">{v.notes}</div> : null}
                      </div>
                    ))}
                    {(selectedPet.vaccinations || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No vaccinations yet.</div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Medical Logs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="rounded-xl border border-pink-100 p-2"
                      type="date"
                      value={logForm.date}
                      onChange={(e) => setLogForm((s) => ({ ...s, date: e.target.value }))}
                    />
                    <select
                      className="rounded-xl border border-pink-100 p-2"
                      value={logForm.type}
                      onChange={(e) => setLogForm((s) => ({ ...s, type: e.target.value }))}
                    >
                      <option value="visit">visit</option>
                      <option value="treatment">treatment</option>
                      <option value="note">note</option>
                      <option value="allergy">allergy</option>
                      <option value="vaccination">vaccination</option>
                    </select>
                    <input
                      className="rounded-xl border border-pink-100 p-2 md:col-span-2"
                      placeholder="Title (optional)"
                      value={logForm.title}
                      onChange={(e) => setLogForm((s) => ({ ...s, title: e.target.value }))}
                    />
                    <textarea
                      className="rounded-xl border border-pink-100 p-2 md:col-span-2"
                      placeholder="Description"
                      value={logForm.description}
                      onChange={(e) => setLogForm((s) => ({ ...s, description: e.target.value }))}
                      rows={4}
                    />
                    <button
                      onClick={addMedicalLog}
                      className="md:col-span-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold"
                    >
                      Add medical log
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(selectedPet.medicalLogs || []).map((l, idx) => (
                      <div key={idx} className="border rounded-xl border-pink-100 p-3">
                        <div className="font-medium">{l.title || "Medical log"}</div>
                        <div className="text-sm text-gray-500">{l.date}{l.type ? ` • ${l.type}` : ""}</div>
                        <div className="text-xs mt-1 text-gray-700">{l.description}</div>
                      </div>
                    ))}
                    {(selectedPet.medicalLogs || []).length === 0 ? (
                      <div className="text-sm text-gray-500">No medical logs yet.</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

