import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Plus, 
  ArrowLeft, 
  Image as ImageIcon, 
  CheckCircle2, 
  Save, 
  Eye, 
  X, 
  Loader2
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useMemo, useRef, useCallback } from "react";

const CATEGORIES = [
  "Nutrition & Health",
  "Training & Behavior",
  "Pet Lifestyle",
  "Species Guide: Dogs",
  "Species Guide: Cats",
  "Species Guide: Other",
  "Pet Travel",
  "Success Stories"
];

export default function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: CATEGORIES[0],
    image: "",
    status: "draft" as "draft" | "pending"
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Image too heavy. Limit is 5MB.");
          return;
        }
        try {
          toast.loading("Uploading image...", { id: 'upload' });
          const { url } = await authService.generalUpload(file);
          const quill = quillRef.current?.getEditor();
          const range = quill?.getSelection();
          if (quill && range) {
            quill.insertEmbed(range.index, 'image', url);
          }
          toast.success("Image inserted", { id: 'upload' });
        } catch (error) {
          toast.error("Upload failed", { id: 'upload' });
        }
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image', 'blockquote'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  }), [imageHandler]);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image', 'blockquote'
  ];

  useEffect(() => {
    if (isEdit && id) {
      const fetchBlog = async () => {
        try {
          const res = await apiClient.get(`/blogs/${id}`);
          const blog = res.data.blog;
          setFormData({
            title: blog.title,
            content: blog.content,
            category: blog.category,
            image: blog.image || "",
            status: blog.status === 'approved' ? 'pending' : (blog.status as "draft" | "pending")
          });
        } catch (error) {
          toast.error("Could not load article for editing.");
          navigate("/my-blogs");
        } finally {
          setFetching(false);
        }
      };
      fetchBlog();
    }
  }, [id, isEdit, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Portrait too heavy. Limit is 5MB.");
      return;
    }

    try {
      setImgUploading(true);
      const { url } = await authService.generalUpload(file);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success("Portrait captured successfully.");
    } catch {
      toast.error("Failed to secure the image.");
    } finally {
      setImgUploading(false);
    }
  };

  const handleSave = async (submitStatus: "draft" | "pending") => {
    if (!formData.title || !formData.content) {
      toast.error("Article needs a soul (Title & Content).");
      return;
    }

    try {
      setLoading(true);
      const payload = { ...formData, status: submitStatus };
      
      if (isEdit) {
        await apiClient.put(`/blogs/${id}`, payload);
        toast.success(submitStatus === "pending" ? "Sent for Moderation" : "Draft Records Updated");
      } else {
        await apiClient.post("/blogs", payload);
        toast.success(submitStatus === "pending" ? "Sent for Moderation" : "Draft Archived");
      }
      
      navigate("/my-blogs");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Storage failure.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
     <div className="min-h-screen flex items-center justify-center bg-[#FBF9F2]">
        <div className="w-12 h-12 border-4 border-sand border-t-caramel rounded-full animate-spin" />
     </div>
  );

  return (
    <div className="min-h-screen bg-[#FBF9F2] pb-32">
      
      {/* Editorial Bar */}
      <nav className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-sand px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/my-blogs")} className="p-2 hover:bg-warm rounded-full text-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60 leading-none mb-1">Editing Mode</span>
            <span className="text-sm font-serif font-bold italic text-ink truncate max-w-[200px]">{formData.title || "Untitled Fragment"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setPreviewOpen(true)}
             className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-sand text-sm font-bold text-muted hover:bg-warm transition-all"
           >
             <Eye className="w-4 h-4" /> Preview
           </button>
           <button 
             disabled={loading}
             onClick={() => handleSave("draft")}
             className="flex items-center gap-2 px-6 py-2 rounded-full border border-sand text-sm font-bold text-ink hover:border-caramel/50 transition-all disabled:opacity-50"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Save Draft
           </button>
           <button 
             disabled={loading}
             onClick={() => handleSave("pending")}
             className="flex items-center gap-2 px-8 py-2 rounded-full bg-ink text-white text-sm font-bold hover:bg-caramel transition-all shadow-xl shadow-ink/10 disabled:opacity-50 active:scale-95"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
             Publish
           </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        
        {/* Category Picker */}
        <div className="flex flex-wrap gap-2 mb-12">
           {CATEGORIES.map(cat => (
             <button
               key={cat}
               onClick={() => setFormData(p => ({ ...p, category: cat }))}
               className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all
                  ${formData.category === cat 
                    ? "bg-caramel text-white border-caramel shadow-md scale-105" 
                    : "bg-white text-muted/60 border-sand/50 hover:border-caramel/30"}
               `}
             >
               {cat}
             </button>
           ))}
        </div>

        {/* Hero Image Area */}
        <div className="mb-12">
           {!formData.image ? (
             <label className="group block w-full aspect-[21/9] rounded-[3rem] border-2 border-dashed border-sand/60 bg-white hover:bg-warm/30 hover:border-caramel/30 transition-all cursor-pointer overflow-hidden p-4">
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                   <div className="w-16 h-16 bg-warm rounded-full flex items-center justify-center text-muted/30 group-hover:scale-110 transition-transform group-hover:bg-white group-hover:shadow-lg">
                      <ImageIcon className="w-8 h-8" />
                   </div>
                   <div className="text-center">
                      <p className="text-base font-serif font-bold italic text-ink mb-1">Add a Cover Portrait</p>
                      <p className="text-xs font-medium text-muted/40">Highly recommended to catch the eye of the community.</p>
                   </div>
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
             </label>
           ) : (
             <div className="relative group aspect-[21/9] rounded-[3rem] overflow-hidden border border-sand/50 shadow-2xl">
                <img src={formData.image} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <label className="px-6 py-3 bg-white rounded-full text-sm font-bold text-ink hover:bg-warm transition-all cursor-pointer shadow-xl">
                      Change Portrait
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                   </label>
                   <button onClick={() => setFormData(p => ({ ...p, image: "" }))} className="px-6 py-3 bg-rose-600 rounded-full text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                      Remove
                   </button>
                </div>
                {imgUploading && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-caramel" />
                  </div>
                )}
             </div>
           )}
        </div>

        {/* Title Input */}
        <textarea 
          placeholder="Title of your fragment..."
          value={formData.title}
          onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
          className="w-full bg-transparent text-4xl md:text-7xl font-serif font-bold italic text-ink placeholder:text-muted/10 outline-none resize-none mb-10 overflow-hidden leading-tight"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />

        {/* Content Editor */}
        <div className="relative mb-20 bg-white rounded-3xl overflow-hidden shadow-sm border border-sand/30">
           <ReactQuill 
              ref={quillRef}
              theme="snow"
              value={formData.content}
              onChange={(val) => setFormData(p => ({ ...p, content: val }))}
              modules={modules}
              formats={formats}
              placeholder="Begin your storytelling here..."
              className="blog-editor-quill"
            />
        </div>
        
        <style>{`
          .blog-editor-quill .ql-editor {
            min-height: 500px;
            font-size: 1.25rem;
            line-height: 1.6;
            font-family: serif;
            font-style: italic;
            color: #2C2418;
          }
          .blog-editor-quill .ql-toolbar {
             border: none !important;
             border-bottom: 1px solid #EAE1D3 !important;
             padding: 1rem !important;
          }
          .blog-editor-quill .ql-container {
             border: none !important;
          }
        `}</style>
      </main>

      {/* Full Preview Modal */}
      <AnimatePresence>
         {previewOpen && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-white overflow-y-auto"
           >
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-sand">
                 <span className="text-sm font-bold uppercase tracking-widest text-muted">Previewing Atelier View</span>
                 <button onClick={() => setPreviewOpen(false)} className="p-2 hover:bg-warm rounded-full text-ink transition-all"> <X className="w-6 h-6" /> </button>
              </div>

              <article className="max-w-3xl mx-auto py-24 px-6 font-serif">
                <div className="text-center mb-16">
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-caramel mb-6 block">{formData.category}</span>
                  <h1 className="text-5xl md:text-7xl font-bold text-ink italic mb-10 leading-tight">{formData.title || "The Unnamed Fragment"}</h1>
                </div>
                {formData.image && (
                  <img src={formData.image} className="w-full rounded-[4rem] mb-20 shadow-2xl" alt="Cover" />
                )}
                <div 
                  className="prose-lg text-2xl text-ink/70 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{ __html: formData.content || "Silence is the only thing found in this draft..." }}
                />
              </article>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
