import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, ChevronRight, Loader2, BookOpen } from "lucide-react";
import Pagination from "@/components/common/Pagination";
import apiClient from "@/utils/api.service";
import { toast } from "react-hot-toast";

type BlogPost = {
  _id: string;
  title: string;
  content: string;
  category: string;
  image: string;
  author: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
  views: number;
};

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;

  const fetchBlogs = async (page: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/blogs?page=${page}&limit=${pageSize}`);
      setPosts(res.data.blogs || []);
      setTotal(res.data.pagination.total || 0);
    } catch (error) {
      toast.error("Could not fetch the journal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(currentPage);
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-[#FBF9F2] px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-caramel">Pet Journal</p>
          <h1 className="font-serif text-6xl font-bold italic text-ink tracking-tight mb-6">Blog</h1>
          <p className="max-w-xl text-sm text-muted/60 font-medium leading-relaxed">
            Comprehensive knowledge on dog and cat care, behavior, nutrition, 
            and easy-to-apply daily practical tips.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
             <Loader2 className="w-12 h-12 animate-spin text-caramel mb-4" />
             <p className="text-sm font-medium text-muted italic">Consulting the archives...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-32 bg-white rounded-[3rem] border border-sand/50 shadow-sm">
             <BookOpen className="w-16 h-16 text-muted/20 mx-auto mb-6" />
             <h2 className="text-2xl font-serif font-bold italic text-ink mb-2">The Journal is Silent</h2>
             <p className="text-sm text-muted/50">There are no approved articles to display at this moment.</p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post._id} className="group bg-white rounded-[3rem] overflow-hidden border border-sand/50 transition-all duration-700 hover:shadow-2xl hover:shadow-ink/5 flex flex-col h-full hover:border-caramel/30">
                  <Link to={`/blogs/${post._id}`} className="block aspect-[16/11] overflow-hidden relative">
                    {post.image ? (
                        <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-warm flex items-center justify-center text-muted/20">
                            <BookOpen className="w-12 h-12" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-4 py-1.5 bg-warm/50 border border-sand/30 text-caramel text-[10px] font-bold uppercase tracking-[0.2em] rounded-full">
                        {post.category}
                      </span>
                      <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link to={`/blogs/${post._id}`} className="block group/title mb-4">
                      <h3 className="font-serif text-2xl font-bold italic text-ink leading-tight group-hover/title:text-caramel transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-muted/60 text-sm leading-relaxed mb-8 line-clamp-3 font-medium">
                      {post.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>

                    <div className="mt-auto pt-6 border-t border-sand/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-warm overflow-hidden border border-sand/40 flex items-center justify-center">
                          {post.author.avatarUrl ? (
                             <img src={post.author.avatarUrl} alt={post.author.name} className="w-full h-full object-cover" />
                          ) : (
                             <User className="w-5 h-5 text-caramel/40" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-ink/80">{post.author.name}</span>
                      </div>
                      <Link 
                        to={`/blogs/${post._id}`}
                        className="w-10 h-10 bg-warm rounded-full flex items-center justify-center text-caramel hover:bg-ink hover:text-white transition-all group/arrow"
                      >
                        <ChevronRight className="w-5 h-5 transition-transform group-hover/arrow:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              className="mt-16"
            />
          </>
        )}
      </div>
    </main>
  );
}
