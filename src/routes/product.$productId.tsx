import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Heart, Clock, Truck, Star, ChevronLeft, ChevronRight, X, Store, Shield, Minus, Plus, Expand } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import Navbar from "@/components/wearbuy/Navbar";
import BottomNav from "@/components/wearbuy/BottomNav";
import Footer from "@/components/wearbuy/Footer";
import { useWearbuy } from "@/context/wearbuy-store";
import { useAuth } from "@/context/auth-store";
import { getProductDetail, getRelatedProducts, getRatingDistribution, type ProductDetail } from "@/lib/product.functions";
import { getProductReviews, addReview, deleteReview, type ReviewItem } from "@/lib/review.functions";

export const Route = createFileRoute("/product/$productId")({
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const fetchProduct = useServerFn(getProductDetail);
  const fetchRelated = useServerFn(getRelatedProducts);
  const fetchDist = useServerFn(getRatingDistribution);
  const fetchReviews = useServerFn(getProductReviews);

  const { addToCart, toggleWishlist, isWished, setCartOpen } = useWearbuy();
  const { firebaseUser } = useAuth();
  const submitReview = useServerFn(addReview);
  const removeReview = useServerFn(deleteReview);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [dist, setDist] = useState<number[]>([0, 0, 0, 0, 0]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [qty, setQty] = useState(1);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    const p = await fetchProduct({ data: { productId } });
    setProduct(p);
    if (p) {
      setSelectedSize(p.sizes[0] ?? "");
      setSelectedColor(p.colors[0] ?? "");
      fetchRelated({ data: { productId, shopId: p.shop.id, category: p.category } }).then(setRelated);
      fetchDist({ data: { productId } }).then((r) => setDist(r.distribution));
    }
    setLoading(false);
  }, [productId, fetchProduct, fetchRelated, fetchDist]);

  const loadReviews = useCallback((page = 1) => {
    fetchReviews({ data: { productId, page, uid: firebaseUser?.uid } }).then((r) => {
      setReviews(r.items);
      setReviewPages(r.pages);
      setReviewPage(r.page);
    });
  }, [productId, firebaseUser, fetchReviews]);

  useEffect(() => { loadProduct(); loadReviews(); }, [productId]);

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setReviewSubmitting(true);
    try {
      await submitReview({ data: { uid: firebaseUser.uid, productId, rating: reviewRating, comment: reviewComment || undefined } });
      setShowReviewForm(false);
      setReviewComment("");
      loadReviews();
      loadProduct(); // refresh rating
    } finally { setReviewSubmitting(false); }
  }

  async function handleDeleteReview(reviewId: string) {
    if (!firebaseUser) return;
    await removeReview({ data: { uid: firebaseUser.uid, reviewId } });
    loadReviews();
    loadProduct();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-[3/4] rounded-3xl bg-secondary animate-shimmer" />
            <div className="space-y-4">
              <div className="h-6 w-32 bg-secondary animate-shimmer rounded" />
              <div className="h-10 w-3/4 bg-secondary animate-shimmer rounded" />
              <div className="h-6 w-24 bg-secondary animate-shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <h1 className="text-2xl font-heading text-foreground mb-2">Product not found</h1>
          <Link to="/" className="text-primary text-sm">Back to store</Link>
        </div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : product.image ? [product.image] : [];
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/search" search={{ q: "", category: product.category }} className="hover:text-foreground">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border aspect-[3/4] group cursor-pointer" onClick={() => setFullscreen(true)}>
              {images[imgIdx] && <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
              <button className="absolute top-4 right-4 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand className="w-4 h-4 text-foreground" />
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
              {product.discount > 0 && <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-destructive text-white text-xs font-bold">{product.discount}% OFF</span>}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((url, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === imgIdx ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Link to="/store/$storeId" params={{ storeId: product.shop.id }} className="text-sm text-primary font-medium hover:underline">{product.shop.name}</Link>
              <h1 className="text-3xl sm:text-4xl text-foreground mt-1 font-heading">{product.name}</h1>
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}
                </div>
                <span className="text-sm text-muted-foreground">{product.avgRating.toFixed(1)} ({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-foreground">₹{product.price.toLocaleString("en-IN")}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">₹{product.comparePrice.toLocaleString("en-IN")}</span>
              )}
              {product.discount > 0 && <span className="text-sm font-medium text-green-600">{product.discount}% off</span>}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${inStock ? "bg-green-500" : "bg-destructive"}`} />
              <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-destructive"}`}>
                {inStock ? (product.stock <= 5 ? `Only ${product.stock} left` : "In Stock") : "Out of Stock"}
              </span>
            </div>

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Color: <span className="text-foreground">{selectedColor}</span></p>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`px-4 py-2 rounded-lg border text-sm transition-all ${selectedColor === c ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">Size: <span className="text-foreground">{selectedSize}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`w-12 h-12 rounded-xl border text-sm font-medium transition-all flex items-center justify-center ${selectedSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/40"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-border rounded-xl overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-accent"><Minus className="w-4 h-4" /></button>
                <span className="px-4 text-sm font-medium text-foreground">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-accent"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => { for (let i = 0; i < qty; i++) addToCart(product as any, selectedSize); setCartOpen(true); }}
                disabled={!inStock}
                className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all disabled:opacity-40"
              >Add to Cart</button>
              <button
                onClick={() => toggleWishlist(product as any)}
                className="px-5 py-3.5 rounded-xl border border-border hover:border-primary/40 transition-all"
              >
                <Heart className={`w-5 h-5 mx-auto ${isWished(product.id) ? "fill-primary text-primary" : "text-foreground"}`} />
              </button>
            </div>

            {/* Delivery & Trust */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Truck className="w-5 h-5 text-primary" />
                <div><p className="text-xs font-medium text-foreground">Fast Delivery</p><p className="text-[10px] text-muted-foreground">Within 60 min</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <Shield className="w-5 h-5 text-primary" />
                <div><p className="text-xs font-medium text-foreground">Secure Payment</p><p className="text-[10px] text-muted-foreground">100% protected</p></div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-3">
                {product.shop.image ? <img src={product.shop.image} alt="" className="w-10 h-10 rounded-xl object-cover" /> : <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center"><Store className="w-5 h-5 text-primary" /></div>}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{product.shop.name}</p>
                  <p className="text-xs text-muted-foreground">{product.shop.category}</p>
                </div>
                <Link to="/store/$storeId" params={{ storeId: product.shop.id }} className="text-xs text-primary font-medium hover:underline">Visit Shop</Link>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading text-foreground">Reviews ({product.reviewCount})</h2>
            {firebaseUser && (
              <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Write a Review</button>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="flex items-center gap-8 mb-8 p-5 rounded-2xl bg-card border border-border">
            <div className="text-center">
              <p className="text-4xl font-heading text-foreground">{product.avgRating.toFixed(1)}</p>
              <div className="flex gap-0.5 mt-1 justify-center">
                {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.avgRating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{product.reviewCount} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map((star) => {
                const count = dist[star - 1] ?? 0;
                const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-card border border-border">
              <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 rounded-2xl bg-card border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {r.userImage ? <img src={r.userImage} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary">{(r.userName ?? "U")[0]}</div>}
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.userName ?? "User"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-foreground/80 mb-2">{r.comment}</p>}
                  {r.images.length > 0 && (
                    <div className="flex gap-2 mb-2">{r.images.map((url, i) => <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />)}</div>
                  )}
                  {r.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2">
                      {r.replies.map((rp) => (
                        <div key={rp.id}>
                          <p className="text-xs font-medium text-primary">{rp.userName}</p>
                          <p className="text-xs text-muted-foreground">{rp.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.isOwn && (
                    <button onClick={() => handleDeleteReview(r.id)} className="mt-2 text-xs text-destructive hover:underline">Delete my review</button>
                  )}
                </div>
              ))}
              {/* Pagination */}
              {reviewPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: reviewPages }, (_, i) => (
                    <button key={i} onClick={() => loadReviews(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-medium ${reviewPage === i + 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-accent"}`}>{i + 1}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-heading text-foreground mb-5">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link key={r.id} to="/product/$productId" params={{ productId: r.id }} className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 hover-lift transition-all">
                  <div className="aspect-[3/4] overflow-hidden">
                    {r.image && <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-foreground truncate font-medium">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-foreground">₹{r.price.toLocaleString("en-IN")}</span>
                      {r.comparePrice && r.comparePrice > r.price && <span className="text-xs text-muted-foreground line-through">₹{r.comparePrice.toLocaleString("en-IN")}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowReviewForm(false)}>
            <div className="max-w-md w-full rounded-3xl bg-background border border-border p-6 shadow-xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-heading text-foreground">Write a Review</h3>
                <button onClick={() => setShowReviewForm(false)} className="p-2 rounded-full hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Rating</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewRating(s)} className="p-1">
                        <Star className={`w-7 h-7 transition-colors ${s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-border hover:text-amber-200"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder="Share your experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm focus:outline-none focus:border-primary/40 resize-none"
                />
                <button disabled={reviewSubmitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-50">
                  {reviewSubmitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Fullscreen Image Viewer */}
        {fullscreen && (
          <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center" onClick={() => setFullscreen(false)}>
            <button className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 z-10"><X className="w-5 h-5 text-white" /></button>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + images.length) % images.length); }} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20"><ChevronLeft className="w-6 h-6 text-white" /></button>
                <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % images.length); }} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20"><ChevronRight className="w-6 h-6 text-white" /></button>
              </>
            )}
            <img src={images[imgIdx]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
