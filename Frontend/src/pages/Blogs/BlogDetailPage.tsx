import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  CalendarDays, 
  Clock3, 
  User, 
  Bookmark, 
  Facebook, 
  Link as LinkIcon,
  ChevronRight,
  ExternalLink,
  ArrowUp,
  Heart,
  Send
} from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

// --- Mock Data ---
const BLOG_POSTS = [
  {
    id: "1",
    title: "7 signs your dog is stressed and how to calm them down",
    excerpt: "Identify early signals such as panting, pacing, and excessive lip licking to intervene properly at home.",
    category: "Dog Care",
    author: "Alice Nguyen",
    readTime: "6 min read",
    date: "2026-03-10",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop",
    content: `
      <p>Dogs communicate their emotions through body language, but these signals can often be subtle. Recognizing when your dog is under stress is crucial for their mental well-being and for maintaining a strong bond with your pet.</p>
      
      <h3>The Tell-Tale Signs of Stress</h3>
      <p>Common indicators include excessive panting when it's not hot, pacing back and forth, and lip licking that occurs outside of meal times. If you notice these behaviors, it's time to assess the environment.</p>
      
      <div class="pull-quote">"A stressed dog isn't a 'bad' dog; they are a dog asking for help in the only way they know how."</div>
      
      <p>Sometimes, stress manifests as physical symptoms like digestive issues or sudden shedding. In more severe cases, a dog might withdraw or become uncharacteristically reactive to normal stimuli.</p>
      
      <h3>How to Create a Calm Environment</h3>
      <p>Start by identifying the trigger. Is it a loud noise? A new person? Once identified, you can work on desensitization. Provide a "safe space"—a crate or a quiet corner where they can retreat without being disturbed.</p>
    `
  },
  {
    id: "2",
    title: "Seasonal bathing schedule for cats: how often is enough?",
    excerpt: "Not all cats need regular bathing. This article helps you choose the right frequency based on fur, age, and weather.",
    category: "Cat Care",
    author: "David Tran",
    readTime: "5 min read",
    date: "2026-03-08",
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop",
    content: `
      <p>The myth that all cats hate water is mostly true, but the necessity of bathing varies wildly. While cats are meticulous self-groomers, certain situations demand a little extra help from their human companions.</p>
      
      <div class="context-cta">
        <h4>Need expert help?</h4>
        <p>Our Spa specialists are trained to handle even the most water-shy cats with care.</p>
        <a href="/services">Book Spa Now</a>
      </div>

      <h3>Spring and Summer Shedding</h3>
      <p>During warmer months, increased shedding can lead to more hairballs. A seasonal bath can help remove loose fur before it ends up in your cat's stomach or on your sofa.</p>
      
      <h3>Winter Skin Care</h3>
      <p>In winter, indoor heating can dry out a cat's skin. Over-bathing during this time can exacerbate the problem, so it's best to stick to waterless foams or strictly necessary spot cleaning.</p>
    `
  }
];

