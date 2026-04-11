import { useEffect, useState } from "react";
import { 
  Camera, 
  KeyRound, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Zap, 
  Save, 
  History, 
  Lock, 
  User,
  Users,
  Award,
  Wallet,
  Clock
} from "lucide-react";
import { authService, UserProfile as UserProfileData } from "@/services/auth.service";
import apiClient from "@/utils/api.service";
import { motion, AnimatePresence } from "framer-motion";
import { VNAddressPicker } from "@/components/profile/VNAddressPicker";
import { toast } from "react-hot-toast";

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
    <div className={`bg-white border border-sand/50 p-6 rounded-[2rem] transition-all hover:shadow-lg hover:border-caramel/20 group ${fullWidth ? "col-span-full" : ""}`}>
      <div className="flex items-center justify-between mb-4 text-muted/60">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-caramel/70" /> {label}
        </label>
        {!disabled && (
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="text-[10px] uppercase font-bold text-caramel hover:text-rust transition-colors px-2 py-1 bg-warm/30 rounded-full"
          >
            {isEditing ? "Cancel" : "Modify"}
          </button>
        )}
      </div>

      {isEditing ? (
        <input
          autoFocus
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="w-full bg-transparent text-lg font-bold text-ink outline-none border-b-2 border-caramel/30 py-1 focus:border-caramel transition-all"
        />
      ) : (
        <p className="text-xl font-serif font-bold text-ink truncate italic">
          {value || `No ${label.toLowerCase()} set`}
        </p>
      )}
    </div>
  );
};

// --- Main Page ---

