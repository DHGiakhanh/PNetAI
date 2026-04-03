import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { User, ChevronRight } from "lucide-react";
import Pagination from "@/components/common/Pagination";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: "Dog Care" | "Cat Care" | "Nutrition" | "Behavior";
  readTime: string;
  date: string;
  image: string;
  author: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "7 signs your dog is stressed and how to calm them down",
    excerpt:
      "Identify early signals such as panting, pacing, and excessive lip licking to intervene properly at home.",
    category: "Dog Care",
    readTime: "6 min read",
    date: "2026-03-10",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop",
    author: "Alice Nguyen"
  },
  {
    id: "2",
    title: "Seasonal bathing schedule for cats: how often is enough?",
    excerpt:
      "Not all cats need regular bathing. This article helps you choose the right frequency based on fur, age, and weather.",
    category: "Cat Care",
    readTime: "5 min read",
    date: "2026-03-08",
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop",
    author: "David Tran"
  },
  {
    id: "3",
    title: "Daily menu for small dogs under 10kg",
    excerpt:
      "Suggested balanced portions of protein, fiber, and healthy fats to maintain steady energy.",
    category: "Nutrition",
    readTime: "8 min read",
    date: "2026-03-05",
    image: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?q=80&w=1200&auto=format&fit=crop",
    author: "Sophie Le"
  },
  {
    id: "4",
    title: "Cats scratching the sofa: real causes and solutions",
    excerpt:
      "Distinguish between instinctual behavior and behavior caused by a lack of stimulation to redesign the cat's play area.",
    category: "Behavior",
    readTime: "7 min read",
    date: "2026-03-03",
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1200&auto=format&fit=crop",
    author: "Emma Vu"
  },
  {
    id: "5",
    title: "Checklist for your puppy's first routine check-up",
    excerpt:
      "Basic documents, tests, and questions to prepare before taking your pet to the clinic.",
    category: "Dog Care",
    readTime: "4 min read",
    date: "2026-02-28",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop",
    author: "Leo Pham"
  },
  {
    id: "6",
    title: "Choosing between wet food or dry kibble for adult cats?",
    excerpt:
      "Compare pros and cons based on water needs, dental health, and budget to help you decide more easily.",
    category: "Nutrition",
    readTime: "6 min read",
    date: "2026-02-24",
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1200&auto=format&fit=crop",
    author: "Chloe Dang"
  },
];

export default function BlogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(blogPosts.length / pageSize));
  const paginatedPosts = useMemo(
    () => blogPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-caramel">Pet Journal</p>
        <h1 className="font-serif text-5xl font-bold italic text-ink">
          Blog 
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted">
          Comprehensive knowledge on dog and cat care, behavior, nutrition, and easy-to-apply daily practical tips.
        </p>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPosts.map((post) => (
            <article key={post.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-sand transition-all duration-500 hover:shadow-2xl hover:shadow-caramel/10 flex flex-col h-full">
              <Link to={`/blogs/${post.id}`} className="block aspect-[16/10] overflow-hidden relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-warm text-caramel text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {post.category}
                  </span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {post.readTime}
                  </span>
                </div>

                <Link to={`/blogs/${post.id}`} className="block group/title">
                  <h3 className="font-serif text-2xl font-bold italic text-ink mb-4 leading-tight group-hover/title:text-caramel transition-colors">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-muted text-sm leading-relaxed mb-8 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="mt-auto pt-6 border-t border-sand/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-warm flex items-center justify-center text-caramel">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-ink">{post.author}</span>
                  </div>
                  <Link 
                    to={`/blogs/${post.id}`}
                    className="text-xs font-extrabold text-caramel uppercase tracking-[0.1em] flex items-center gap-2 group/link"
                  >
                    Read Article 
                    <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={blogPosts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </main>
  );
}
