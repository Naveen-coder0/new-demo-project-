import { Heart, Clock, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { products } from "@/lib/wearbuy-data";
import { useWearbuy } from "@/context/wearbuy-store";

export default function TrendingProducts() {
  const { city, toggleWishlist, isWished } = useWearbuy();
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl sm:text-4xl text-foreground">Trending in {city}</h2>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">What your city is loving right now</p>
          </div>
          <Link to="/search" search={{ q: "", trending: true }} className="text-sm text-primary hover:text-primary-glow transition-colors">See more</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((product) => (
            <Link key={product.id} to="/product/$productId" params={{ productId: product.id }} className="group relative rounded-2xl overflow-hidden bg-card/80 border border-border hover:border-primary/40 hover-lift transition-all duration-300">
              <div className="relative aspect-[3/4] overflow-hidden">
                <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <button onClick={(e) => { e.preventDefault(); toggleWishlist(product); }} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all">
                  <Heart className={`w-4 h-4 ${isWished(product.id) ? "fill-primary text-primary" : "text-foreground"}`} />
                </button>
                {product.tryAndBuy && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-primary text-primary-foreground backdrop-blur-sm font-medium">Try & Buy</span>
                  </div>
                )}
                {product.badge && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="px-2 py-1 rounded-md text-[10px] bg-white/95 text-black backdrop-blur-sm block text-center font-medium">{product.badge}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm text-foreground mb-0.5 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.store}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base text-foreground font-medium">{product.price}</span>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Clock className="w-3 h-3" />
                    <span>{product.deliveryEta}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}