export default function SaleProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>({
    id: "", name: "", email: "", phone: "", address: "", role: "", createdAt: "", avatarUrl: ""
  });
  const [stats, setStats] = useState({ providers: 0, pending: 0 });
  const [showPassModal, setShowPassModal] = useState(false);
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [passUpdating, setPassUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [user, managedRes, pendingRes] = await Promise.all([
          authService.getCurrentUser(),
          apiClient.get("/sale/service-providers"),
          apiClient.get("/sale/service-providers/pending")
        ]);
        setProfile(user);
        setStats({
          providers: managedRes.data.providers?.length || 0,
          pending: pendingRes.data.pendingProviders?.length || 0
        });
      } catch {
        const raw = localStorage.getItem("user");
        if (raw) setProfile(JSON.parse(raw));
      } finally { setLoading(false); }
    };
    init();
  }, []);

  const handleUpdate = (field: keyof UserProfileData, val: string) => {
    setProfile((p: UserProfileData) => ({ ...p, [field]: val }));
    setHasChanges(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfile(p => ({ ...p, avatarUrl: previewUrl }));

    try {
      const { url } = await authService.uploadAvatar(file);
      setProfile(p => ({ ...p, avatarUrl: url }));
      
      const currentLocal = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentLocal, avatarUrl: url }));
      window.dispatchEvent(new Event("user:updated"));
      
      toast.success("Portrait updated in your records");
    } catch {
      toast.error("Failed to secure portrait");
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
      
      if (updatedUser) {
        setProfile(p => ({ ...p, ...updatedUser }));
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("user:updated"));
      }

      setHasChanges(false);
      toast.success("Atelier Records Synchronized");
    } catch {
      toast.error("Vault update failed");
    } finally { setSaving(false); }
  };

  const handlePasswordUpdate = async () => {
    if (!passData.current || !passData.new || !passData.confirm) {
      toast.error("Complete all security layers");
      return;
    }
    if (passData.new !== passData.confirm) {
      toast.error("New keys mismatch");
      return;
    }

    try {
      setPassUpdating(true);
      await authService.changePassword({ 
        currentPassword: passData.current, 
        newPassword: passData.new 
      });
      toast.success("Security keys re-forged");
      setShowPassModal(false);
      setPassData({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Re-forging failed");
    } finally {
      setPassUpdating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-12 h-12 border-4 border-sand border-t-caramel rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header Deck */}
      <header className="mb-12 flex flex-col md:flex-row items-center gap-10">
        <div className="relative group">
          <div className="w-44 h-44 rounded-[3rem] border border-sand/40 p-2 flex items-center justify-center bg-white shadow-2xl shadow-caramel/5 overflow-hidden transition-all duration-500 group-hover:rotate-2">
            <div className="w-full h-full rounded-[2.5rem] bg-sand/20 flex items-center justify-center text-6xl font-serif font-bold text-brown/70 italic relative overflow-hidden bg-gradient-to-br from-warm via-white to-sand/30">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              ) : (
                profile.name ? profile.name.split(" ").map((n: string) => n[0]).slice(0, 1).join("") : <User className="w-16 h-16" />
              )}
            </div>
          </div>
          
          <label className="absolute -bottom-2 -right-2 bg-ink p-4 rounded-3xl text-white shadow-2xl border-4 border-white hover:bg-caramel hover:scale-110 transition-all cursor-pointer z-10 group-active:scale-95">
            <Camera className="w-5 h-5" />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="text-center md:text-left flex-1">
          <div className="px-4 py-1.5 bg-caramel/10 border border-caramel/20 rounded-full inline-flex items-center gap-2 mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-caramel" />
            <span className="text-[10px] font-bold text-caramel uppercase tracking-[0.2em]">Authorized Representative</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-ink tracking-tight leading-tight">
            The Personal <br />
            <span className="text-caramel/80">Atelier of {profile.name.split(" ")[0]}</span>
          </h1>
        </div>
      </header>

      {/* Bento Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Records Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stats Board */}
          <section className="grid grid-cols-3 gap-6">
            {[
              { label: "Managed Providers", val: stats.providers.toString(), icon: Users, color: "text-caramel" },
              { label: "Pending Approvals", val: stats.pending.toString(), icon: Clock, color: "text-sage" },
              { label: "Performance Score", val: "98%", icon: Award, color: "text-rust" }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-sand/50 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-4`} />
                <p className="text-2xl font-serif font-bold italic text-ink mb-1">{stat.val}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted/60">{stat.label}</p>
              </div>
            ))}
          </section>

          {/* Primary Information */}
          <section className="bg-white/60 backdrop-blur-sm border border-sand/60 rounded-[3rem] p-10 shadow-sm relative">
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-caramel/5 rounded-full blur-3xl -translate-y-20 translate-x-20" />
            </div>
            
            <h3 className="text-2xl font-serif font-bold italic text-ink mb-12 flex items-center gap-4">
              <Zap className="text-caramel w-6 h-6" /> Profile Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <InfoCard
                label="Public Identity"
                value={profile.name}
                icon={User}
                onChange={(v) => handleUpdate("name", v)}
                fullWidth
              />
              <InfoCard
                label="Direct Vault"
                value={profile.email}
                icon={Mail}
                onChange={() => { }}
                disabled
              />
              <InfoCard
                label="Communication Line"
                value={profile.phone}
                icon={Phone}
                onChange={(v) => handleUpdate("phone", v)}
              />

              <div className="col-span-full bg-white border border-sand/50 p-8 rounded-[2.5rem] hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-4 h-4 text-caramel/70" />
                  <label className="text-[10px] font-bold text-muted/60 uppercase tracking-[0.2em]">Territory Assignment</label>
                </div>
                <VNAddressPicker
                  initialValue={profile.address}
                  onChange={(v) => handleUpdate("address", v)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Ancillary Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Security & Access */}
          <section className="bg-ink text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-caramel/10 rounded-full blur-2xl translate-y-16 translate-x-16" />
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Lock className="w-6 h-6 text-caramel" />
              </div>
              <h3 className="text-xl font-serif font-bold italic">Security Vault</h3>
            </div>

            <p className="text-white/40 text-[11px] mb-8 leading-relaxed">
              Ensure your digital keys are rotated regularly to maintain the integrity of your representative portal.
            </p>

            <button
              onClick={() => setShowPassModal(true)}
              className="w-full py-5 bg-white text-ink text-xs font-bold rounded-[1.5rem] hover:bg-caramel hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <KeyRound className="w-4 h-4" /> Re-Forge Credentials
            </button>
          </section>

          {/* Activity Log */}
          <section className="bg-white border border-sand/80 rounded-[3rem] p-8 shadow-sm">
            <h3 className="text-lg font-serif font-bold italic text-ink mb-8 flex items-center gap-3">
              <History className="text-caramel/60 w-5 h-5" /> Operation Timeline
            </h3>
            
            <div className="space-y-6">
              {[
                { title: "New Provider Link", time: "3 hours ago", type: "system" },
                { title: "Service Verified", time: "Yesterday", type: "approval" }
              ].map((act, idx) => (
                <div key={idx} className="flex gap-4 p-4 hover:bg-warm/20 rounded-[1.5rem] transition-colors group cursor-default">
                  <div className="w-2 h-2 mt-2 rounded-full bg-caramel group-hover:scale-125 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-ink mb-1">{act.title}</p>
                    <p className="text-[10px] text-muted uppercase tracking-widest">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Floating Storage Trigger */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -ml-[180px] z-50 w-[360px]"
          >
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-ink text-white py-6 rounded-full font-bold shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group border border-white/10"
            >
              <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {saving ? "Storing records..." : "Seal Atelier Updates"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Re-Forging Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPassModal(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[3rem] max-w-md w-full p-10 relative z-10 shadow-2xl border border-sand/30"
            >
              <h2 className="text-3xl font-serif font-bold italic text-ink mb-8">Re-Forge Keys</h2>
              
              <div className="space-y-5 mb-10">
                {['current', 'new', 'confirm'].map((f) => (
                  <div key={f} className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted uppercase tracking-widest pl-2">
                      {f === 'confirm' ? 'Verify New' : f} Key
                    </label>
                    <input 
                      type="password" 
                      value={(passData as any)[f]}
                      onChange={(e) => setPassData(p => ({ ...p, [f]: e.target.value }))}
                      className="w-full bg-warm/30 p-4 rounded-2xl border border-transparent focus:border-caramel outline-none font-medium transition-all text-sm" 
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={handlePasswordUpdate}
                disabled={passUpdating}
                className="w-full bg-caramel text-white py-5 rounded-[1.5rem] font-bold shadow-xl hover:bg-rust transition-all disabled:opacity-50"
              >
                {passUpdating ? "Re-Forging..." : "Authorize Selection"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

