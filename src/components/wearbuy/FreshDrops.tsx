import { useState, useEffect } from "react";
import { Sparkles, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getLatestProducts } from "@/lib/product.functions";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

type FreshProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  comparePrice: number | null;
  discount: number;
  shopName: string;
};

export default function FreshDrops() {
  const fetchLatest = useServerFn(getLatestProducts);
  const [products, setProducts] = useState<FreshProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest({ data: { limit: 8 } })
      .then((p) => setProducts(p as FreshProduct[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchLatest]);

  // Hide the section entirely if no seller products exist yet
  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-transparent to-transparent" />
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl sm:text-4xl text-foreground">Fresh Drops</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">Just In</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">New arrivals from our latest sellers</p>
          </div>
          <Link to="/search" search={{ q: "" }} className="text-sm text-primary hover:text-primary-glow transition-colors">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$productId"
                  params={{ productId: p.id }}
                  className="group relative rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 hover-lift transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-accent flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                    {p.discount > 0 && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md text-[11px] bg-destructive text-white font-bold">
                        {p.discount}% OFF
                      </span>
                    )}
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] bg-primary text-primary-foreground font-medium">
                      New
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm text-foreground mb-0.5 line-clamp-1 font-medium">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{p.shopName}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-base text-foreground font-semibold">₹{p.price.toLocaleString("en-IN")}</span>
                      {p.comparePrice && p.comparePrice > p.price && (
                        <span className="text-xs text-muted-foreground line-through">₹{p.comparePrice.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
