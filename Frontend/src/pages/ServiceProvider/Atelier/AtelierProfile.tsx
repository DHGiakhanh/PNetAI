import { useState, useEffect } from "react";
import { 
  Building2, 
  UploadCloud, 
  ShieldCheck, 
  Clock,
  Camera,
  X
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { authService, UserProfile } from "@/services/auth.service";
import { VNAddressPicker } from "@/components/profile/VNAddressPicker";
import { toast } from "react-hot-toast";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

export const AtelierProfile = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    avatarUrl: "",
    clinicName: "",
    description: "",
    operatingHours: { start: "08:00", end: "20:00" },
    doctorLicenseUrl: "",
    businessLicenseUrl: "",
    clinicLicenseUrl: "",
    clinicLicenseNumber: "",
  });

  const [cropper, setCropper] = useState<{ image: string; open: boolean }>({
    image: "",
    open: false,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await authService.getCurrentUser();
        setUser(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          address: data.address || "",
          avatarUrl: data.avatarUrl || "",
          clinicName: data.legalDocuments?.clinicName || "",
          description: data.description || "",
          operatingHours: data.operatingHours || { start: "08:00", end: "20:00" },
          doctorLicenseUrl: data.legalDocuments?.doctorLicenseUrl || "",
          businessLicenseUrl: data.legalDocuments?.businessLicenseUrl || "",
          clinicLicenseUrl: data.legalDocuments?.clinicLicenseUrl || "",
          clinicLicenseNumber: data.legalDocuments?.clinicLicenseNumber || "",
        });
      } catch (err) {
        toast.error("Atelier credentials could not be retrieved.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        avatarUrl: formData.avatarUrl,
        description: formData.description,
        operatingHours: formData.operatingHours,
        legalDocuments: {
            clinicName: formData.clinicName,
            clinicLicenseNumber: formData.clinicLicenseNumber,
            doctorLicenseUrl: formData.doctorLicenseUrl,
            businessLicenseUrl: formData.businessLicenseUrl,
            clinicLicenseUrl: formData.clinicLicenseUrl,
            submittedAt: (formData.businessLicenseUrl) 
                ? new Date().toISOString() 
                : (typeof user?.legalDocuments?.submittedAt === 'string' ? user.legalDocuments.submittedAt : undefined)
        }
      });
      toast.success("Facility profile successfully synchronized.");
    } catch {
      toast.error("Profile synchronization failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'doctor_license' | 'business_license' | 'clinic_license') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Securing media...", { id: 'upload' });
      const { url } = await authService.uploadImage(file);
      if (type === 'doctor_license') {
        setFormData(prev => ({ ...prev, doctorLicenseUrl: url }));
      } else if (type === 'business_license') {
        setFormData(prev => ({ ...prev, businessLicenseUrl: url }));
      } else if (type === 'clinic_license') {
        setFormData(prev => ({ ...prev, clinicLicenseUrl: url }));
      }
      toast.success("Media captured successfully.", { id: 'upload' });
    } catch {
      toast.error("Upload protocol failed.", { id: 'upload' });
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropper({ image: reader.result as string, open: true });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    try {
      setCropper(p => ({ ...p, open: false }));
      toast.loading("Updating ID Portrait...", { id: 'avt' });
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const { url } = await authService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      toast.success("Identity portrait updated.", { id: 'avt' });
    } catch {
      toast.error("Portrait storage failed.", { id: 'avt' });
    }
  };

  if (loading) return <div>Synchronizing Facility Records...</div>;

  return (
     <div className="space-y-12 pb-24 font-sans">
      {/* Cinematic Header */}
      <section className="relative h-96 rounded-[4rem] overflow-hidden shadow-2xl group">
         <img 
           src="https://images.unsplash.com/photo-1513360309081-38a623659117?q=80&w=2000" 
           className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" 
           alt="Cover" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
         
         <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row items-end gap-10">
            <div className="relative group/avt">
               <div className="h-32 w-32 rounded-[2.5rem] bg-white p-1 shadow-2xl overflow-hidden border-4 border-white/20">
                  <img src={formData.avatarUrl || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400"} className="w-full h-full object-cover rounded-[2.2rem]" alt="Logo" />
               </div>
               <label className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover/avt:opacity-100 transition-opacity flex items-center justify-center cursor-pointer shadow-inner">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
               </label>
            </div>
            
            <div className="flex-1 pb-2">
               <div className="flex items-center gap-3 text-blue-400 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{user?.role === 'provider' ? 'Certified Provider' : 'Atelier Registry'}</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{formData.clinicName || "Unnamed Center"}</h1>
            </div>

            <div className="flex gap-4 pb-2">
               <button onClick={handleSave} disabled={saving} className="px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">
                  {saving ? "Processing..." : "Authorize Update"}
               </button>
            </div>
         </div>
      </section>

      <AnimatePresence>
        {cropper.open && (
           <ImageCropperModal 
             image={cropper.image}
             onClose={() => setCropper(p => ({ ...p, open: false }))}
             onCropComplete={handleCropComplete}
           />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Identity & Content */}
         <div className="lg:col-span-8 space-y-12">
            
            {/* General Info */}
            <div className="bg-white rounded-[3.5rem] border border-gray-100 p-12 shadow-sm">
               <div className="flex items-center gap-4 mb-12">
                  <div className="h-14 w-14 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                     <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-widest text-gray-900">Facility Identity</h3>
                     <p className="text-xs font-bold text-gray-400">Core information for public listing</p>
                  </div>
               </div>

               <div className="grid gap-10">
                  <div className="grid sm:grid-cols-3 gap-10">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Official Name</label>
                        <input 
                          type="text" 
                          value={formData.clinicName} 
                          onChange={e => setFormData(p => ({ ...p, clinicName: e.target.value }))}
                          className="w-full bg-gray-50/50 border border-gray-100 px-8 py-5 rounded-[2rem] outline-none font-bold text-lg text-gray-900 focus:border-blue-300 transition-all shadow-inner" 
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">License Number</label>
                        <input 
                          type="text" 
                          value={formData.clinicLicenseNumber}
                          onChange={e => setFormData(p => ({ ...p, clinicLicenseNumber: e.target.value }))}
                          placeholder="E.g. 123/CL-GP"
                          className="w-full bg-gray-50/50 border border-gray-100 px-8 py-5 rounded-[2rem] outline-none font-bold text-lg text-gray-900 focus:border-blue-300 transition-all shadow-inner" 
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Facility Hotline</label>
                        <input 
                          type="text" 
                          value={formData.phone}
                          onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                          className="w-full bg-gray-50/50 border border-gray-100 px-8 py-5 rounded-[2rem] outline-none font-bold text-lg text-gray-900 focus:border-blue-300 transition-all shadow-inner" 
                        />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Professional Biography</label>
                     <textarea 
                       rows={4}
                       value={formData.description}
                       onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                       placeholder="Outline the medical specialties, mission, and history of your facility..."
                       className="w-full bg-gray-50/50 border border-gray-100 px-8 py-6 rounded-[2.5rem] outline-none font-medium text-[15px] text-gray-700 focus:border-blue-300 transition-all resize-none shadow-inner" 
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 pl-1">Registered Address</label>
                     <VNAddressPicker 
                        initialValue={formData.address}
                        onChange={val => setFormData(p => ({ ...p, address: val }))}
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Compliance & Operations */}
            <div className="lg:col-span-4 space-y-12">
            
            {/* Operating Hours */}
            <div className="bg-gray-950 rounded-[3rem] p-10 text-white shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
               <div className="flex items-center gap-4 mb-10">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/10">
                     <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Operational Shifts</h3>
               </div>

               <div className="space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Facility Activation</label>
                     <div className="relative group/time">
                        <input 
                           type="time" 
                           value={formData.operatingHours.start} 
                           onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, start: e.target.value } }))}
                           className="w-full bg-white/5 border border-white/10 px-8 py-5 rounded-[1.5rem] outline-none font-black text-2xl text-blue-400 focus:border-blue-500 transition-all shadow-inner" 
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase">Start</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Daily Deactivation</label>
                     <div className="relative group/time">
                        <input 
                           type="time" 
                           value={formData.operatingHours.end} 
                           onChange={e => setFormData(p => ({ ...p, operatingHours: { ...p.operatingHours, end: e.target.value } }))}
                           className="w-full bg-white/5 border border-white/10 px-8 py-5 rounded-[1.5rem] outline-none font-black text-2xl text-rose-400 focus:border-rose-500 transition-all shadow-inner" 
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase">End</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Business License */}
            <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm overflow-hidden relative">
               <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Certification</h4>
                  <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
               </div>

               {formData.businessLicenseUrl ? (
                 <div className="relative group aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl">
                    <img src={formData.businessLicenseUrl} className="w-full h-full object-cover" alt="Business License" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                       <button 
                         onClick={() => setFormData(p => ({ ...p, businessLicenseUrl: "" }))}
                         className="p-4 bg-white/10 hover:bg-red-600 text-white rounded-full transition-all hover:scale-110 active:scale-90 border border-white/20"
                       >
                          <X className="w-6 h-6" />
                       </button>
                       <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/60">Discard Business License</p>
                    </div>
                 </div>
               ) : (
                 <label className="flex flex-col items-center justify-center aspect-[3/4] rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-white hover:border-blue-300 transition-all cursor-pointer group shadow-inner p-8">
                    <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-gray-300 group-hover:text-amber-600 transition-all mb-6">
                       <ShieldCheck className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-black text-gray-900 mb-2">Business License</p>
                    <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-tighter leading-relaxed">Official business <br/>registration document</p>
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'business_license')} />
                 </label>
               )}
            </div>

            {/* Status Information */}
            <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100">
               <div className="flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                     <p className="text-[11px] font-black uppercase tracking-widest text-emerald-900 mb-1">Authorization Status</p>
                     <p className="text-[11px] font-bold text-emerald-800/60 leading-relaxed uppercase tracking-tighter">Your facility profile and medical licenses are currently active and visible to the PNetAI network.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
