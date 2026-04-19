import { useEffect, useState, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { productService, Product } from "@/services/product.service";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import { ImageCropperModal } from "@/components/shared/ImageCropperModal";

const CATEGORIES = ["Food", "Accessories", "Health", "Toys", "Grooming", "Travel"];

export const ProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");

  const [cropper, setCropper] = useState<{ image: string; open: boolean }>({
    image: "",
    open: false,
  });

  // New item state
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: CATEGORIES[0],
    price: 0,
    stock: 0,
    images: [] as string[]
  });
  const [imgUploading, setImgUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      const res = await productService.getProducts({ providerId: user.id });
      setProducts(res.products);
    } catch (error) {
       toast.error("Failed to retrieve inventory records.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropper({ image: reader.result as string, open: true });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    try {
      setCropper(p => ({ ...p, open: false }));
      setImgUploading(true);
      
      const file = new File([blob], "product.jpg", { type: "image/jpeg" });
      const { url } = await productService.uploadProductImage(file);
      
      setNewItem(prev => ({ ...prev, images: [url] }));
      toast.success("Portrait captured.");
    } catch {
      toast.error("Portrait upload failed.");
    } finally {
      setImgUploading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newItem.name || !newItem.description || newItem.price <= 0) {
      toast.error("Please provide valid item credentials.");
      return;
    }
    try {
      setCreating(true);
      const created = await productService.createProduct(newItem);
      setProducts(prev => [created, ...prev]);
      toast.success("Artifact stored in registry.");
      setIsAdding(false);
      setNewItem({ name: "", description: "", category: CATEGORIES[0], price: 0, stock: 0, images: [] });
    } catch {
      toast.error("Failed to authorize registry entry.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuickUpdate = async (id: string, updates: Partial<Product>) => {
    try {
      await productService.updateProduct(id, updates);
      setProducts(prev => prev.map(p => p._id === id ? { ...p, ...updates } : p));
      toast.success("Registry synchronized.");
    } catch {
      toast.error("Failed to update record.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
       <Loader2 className="w-10 h-10 animate-spin text-caramel" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-caramel mb-2">
            <div className="w-10 h-px bg-caramel"></div>
            Inventory Management
          </div>
          <h1 className="text-4xl font-serif font-bold italic text-ink">
            Product Portfolio
          </h1>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-ink text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-caramel transition-all shadow-xl shadow-ink/10 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Premium Item
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40 group-focus-within:text-caramel transition-colors" />
          <input 
            type="text" 
            placeholder="Search catalog... e.g. Kibble, Bed"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-sand py-4 pl-14 pr-6 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-caramel/5 focus:border-caramel/30 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-white border border-sand rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-muted hover:bg-warm transition">
              <Filter className="w-4 h-4" /> Category
           </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-[3rem] border border-sand shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FBF9F2]/50 border-b border-sand">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Item Profile</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted text-center">Price (VND)</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted text-center">Inventory</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/40">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="group hover:bg-[#FBF9F2]/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-warm overflow-hidden border border-sand/30 shrink-0">
                        <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink mb-0.5">{p.name}</p>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">ID: #{p._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-warm rounded-full text-[10px] font-bold text-brown border border-sand/30">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <input 
                      type="number" 
                      className="w-32 bg-transparent border-b border-transparent hover:border-caramel/30 focus:border-caramel focus:outline-none text-sm font-serif font-bold italic text-ink text-center py-1 transition-all"
                      value={p.price}
                      onBlur={(e) => handleQuickUpdate(p._id, { price: parseFloat(e.target.value) })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProducts(prev => prev.map(item => item._id === p._id ? { ...item, price: parseFloat(val) || 0 } : item));
                      }}
                    />
                  </td>
                  <td className="px-8 py-6 text-center">
                    <input 
                      type="number" 
                      className="w-16 bg-transparent border-b border-transparent hover:border-caramel/30 focus:border-caramel focus:outline-none text-sm font-bold text-ink text-center py-1 transition-all"
                      value={p.stock}
                      onBlur={(e) => handleQuickUpdate(p._id, { stock: parseInt(e.target.value) })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProducts(prev => prev.map(item => item._id === p._id ? { ...item, stock: parseInt(val) || 0 } : item));
                      }}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${p.stock > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                       <span className={`text-[11px] font-bold ${p.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 rounded-xl hover:bg-warm text-muted hover:text-ink transition">
                          <Edit3 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-8 py-32 text-center">
                      <p className="text-sm font-serif italic text-muted">No artifacts found in the chosen gallery.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-ink/70 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 60 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 60 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-12 shadow-2xl overflow-hidden"
            >
               <h2 className="text-3xl font-serif font-bold italic text-ink mb-10">Add Atelier Item</h2>
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Product Name</label>
                        <input 
                          value={newItem.name}
                          onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-warm/30 border border-sand px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-caramel/5 font-bold text-ink" placeholder="e.g. Organic Beef Bites" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Category</label>
                        <select 
                          value={newItem.category}
                          onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-warm/30 border border-sand px-6 py-4 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-ink"
                        >
                           {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Description</label>
                     <textarea 
                       value={newItem.description}
                       onChange={e => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                       className="w-full bg-warm/30 border border-sand px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-caramel/5 font-bold text-ink min-h-[100px] resize-none" 
                       placeholder="Tell the story of this artifact..."
                     />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Portrait Image</label>
                    <label className="relative block w-full aspect-[21/9] border-2 border-dashed border-sand/50 rounded-[2rem] overflow-hidden bg-[#FBF9F2]/50 hover:bg-warm transition-colors cursor-pointer group">
                       {newItem.images[0] ? (
                         <img src={newItem.images[0]} className="w-full h-full object-cover" alt="Preview" />
                       ) : (
                         <div className="h-full w-full flex flex-col items-center justify-center gap-3">
                            <ImageIcon className="w-8 h-8 text-sand group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-muted">Drop or Browse Collection</span>
                         </div>
                       )}
                       {imgUploading && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-caramel" />
                         </div>
                       )}
                       <input type="file" className="hidden" accept="image/*" onChange={handleProductImageSelect} />
                    </label>
                  </div>

                  <AnimatePresence>
                    {cropper.open && (
                        <ImageCropperModal 
                          image={cropper.image}
                          aspect={21/9}
                          onClose={() => setCropper(p => ({ ...p, open: false }))}
                          onCropComplete={handleCropComplete}
                        />
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Public Rate (VND)</label>
                        <input 
                          type="number" 
                          value={newItem.price || ""}
                          onChange={e => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-warm/30 border border-sand px-6 py-4 rounded-2xl outline-none font-bold text-ink" placeholder="0" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4">Initial Stock</label>
                        <input 
                          type="number" 
                          value={newItem.stock || ""}
                          onChange={e => setNewItem(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-warm/30 border border-sand px-6 py-4 rounded-2xl outline-none font-bold text-ink" placeholder="0" 
                        />
                     </div>
                  </div>
               </div>
               <div className="mt-12 flex gap-4">
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-5 rounded-full border border-sand font-bold text-xs uppercase tracking-widest hover:bg-warm transition">Esc</button>
                  <button 
                    disabled={imgUploading || creating}
                    onClick={handleCreateProduct}
                    className="flex-1 py-5 rounded-full bg-ink text-white font-bold text-xs uppercase tracking-widest hover:bg-caramel transition shadow-xl shadow-ink/10 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Authorize Registry"}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
