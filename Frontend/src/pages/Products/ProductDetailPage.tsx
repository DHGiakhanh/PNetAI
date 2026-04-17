import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Minus, Plus, ShieldCheck, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatVnd } from "@/utils/currency";
import { cartService } from "../../services/cart.service";
import { productService, Product } from "../../services/product.service";
import {
  ratingService,
  Rating,
  ReviewEligibility,
} from "../../services/rating.service";

const initialReviewForm = {
  rating: 5,
  comment: "",
};

function getProductProviderName(product: Product) {
  if (typeof product.providerId === "string") return "Service Provider";
  return product.providerId?.name || "Service Provider";
}

function getRatingAuthorName(review: Rating) {
  if (typeof review.user === "string") return "Customer";
  return review.user?.name || "Customer";
}

function renderStaticStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => {
    const filled = index < Math.round(rating);

    return (
      <Star
        key={index}
        className={`h-4 w-4 ${
          filled ? "fill-amber-400 text-amber-400" : "text-sand-dark"
        }`}
      />
    );
  });
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [reviews, setReviews] = useState<Rating[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
  const [currentUserReview, setCurrentUserReview] = useState<Rating | null>(null);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

  const displayTotalReviews = reviewsLoading
    ? product?.totalReviews ?? 0
    : reviews.length;

  const displayAverageRating = reviewsLoading
    ? product?.averageRating ?? 0
    : reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (!productId) return;

    fetchProduct(productId);
    fetchRelatedProducts();
    fetchReviews(productId);
  }, [productId]);

  useEffect(() => {
    if (!productId || authLoading) return;

    if (!user) {
      setReviewEligibility(null);
      setCurrentUserReview(null);
      setReviewForm(initialReviewForm);
      return;
    }

    fetchReviewEligibility(productId);
  }, [productId, user, authLoading]);

  const fetchProduct = async (
    id: string,
    options?: { showLoader?: boolean; resetView?: boolean }
  ) => {
    const showLoader = options?.showLoader ?? true;
    const resetView = options?.resetView ?? true;

    try {
      if (showLoader) {
        setLoading(true);
      }
      const productData = await productService.getProductById(id);
      setProduct(productData);
      setQty((currentQty) => Math.min(Math.max(currentQty, 1), Math.max(productData.stock, 1)));

      if (resetView) {
        setActiveImageIdx(0);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 4 });
      setRelatedProducts(response.products);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchReviews = async (id: string) => {
    try {
      setReviewsLoading(true);
      const ratings = await ratingService.getProductRatings(id);
      setReviews(ratings);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewEligibility = async (id: string) => {
    try {
      const [eligibility, myReview] = await Promise.all([
        ratingService.getReviewEligibility(id),
        ratingService.getMyProductRating(id),
      ]);

      setReviewEligibility(eligibility);
      setCurrentUserReview(myReview);
      setReviewForm(
        myReview
          ? {
              rating: myReview.rating,
              comment: myReview.comment || "",
            }
          : initialReviewForm
      );
    } catch (error) {
      console.error("Error fetching review eligibility:", error);
      setReviewEligibility(null);
      setCurrentUserReview(null);
      setReviewForm(initialReviewForm);
    }
  };

  const refreshReviewSection = async (id: string) => {
    await Promise.all([
      fetchProduct(id, { showLoader: false, resetView: false }),
      fetchReviews(id),
      user ? fetchReviewEligibility(id) : Promise.resolve(),
    ]);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart.");
      navigate("/login");
      return;
    }

    try {
      setAddLoading(true);

      const currentCart = await cartService.getCart();
      const existingItem = currentCart.items.find((item) => {
        const existingProduct = item.product as string | { _id?: string };
        return (typeof existingProduct === "string" ? existingProduct : existingProduct?._id) === product._id;
      });

      const existingQty = existingItem?.quantity || 0;
      const totalPlannedQty = existingQty + qty;

      if (totalPlannedQty > product.stock) {
        toast.error("Out of stock");
        return;
      }

      await cartService.addToCart(product._id, qty);
      toast.success("Added to cart successfully.");
      window.dispatchEvent(new Event("cart:updated"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not add to cart.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!productId) return;

    const trimmedComment = reviewForm.comment.trim();
    if (!reviewForm.rating) {
      toast.error("Please select a rating.");
      return;
    }

    try {
      setReviewSubmitting(true);

      if (currentUserReview) {
        await ratingService.updateRating(currentUserReview._id, {
          rating: reviewForm.rating,
          comment: trimmedComment,
        });
        toast.success("Review updated successfully.");
      } else {
        await ratingService.createRating({
          product: productId,
          rating: reviewForm.rating,
          comment: trimmedComment,
        });
        toast.success("Review submitted successfully.");
      }

      await refreshReviewSection(productId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!productId || !currentUserReview) return;

    try {
      setReviewDeleting(true);
      await ratingService.deleteRating(currentUserReview._id);
      toast.success("Review deleted successfully.");
      setReviewForm(initialReviewForm);
      await refreshReviewSection(productId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not delete review.");
    } finally {
      setReviewDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-32 rounded bg-sand"></div>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] rounded-[28px] bg-sand"></div>
            </div>
            <div className="lg:col-span-5">
              <div className="space-y-4">
                <div className="h-4 w-20 rounded bg-sand"></div>
                <div className="h-8 w-3/4 rounded bg-sand"></div>
                <div className="h-20 rounded bg-sand"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-[22px] bg-white p-6 shadow-sm ring-1 ring-sand">
          <p className="text-sm font-semibold text-muted">Product not found.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brown-dark"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  const images = product.images.length ? product.images : [];
  const activeImage = images[Math.min(activeImageIdx, Math.max(images.length - 1, 0))];
  const providerName = getProductProviderName(product);
  const canWriteReview = Boolean(currentUserReview || reviewEligibility?.canReview);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-sand hover:bg-warm"
        >
          <Heart className="h-4 w-4 text-brown" />
          Save
        </button>
      </div>

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-sand">
            <div className="relative aspect-[4/3] bg-warm">
              {activeImage ? (
                <img
                  alt={product.name}
                  src={activeImage}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-semibold text-muted">
                  No image
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto p-4">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ${
                    idx === activeImageIdx ? "ring-caramel" : "ring-sand"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img alt="" src={img} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
              {product.category}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-extrabold italic leading-snug text-ink">
              {product.name}
            </h1>
            <p className="mt-1 text-xs font-semibold text-brown">Provided by {providerName}</p>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-700 ring-1 ring-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {displayAverageRating.toFixed(1)}
                </span>
                <a href="#reviews" className="text-sm font-semibold text-muted hover:text-ink">
                  ({displayTotalReviews} reviews)
                </a>
              </div>
              <span className="text-2xl font-extrabold text-ink">{formatVnd(product.price)}</span>
            </div>

            <p className="mt-4 text-sm font-semibold leading-relaxed text-muted">
              {product.description}
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <p className="font-serif text-sm font-extrabold italic text-ink">Quantity</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-warm p-1 ring-1 ring-sand">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4 text-ink" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-extrabold text-ink">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-sand hover:bg-warm disabled:opacity-50"
                    aria-label="Increase quantity"
                    disabled={qty >= product.stock}
                  >
                    <Plus className="h-4 w-4 text-ink" />
                  </button>
                </div>
              </div>

              <div className="mt-1 grid gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addLoading || product.stock <= 0}
                  className="inline-flex w-full items-center justify-center rounded-full bg-brown px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-brown-dark disabled:opacity-60"
                >
                  {addLoading ? "Adding..." : `Add to cart · ${formatVnd(product.price * qty)}`}
                </button>
                <div className="flex items-center gap-2 rounded-2xl bg-warm p-4 ring-1 ring-sand">
                  <ShieldCheck className="h-5 w-5 text-brown" />
                  <p className="text-sm font-semibold text-ink">
                    Free returns within 7 days · Community verified picks
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="font-serif text-sm font-extrabold italic text-ink">Product Info</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Stock Available</span>
                  <span className="text-xs font-extrabold text-muted">{product.stock} units</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Category</span>
                  <span className="text-xs font-extrabold text-muted">{product.category}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-warm px-4 py-3 text-sm font-semibold text-ink ring-1 ring-sand">
                  <span>Service Provider</span>
                  <span className="text-xs font-extrabold text-muted">{providerName}</span>
                </div>
                {product.isHot && (
                  <div className="flex items-center justify-between rounded-2xl bg-[#fff5f1] px-4 py-3 text-sm font-semibold text-rust ring-1 ring-rust/25">
                    <span>Hot Product</span>
                    <span className="text-xs font-extrabold text-rust">Hot</span>
                  </div>
                )}
                {product.isRecommended && (
                  <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span>Recommended</span>
                    <span className="text-xs font-extrabold text-emerald-600">Top pick</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-sand">
            <p className="font-serif text-sm font-extrabold italic text-ink">Selected</p>
            <div className="mt-2 flex items-center justify-between text-sm font-semibold text-muted">
              <span>Quantity</span>
              <span className="font-extrabold text-ink">{qty}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-serif text-2xl font-extrabold italic text-ink">
                  Customer Reviews
                </p>
                <p className="mt-1 text-sm font-semibold text-muted">
                  Only customers with delivered orders can review this product.
                </p>
              </div>
              <div className="rounded-2xl bg-warm px-4 py-3 text-right ring-1 ring-sand">
                <p className="text-2xl font-extrabold text-ink">{displayAverageRating.toFixed(1)}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {displayTotalReviews} reviews
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {reviewsLoading ? (
                <div className="rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                  No reviews yet. Be the first verified customer to share feedback.
                </div>
              ) : (
                reviews.map((review) => (
                  <article
                    key={review._id}
                    className="rounded-2xl bg-warm/70 p-4 shadow-sm ring-1 ring-sand"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-extrabold text-ink">
                          {getRatingAuthorName(review)}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          {renderStaticStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-muted">
                        {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {review.comment?.trim() || "Customer left a star rating without extra comments."}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-sand">
            <p className="font-serif text-2xl font-extrabold italic text-ink">
              {currentUserReview ? "Your Review" : "Write a Review"}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted">
              Verified buyers can rate from 1 to 5 stars and leave a comment.
            </p>

            {authLoading ? (
              <div className="mt-5 rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                Checking your review access...
              </div>
            ) : !user ? (
              <div className="mt-5 rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                <p>Login to see whether you can review this product.</p>
                <Link to="/login" className="mt-3 inline-flex text-brown hover:text-brown-dark">
                  Go to login
                </Link>
              </div>
            ) : canWriteReview ? (
              <div className="mt-5">
                <div>
                  <p className="text-sm font-extrabold text-ink">Your rating</p>
                  <div className="mt-3 flex items-center gap-2">
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = index + 1;
                      const active = value <= reviewForm.rating;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setReviewForm((current) => ({ ...current, rating: value }))
                          }
                          className="rounded-full p-1 transition hover:scale-105"
                          aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`h-7 w-7 ${
                              active ? "fill-amber-400 text-amber-400" : "text-sand-dark"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="review-comment"
                    className="text-sm font-extrabold text-ink"
                  >
                    Comment
                  </label>
                  <textarea
                    id="review-comment"
                    rows={5}
                    value={reviewForm.comment}
                    onChange={(event) =>
                      setReviewForm((current) => ({
                        ...current,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="What did you like or dislike about this product?"
                    className="mt-2 w-full rounded-2xl border border-sand bg-warm px-4 py-3 text-sm text-ink outline-none transition focus:border-caramel"
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleReviewSubmit}
                    disabled={reviewSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-brown px-5 py-2.5 text-sm font-extrabold text-white hover:bg-brown-dark disabled:opacity-60"
                  >
                    {reviewSubmitting
                      ? "Saving..."
                      : currentUserReview
                        ? "Update review"
                        : "Submit review"}
                  </button>

                  {currentUserReview && (
                    <button
                      type="button"
                      onClick={handleDeleteReview}
                      disabled={reviewDeleting}
                      className="inline-flex items-center gap-2 rounded-full border border-sand px-5 py-2.5 text-sm font-extrabold text-ink hover:bg-warm disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {reviewDeleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ) : reviewEligibility?.hasPurchased ? (
              <div className="mt-5 rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                You already reviewed this product. Your previous review is shown above and can be edited here once it loads.
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-warm p-4 text-sm font-semibold text-muted ring-1 ring-sand">
                You can review this product after at least one order containing it is marked as
                delivered.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <p className="font-serif text-lg font-extrabold italic text-ink">You may also like</p>
          <Link to="/products" className="text-sm font-semibold text-brown hover:text-brown-dark">
            Browse all
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <Link
              key={relatedProduct._id}
              to={`/products/${relatedProduct._id}`}
              className="group overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-sand hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-warm">
                <img
                  alt={relatedProduct.name}
                  src={
                    relatedProduct.images[0] ||
                    "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
                  }
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-muted">{relatedProduct.category}</p>
                <p className="mt-1 line-clamp-1 text-sm font-extrabold text-ink">
                  {relatedProduct.name}
                </p>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-brown">
                  by {getProductProviderName(relatedProduct)}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-ink">
                    {formatVnd(relatedProduct.price)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {relatedProduct.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
