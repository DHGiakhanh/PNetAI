import { PropsWithChildren, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Heart,
  House,
  MapPin,
  PawPrint,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import apiClient from "@/utils/api.service";
import { productService, Product } from "@/services/product.service";
import { serviceService, Service } from "@/services/service.service";
import { formatVnd } from "@/utils/currency";

const STOCK_IMAGES = {
  grooming:
    "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=760&h=900&q=72",
  veterinary:
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=760&h=900&q=72",
  training:
    "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=760&h=900&q=72",
  boarding:
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=760&h=900&q=72",
  care:
    "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=980&h=1100&q=72",
  cat:
    "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=640&h=720&q=72",
  dog:
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=760&h=820&q=72",
  community:
    "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=1200&h=840&q=72",
  product:
    "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=720&h=720&q=72",
};

function Reveal({
  children,
  className = "",
  delay = 0,
}: PropsWithChildren<{ className?: string; delay?: number }>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return (
    <p className={`mb-4 text-[11px] font-bold uppercase tracking-[0.3em] ${light ? "text-sand" : "text-caramel"}`}>
      {children}
    </p>
  );
}

function ImageFallback({
  src,
  fallback,
  alt,
  className,
}: {
  src?: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const [imageSrc, setImageSrc] = useState(src || fallback);

  useEffect(() => {
    setImageSrc(src || fallback);
  }, [fallback, src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImageSrc(fallback)}
      className={className}
    />
  );
}

const DISCOVERY_LINKS = [
  { label: "Care Services", description: "Trusted clinics", path: "/services", Icon: Stethoscope },
  { label: "Breeding", description: "Healthy matches", path: "/breeding", Icon: Heart },
  { label: "Pet Boutique", description: "Curated essentials", path: "/products", Icon: ShoppingBag },
  { label: "Community", description: "Stories & tips", path: "/feeds", Icon: PawPrint },
];

export const ServicesStrip = () => (
  <section className="bg-forest px-4 py-6 text-white sm:px-6">
    <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DISCOVERY_LINKS.map(({ label, description, path, Icon }) => (
        <Link
          key={label}
          to={path}
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 transition hover:bg-white/[0.14]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 transition group-hover:bg-caramel">
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold">{label}</span>
            <span className="text-sm text-white/65">{description}</span>
          </span>
        </Link>
      ))}
    </div>
  </section>
);

type CareCard = {
  title: string;
  description: string;
  category: string;
  image: string;
  path: string;
};

const DEFAULT_CARE_CARDS: CareCard[] = [
  {
    title: "Gentle Grooming",
    description: "Bath, coat care and tidy trims delivered with patience.",
    category: "Grooming",
    image: STOCK_IMAGES.grooming,
    path: "/services",
  },
  {
    title: "Health Visits",
    description: "Find verified veterinary care for everyday wellbeing.",
    category: "Veterinary",
    image: STOCK_IMAGES.veterinary,
    path: "/services",
  },
  {
    title: "Positive Training",
    description: "Build happy habits with caring professional guidance.",
    category: "Training",
    image: STOCK_IMAGES.training,
    path: "/services",
  },
  {
    title: "Cozy Stays",
    description: "Comfortable boarding while pet parents are away.",
    category: "Boarding",
    image: STOCK_IMAGES.boarding,
    path: "/services",
  },
];

export const CareServices = () => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const popular = await serviceService.getPopularServices();
        if (popular.length > 0) {
          setServices(popular.slice(0, 4));
          return;
        }
        const latest = await serviceService.getLatestServices();
        setServices(latest.slice(0, 4));
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const cards = DEFAULT_CARE_CARDS.map((fallback, index) => {
    const service = services[index];
    if (!service) return fallback;

    return {
      title: service.title,
      description: service.description || fallback.description,
      category: service.category || fallback.category,
      image: service.images?.[0] || fallback.image,
      path: `/services/${service._id}`,
    };
  });

  return (
    <section className="bg-cream px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <Eyebrow>Our Services</Eyebrow>
          <h2 className="font-serif text-4xl font-semibold not-italic leading-tight text-ink sm:text-6xl">
            Complete care for every
            <br className="hidden sm:block" /> wag and whisker
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Discover care providers, appointments and everyday support built around your pet&apos;s comfort.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 0.06}>
              <Link
                to={card.path}
                className="group block h-full overflow-hidden rounded-[28px] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/4.7] overflow-hidden">
                  <ImageFallback
                    src={card.image}
                    fallback={DEFAULT_CARE_CARDS[index].image}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brown backdrop-blur">
                    {card.category}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-semibold not-italic text-ink">{card.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{card.description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brown">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export const AICareStory = () => (
  <section className="overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
      <Reveal className="relative min-h-[510px] sm:min-h-[590px]">
        <div className="absolute left-0 top-0 h-[78%] w-[70%] overflow-hidden rounded-[38px]">
          <ImageFallback
            src={STOCK_IMAGES.care}
            fallback={STOCK_IMAGES.dog}
            alt="A dog receiving attentive everyday care"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 right-0 h-[46%] w-[48%] overflow-hidden rounded-[30px] border-[8px] border-white">
          <ImageFallback
            src={STOCK_IMAGES.cat}
            fallback={STOCK_IMAGES.dog}
            alt="A relaxed cat at home"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute right-4 top-10 rounded-3xl bg-forest px-5 py-5 text-white shadow-xl sm:right-10">
          <Bot className="mb-3 h-6 w-6 text-sand" />
          <p className="font-serif text-2xl font-semibold not-italic">AI Care</p>
          <p className="mt-1 text-sm text-white/70">Guidance, 24/7</p>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <Eyebrow>Thoughtful Pet Parenting</Eyebrow>
        <h2 className="font-serif text-4xl font-semibold not-italic leading-tight text-ink sm:text-6xl">
          Care that understands your companion
        </h2>
        <p className="mt-7 text-base leading-relaxed text-muted sm:text-lg">
          PNetAI connects daily care with smart support: record pet information, explore trusted providers and ask the
          AI assistant when you need a helpful first step.
        </p>

        <div className="mt-9 space-y-5">
          {[
            { Icon: ShieldCheck, title: "Trusted provider network", text: "Explore clinics and care services available on the platform." },
            { Icon: Bot, title: "AI support at hand", text: "Quick guidance alongside your pet profile and care journey." },
            { Icon: Sparkles, title: "One warm ecosystem", text: "Shopping, stories and breeding connections in one place." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-warm text-brown">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{text}</span>
              </span>
            </div>
          ))}
        </div>

        <Link
          to="/services"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-brown px-7 py-4 font-semibold text-white transition hover:bg-brown-dark"
        >
          Explore care services <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
);

type BreedingListing = {
  _id: string;
  title: string;
  description: string;
  images?: string[];
  pet?: {
    name?: string;
    species?: string;
    breed?: string;
    gender?: string;
    age?: number;
    avatarUrl?: string;
  };
};

function breedingFallback(species?: string) {
  return species?.toLowerCase() === "cat" ? STOCK_IMAGES.cat : STOCK_IMAGES.dog;
}

export const FeaturedBreeding = () => {
  const [listings, setListings] = useState<BreedingListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/breeding")
      .then((response) => setListings((response.data?.listings || []).slice(0, 4)))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-warm px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Breeding Matches</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold not-italic leading-tight text-ink sm:text-6xl">
              Meet compatible companions
            </h2>
          </div>
          <Link to="/breeding" className="inline-flex items-center gap-2 font-semibold text-brown">
            View all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse overflow-hidden rounded-[28px] bg-white">
                <div className="aspect-[4/4.5] bg-sand/70" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-2/5 rounded bg-sand" />
                  <div className="h-6 w-4/5 rounded bg-sand" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing, index) => {
              const pet = listing.pet;
              const fallback = breedingFallback(pet?.species);
              const image = listing.images?.[0] || pet?.avatarUrl;
              return (
                <Reveal key={listing._id} delay={index * 0.06}>
                  <Link
                    to="/breeding"
                    className="group block overflow-hidden rounded-[28px] bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/4.4] overflow-hidden">
                      <ImageFallback
                        src={image}
                        fallback={fallback}
                        alt={pet?.name || listing.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      {pet?.gender ? (
                        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brown">
                          {pet.gender}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-caramel">
                        {pet?.breed || pet?.species || "Companion"}
                        {pet?.age !== undefined ? ` | ${pet.age} years` : ""}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-xl font-semibold not-italic text-ink">
                        {pet?.name || listing.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{listing.title}</p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal className="grid overflow-hidden rounded-[36px] bg-white lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-9 sm:p-14">
              <PawPrint className="h-8 w-8 text-caramel" />
              <h3 className="mt-6 font-serif text-3xl font-semibold not-italic text-ink">
                New approved matches will appear here
              </h3>
              <p className="mt-4 max-w-lg leading-relaxed text-muted">
                Browse the breeding area or create a listing for your registered pet to connect responsibly.
              </p>
              <Link
                to="/breeding"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-brown px-6 py-3.5 font-semibold text-white"
              >
                Explore breeding <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ImageFallback
              src={STOCK_IMAGES.dog}
              fallback={STOCK_IMAGES.cat}
              alt="Pet companion"
              className="h-72 w-full object-cover lg:h-full"
            />
          </Reveal>
        )}
      </div>
    </section>
  );
};

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productService.getHotProducts(), productService.getLatestProducts()])
      .then(([hot, latest]) => {
        const unique = [...hot, ...latest].filter(
          (product, index, all) => all.findIndex((entry) => entry._id === product._id) === index,
        );
        setProducts(unique.slice(0, 4));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-cream px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Eyebrow>Pet Boutique</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold not-italic text-ink sm:text-6xl">
              Thoughtful picks for daily joy
            </h2>
          </div>
          <Link to="/products" className="inline-flex items-center gap-2 font-semibold text-brown">
            Browse the shop <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-[500px] animate-pulse rounded-[34px] bg-sand/60" />
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-60 animate-pulse rounded-[28px] bg-sand/60" />
              ))}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal>
              <Link to={`/products/${products[0]._id}`} className="group block overflow-hidden rounded-[34px] bg-white">
                <div className="relative aspect-[5/4] overflow-hidden">
                  <ImageFallback
                    src={products[0].images?.[0]}
                    fallback={STOCK_IMAGES.product}
                    alt={products[0].name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  {products[0].isHot && (
                    <span className="absolute left-5 top-5 rounded-full bg-brown px-4 py-2 text-xs font-semibold text-white">
                      Popular pick
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-4 p-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-caramel">{products[0].category}</p>
                    <h3 className="mt-2 text-3xl font-semibold not-italic text-ink">{products[0].name}</h3>
                  </div>
                  <p className="shrink-0 font-semibold text-brown">{formatVnd(products[0].price)}</p>
                </div>
              </Link>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {products.slice(1).map((product, index) => (
                <Reveal key={product._id} delay={(index + 1) * 0.05}>
                  <Link to={`/products/${product._id}`} className="group block h-full overflow-hidden rounded-[28px] bg-white">
                    <div className="aspect-square overflow-hidden">
                      <ImageFallback
                        src={product.images?.[0]}
                        fallback={STOCK_IMAGES.product}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="line-clamp-1 text-xl font-semibold not-italic text-ink">{product.name}</h3>
                      <p className="mt-2 font-semibold text-brown">{formatVnd(product.price)}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        ) : (
          <Reveal className="flex flex-col items-center justify-center rounded-[34px] bg-white px-6 py-16 text-center">
            <ShoppingBag className="h-8 w-8 text-caramel" />
            <h3 className="mt-5 text-3xl font-semibold not-italic text-ink">Explore pet essentials</h3>
            <p className="mt-3 max-w-lg text-muted">Discover available products for play, comfort and everyday care.</p>
            <Link to="/products" className="mt-7 rounded-full bg-brown px-7 py-3.5 font-semibold text-white">
              Open boutique
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
};

type BlogPreview = {
  _id: string;
  title: string;
  category?: string;
  image?: string;
  images?: string[];
  views?: number;
  author?: { name?: string };
};

export const CommunityJournal = () => {
  const [posts, setPosts] = useState<BlogPreview[]>([]);

  useEffect(() => {
    apiClient
      .get("/blogs/latest")
      .then((response) => setPosts((response.data?.blogs || []).slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mb-12 text-center">
          <Eyebrow>Community Journal</Eyebrow>
          <h2 className="font-serif text-4xl font-semibold not-italic text-ink sm:text-6xl">
            Stories, moments and care tips
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Explore recent approved posts shared across the PNetAI community.
          </p>
        </Reveal>

        {posts.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <Link to={`/feeds/${posts[0]._id}`} className="group relative block h-[500px] overflow-hidden rounded-[34px]">
                <ImageFallback
                  src={posts[0].image || posts[0].images?.[0]}
                  fallback={STOCK_IMAGES.community}
                  alt={posts[0].title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 p-8 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-sand">{posts[0].category || "Community"}</p>
                  <h3 className="mt-3 font-serif text-4xl font-semibold not-italic">{posts[0].title}</h3>
                  <p className="mt-4 text-sm text-white/75">By {posts[0].author?.name || "PNetAI Community"}</p>
                </div>
              </Link>
            </Reveal>
            <div className="grid gap-5">
              {posts.slice(1).map((post, index) => (
                <Reveal key={post._id} delay={(index + 1) * 0.07}>
                  <Link to={`/feeds/${post._id}`} className="group grid overflow-hidden rounded-[28px] bg-cream sm:grid-cols-[42%_58%]">
                    <ImageFallback
                      src={post.image || post.images?.[0]}
                      fallback={index === 0 ? STOCK_IMAGES.cat : STOCK_IMAGES.dog}
                      alt={post.title}
                      className="h-52 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-56"
                    />
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-caramel">{post.category || "Pet Life"}</p>
                      <h3 className="mt-3 line-clamp-3 text-2xl font-semibold not-italic text-ink">{post.title}</h3>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brown">
                        Read story <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
              {posts.length < 3 ? (
                <Link
                  to="/feeds"
                  className="flex min-h-36 items-center justify-center gap-2 rounded-[28px] border border-dashed border-sand text-brown"
                >
                  <BookOpen className="h-5 w-5" /> See more stories
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <Reveal className="relative overflow-hidden rounded-[38px]">
            <ImageFallback
              src={STOCK_IMAGES.community}
              fallback={STOCK_IMAGES.dog}
              alt="Pets enjoying time with their community"
              className="h-[440px] w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/75 to-transparent p-8 sm:p-12">
              <div className="max-w-xl text-white">
                <h3 className="font-serif text-4xl font-semibold not-italic">Join the pet-loving community</h3>
                <p className="mt-4 text-white/75">Share moments and discover approved care stories from other pet parents.</p>
                <Link to="/feeds" className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-brown">
                  Explore community
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
};

export const HomeCallToAction = () => (
  <section className="bg-white px-4 pb-20 pt-4 sm:px-6 sm:pb-28">
    <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-forest">
      <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-9 text-white sm:p-14 lg:p-16">
          <Eyebrow light>Begin With PNetAI</Eyebrow>
          <h2 className="font-serif text-4xl font-semibold not-italic leading-tight sm:text-5xl">
            A warmer home for every pet journey
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-white/72">
            Find trusted care, discover compatible companions and connect with a community built for pet parents.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-full bg-caramel px-7 py-4 font-semibold text-white transition hover:bg-white hover:text-brown">
              Join PNetAI
            </Link>
            <Link to="/services" className="rounded-full border border-white/30 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
              Find services
            </Link>
          </div>
        </div>
        <div className="relative min-h-80">
          <ImageFallback
            src={STOCK_IMAGES.grooming}
            fallback={STOCK_IMAGES.dog}
            alt="Gentle pet care"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute bottom-6 left-6 flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink shadow-lg">
            <House className="h-4 w-4 text-brown" />
            Care begins at home
          </div>
        </div>
      </div>
    </Reveal>
  </section>
);