export default function BlogDetailPage() {
  const { blogId } = useParams();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const post = BLOG_POSTS.find(p => p.id === blogId) || BLOG_POSTS[0];
  const relatedPosts = BLOG_POSTS.filter(p => p.id !== blogId).slice(0, 3);
  
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [likeCount, setLikeCount] = useState(124);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "Mochi's Dad", text: "This was so helpful! Mochi has been pacing a lot lately.", date: "2 hours ago", avatar: "👨‍💻" },
    { id: 2, user: "Sarah Green", text: "I didn't know about the lip licking sign. Thank you for the insight!", date: "1 day ago", avatar: "👩‍🌾" }
  ]);

  const handleInteraction = (action: () => void) => {
    if (!isLoggedIn) {
      toast.error("Please login to interact with this article", {
        style: { borderRadius: '20px', background: '#2C2418', color: '#fff', fontSize: '14px', fontWeight: 'bold' },
        icon: '🔒'
      });
      return;
    }
    action();
  };

  const toggleLike = () => handleInteraction(() => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    if (!isLiked) toast.success("Article liked!");
  });

  const toggleBookmark = () => handleInteraction(() => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Saved to bookmarks");
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleInteraction(() => {
      if (!commentText.trim()) return;
      setComments([
        { id: Date.now(), user: "You", text: commentText, date: "Just now", avatar: "👤" },
        ...comments
      ]);
      setCommentText("");
      toast.success("Comment posted!");
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleScroll = () => setShowBackToTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCF9F5] pb-24">
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-caramel z-[60] origin-left"
        style={{ scaleX }}
      />

      <div className="max-w-4xl mx-auto px-6 pt-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted mb-8">
          <Link to="/blogs" className="hover:text-caramel transition-colors">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-caramel">{post.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="line-clamp-1 opacity-50">{post.title}</span>
        </nav>

        {/* Hero Header */}
        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic text-ink leading-[1.1] mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 mb-12">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-sand shadow-sm">
              <div className="w-8 h-8 rounded-full bg-warm flex items-center justify-center text-caramel">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-ink">{post.author}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm font-bold text-muted/60 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                {post.date}
              </span>
              <span className="w-1 h-1 bg-sand rounded-full" />
              <span className="flex items-center gap-1.5">
                <Clock3 className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-caramel/5 rounded-[3.5rem] blur-2xl group-hover:bg-caramel/10 transition-colors" />
            <div className="relative aspect-[16/9] rounded-[3rem] overflow-hidden shadow-2xl shadow-sand-dark/20 border-8 border-white ring-1 ring-sand">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover"
              />
              {/* Noise Overlay Effect (Reliable Data URI) */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
              />
            </div>
          </div>
        </header>

        {/* Article Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          
          {/* Sticky Sidebar */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-32 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <button 
                  onClick={toggleLike}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm group ${
                    isLiked ? "bg-red-50 border-red-200 text-red-500" : "bg-white border-sand text-muted hover:text-red-500 hover:border-red-500"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                </button>
                <span className="text-[10px] font-bold text-muted pointer-events-none">{likeCount}</span>
              </div>

              <button className="w-12 h-12 rounded-full bg-white border border-sand flex items-center justify-center text-muted hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm group">
                <Facebook className="w-5 h-5" />
              </button>
              
              <button 
                onClick={toggleBookmark}
                className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                  isBookmarked ? "bg-warm border-sand text-caramel" : "bg-white border-sand text-muted hover:text-caramel hover:border-caramel"
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-caramel" : ""}`} />
              </button>

              <div className="h-px bg-sand w-8 my-2" />
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
                className="w-12 h-12 rounded-full bg-white border border-sand flex items-center justify-center text-muted hover:text-caramel hover:border-caramel transition-all shadow-sm"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <article className="lg:col-span-11 max-w-3xl">
            <div 
              className="article-content max-w-none 
                [&_.pull-quote]:py-12 [&_.pull-quote]:px-8 [&_.pull-quote]:my-12 
                [&_.pull-quote]:border-y [&_.pull-quote]:border-sand/50 
                [&_.pull-quote]:font-serif [&_.pull-quote]:italic [&_.pull-quote]:text-3xl 
                [&_.pull-quote]:text-center [&_.pull-quote]:text-ink [&_.pull-quote]:bg-warm/10
                [&_.context-cta]:bg-ink [&_.context-cta]:p-10 [&_.context-cta]:rounded-[2.5rem] 
                [&_.context-cta]:text-white [&_.context-cta]:my-16 [&_.context-cta]:relative 
                [&_.context-cta]:overflow-hidden
                [&_.context-cta_h4]:text-white [&_.context-cta_h4]:m-0 [&_.context-cta_p]:text-white/60 
                [&_.context-cta_p]:text-base [&_.context-cta_p]:mb-6
                [&_.context-cta_a]:inline-flex [&_.context-cta_a]:bg-caramel [&_.context-cta_a]:text-white 
                [&_.context-cta_a]:px-8 [&_.context-cta_a]:py-3 [&_.context-cta_a]:rounded-full 
                [&_.context-cta_a]:font-bold [&_.context-cta_a]:no-underline 
                [&_.context-cta_a]:hover:bg-caramel-dark [&_.context-cta_a]:transition-colors"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <div className="my-20 pt-16 border-t border-sand">
              {/* Real Comment Section */}
              <div id="comments" className="space-y-12">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold italic text-ink flex items-center gap-3">
                    Conversations
                    <span className="px-2.5 py-0.5 bg-warm text-caramel rounded-full text-sm italic">{comments.length}</span>
                  </h3>
                </div>

                {isLoggedIn ? (
                  <form onSubmit={handleCommentSubmit} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-sand flex items-center justify-center text-xl flex-shrink-0">👤</div>
                    <div className="flex-1 relative">
                      <textarea 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Join the discussion..."
                        className="w-full bg-white border border-sand p-4 pr-16 rounded-[1.5rem] focus:border-caramel outline-none transition-all min-h-[100px] text-muted font-medium"
                      />
                      <button 
                        type="submit"
                        className="absolute bottom-4 right-4 bg-caramel hover:bg-caramel-dark text-white p-2.5 rounded-full shadow-lg shadow-caramel/20 transition-all active:scale-90"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-warm/30 rounded-[2.5rem] p-10 text-center border-2 border-dashed border-sand">
                    <p className="text-ink font-bold mb-4">Want to join the conversation?</p>
                    <Link to="/login" className="inline-flex bg-ink text-white px-8 py-3 rounded-full font-bold hover:bg-caramel transition-all">
                      Login to Comment
                    </Link>
                  </div>
                )}

                <div className="space-y-8 divide-y divide-sand/30">
                  {comments.map(comment => (
                    <div key={comment.id} className="pt-8 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-warm flex items-center justify-center text-lg flex-shrink-0">
                        {comment.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-ink text-sm">{comment.user}</span>
                          <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{comment.date}</span>
                        </div>
                        <p className="text-muted leading-relaxed">{comment.text}</p>
                        <div className="flex gap-4 mt-3">
                          <button className="text-[10px] font-bold text-muted hover:text-caramel uppercase tracking-widest transition-colors">Reply</button>
                          <button className="text-[10px] font-bold text-muted hover:text-red-500 uppercase tracking-widest transition-colors">Flag</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </article>
        </div>

        {/* Related Posts */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-serif font-bold italic text-ink">Related Stories</h3>
            <Link to="/blogs" className="text-sm font-extrabold text-caramel flex items-center gap-1 group">
              View Journal <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x no-scrollbar">
            {relatedPosts.map(p => (
              <Link 
                key={p.id} 
                to={`/blogs/${p.id}`}
                className="min-w-[300px] bg-white rounded-[2.5rem] p-4 border border-sand group snap-start shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-4">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="px-2 pb-2">
                  <span className="text-[10px] font-bold text-caramel uppercase tracking-widest">{p.category}</span>
                  <h4 className="font-serif font-bold italic text-lg text-ink mt-2 line-clamp-2 leading-tight group-hover:text-caramel transition-colors">{p.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-10 right-10 w-14 h-14 bg-ink text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:bg-caramel transition-colors"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="max-w-4xl mx-auto px-6 pt-12 flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
        <span>© 2026 PNetAI Journal</span>
        <div className="flex gap-6">
          <Link to="/" className="hover:text-caramel transition-colors">Home</Link>
          <Link to="/services" className="hover:text-caramel transition-colors">Services</Link>
          <Link to="/products" className="hover:text-caramel transition-colors">Products</Link>
        </div>
      </footer>
    </div>
  );
}
