import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  PawPrint,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import { Pet, petService } from "@/services/pet.service";

const speciesOptions = ["", "Dog", "Cat", "Bird", "Rabbit", "Hamster", "Other"];
const moderationOptions = ["", "active", "flagged", "disabled"];
const defaultCorrectionMessage = "Please verify/update this pet information.";

const statusClasses: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  flagged: "bg-amber-50 text-amber-700 border-amber-100",
  disabled: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function AdminPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPets, setTotalPets] = useState(0);
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [moderationPet, setModerationPet] = useState<Pet | null>(null);
  const [correctionPet, setCorrectionPet] = useState<Pet | null>(null);
  const [moderationSummary, setModerationSummary] = useState({ active: 0, flagged: 0, disabled: 0 });
  const pageSize = 10;

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await petService.getAdminPets({
        page,
        limit: pageSize,
        search,
        species,
        healthStatus,
        moderationStatus,
      });
      setPets(response.pets);
      setTotalPages(response.pagination.pages || 1);
      setTotalPets(response.pagination.total || 0);
      setModerationSummary(response.moderationSummary);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load pet registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (page === 1) fetchPets();
      else setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, species, healthStatus, moderationStatus]);

  useEffect(() => {
    fetchPets();
  }, [page]);

  const selectedPetId = selectedPet?._id;
  useEffect(() => {
    if (!selectedPetId) return;
    const fresh = pets.find((pet) => pet._id === selectedPetId);
    if (fresh) setSelectedPet(fresh);
  }, [pets, selectedPetId]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-caramel">Trust & Safety</p>
          <h1 className="font-serif text-4xl font-bold italic text-ink">Pet Registry Moderation</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-muted">
            Review pet records, flag suspicious profiles, and ask owners to correct important information.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPets}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-sand bg-white px-5 py-2.5 text-xs font-black uppercase tracking-widest text-ink shadow-sm hover:bg-warm"
        >
          <RefreshCw className="h-4 w-4 text-caramel" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Active pets", value: moderationSummary.active, icon: CheckCircle2 },
          { label: "Flagged pets", value: moderationSummary.flagged, icon: ShieldAlert },
          { label: "Disabled pets", value: moderationSummary.disabled, icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <stat.icon className="mb-3 h-5 w-5 text-caramel" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-black text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-sand bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px_170px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pet, breed, owner, email, phone..."
              className="h-12 w-full rounded-xl border border-sand bg-warm/30 pl-11 pr-4 text-sm font-semibold text-ink outline-none focus:border-caramel"
            />
          </div>
          <select
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
            className="h-12 rounded-xl border border-sand bg-warm/30 px-3 text-sm font-semibold text-ink outline-none focus:border-caramel"
          >
            {speciesOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All species"}
              </option>
            ))}
          </select>
          <input
            value={healthStatus}
            onChange={(event) => setHealthStatus(event.target.value)}
            placeholder="Health status"
            className="h-12 rounded-xl border border-sand bg-warm/30 px-3 text-sm font-semibold text-ink outline-none focus:border-caramel"
          />
          <select
            value={moderationStatus}
            onChange={(event) => setModerationStatus(event.target.value)}
            className="h-12 rounded-xl border border-sand bg-warm/30 px-3 text-sm font-semibold capitalize text-ink outline-none focus:border-caramel"
          >
            {moderationOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "All moderation"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-warm/60">
              <tr>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Pet</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Owner</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Health</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Moderation</th>
                <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Updated</th>
                <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-caramel" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted">Loading registry...</span>
                  </td>
                </tr>
              ) : pets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs font-black uppercase tracking-widest text-muted">
                    No pet records found.
                  </td>
                </tr>
              ) : (
                pets.map((pet) => {
                  const status = pet.moderationStatus || "active";
                  return (
                    <tr key={pet._id} className="hover:bg-warm/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-sand bg-warm">
                            {pet.avatarUrl ? (
                              <img src={pet.avatarUrl} alt={pet.name} className="h-full w-full object-cover" />
                            ) : (
                              <PawPrint className="h-5 w-5 text-caramel" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-ink">{pet.name}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
                              {pet.species} / {pet.breed || "No breed"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-ink">{pet.user?.name || "Unknown owner"}</p>
                        <p className="text-xs text-muted">{pet.user?.email || "-"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-ink">{pet.healthStatus || "Healthy"}</p>
                        <p className="text-xs text-muted">{pet.weightKg || 0} kg</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClasses[status] || statusClasses.active}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-muted">
                        {pet.updatedAt ? new Date(pet.updatedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPet(pet)}
                            className="inline-flex items-center gap-1 rounded-lg border border-sand px-3 py-2 text-xs font-bold text-ink hover:bg-warm"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setModerationPet(pet)}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                          >
                            <ShieldAlert className="h-4 w-4" />
                            Moderate
                          </button>
                          <button
                            type="button"
                            onClick={() => setCorrectionPet(pet)}
                            className="inline-flex items-center gap-1 rounded-lg border border-caramel/30 px-3 py-2 text-xs font-bold text-brown hover:bg-warm"
                          >
                            <Send className="h-4 w-4" />
                            Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalPets}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {selectedPet && <PetDetailModal pet={selectedPet} onClose={() => setSelectedPet(null)} />}
      {moderationPet && (
        <ModerationModal
          pet={moderationPet}
          onClose={() => setModerationPet(null)}
          onSaved={(pet) => {
            setPets((prev) => prev.map((item) => (item._id === pet._id ? pet : item)));
            setModerationPet(null);
            toast.success("Pet moderation updated.");
          }}
        />
      )}
      {correctionPet && (
        <CorrectionModal
          pet={correctionPet}
          onClose={() => setCorrectionPet(null)}
          onSent={(pet) => {
            setPets((prev) => prev.map((item) => (item._id === pet._id ? pet : item)));
            setCorrectionPet(null);
            toast.success("Correction request sent.");
          }}
        />
      )}
    </div>
  );
}

function PetDetailModal({ pet, onClose }: { pet: Pet; onClose: () => void }) {
  const status = pet.moderationStatus || "active";
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-sand bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-caramel">Pet detail</p>
            <h2 className="font-serif text-3xl font-bold italic text-ink">{pet.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-sand hover:bg-warm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-sand bg-warm">
            {pet.avatarUrl ? (
              <img src={pet.avatarUrl} alt={pet.name} className="h-48 w-full object-cover" />
            ) : (
              <div className="grid h-48 place-items-center">
                <PawPrint className="h-12 w-12 text-caramel" />
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Owner" value={`${pet.user?.name || "Unknown"} (${pet.user?.email || "-"})`} />
            <InfoRow label="Species" value={`${pet.species} / ${pet.breed || "No breed"}`} />
            <InfoRow label="Gender / Age" value={`${pet.gender || "Unknown"} / ${pet.age || 0} years`} />
            <InfoRow label="Weight" value={`${pet.weightKg || 0} kg`} />
            <InfoRow label="Health" value={pet.healthStatus || "Healthy"} />
            <InfoRow label="Moderation" value={status} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextPanel title="Allergies" text={pet.allergies || "No allergies recorded."} />
          <TextPanel title="Notes for staff" text={pet.notes || "No notes recorded."} />
          <TextPanel title="Medical summary" text={pet.medicalHistory || "No medical history recorded."} />
          <TextPanel title="Moderation note" text={pet.moderationNote || pet.moderationReason || "No moderation note."} />
        </div>

        <div className="mt-5 rounded-2xl border border-sand bg-warm/20 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">Clinic timeline</p>
          {(pet.medicalHistoryRecords || []).length === 0 ? (
            <p className="text-sm font-semibold text-muted">No clinic timeline yet.</p>
          ) : (
            <div className="space-y-2">
              {pet.medicalHistoryRecords?.slice().reverse().map((record) => (
                <div key={record._id || `${record.createdAt}-${record.note}`} className="rounded-xl bg-white p-3 ring-1 ring-sand">
                  <p className="text-sm font-semibold text-ink">{record.note}</p>
                  <p className="mt-1 text-xs text-muted">
                    {record.providerName || "Clinic"} / {record.createdAt ? new Date(record.createdAt).toLocaleString() : "Unknown time"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModerationModal({
  pet,
  onClose,
  onSaved,
}: {
  pet: Pet;
  onClose: () => void;
  onSaved: (pet: Pet) => void;
}) {
  const [status, setStatus] = useState<"active" | "flagged" | "disabled">((pet.moderationStatus || "active") as "active" | "flagged" | "disabled");
  const [reason, setReason] = useState(pet.moderationReason || "");
  const [note, setNote] = useState(pet.moderationNote || "");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const updated = await petService.updatePetModeration(pet._id, {
        moderationStatus: status,
        moderationReason: reason,
        moderationNote: note,
      });
      onSaved(updated);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update moderation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalFrame title={`Moderate ${pet.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-muted">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "active" | "flagged" | "disabled")}
            className="w-full rounded-xl border border-sand bg-warm/30 px-4 py-3 text-sm font-semibold outline-none focus:border-caramel"
          >
            <option value="active">Active</option>
            <option value="flagged">Flagged</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-muted">Reason</label>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-xl border border-sand bg-warm/30 px-4 py-3 text-sm font-semibold outline-none focus:border-caramel"
            placeholder="Fake pet, spam, abuse..."
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-muted">Internal note</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-sand bg-warm/30 px-4 py-3 text-sm font-semibold outline-none focus:border-caramel"
            placeholder="Add context for future moderation review."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-sand px-5 py-2 text-sm font-semibold hover:bg-warm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-ink px-6 py-2 text-sm font-semibold text-white hover:bg-caramel disabled:opacity-60">
            {saving ? "Saving..." : "Save moderation"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function CorrectionModal({
  pet,
  onClose,
  onSent,
}: {
  pet: Pet;
  onClose: () => void;
  onSent: (pet: Pet) => void;
}) {
  const [message, setMessage] = useState(pet.correctionRequestMessage || defaultCorrectionMessage);
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSending(true);
      const updated = await petService.requestPetCorrection(pet._id, message);
      onSent(updated);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not send correction request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalFrame title={`Request correction: ${pet.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-2xl border border-sand bg-warm/30 p-4 text-sm font-semibold text-muted">
          This sends an in-app notification and email to {pet.user?.email || "the owner"}.
        </p>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-widest text-muted">Message to owner</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            required
            className="w-full rounded-xl border border-sand bg-warm/30 px-4 py-3 text-sm font-semibold outline-none focus:border-caramel"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full border border-sand px-5 py-2 text-sm font-semibold hover:bg-warm">
            Cancel
          </button>
          <button type="submit" disabled={sending} className="rounded-full bg-caramel px-6 py-2 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60">
            {sending ? "Sending..." : "Send request"}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-sand bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold italic text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-sand hover:bg-warm">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sand bg-warm/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function TextPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-sand bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{text}</p>
    </div>
  );
}
