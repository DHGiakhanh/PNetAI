import { CalendarDays, Clock3, PawPrint } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: "Dog Care" | "Cat Care" | "Nutrition" | "Behavior";
  readTime: string;
  date: string;
  image: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "7 dấu hiệu chó đang bị stress và cách giúp bé bình tĩnh",
    excerpt:
      "Nhận biết sớm các tín hiệu như thở gấp, đi lòng vòng, liếm môi quá mức để can thiệp đúng cách tại nhà.",
    category: "Dog Care",
    readTime: "6 min read",
    date: "2026-03-10",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Lịch tắm cho mèo theo mùa: bao lâu là đủ?",
    excerpt:
      "Không phải mèo nào cũng cần tắm thường xuyên. Bài viết giúp bạn chọn tần suất phù hợp theo lông, độ tuổi và thời tiết.",
    category: "Cat Care",
    readTime: "5 min read",
    date: "2026-03-08",
    image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Thực đơn hằng ngày cho chó nhỏ dưới 10kg",
    excerpt:
      "Gợi ý khẩu phần ăn cân bằng giữa protein, chất xơ và chất béo tốt để duy trì năng lượng ổn định.",
    category: "Nutrition",
    readTime: "8 min read",
    date: "2026-03-05",
    image: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Mèo cào sofa: nguyên nhân thật sự và cách xử lý",
    excerpt:
      "Phân biệt hành vi bản năng và hành vi do thiếu kích thích để thiết kế lại góc chơi cho mèo.",
    category: "Behavior",
    readTime: "7 min read",
    date: "2026-03-03",
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Checklist đi khám định kỳ cho cún lần đầu",
    excerpt:
      "Những giấy tờ, xét nghiệm cơ bản và câu hỏi nên chuẩn bị trước khi đưa thú cưng đến phòng khám.",
    category: "Dog Care",
    readTime: "4 min read",
    date: "2026-02-28",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Chọn pate hay hạt khô cho mèo trưởng thành?",
    excerpt:
      "So sánh ưu nhược điểm theo nhu cầu nước, sức khỏe răng miệng và ngân sách để bạn quyết định dễ hơn.",
    category: "Nutrition",
    readTime: "6 min read",
    date: "2026-02-24",
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function BlogsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-warm to-cream px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-caramel">Pet Journal</p>
        <h1 className="font-serif text-5xl font-bold italic text-ink">
          Blog <span className="text-caramel">cho chó mèo</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted">
          Tổng hợp kiến thức chăm sóc chó mèo, hành vi, dinh dưỡng và các mẹo thực hành dễ áp dụng hằng ngày.
        </p>

        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-3xl border border-sand bg-white shadow-sm">
              <div className="aspect-[4/3] bg-warm">
                <img src={post.image} alt={post.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="space-y-3 p-5">
                <span className="inline-flex items-center gap-1 rounded-full bg-warm px-3 py-1 text-xs font-semibold text-brown ring-1 ring-sand">
                  <PawPrint className="h-3.5 w-3.5" />
                  {post.category}
                </span>
                <h2 className="line-clamp-2 font-serif text-2xl font-bold italic text-ink">{post.title}</h2>
                <p className="line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <button className="inline-flex rounded-full bg-brown px-4 py-2 text-sm font-semibold text-white hover:bg-brown-dark">
                  Read Article
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
