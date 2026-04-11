import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productService, Product } from "@/services/product.service";

const SERVICES = [
  { icon: "🛁", name: "Bath & Hygiene", desc: "From $3.5" },
  { icon: "✂️", name: "Haircut", desc: "From $6.5" },
  { icon: "💅", name: "Nails & Ears", desc: "From $2.2" },
  { icon: "🦷", name: "Dental Care", desc: "From $5.0" },
  { icon: "🏨", name: "Stay", desc: "From $8.5/night" },
];

export const ServicesStrip = () => {
  return (
    <section className="bg-brown py-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-5">
        {SERVICES.map((service, index) => (
          <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-white">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-xl">
              {service.icon}
            </div>
            <div>
              <div className="text-[15px] font-medium leading-tight">{service.name}</div>
              <div className="text-[12px] opacity-70 mt-0.5">{service.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const FEATURE_LIST = [
  {
    title: "Premium Care",
    description: "Personalized attention tailored to your pet's unique personality and needs.",
    icon: "✨",
  },
  {
    title: "Eco-Friendly",
    description: "Sustainability at the heart of everything we choose for our furry friends.",
    icon: "🌿",
  },
  {
    title: "AI Integration",
    description: "Smart monitoring and health tracking powered by PNetAI technology.",
    icon: "🧠",
  },
];

export const Features = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-warm to-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
        {FEATURE_LIST.map((feature, idx) => (
          <div
            key={idx}
            className="p-10 bg-white rounded-3xl border border-sand shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group"
          >
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
            <h3 className="text-3xl mb-4 italic text-slate-800">{feature.title}</h3>
            <p className="text-lg font-light text-slate-500 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center">
        <p className="text-brown font-serif italic text-2xl">&quot;The world is a friendlier place with paws.&quot;</p>
      </div>
    </section>
  );
};

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export const FeaturedProducts = ({ onProductClick }: { onProductClick?: (id: string) => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const [hotProducts, latestProducts] = await Promise.all([
          productService.getHotProducts(),
          productService.getLatestProducts(),
        ]);

        const merged = [...hotProducts, ...latestProducts];
        const unique = merged.filter((product, index, arr) => arr.findIndex((p) => p._id === product._id) === index);
        setProducts(unique.slice(0, 6));
      } catch (error) {
        console.error("Error fetching featured products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-6">
      <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-px bg-brown" />
            <span className="text-xs uppercase tracking-[0.12em] text-brown font-semibold">Featured Products</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-tight">
            Selected <span className="text-brown italic font-normal">exclusively</span>
            <br />
            for your beloved pet
          </h2>
        </div>
        <Link to="/products" className="text-brown font-medium text-[15px] flex items-center gap-1.5 hover:gap-2.5 transition-all">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [...Array(5)].map((_, idx) => (
              <div key={idx} className="animate-pulse bg-white rounded-3xl overflow-hidden border border-sand">
                <div className="aspect-square bg-sand" />
                <div className="p-6">
                  <div className="h-3 w-20 bg-sand rounded mb-3" />
                  <div className="h-6 w-4/5 bg-sand rounded mb-4" />
                  <div className="h-5 w-24 bg-sand rounded" />
                </div>
              </div>
            ))
          : products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-3xl overflow-hidden border border-sand group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sand"
                onClick={() => onProductClick?.(product._id)}
              >
                <div className="relative bg-warm aspect-square transition-transform duration-500 group-hover:scale-[1.02]">
                  <img
                    src={
                      product.images[0] ||
                      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=600&auto=format&fit=crop"
                    }
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {product.isHot && (
                    <div className="absolute top-4 left-4 bg-brown text-white px-3 py-1 rounded-full text-[11px] font-semibold">
                      Hot
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">{product.category}</div>
                  <div className="text-brown text-xs mb-2">
                    ★ {product.averageRating.toFixed(1)} ({product.totalReviews})
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="text-lg font-bold text-brown">{formatUsd(product.price)}</span>
                    </div>
                    <Link
                      to={`/products/${product._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-9 h-9 bg-brown text-white rounded-full inline-flex items-center justify-center text-xl transition-all hover:bg-brown-dark hover:rotate-90"
                      aria-label={`View ${product.name}`}
                    >
                      +
                    </Link>
                  </div>
                </div>
              </div>
            ))}
      </div>
      </div>
    </section>
  );
};

const SPA_SERVICES = [
  { icon: "🛁", name: "Bath & Shampoo", price: "From $3.5" },
  { icon: "✂️", name: "Haircut", price: "From $6.5" },
  { icon: "💅", name: "Nails & Ears", price: "From $2.2" },
  { icon: "⭐", name: "Full Package", price: "From $15.5" },
];

const TIME_SLOTS = ["8:00", "9:30", "11:00", "13:30", "15:00", "16:30"];

export const SpaBooking = () => {
  const [selectedSlot, setSelectedSlot] = useState("9:30");

  return (
    <section className="py-24">
    <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 rounded-[40px] bg-gradient-to-r from-warm to-cream px-6 py-14 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-16 lg:py-20">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-px bg-brown" />
          <span className="text-xs uppercase tracking-[0.12em] text-brown font-semibold">Book a Spa</span>
        </div>
        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 leading-tight mb-4">
          Care for your pet
          <br />
          <span className="text-brown italic font-normal">as you wish</span>
        </h2>
        <p className="text-gray-600 text-[16px] font-light max-w-md leading-relaxed mb-10">
          Flexible schedules, dedicated staff, clean &amp; safe environment.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {SPA_SERVICES.map((s, idx) => (
            <div
              key={idx}
              className="bg-white border border-sand p-5 rounded-2xl cursor-pointer hover:border-caramel hover:-translate-y-0.5 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{s.icon}</div>
              <div className="text-[14px] font-semibold text-gray-900">{s.name}</div>
              <div className="text-[13px] text-brown font-medium">{s.price}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-brown to-brown-dark rounded-[28px] p-10 text-white shadow-2xl">
        <h3 className="text-2xl font-serif font-semibold mb-8">Quick Booking</h3>

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] opacity-60 uppercase tracking-widest mb-2">Service</label>
            <select className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl outline-none focus:border-white transition-colors appearance-none">
              <option className="text-gray-900">Basic Bath</option>
              <option className="text-gray-900">Grooming</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] opacity-60 uppercase tracking-widest mb-2">Your Pet</label>
            <select className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl outline-none focus:border-white transition-colors appearance-none">
              <option className="text-gray-900">Mochi - Poodle</option>
              <option className="text-gray-900">Bong - British Shorthair</option>
              <option className="text-gray-900">+ Add new pet</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] opacity-60 uppercase tracking-widest mb-2">Appointment Date</label>
              <input
                type="date"
                className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-xl outline-none focus:border-white transition-colors"
                defaultValue="2025-04-10"
              />
            </div>
            <div>
              <label className="block text-[11px] opacity-60 uppercase tracking-widest mb-2">Select Time</label>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-[11px] p-2 rounded-lg border border-white/15 transition-all ${
                      selectedSlot === slot
                        ? "bg-white text-brown-dark border-white"
                        : "bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100"
                    }`}
                    disabled={slot === "16:30"}
                    style={slot === "16:30" ? { opacity: 0.3, cursor: "not-allowed" } : {}}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-brown hover:bg-brown-dark text-white py-4 rounded-2xl font-semibold mt-10 transition-all hover:-translate-y-0.5 shadow-lg shadow-brown-dark/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-caramel/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brown-dark">
          Confirm Booking
        </button>
      </div>
    </div>
    </section>
  );
};

const REVIEWS = [
  {
    quote:
      '"PNetAI has completely changed how I care for Mochi. From booking a spa to buying food, everything is so convenient and reliable!"',
    author: "Alice Nguyen",
    pet: "Mochi's owner - Poodle, 2 years old",
    avatar: "👩",
    isBig: true,
  },
  {
    quote: '"Super fast delivery, 100% authentic products. My cat Bong loves the interactive toy!"',
    author: "David Tran",
    pet: "Bong's owner - British Shorthair",
    avatar: "👨",
  },
  {
    quote: '"The spa staff are very gentle, my dog is no longer afraid of bathing!"',
    author: "Helen Le",
    pet: "Butter's owner - Golden Retriever",
    avatar: "👩",
  },
];

export const Testimonials = () => {
  return (
    <section className="bg-gradient-to-r from-brown to-forest py-24 text-white overflow-hidden relative">
      <div className="mx-auto max-w-6xl px-6">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-10 mb-16">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-px bg-white/80" />
            <span className="text-xs uppercase tracking-[0.12em] text-white/90 font-semibold">Testimonials</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold leading-tight">
            What our <span className="text-sand italic font-normal">customers say</span> about us
          </h2>
        </div>
        <p className="text-white/50 text-[16px] font-light max-w-sm">
          Over 2,000 5-star reviews from pet owners nationwide.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {REVIEWS.map((r, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-8 border border-white/10 transition-all hover:bg-white/10 group ${
              r.isBig ? "lg:col-span-2 bg-white/20 border-white/30" : "bg-white/10"
            }`}
          >
            <div className="text-yellow-200 text-sm mb-4">★★★★★</div>
            <p className={`font-serif italic opacity-90 leading-tight mb-8 ${r.isBig ? "text-2xl lg:text-3xl" : "text-xl"}`}>
              {r.quote}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-caramel to-sage text-gray-800 flex items-center justify-center text-xl">
                {r.avatar}
              </div>
              <div>
                <div className="text-[14px] font-semibold">{r.author}</div>
                <div className="text-[12px] opacity-40">{r.pet}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
};

export const Newsletter = () => {
  return (
    <section className="py-24">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 rounded-[40px] bg-gradient-to-r from-warm to-cream px-6 py-14 sm:px-8 lg:flex-row lg:gap-12 lg:px-16 lg:py-20">
      <div className="max-w-md">
        <h2 className="text-4xl font-serif font-bold text-gray-900 leading-[1.15] mb-4">
          Receive <br />
          <span className="text-brown italic font-normal">exclusive offers</span> every week
        </h2>
        <p className="text-gray-600 text-[15px] font-light">Care tips, discount vouchers, and the latest news from PNetAI.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:min-w-[400px]">
        <input
          type="email"
          placeholder="Your email address..."
          className="flex-1 bg-white border border-sand px-6 py-4 rounded-full outline-none focus:border-caramel transition-all text-gray-900"
        />
        <button className="bg-brown hover:bg-brown-dark text-white px-8 py-4 rounded-full font-bold transition-all hover:-translate-y-0.5 shadow-md">
          Subscribe →
        </button>
      </div>
    </div>
    </section>
  );
};
