import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Heart,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  Weight,
  X,
} from "lucide-react";
import { Pet } from "@/services/pet.service";

const closeButtonClass =
  "grid h-9 w-9 place-items-center rounded-full border border-sand bg-[#FAF7F2] text-ink shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-caramel/40";

const getModerationCopy = (status?: Pet["moderationStatus"]) => {
  if (status === "disabled") {
    return {
      label: "Booking Disabled",
      className: "border-rose-200 bg-rose-50 text-rose-700",
      message: "This pet profile is temporarily disabled for booking.",
    };
  }
  if (status === "flagged") {
    return {
      label: "Needs Review",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      message: "This pet profile has been flagged for review.",
    };
  }
  return null;
};

type PetPassportModalProps = {
  pet: Pet;
  onClose: () => void;
};

export function PetPassportModal({ pet, onClose }: PetPassportModalProps) {
  const moderationCopy = getModerationCopy(pet.moderationStatus);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 p-2 backdrop-blur-[2px] sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="relative mt-2 w-full max-w-4xl overflow-hidden rounded-[40px] border border-sand bg-[#FAF7F2] shadow-2xl"
        >
          <div className="max-h-[96vh] overflow-y-auto [scrollbar-gutter:stable]">
            <div className="relative">
              <div className="relative h-48 overflow-hidden bg-[#FAF7F2]">
                <div className="absolute inset-0 bg-gradient-to-r from-caramel/10 to-transparent" />
                <button
                  type="button"
                  onClick={onClose}
                  className={`absolute right-8 top-5 z-40 ${closeButtonClass}`}
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-8 pb-10">
                <div className="relative z-10 -mt-24 flex flex-col items-center md:flex-row md:items-end md:gap-8">
                  <div className="h-44 w-44 overflow-hidden rounded-[2.5rem] border-[6px] border-[#FAF7F2] bg-warm shadow-xl">
                    <img
                      src={
                        pet.avatarUrl ||
                        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=500&auto=format&fit=crop"
                      }
                      alt={pet.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-6 flex-1 text-center md:mb-4 md:text-left">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-caramel/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-caramel ring-1 ring-caramel/20">
                      <ShieldCheck className="h-3 w-3" /> {pet.healthStatus || "Healthy"}
                    </span>
                    <h2 className="mt-2 font-serif text-5xl font-bold italic text-ink md:text-6xl">{pet.name}</h2>
                    <p className="mt-1 text-lg font-medium text-muted">
                      {pet.species} • {pet.breed || "Mixed Breed"}
                    </p>
                  </div>
                </div>

                {moderationCopy ? (
                  <div
                    className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${moderationCopy.className}`}
                  >
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-black uppercase tracking-widest">{moderationCopy.label}</p>
                      <p className="mt-1">
                        {pet.correctionRequestMessage || moderationCopy.message}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Gender", value: pet.gender || "Unknown", icon: PawPrint },
                    { label: "Age", value: `${pet.age || 0} Years`, icon: CalendarDays },
                    { label: "Weight", value: `${pet.weightKg || 0} KG`, icon: Weight },
                    { label: "Spayed", value: pet.isSpayed ? "Yes" : "No", icon: Activity },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-3xl border border-sand bg-white p-5 shadow-sm transition-transform hover:-translate-y-1"
                    >
                      <stat.icon className="mb-3 h-5 w-5 text-caramel" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{stat.label}</p>
                      <p className="mt-1 font-serif text-xl font-bold text-ink">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-2">
                  <section className="rounded-[2.5rem] border border-sand bg-white p-8 shadow-sm">
                    <h3 className="flex items-center gap-3 font-serif text-2xl font-bold italic text-ink">
                      <Stethoscope className="h-6 w-6 text-caramel" /> Professional History
                    </h3>
                    <div className="mt-6 space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">
                          Medical Summary
                        </p>
                        <p className="mt-2 text-sm italic leading-relaxed text-ink opacity-80">
                          {pet.medicalHistory || "No professional history recorded."}
                        </p>
                      </div>
                      {pet.medicalHistoryRecords && pet.medicalHistoryRecords.length > 0 ? (
                        <div>
                          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted/60">
                            Clinic Timeline
                          </p>
                          <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                            {pet.medicalHistoryRecords
                              .slice()
                              .reverse()
                              .map((record, index) => (
                                <div
                                  key={record._id || index}
                                  className="rounded-2xl border border-sand/50 bg-warm/30 p-4"
                                >
                                  <p className="text-sm font-medium italic text-ink">"{record.note}"</p>
                                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                                    <span className="uppercase tracking-widest text-caramel">
                                      {record.providerName || "Clinic"}
                                    </span>
                                    <span className="text-muted">
                                      {record.createdAt
                                        ? new Date(record.createdAt).toLocaleDateString()
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="rounded-[2.5rem] border border-sand bg-white p-8 shadow-sm">
                    <h3 className="flex items-center gap-3 font-serif text-2xl font-bold italic text-ink">
                      <Heart className="h-6 w-6 text-caramel" /> Health & Behavior
                    </h3>
                    <div className="mt-6 space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">Allergies</p>
                        <p className="mt-2 text-sm font-bold text-ink">{pet.allergies || "None identified."}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">
                          Special Instructions
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-ink opacity-80">
                          {pet.notes || "No special care instructions provided."}
                        </p>
                      </div>
                      <div className="border-t border-sand pt-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-warm text-caramel">
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted/60">
                              Last Professional Visit
                            </p>
                            <p className="text-sm font-bold text-ink">
                              {pet.lastVisitDate
                                ? new Date(pet.lastVisitDate).toLocaleDateString()
                                : "No recorded visits"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-ink px-10 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-ink/90"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
