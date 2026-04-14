import { useEffect, useState } from "react";
import {
  BellRing,
  Camera,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Zap,
  ArrowRight,
  Save,
  X,
  History,
  Lock,
  User,
  Heart
} from "lucide-react";
import { authService, UserProfile as UserProfileData } from "../../services/auth.service";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { VNAddressPicker } from "../../components/profile/VNAddressPicker";
import { toast } from "react-hot-toast";
import { Pet, petService } from "@/services/pet.service";

const RECENT_ACTIVITIES = [
  { id: 1, type: "Booking", title: "Full Spa Treatment", date: "2 days ago", icon: <Zap className="w-4 h-4" /> },
  { id: 2, type: "Purchase", title: "Premium Organic Kibble", date: "5 days ago", icon: <History className="w-4 h-4" /> },
];



function readUserFallback(): Partial<UserProfileData> {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

// --- Specialized Profile Cards ---

const InfoCard = ({ label, value, icon: Icon, onChange, disabled = false, fullWidth = false }: {
  label: string;
  value: string | undefined;
  icon: any;
  onChange: (val: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={`bg-white border border-sand/50 p-6 rounded-[1.5rem] transition-all hover:shadow-sm ${fullWidth ? "col-span-full" : ""}`}>
      <div className="flex items-center justify-between mb-3 text-muted/60">
        <label className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" /> {label}
        </label>
        {!disabled && (
          <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] uppercase font-bold text-caramel hover:underline">
            {isEditing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>

      {isEditing ? (
        <input
          autoFocus
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full bg-transparent text-lg font-bold text-ink outline-none border-b-2 border-sage py-1"
        />
      ) : (
        <p className="text-lg font-bold text-ink truncate">
          {value || `No ${label.toLowerCase()} set`}
        </p>
      )}
    </div>
  );
};

// --- Custom Toggle ---
const CustomToggle = ({ checked, onChange, label, sublabel }: { checked: boolean, onChange: (v: boolean) => void, label: string, sublabel: string }) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between p-6 bg-white border border-sand/30 rounded-[1.5rem] hover:bg-warm/10 transition-all text-left"
  >
    <div>
      <p className="text-sm font-bold text-ink">{label}</p>
      <p className="text-[11px] text-muted">{sublabel}</p>
    </div>
    <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${checked ? "bg-sage" : "bg-sand"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${checked ? "left-7" : "left-1"}`} />
    </div>
  </button>
);

// --- Main Page ---

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    id: "", name: "", email: "", phone: "", address: "", saleCode: "", role: "", createdAt: "",
  });
  const [pets, setPets] = useState<Pet[]>([]);
  const [showPassModal, setShowPassModal] = useState(false);
  const [prefs, setPrefs] = useState({ zalo: true, journal: true, deals: false, sms: true });
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [passUpdating, setPassUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const storedPrefs = localStorage.getItem("user_prefs");
        if (storedPrefs) setPrefs(JSON.parse(storedPrefs));

        const [user, petsList] = await Promise.all([
          authService.getCurrentUser(),
          petService.getMyPets()
        ]);
        setProfile((p: UserProfileData) => ({ ...p, ...user }));
        setPets(petsList);
      } catch {
        const fb = readUserFallback();
        setProfile((p: UserProfileData) => ({ ...p, ...fb }));
      } finally { setLoading(false); }
    };
    init();
  }, []);

  const handleUpdate = (field: keyof UserProfileData, val: string) => {
    setProfile((p: UserProfileData) => ({ ...p, [field]: val }));
    setHasChanges(true);
  };

  const handlePrefChange = (pref: keyof typeof prefs, val: boolean) => {
    setPrefs(p => ({ ...p, [pref]: val }));
    setHasChanges(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Local preview (immediate feedback)
    const previewUrl = URL.createObjectURL(file);
    setProfile(p => ({ ...p, avatarUrl: previewUrl }));

    try {
      const { url } = await authService.uploadAvatar(file);
      setProfile(p => ({ ...p, avatarUrl: url }));
      
      // Update local storage so navbar and other parts sync
      const currentLocal = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentLocal, avatarUrl: url }));
      window.dispatchEvent(new Event("user:updated"));
      
      toast.success("Avatar updated in your Atelier");
    } catch (err) {
      toast.error("Failed to upload avatar");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedUser = await authService.updateProfile({ 
        name: profile.name, 
        phone: profile.phone, 
        address: profile.address,
        avatarUrl: profile.avatarUrl
      });
      
      // Update local state and persistence
      if (updatedUser) {
        setProfile(p => ({ ...p, ...updatedUser }));
        const currentLocal = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...currentLocal, ...updatedUser })); // Vital for Navbar
        window.dispatchEvent(new Event("user:updated")); // Notify Navbar
      }

      // Persist preferences (since backend might not support them yet)
      localStorage.setItem("user_prefs", JSON.stringify(prefs));
      
      setHasChanges(false);
      toast.success("All records secured in your Atelier");
    } catch (e) {
      toast.error("Records update failed. Please try again.");
    } finally { setSaving(false); }
  };

  const handlePasswordUpdate = async () => {
    if (!passData.current || !passData.new || !passData.confirm) {
      toast.error("Please fill in all security fields");
      return;
    }
    if (passData.new !== passData.confirm) {
      toast.error("New keys do not match. Verify your entry.");
      return;
    }
    if (passData.new.length < 6) {
      toast.error("Secret key must be at least 6 characters long");
      return;
    }

    try {
      setPassUpdating(true);
      await authService.changePassword({ 
        currentPassword: passData.current, 
        newPassword: passData.new 
      });
      toast.success("Security keys updated successfully");
      setShowPassModal(false);
      setPassData({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update security keys");
    } finally {
      setPassUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-sand border-t-caramel rounded-full animate-spin" />
        <p className="font-serif italic font-bold text-caramel">Opening your Private Atelier...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F2] pb-32">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        {/* Header - Matches FunLeo Sample */}
        <header className="mb-12 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-[1px] border-caramel/40 p-2 flex items-center justify-center bg-white shadow-xl shadow-caramel/5 overflow-hidden transition-all group-hover:border-caramel/80">
              <div className="w-full h-full rounded-full bg-sand/30 flex items-center justify-center text-5xl font-serif font-bold text-brown/70 italic relative overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                ) : (
                  profile.name ? profile.name.split(" ").map((n: string) => n[0]).slice(0, 1).join("") : <User className="w-16 h-16" />
                )}
              </div>
            </div>
            
            <label className="absolute bottom-2 right-2 bg-caramel p-3 rounded-full text-white shadow-xl border-4 border-white hover:scale-110 transition-transform cursor-pointer">
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-4">
            </div>
            <h1 className="text-5xl md:text-8xl font-serif font-bold italic text-ink tracking-tight leading-tight">
              Welcome back, <br />
              <span className="text-brown">{profile.name || "Friend"}</span>
            </h1>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Detailed Information Section */}
            <section className="bg-white/40 border border-sand rounded-[3rem] p-10 shadow-sm">
              <h3 className="text-2xl font-serif font-bold italic text-ink mb-10 flex items-center gap-4">
                <ShieldCheck className="text-caramel w-7 h-7" /> Detailed Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  label="Full Name"
                  value={profile.name}
                  icon={User}
                  onChange={(v) => handleUpdate("name", v)}
                  fullWidth
                />
                <InfoCard
                  label="Email Address"
                  value={profile.email}
                  icon={Mail}
                  onChange={() => { }}
                  disabled
                />
                <InfoCard
                  label="Phone Number"
                  value={profile.phone}
                  icon={Phone}
                  onChange={(v) => handleUpdate("phone", v)}
                />

                {/* Residence Location Card - Redesigned Sample Mode */}
                <div className="col-span-full bg-white border border-sand/50 p-6 rounded-[2rem]">
                  <div className="flex items-center justify-between mb-6">
                    <label className="text-[10px] font-bold text-muted/60 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-caramel/70" /> Residence Location
                    </label>
                  </div>
                  <VNAddressPicker
                    initialValue={profile.address}
                    onChange={(v) => handleUpdate("address", v)}
                  />
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section className="bg-white/40 border border-sand rounded-[3rem] p-10 shadow-sm">
              <h3 className="text-2xl font-serif font-bold italic text-ink mb-10 flex items-center gap-4">
                <BellRing className="text-caramel w-7 h-7" /> Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomToggle checked={prefs.zalo} label="Zalo Reminders" sublabel="Instant booking alerts" onChange={(v) => handlePrefChange("zalo", v)} />
                <CustomToggle checked={prefs.journal} label="Weekly Journal" sublabel="Pet care tips in your inbox" onChange={(v) => handlePrefChange("journal", v)} />
                <CustomToggle checked={prefs.deals} label="Exclusive Deals" sublabel="Flash sales and special events" onChange={(v) => handlePrefChange("deals", v)} />
                <CustomToggle checked={prefs.sms} label="SMS Alerts" sublabel="Urgent medical notifications" onChange={(v) => handlePrefChange("sms", v)} />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            {/* My Little Friends Card */}
            <div className="bg-ink text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-caramel/10 rounded-full blur-3xl -translate-y-24 translate-x-24" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-serif font-bold italic">My Little Friends</h3>
                  <button 
                    onClick={() => navigate("/my-pets")}
                    className="w-12 h-12 bg-caramel rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="flex -space-x-5 mb-8">
                  {pets.length > 0 ? pets.slice(0, 3).map((pet: Pet, i: number) => (
                    <div key={i} className="w-16 h-16 rounded-[1.5rem] border-4 border-ink bg-sand flex items-center justify-center overflow-hidden shadow-2xl ring-1 ring-white/10">
                      {pet.avatarUrl ? <img src={pet.avatarUrl} crossOrigin="anonymous" className="w-full h-full object-cover" /> : <span className="font-bold text-ink italic">{pet.name[0]}</span>}
                    </div>
                  )) : (
                    <div className="w-16 h-16 rounded-[1.5rem] border-4 border-ink bg-sand/20 flex items-center justify-center text-white/20"><Heart className="w-6 h-6" /></div>
                  )}
                </div>

                <p className="text-white/50 text-sm mb-10 leading-relaxed font-medium">
                  {pets.length > 0 ? `You have ${pets.length} companions registered. Keep their passports up to date.` : "You don't have any companions yet. Add one to unlock the library."}
                </p>

                <button 
                  onClick={() => navigate("/my-pets")}
                  className="w-full bg-white text-ink py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 group-hover:bg-caramel group-hover:text-white transition-all duration-500 shadow-xl"
                >
                  Manage Pet Library <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white border border-sand rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
              <h3 className="text-xl font-serif font-bold italic text-ink mb-8 flex items-center gap-3">
                <Zap className="text-caramel w-5 h-5" /> Recent Activity
              </h3>
              <div className="space-y-6">
                {RECENT_ACTIVITIES.map(act => (
                  <div key={act.id} className="group flex items-start gap-5 p-6 bg-[#FBF9F2] rounded-[1.5rem] border border-transparent hover:border-sand/50 transition-all cursor-default">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-caramel shadow-sm group-hover:scale-110 transition-transform">
                      {act.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 italic opacity-60">{act.type}</p>
                      <p className="text-sm font-bold text-ink truncate mb-1">{act.title}</p>
                      <p className="text-[11px] text-muted font-medium">{act.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-2 text-[11px] font-bold text-muted uppercase tracking-[0.2em] hover:text-caramel transition-colors flex items-center justify-center gap-2">
                View Full Timeline <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Danger Security Zone */}
            <div className="p-8 border-2 border-dashed border-sand/40 rounded-[3rem] bg-rust/[0.01]">
              <div className="flex items-center gap-3 mb-6 text-rust/80">
                <Lock className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-[0.2em]">Security Chamber</h4>
              </div>
              <div className="space-y-4">
                <button
                  onClick={() => setShowPassModal(true)}
                  className="w-full py-4 bg-white text-ink text-xs font-bold rounded-2xl border border-sand hover:bg-warm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Change Password
                </button>
                <button className="w-full py-4 bg-rust text-white text-xs font-bold rounded-2xl hover:bg-rust-dark transition-all flex items-center justify-center gap-3 shadow-lg shadow-rust/10">
                  <Trash2 className="w-3.5 h-3.5" /> Archive My Atelier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Button - Animated */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-ink text-white py-6 rounded-full font-bold shadow-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
            >
              <div className="relative">
                <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-caramel rounded-full animate-ping" />
              </div>
              {saving ? "Storing records..." : "Save Atelier Records"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Credentials Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPassModal(false)}
              className="absolute inset-0 bg-ink/70 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 60 }}
              className="bg-white rounded-[40px] max-w-lg w-full p-12 relative overflow-hidden shadow-2xl border border-sand/30"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-4xl font-serif font-bold italic text-ink">Change <br />Password</h2>
                <button onClick={() => setShowPassModal(false)} className="w-12 h-12 rounded-full bg-sand/10 flex items-center justify-center text-muted hover:bg-sand/30 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-6 mb-12">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-2">Current Key</label>
                  <input 
                    type="password" 
                    value={passData.current}
                    onChange={(e) => setPassData(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••" 
                    className="w-full bg-[#f8f6f0] p-5 rounded-3xl border border-transparent focus:border-caramel outline-none font-medium transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-2">New Secret Key</label>
                  <input 
                    type="password" 
                    value={passData.new}
                    onChange={(e) => setPassData(p => ({ ...p, new: e.target.value }))}
                    placeholder="••••••••" 
                    className="w-full bg-[#f8f6f0] p-5 rounded-3xl border border-transparent focus:border-caramel outline-none font-medium transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest pl-2">Confirm New Secret Key</label>
                  <input 
                    type="password" 
                    value={passData.confirm}
                    onChange={(e) => setPassData(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••" 
                    className="w-full bg-[#f8f6f0] p-5 rounded-3xl border border-transparent focus:border-caramel outline-none font-medium transition-all" 
                  />
                </div>
              </div>

              <button 
                onClick={handlePasswordUpdate}
                disabled={passUpdating}
                className="w-full bg-caramel text-white py-6 rounded-[2rem] font-bold shadow-2xl shadow-caramel/20 hover:bg-caramel-dark transition-all disabled:opacity-50"
              >
                {passUpdating ? "Updating Security Vault..." : "Authorize Update"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
