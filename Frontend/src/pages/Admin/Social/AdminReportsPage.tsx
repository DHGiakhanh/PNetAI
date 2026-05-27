import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  AlertTriangle, 
  Check, 
  Trash2, 
  Loader2, 
  User, 
  Calendar,
  ExternalLink
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type Author = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image?: string;
  status: string;
  author: Author;
};

type Report = {
  _id: string;
  reporter: Author;
  blog: Blog;
  reason: string;
  status: "pending" | "resolved";
  createdAt: string;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/reports");
      setReports(res.data.reports || []);
    } catch (error) {
      toast.error("Could not load reports log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleHideBlog = async (reportId: string, blogId: string) => {
    if (!window.confirm("Are you sure you want to hide this blog post? It will immediately disappear from the public feed.")) return;
    try {
      setProcessingId(reportId);
      // 1. Hide the blog post
      await apiClient.patch(`/admin/blogs/${blogId}/status`, { status: "hidden" });
      // 2. Resolve the report
      await apiClient.patch(`/admin/reports/${reportId}/resolve`, { status: "resolved" });
      toast.success("Blog hidden and report resolved.");
      
      // Update local state
      setReports(prev => prev.map(rep => rep._id === reportId ? { ...rep, status: "resolved" } : rep));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resolve report.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!window.confirm("Are you sure you want to dismiss this report? The blog post will remain visible.")) return;
    try {
      setProcessingId(reportId);
      await apiClient.patch(`/admin/reports/${reportId}/resolve`, { status: "resolved" });
      toast.success("Report dismissed (resolved).");
      
      // Update local state
      setReports(prev => prev.map(rep => rep._id === reportId ? { ...rep, status: "resolved" } : rep));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resolve report.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Moderation Center</p>
        <h1 className="font-serif text-4xl font-bold italic text-ink tracking-tight mt-1">Reported Posts</h1>
        <p className="text-xs text-muted/60 font-medium mt-2 leading-relaxed">
          Manage user flag reports, inspect potential community violations, and hide inappropriate contents.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-caramel mb-4" />
          <p className="text-sm font-medium text-muted italic">Querying community flags...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center p-20 bg-white rounded-[2.5rem] border border-sand/50 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-muted/20 mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold italic text-ink mb-1">Clear Horizons</h3>
          <p className="text-xs text-muted/40 font-medium">There are no pending user reports at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-sand/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand/40 bg-[#FBF9F2]/50 text-[10px] font-bold text-muted/60 uppercase tracking-wider">
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand/20 text-sm font-medium text-ink/80">
                {reports.map((rep) => {
                  const isPending = rep.status === "pending";
                  return (
                    <tr key={rep._id} className={`hover:bg-[#FBF9F2]/20 transition-colors ${!isPending ? "opacity-60 bg-gray-50/50" : ""}`}>
                      
                      {/* Article Info */}
                      <td className="px-6 py-5 max-w-xs">
                        <div className="space-y-1">
                          {rep.blog ? (
                            <Link 
                              to={`/feeds/${rep.blog._id}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-serif font-bold italic text-ink text-base line-clamp-1 hover:text-caramel transition-colors inline-flex items-center gap-1.5 group/title"
                            >
                              {rep.blog.title}
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 transition-opacity text-caramel shrink-0" />
                            </Link>
                          ) : (
                            <p className="font-serif font-bold italic text-ink/40 text-base line-clamp-1">
                              Deleted Blog
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-muted/50 font-bold uppercase tracking-wider">
                            <span>{rep.blog?.category || "Unknown"}</span>
                            <span>&bull;</span>
                            <span>By {rep.blog?.author?.name || "Author"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Reporter Info */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-warm overflow-hidden flex items-center justify-center border border-sand">
                            {rep.reporter?.avatarUrl ? (
                              <img src={rep.reporter.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-caramel/40" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-ink leading-tight">{rep.reporter?.name || "User"}</p>
                            <p className="text-[10px] font-medium text-muted/50 mt-0.5">{rep.reporter?.email || ""}</p>
                          </div>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-6 py-5 max-w-xs">
                        <p className="text-xs text-muted/80 leading-relaxed italic">
                          "{rep.reason}"
                        </p>
                        <p className="text-[9px] text-muted/40 mt-1 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rep.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPending
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          {rep.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleHideBlog(rep._id, rep.blog?._id)}
                              disabled={processingId !== null}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                              title="Hide Blog Post"
                            >
                              {processingId === rep._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Hide Post
                            </button>
                            <button
                              onClick={() => handleDismissReport(rep._id)}
                              disabled={processingId !== null}
                              className="px-4 py-2 border border-sand hover:bg-emerald-50 text-emerald-600 hover:border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                              title="Dismiss Report"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted/30 italic font-bold">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
