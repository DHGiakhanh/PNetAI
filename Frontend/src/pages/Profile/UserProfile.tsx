import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Camera,
  ChevronRight,
  Eye,
  KeyRound,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import ToggleSwitch from "../../components/common/ToggleSwitch";
import { authService, UserProfile as UserProfileData } from "../../services/auth.service";

type Pet = {
  id: string;
  name: string;
  breed?: string;
  species?: string;
  avatarUrl?: string;
};

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

function readUserFallback(): Partial<UserProfileData> {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as Partial<UserProfileData>) : {};
  } catch {
    return {};
  }
}

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [profile, setProfile] = useState<UserProfileData>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    saleCode: "",
    role: "",
    createdAt: "",
  });

  useEffect(() => {
    setPets(readPetsFromStorage());
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const user = await authService.getCurrentUser();
        setProfile((prev) => ({
          ...prev,
          ...user,
        }));
      } catch {
        const fallback = readUserFallback();
        if (!fallback.email && !fallback.name) {
          setError("Unable to load profile data.");
        }
        setProfile((prev) => ({
          ...prev,
          ...fallback,
        }));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const firstName = useMemo(() => profile.name?.split(" ").slice(0, -1).join(" ") || profile.name || "", [profile.name]);
  const lastName = useMemo(() => profile.name?.split(" ").slice(-1).join(" ") || "", [profile.name]);
  const joinedDateLabel = useMemo(() => {
    if (!profile.createdAt) return "Member";
    return new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [profile.createdAt]);

  const handleField = (field: keyof UserProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSuccess("");
  };

  const handleNameField = (value: string, type: "first" | "last") => {
    const currentFirst = firstName;
    const currentLast = lastName;
    const merged = type === "first" ? `${value} ${currentLast}`.trim() : `${currentFirst} ${value}`.trim();
    handleField("name", merged);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updated = await authService.updateProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
      });

      const merged = { ...profile, ...updated };
      setProfile(merged);

      const fallback = readUserFallback();
      localStorage.setItem("user", JSON.stringify({ ...fallback, ...merged }));
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-12 w-64 rounded-xl bg-sand" />
          <div className="h-40 rounded-3xl bg-sand/70" />
          <div className="h-72 rounded-3xl bg-sand/70" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm via-cream to-warm px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="font-serif text-4xl font-bold italic text-ink">My Profile</h1>
          <p className="mt-2 text-sm text-muted">Manage your personal details, security, and pet preferences.</p>
          {error ? <p className="mt-3 text-sm text-rust">{error}</p> : null}
          {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-sand bg-white/85 p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-brown text-xl font-bold text-white ring-2 ring-sand">
                {(profile.name || "PP")
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? "")
                  .join("")}
              </div>
              <div className="min-w-[200px] flex-1">
                <h2 className="text-xl font-semibold text-ink">{profile.name || "Pet Parent"}</h2>
                <p className="text-sm text-muted">{joinedDateLabel}</p>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink hover:bg-warm">
                <Camera className="h-4 w-4" /> Change Photo
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-sand bg-gradient-to-br from-brown to-brown-dark p-6 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.15em] text-white/80">Account</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold italic">{profile.role || "customer"}</h3>
            <p className="mt-3 text-sm text-white/80">
              {pets.length} pet profile{pets.length === 1 ? "" : "s"} connected.
            </p>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-sand bg-white/85 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">Personal Information</h3>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-brown px-4 py-2 text-sm font-semibold text-white hover:bg-brown-dark disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-sand bg-warm/40 p-3 text-sm text-ink outline-none focus:border-caramel"
                  value={firstName}
                  onChange={(e) => handleNameField(e.target.value, "first")}
                  placeholder="First name"
                />
                <input
                  className="rounded-xl border border-sand bg-warm/40 p-3 text-sm text-ink outline-none focus:border-caramel"
                  value={lastName}
                  onChange={(e) => handleNameField(e.target.value, "last")}
                  placeholder="Last name"
                />
                <input
                  className="rounded-xl border border-sand bg-warm/40 p-3 text-sm text-ink outline-none focus:border-caramel sm:col-span-2"
                  value={profile.email || ""}
                  disabled
                  placeholder="Email"
                />
                <input
                  className="rounded-xl border border-sand bg-warm/40 p-3 text-sm text-ink outline-none focus:border-caramel"
                  value={profile.phone || ""}
                  onChange={(e) => handleField("phone", e.target.value)}
                  placeholder="Phone number"
                />
                <input
                  className="rounded-xl border border-sand bg-warm/40 p-3 text-sm text-ink outline-none focus:border-caramel"
                  value={profile.address || ""}
                  onChange={(e) => handleField("address", e.target.value)}
                  placeholder="Address"
                />
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-ink">Linked Sale Code (Optional)</p>
                <input
                  className="w-full rounded-xl border border-sand bg-warm p-3 text-sm text-ink outline-none"
                  value={profile.saleCode || ""}
                  disabled
                  placeholder="No sale code"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-sand bg-white/85 p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brown" />
                <h3 className="text-lg font-semibold text-ink">Security</h3>
              </div>
              <div className="rounded-2xl border border-sand bg-warm/40 p-4">
                <p className="mb-4 text-sm text-muted">Change your password regularly to keep your account safe.</p>
                <button className="inline-flex items-center gap-2 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink hover:bg-warm">
                  <KeyRound className="h-4 w-4 text-brown" />
                  Change Password
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-sand bg-white/85 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">My Pets</h3>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-brown text-white">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {pets.length === 0 ? (
                  <p className="rounded-2xl border border-sand bg-warm/40 p-3 text-sm text-muted">No pet profiles yet.</p>
                ) : (
                  pets.map((pet) => (
                    <button
                      key={pet.id}
                      className="flex w-full items-center justify-between rounded-2xl border border-sand bg-warm/40 p-3 text-left hover:bg-warm"
                    >
                      <div className="flex items-center gap-3">
                        {pet.avatarUrl ? (
                          <img src={pet.avatarUrl} alt={pet.name} className="h-11 w-11 rounded-xl object-cover" />
                        ) : (
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-sand text-xs font-bold text-brown">
                            {pet.name?.slice(0, 1).toUpperCase() || "P"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-ink">{pet.name}</p>
                          <p className="text-xs text-muted">{pet.breed || pet.species || "Pet"}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-sand bg-white/85 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-ink">Preferences</h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <BellRing className="h-4 w-4 text-brown" />
                      Email Notifications
                    </p>
                    <p className="text-xs text-muted">Health updates and reminders</p>
                  </div>
                  <ToggleSwitch defaultOn />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Smartphone className="h-4 w-4 text-brown" />
                      SMS Alerts
                    </p>
                    <p className="text-xs text-muted">For vet appointments</p>
                  </div>
                  <ToggleSwitch />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Eye className="h-4 w-4 text-brown" />
                      Community Visibility
                    </p>
                    <p className="text-xs text-muted">Show profile to other owners</p>
                  </div>
                  <ToggleSwitch defaultOn />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-rust/25 bg-[#fff5f1] p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-semibold text-rust">Danger Zone</h3>
              <p className="mb-4 text-sm text-muted">
                Permanently delete your account and all associated pet records from PNetAI.
              </p>
              <button className="inline-flex items-center gap-2 rounded-full border border-rust/40 px-4 py-2 text-sm font-semibold text-rust hover:bg-[#ffe9e1]">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
